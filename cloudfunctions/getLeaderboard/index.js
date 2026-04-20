// cloudfunctions/getLeaderboard/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

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

    // 获取排行榜数据（分页）
    // 使用 _id 作为第二排序条件，确保同分用户排序稳定，避免翻页 Bug
    const rankRes = await db.collection('users')
      .orderBy(sortField, 'desc')
      .orderBy('_id', 'asc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取当前用户信息
    const myUserRes = await db.collection('users').where({
      _openid: openid
    }).get();

    const myUser = myUserRes.data[0] || {};
    const myScore = myUser[sortField] || 0;

    // 计算当前用户排名：统计分数高于当前用户的用户数 + 1
    // 这样避免了拉取全量数据的 100 条限制
    const higherCountRes = await db.collection('users')
      .where({
        [sortField]: _.gt(myScore)
      })
      .count();

    const myRank = higherCountRes.total + 1;

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
    const myRankInfo = {
      rank: myRank,
      id: myUser._id,
      nickname: myUser.nickname || '我',
      avatar: myUser.avatar || '/images/icons/user.png',
      count: myScore,
      weekCount: myUser.week_questions || 0,
      todayCount: myUser.today_questions || 0,
      activeDays: myUser.continue_days || 0,
      isMe: true
    };

    // 获取总用户数
    const totalCountRes = await db.collection('users').count();

    return {
      list,
      myRank: myRankInfo,
      total: totalCountRes.total,
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
