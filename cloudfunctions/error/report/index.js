// cloudfunctions/error/report/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { questionId, wrongOption } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查询是否已有错题记录
    const existRes = await db.collection('user_errors').where({
      user_id: openid,
      question_id: questionId
    }).get();

    const now = new Date();

    if (existRes.data.length > 0) {
      // 更新已有记录：错误次数+1，更新错误时间
      const currentError = existRes.data[0];
      await db.collection('user_errors').where({
        _id: currentError._id
      }).update({
        data: {
          wrong_option: wrongOption,
          error_count: (currentError.error_count || 1) + 1,
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

    return { status: 'recorded' };
  } catch (err) {
    console.error('记录错题失败:', err);
    return {
      status: 'error',
      error: err.message
    };
  }
};

// 更新用户错题数量
async function updateUserErrorCount(openid, delta) {
  try {
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userRes.data.length > 0) {
      const currentCount = userRes.data[0].wrong_questions || 0;
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          wrong_questions: currentCount + delta,
          updated_at: new Date()
        }
      });
    }
  } catch (err) {
    console.error('更新错题数量失败:', err);
  }
}
