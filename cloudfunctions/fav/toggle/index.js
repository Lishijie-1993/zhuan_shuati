// cloudfunctions/fav/toggle/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { questionId, action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    if (action === 'add') {
      // 添加收藏
      // 检查是否已收藏
      const existRes = await db.collection('user_favorites').where({
        user_id: openid,
        question_id: questionId
      }).get();

      if (existRes.data.length > 0) {
        return { status: 'already_exists' };
      }

      await db.collection('user_favorites').add({
        data: {
          user_id: openid,
          question_id: questionId,
          created_at: new Date()
        }
      });

      // 更新用户收藏数量
      await updateUserFavoritesCount(openid, 1);

      return { status: 'added' };
    } else if (action === 'remove') {
      // 取消收藏
      await db.collection('user_favorites').where({
        user_id: openid,
        question_id: questionId
      }).remove();

      // 更新用户收藏数量
      await updateUserFavoritesCount(openid, -1);

      return { status: 'removed' };
    }

    return { status: 'unknown_action' };
  } catch (err) {
    console.error('收藏操作失败:', err);
    return {
      status: 'error',
      error: err.message
    };
  }
};

// 更新用户收藏数量
async function updateUserFavoritesCount(openid, delta) {
  try {
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userRes.data.length > 0) {
      const currentCount = userRes.data[0].favorites || 0;
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          favorites: currentCount + delta,
          updated_at: new Date()
        }
      });
    }
  } catch (err) {
    console.error('更新收藏数量失败:', err);
  }
}
