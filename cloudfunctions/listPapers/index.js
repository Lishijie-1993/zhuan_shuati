// cloudfunctions/listPapers/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 【安全修复】添加分页限制，防止全表扫描
    const page = Math.max(1, parseInt(event.page) || 1);
    const pageSize = Math.min(50, Math.max(10, parseInt(event.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // 获取启用的试卷
    const res = await db.collection('exam_papers')
      .where({
        status: 'active'
      })
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取总数
    const countRes = await db.collection('exam_papers')
      .where({ status: 'active' })
      .count();

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
      list,
      total: countRes.total,
      page,
      pageSize,
      hasNext: skip + list.length < countRes.total
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
