// cloudfunctions/listPapers/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 获取所有启用的试卷
    const res = await db.collection('exam_papers')
      .where({
        status: 'active'
      })
      .orderBy('created_at', 'desc')
      .get();

    const list = res.data.map(paper => ({
      id: paper._id,
      title: paper.title,
      questionCount: paper.question_ids ? paper.question_ids.length : 0,
      duration: paper.duration || 90,
      totalScore: paper.total_score || 100,
      status: paper.status
    }));

    return {
      success: true,
      list
    };
  } catch (err) {
    console.error('获取试卷列表失败:', err);
    return {
      success: false,
      list: [],
      error: err.message
    };
  }
};
