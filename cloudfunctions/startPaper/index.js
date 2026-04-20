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
        paper_title: paper.title || '模拟考试',
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
          options: formatOptions(q.options),
          // 解析答案字段，支持多种格式
          answer: parseAnswer(q.correct_answer, q.type),
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

// 统一格式化选项数据
function formatOptions(options) {
  if (!options) return [];

  // 如果是字符串（JSON），尝试解析
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      // 如果解析失败，尝试按换行分割
      const lines = options.split('\n').filter(s => s.trim());
      return lines.map((s, i) => ({
        id: String.fromCharCode(65 + i),
        text: s.trim()
      }));
    }
  }

  // 如果是数组
  if (Array.isArray(options)) {
    return options.map((opt, index) => {
      // 如果是对象
      if (typeof opt === 'object') {
        return {
          id: opt.id || opt.key || String.fromCharCode(65 + index),
          text: opt.text || opt.content || opt.value || ''
        };
      }
      // 如果是字符串
      return {
        id: String.fromCharCode(65 + index),
        text: String(opt)
      };
    });
  }

  return [];
}

// 解析答案字段，确保格式统一
function parseAnswer(correctAnswer, questionType) {
  if (!correctAnswer) return null;

  // 如果已经是数组，直接返回
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.sort(); // 排序确保一致
  }

  // 如果是字符串，尝试解析
  if (typeof correctAnswer === 'string') {
    // 尝试解析 JSON 数组
    try {
      const parsed = JSON.parse(correctAnswer);
      if (Array.isArray(parsed)) {
        return parsed.sort();
      }
    } catch (e) {
      // JSON 解析失败，可能是多选格式如 "A,B,C" 或 "ABC"
    }

    // 处理逗号分隔的格式如 "A,B,C"
    if (correctAnswer.includes(',')) {
      return correctAnswer.split(',').map(s => s.trim().toUpperCase()).sort();
    }

    // 处理连续字符串格式如 "ABC" (多选) 或 "A" (单选/判断)
    // 如果是单选/判断，返回单个字符
    if (questionType === 'single' || questionType === 'judge') {
      return correctAnswer.trim().toUpperCase();
    }

    // 多选可能是连续字符串如 "ABC"
    return correctAnswer.split('').map(s => s.trim().toUpperCase()).sort();
  }

  return correctAnswer;
}
