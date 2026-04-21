// cloudfunctions/getQuestions/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { chapter, mode = 'normal', page = 1, limit = 10, includeAnswer = false } = event;
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
      // 错题模式：支持真正的分页获取
      return await getErrorQuestions(openid, page, limit, includeAnswer);
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
        .map(q => formatQuestion(q, includeAnswer));

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
      // 乱序模式：使用聚合管道实现稳定的随机分页
      const skip = (page - 1) * limit;

      // 获取一个较大的随机样本（约 500 条），足够覆盖多次分页
      const randomRes = await db.collection('question_bank').aggregate()
        .sample({ size: 500 })
        .end();

      // 从随机样本中手动分页
      const pageData = randomRes.list.slice(skip, skip + limit);
      const list = pageData.map(q => formatQuestion(q, includeAnswer));

      return {
        list,
        total,
        hasNext: skip + list.length < randomRes.list.length
      };
    } else {
      const questionsRes = await db.collection('question_bank')
        .where(query)
        .skip(skip)
        .limit(limit)
        .get();

      const list = questionsRes.data.map(q => formatQuestion(q, includeAnswer));
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

// 获取错题（真正的分页，避免内存溢出）
async function getErrorQuestions(openid, page, limit, includeAnswer = false) {
  const skip = (page - 1) * limit;

  // 构建错题查询条件
  const errorQuery = _.or([
    { user_id: openid },
    { _openid: openid }
  ]);

  // 先获取符合条件的总记录数
  const countRes = await db.collection('user_errors')
    .where(errorQuery)
    .count();

  const total = countRes.total;

  // 使用真正的数据库分页，按时间倒序获取错题ID
  const errorRes = await db.collection('user_errors')
    .where(errorQuery)
    .orderBy('last_wrong_time', 'desc')
    .skip(skip)
    .limit(limit)
    .get();

  if (errorRes.data.length === 0) {
    return {
      list: [],
      total,
      hasNext: false
    };
  }

  // 构建错题ID映射（记录错误次数）
  const errorMap = {};
  errorRes.data.forEach(e => {
    errorMap[e.question_id] = e;
  });

  const pageIds = errorRes.data.map(e => e.question_id);

  // 根据错题ID获取题目详情
  const questionsRes = await db.collection('question_bank')
    .where({
      _id: _.in(pageIds)
    })
    .get();

  // 保持分页顺序，合并错误次数
  const list = pageIds
    .map(id => questionsRes.data.find(q => q._id === id))
    .filter(q => q)
    .map(q => {
      const formatted = formatQuestion(q, includeAnswer);
      formatted.errorCount = errorMap[q._id] ? errorMap[q._id].error_count || 1 : 1;
      return formatted;
    });

  return {
    list,
    total,
    hasNext: skip + list.length < total
  };
}

// 格式化题目数据（根据模式决定是否包含敏感字段）
function formatQuestion(q, includeAnswer = false) {
  const base = {
    id: q._id || q.id,
    subjectId: q.subject_id,
    chapterId: q.chapter_id,
    type: q.type,
    content: q.content,
    options: formatOptions(q.options),
    difficulty: q.difficulty || 1
  };

  // 【安全修复】只有明确要求或非考试模式下才返回答案
  // 调用方应显式传入 includeAnswer: true
  if (includeAnswer) {
    base.correctAnswer = q.correct_answer;
    base.analysis = q.analysis || '暂无解析';
  }

  return base;
}

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
