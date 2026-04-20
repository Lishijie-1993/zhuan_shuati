// cloudfunctions/quiz/getQuestions/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { chapter, mode = 'normal', page = 1, limit = 10 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 构建查询条件
    let query = {};
    
    // 根据模式筛选
    if (mode === 'normal') {
      // 正常模式：指定章节
      if (chapter) {
        query.chapter_id = chapter;
      }
    } else if (mode === 'random') {
      // 乱序模式：随机获取题目
      query = {}; // 不限制章节
    } else if (mode === 'error') {
      // 错题模式：获取用户的错题
      const errorRes = await db.collection('user_errors').where({
        user_id: openid
      }).get();
      const errorQuestionIds = errorRes.data.map(e => e.question_id);
      return {
        list: [],
        total: errorQuestionIds.length,
        hasNext: false
      };
    }

    // 查询题目总数
    const countRes = await db.collection('question_bank').where(query).count();
    const total = countRes.total;

    // 分页查询
    const skip = (page - 1) * limit;
    let questionsQuery = db.collection('question_bank').where(query);
    
    if (mode === 'random') {
      // 乱序模式使用 aggregate + sample
      const aggregateRes = await db.collection('question_bank').aggregate()
        .sample({ size: limit })
        .end();
      
      const list = aggregateRes.list.map(q => formatQuestion(q));
      return {
        list,
        total,
        hasNext: page * limit < total
      };
    } else {
      const questionsRes = await questionsQuery
        .skip(skip)
        .limit(limit)
        .get();
      
      const list = questionsRes.data.map(q => formatQuestion(q));
      return {
        list,
        total,
        hasNext: skip + list.length < total
      };
    }
  } catch (err) {
    console.error('获取题目失败:', err);
    return {
      list: [],
      total: 0,
      hasNext: false,
      error: err.message
    };
  }
};

// 格式化题目数据
function formatQuestion(q) {
  return {
    id: q._id || q.id,
    subjectId: q.subject_id,
    chapterId: q.chapter_id,
    type: q.type, // single/multi/judge
    content: q.content,
    options: q.options || [],
    correctAnswer: q.correct_answer,
    analysis: q.analysis || '暂无解析',
    difficulty: q.difficulty || 1
  };
}
