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
      // 更新已有进度
      await db.collection('user_quiz_progress').where({
        _id: progressRes.data[0]._id
      }).update({
        data: {
          last_index: currentIndex,
          correct_count: correctCount,
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
          correct_count: correctCount,
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
