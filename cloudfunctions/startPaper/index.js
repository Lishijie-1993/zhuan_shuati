// cloudfunctions/exam/startPaper/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { paperId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取试卷模板
    const paperRes = await db.collection('exam_papers').where({
      _id: paperId,
      status: 'active'
    }).get();

    if (paperRes.data.length === 0) {
      return {
        success: false,
        error: '试卷不存在或已下线'
      };
    }

    const paper = paperRes.data[0];
    const questionIds = paper.question_ids || [];
    const duration = paper.duration || 120; // 默认120分钟

    // 生成快照ID
    const snapshotId = `snap_${openid}_${paperId}_${Date.now()}`;

    // 创建考试快照记录
    const now = new Date();
    await db.collection('user_exam_records').add({
      data: {
        user_id: openid,
        paper_id: paperId,
        snapshot_id: snapshotId,
        score: null,
        answers: {},
        question_ids: questionIds,
        start_time: now,
        submit_time: null,
        status: 'in_progress',
        time_used: 0,
        created_at: now,
        updated_at: now
      }
    });

    // 获取题目详情
    let questions = [];
    if (questionIds.length > 0) {
      const questionsRes = await db.collection('question_bank')
        .where({
          _id: _.in(questionIds)
        })
        .get();

      // 按原始顺序排列题目
      questions = questionIds
        .map(id => questionsRes.data.find(q => q._id === id))
        .filter(q => q)
        .map(q => ({
          id: q._id,
          type: q.type === 'single' ? 'single' : (q.type === 'multiple' ? 'multiple' : 'judge'),
          title: q.content,
          options: (q.options || []).map(opt => ({
            key: opt.key,
            content: opt.value || opt.content || ''
          })),
          answer: q.correct_answer,
          analysis: q.analysis || ''
        }));
    }

    return {
      success: true,
      snapshotId,
      questions,
      duration,
      title: paper.title,
      totalScore: paper.total_score
    };
  } catch (err) {
    console.error('开始考试失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};
