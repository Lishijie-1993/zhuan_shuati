// cloudfunctions/error/report/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 简单的内存缓存用于防刷（生产环境建议使用 Redis）
const reportCache = new Map();

exports.main = async (event, context) => {
  const { questionId, wrongOption } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 【安全修复】必填参数校验
  if (!questionId) {
    return {
      status: 'error',
      error: '缺少必要参数：questionId'
    };
  }

  // 【安全修复】内容长度限制
  if (wrongOption && wrongOption.length > 500) {
    return {
      status: 'error',
      error: '错误选项内容过长'
    };
  }

  // 【安全修复】防刷机制 - 同一用户60秒内只能报告一次
  const cacheKey = `${openid}_${questionId}`;
  const lastReport = reportCache.get(cacheKey);
  if (lastReport && Date.now() - lastReport < 60000) {
    return {
      status: 'error',
      error: '操作过于频繁，请稍后再试'
    };
  }

  try {
    // 查询是否已有错题记录
    const existRes = await db.collection('user_errors').where({
      user_id: openid,
      question_id: questionId
    }).get();

    const now = new Date();

    if (existRes.data.length > 0) {
      // 更新已有记录：使用原子操作增加错误次数
      await db.collection('user_errors').where({
        _id: existRes.data[0]._id
      }).update({
        data: {
          wrong_option: wrongOption || existRes.data[0].wrong_option,
          error_count: _.inc(1),  // 【安全修复】使用原子操作
          last_wrong_time: now,
          updated_at: now
        }
      });
    } else {
      // 创建新记录
      await db.collection('user_errors').add({
        data: {
          user_id: openid,
          question_id: questionId,
          wrong_option: wrongOption,
          error_count: 1,
          last_wrong_time: now,
          created_at: now,
          updated_at: now
        }
      });

      // 更新用户错题数量
      await updateUserErrorCount(openid, 1);
    }

    // 更新缓存时间
    reportCache.set(cacheKey, Date.now());

    return { status: 'recorded' };
  } catch (err) {
    console.error('记录错题失败:', err);
    return {
      status: 'error',
      error: err.message
    };
  }
};

// 更新用户错题数量（原子操作）
async function updateUserErrorCount(openid, delta) {
  try {
    await db.collection('users').where({
      _id: openid
    }).update({
      data: {
        wrong_questions: _.inc(delta),
        updated_at: new Date()
      }
    });
  } catch (err) {
    console.error('更新错题数量失败:', err);
  }
}
