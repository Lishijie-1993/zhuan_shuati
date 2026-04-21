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
    // 使用分数作为第一排序条件，_id 作为第二排序条件，确保同分用户排序稳定
    const rankRes = await db.collection('users')
      .orderBy(sortField, 'desc')
      .orderBy('_id', 'asc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取当前用户信息（_id 即用户的 openid）
    const myUserRes = await db.collection('users').where({
      _id: openid
    }).get();

    const myUser = myUserRes.data[0] || {};
    const myScore = myUser[sortField] || 0;

    // 计算当前用户排名：统计分数严格高于当前用户的用户数 + 1
    // 注意：这里只统计分数严格高于的，不包括同分的
    const higherCountRes = await db.collection('users')
      .where({
        [sortField]: _.gt(myScore)
      })
      .count();

    // 计算同分人数（用于显示并列信息）
    const equalCountRes = await db.collection('users')
      .where({
        [sortField]: _.eq(myScore)
      })
      .count();

    // 计算我的排名：严格高于的人数 + 1
    const myRank = higherCountRes.total + 1;
    // 同分的人数（包括自己）
    const tiedCount = equalCountRes.total;

    // 构建排行榜列表
    // 排名 = 跳过数量 + 当前页索引 + 1
    const list = rankRes.data.map((user, index) => ({
      rank: skip + index + 1,  // 使用实际位置作为排名
      id: user._id,
      nickname: user.nickname || '匿名用户',
      avatar: user.avatar || '/images/icons/user.png',
      count: user[sortField] || 0,
      weekCount: user.week_questions || 0,
      todayCount: user.today_questions || 0,
      activeDays: user.continue_days || 0,
      isMe: user._id === openid
    }));

    // 构建我的排名信息（包含并列信息）
    // 如果有同分的人，显示并列排名
    const displayRank = tiedCount > 1 ? `${myRank} (与${tiedCount - 1}人并列)` : myRank;
    const myRankInfo = {
      rank: myRank,
      displayRank: displayRank,
      tiedCount: tiedCount,
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
