// cloudfunctions/rank/getLeaderboard/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { tab = 'total', page = 1 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // 根据 tab 决定排序字段
    let sortField = 'total_questions';
    if (tab === 'week') {
      sortField = 'week_questions';
    } else if (tab === 'today') {
      sortField = 'today_questions';
    }

    // 获取排行榜数据
    const rankRes = await db.collection('users')
      .orderBy(sortField, 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取当前用户的排名
    const myRankRes = await db.collection('users')
      .orderBy(sortField, 'desc')
      .get();

    const myRankIndex = myRankRes.data.findIndex(u => u._openid === openid);
    const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

    // 获取当前用户信息
    const myUserRes = await db.collection('users').where({
      _openid: openid
    }).get();

    const myUser = myUserRes.data[0] || {};

    const list = rankRes.data.map((user, index) => ({
      rank: skip + index + 1,
      id: user._id,
      nickname: user.nickname || '匿名用户',
      avatar: user.avatar || '/images/icons/user.png',
      count: user[sortField] || 0,
      weekCount: user.week_questions || 0,
      todayCount: user.today_questions || 0,
      activeDays: user.continue_days || 0,
      isMe: user._openid === openid
    }));

    // 构建我的排名信息
    const myRankInfo = myRank ? {
      rank: myRank,
      id: myUser._id,
      nickname: myUser.nickname || '我',
      avatar: myUser.avatar || '/images/icons/user.png',
      count: myUser[sortField] || 0,
      weekCount: myUser.week_questions || 0,
      todayCount: myUser.today_questions || 0,
      activeDays: myUser.continue_days || 0,
      isMe: true
    } : null;

    return {
      list,
      myRank: myRankInfo,
      total: myRankRes.data.length,
      hasNext: list.length === pageSize
    };
  } catch (err) {
    console.error('获取排行榜失败:', err);
    return {
      list: [],
      myRank: null,
      total: 0,
      hasNext: false,
      error: err.message
    };
  }
};
