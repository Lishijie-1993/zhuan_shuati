// cloudfunctions/getQuestions/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

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
      query = {};
    } else if (mode === 'error') {
      // 错题模式：支持分页获取用户的错题
      const errorData = await fetchAllErrorData(openid);

      const total = errorData.length;
      const skip = (page - 1) * limit;
      const pageData = errorData.slice(skip, skip + limit);

      if (pageData.length === 0) {
        return {
          list: [],
          total,
          hasNext: false
        };
      }

      const pageIds = pageData.map(e => e.question_id);

      // 根据错题ID获取题目详情
      const questionsRes = await db.collection('question_bank')
        .where({
          _id: db.command.in(pageIds)
        })
        .get();

      // 保持原有顺序，合并错误次数
      const errorMap = {};
      pageData.forEach(e => { errorMap[e.question_id] = e; });

      const list = pageIds
        .map(id => questionsRes.data.find(q => q._id === id))
        .filter(q => q)
        .map(q => {
          const formatted = formatQuestion(q);
          formatted.errorCount = errorMap[q._id] ? errorMap[q._id].error_count || 1 : 1;
          return formatted;
        });

      return {
        list,
        total,
        hasNext: skip + list.length < total
      };
    } else if (mode === 'byIds') {
      // 根据ID列表获取题目
      const { ids = [] } = event;
      if (ids.length === 0) {
        return { list: [], total: 0, hasNext: false };
      }

      const questionsRes = await db.collection('question_bank')
        .where({
          _id: db.command.in(ids)
        })
        .get();

      // 按原始顺序排列
      const list = ids
        .map(id => questionsRes.data.find(q => q._id === id))
        .filter(q => q)
        .map(q => formatQuestion(q));

      return {
        list,
        total: list.length,
        hasNext: false
      };
    }

    // 查询题目总数
    const countRes = await db.collection('question_bank').where(query).count();
    const total = countRes.total;

    // 分页查询
    const skip = (page - 1) * limit;
    
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
      const questionsRes = await db.collection('question_bank')
        .where(query)
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

// 分批获取所有错题数据（解决100条限制）
async function fetchAllErrorData(openid) {
  const BATCH_SIZE = 100;
  const allErrors = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await db.collection('user_errors')
      .where(_.or([
        { user_id: openid },
        { _openid: openid }
      ]))
      .orderBy('last_wrong_time', 'desc')
      .skip(skip)
      .limit(BATCH_SIZE)
      .get();

    allErrors.push(...res.data);

    if (res.data.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      skip += BATCH_SIZE;
    }
  }

  // 去重（同一题目保留最新记录）
  const errorMap = {};
  allErrors.forEach(e => {
    const existing = errorMap[e.question_id];
    if (!existing || new Date(e.last_wrong_time) > new Date(existing.last_wrong_time)) {
      errorMap[e.question_id] = e;
    }
  });

  return Object.values(errorMap).sort((a, b) =>
    new Date(b.last_wrong_time) - new Date(a.last_wrong_time)
  );
}

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
