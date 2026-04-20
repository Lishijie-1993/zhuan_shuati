// cloudfunctions/auth/getUserInfo/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 自动初始化/拉取用户档案
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userRes.data.length > 0) {
      // 用户已存在，返回用户信息
      const userInfo = userRes.data[0];
      return {
        userInfo: {
          nickname: userInfo.nickname || '安全学员',
          avatar: userInfo.avatar || '/images/icons/user.png',
          totalQuestions: userInfo.total_questions || 0,
          continueDays: userInfo.continue_days || 0,
          favorites: userInfo.favorites || 0,
          wrongQuestions: userInfo.wrong_questions || 0,
          medals: userInfo.medals ? userInfo.medals.length : 0,
          settings: userInfo.settings || { theme: 'blue', sound: true, vibrate: true }
        },
        isNewUser: false
      };
    } else {
      // 新用户，创建初始档案
      const now = new Date();
      const newUser = {
        _openid: openid,
        nickname: '安全学员',
        avatar: '/images/icons/user.png',
        total_questions: 0,
        continue_days: 0,
        favorites: 0,
        wrong_questions: 0,
        medals: [],
        settings: {
          theme: 'blue',
          sound: true,
          vibrate: true
        },
        created_at: now,
        updated_at: now
      };

      await db.collection('users').add({
        data: newUser
      });

      return {
        userInfo: {
          nickname: '安全学员',
          avatar: '/images/icons/user.png',
          totalQuestions: 0,
          continueDays: 0,
          favorites: 0,
          wrongQuestions: 0,
          medals: 0,
          settings: { theme: 'blue', sound: true, vibrate: true }
        },
        isNewUser: true
      };
    }
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return {
      userInfo: null,
      isNewUser: false,
      error: err.message
    };
  }
};
