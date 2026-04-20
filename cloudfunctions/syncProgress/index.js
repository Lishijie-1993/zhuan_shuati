// cloudfunctions/quiz/syncProgress/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { chapter, currentIndex, correctCount } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

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

    return { success: true };
  } catch (err) {
    console.error('同步进度失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
