// cloudfunctions/quiz/syncProgress/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { chapter, currentIndex, correctCount } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 【安全修复】必填参数校验
  if (chapter === undefined || currentIndex === undefined) {
    return {
      success: false,
      error: '缺少必要参数：chapter 和 currentIndex'
    };
  }

  // 【安全修复】参数类型校验
  if (typeof currentIndex !== 'number' || (correctCount !== undefined && typeof correctCount !== 'number')) {
    return {
      success: false,
      error: '参数类型错误：currentIndex 和 correctCount 必须为数字'
    };
  }

  try {
    // 兼容 chapter_id 和 chapterTitle 两种字段名
    const queryChapter = chapter || event.chapterId;

    // 查询是否存在进度记录
    const progressRes = await db.collection('user_quiz_progress').where({
      user_id: openid,
      chapter_title: queryChapter
    }).get();

    const now = new Date();

    if (progressRes.data.length > 0) {
      const existingRecord = progressRes.data[0];
      const existingMaxIndex = existingRecord.max_index || existingRecord.last_index || 0;
      const existingCorrectCount = existingRecord.max_correct_count || existingRecord.correct_count || 0;

      // 【修复】只更新最大探索深度，不覆盖倒退的进度
      const newMaxIndex = Math.max(existingMaxIndex, currentIndex);
      const newMaxCorrectCount = Math.max(existingCorrectCount, correctCount);

      await db.collection('user_quiz_progress').where({
        _id: existingRecord._id
      }).update({
        data: {
          last_index: currentIndex,  // 记录当前位置
          max_index: newMaxIndex,  // 记录最大探索深度
          last_correct_count: correctCount,
          max_correct_count: newMaxCorrectCount,
          last_time: now,
          updated_at: now
        }
      });
    } else {
      // 创建新进度记录
      await db.collection('user_quiz_progress').add({
        data: {
          user_id: openid,
          chapter_title: queryChapter,
          last_index: currentIndex,
          max_index: currentIndex,
          last_correct_count: correctCount,
          max_correct_count: correctCount,
          last_time: now,
          created_at: now,
          updated_at: now
        }
      });
    }

    // 【修复6】同步更新 users 表的 total_questions 字段
    // 只有答对时才计数
    if (correctCount && correctCount > 0) {
      await _updateUserTotalQuestions(openid, correctCount);
    }

    // 【修复2】同步更新本周和今日刷题数（支持排行榜 week/today 排序）
    await _updateUserPeriodicQuestions(openid, correctCount);

    return { success: true };
  } catch (err) {
    console.error('同步进度失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 【修复6】更新用户总刷题数（原子操作）
async function _updateUserTotalQuestions(openid, correctCount) {
  try {
    // 尝试使用 _id（即 openid）查找
    let userRes = await db.collection('users').where({
      _id: openid
    }).get();

    if (userRes.data.length > 0) {
      // 用户已存在，更新 total_questions
      await db.collection('users').where({
        _id: openid
      }).update({
        data: {
          total_questions: _.inc(correctCount),
          updated_at: new Date()
        }
      });
    } else {
      // 用户不存在，创建新记录
      await db.collection('users').add({
        data: {
          _id: openid,
          total_questions: correctCount,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  } catch (err) {
    console.error('更新用户总刷题数失败:', err);
    // 不抛出错误，避免影响主流程
  }
}

// 【修复2】更新用户本周和今日刷题数（排行榜用）
async function _updateUserPeriodicQuestions(openid, correctCount) {
  try {
    const now = new Date();
    const startOfWeek = _getStartOfWeek(now);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const userRes = await db.collection('users').where({
      _id: openid
    }).get();

    if (userRes.data.length > 0) {
      const user = userRes.data[0];
      const lastResetWeek = user.last_reset_week ? new Date(user.last_reset_week) : null;
      const lastResetDay = user.last_reset_day ? new Date(user.last_reset_day) : null;

      // 如果本周不是同一周，重置 week_questions
      const weekQuestions = (!lastResetWeek || startOfWeek > lastResetWeek)
        ? correctCount
        : (user.week_questions || 0) + correctCount;

      // 如果今日不是同一天，重置 today_questions
      const todayQuestions = (!lastResetDay || startOfDay > lastResetDay)
        ? correctCount
        : (user.today_questions || 0) + correctCount;

      await db.collection('users').where({
        _id: openid
      }).update({
        data: {
          week_questions: weekQuestions,
          today_questions: todayQuestions,
          last_reset_week: lastResetWeek && startOfWeek <= lastResetWeek ? lastResetWeek : startOfWeek,
          last_reset_day: startOfDay,
          updated_at: now
        }
      });
    } else {
      // 新用户：创建时同时设置本周和今日计数
      await db.collection('users').add({
        data: {
          _id: openid,
          week_questions: correctCount,
          today_questions: correctCount,
          last_reset_week: startOfWeek,
          last_reset_day: startOfDay,
          created_at: now,
          updated_at: now
        }
      });
    }
  } catch (err) {
    console.error('更新用户周期刷题数失败:', err);
  }
}

// 获取本周一凌晨时间戳（用于判断是否需要重置 week_questions）
function _getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
