// cloudfunctions/getExamHistory/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { page = 1, limit = 20 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const skip = (page - 1) * limit;

    // 先获取符合条件的总记录数（用于分页导航）
    const countRes = await db.collection('user_exam_records')
      .where({
        user_id: openid,
        status: 'completed'
      })
      .count();

    const total = countRes.total;

    // 使用真正的数据库分页，直接 skip + limit
    const res = await db.collection('user_exam_records')
      .where({
        user_id: openid,
        status: 'completed'
      })
      .orderBy('submit_time', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    // 格式化记录数据
    const list = res.data.map(record => {
      const submitTime = record.submit_time
        ? new Date(record.submit_time)
        : new Date();
      const startTime = record.start_time
        ? new Date(record.start_time)
        : submitTime;

      return {
        id: record._id,
        recordId: record._id,
        title: record.paper_title || '模拟考试',
        score: record.score ?? 0,
        time: formatTime(submitTime),
        date: formatDate(submitTime),
        timeUsed: record.time_used || 0,
        startTime: formatTime(startTime),
        status: record.status
      };
    });

    return {
      list,
      total,
      page,
      limit,
      hasNext: skip + list.length < total
    };
  } catch (err) {
    console.error('获取考试记录失败:', err);
    return {
      list: [],
      total: 0,
      page,
      limit,
      hasNext: false,
      error: err.message
    };
  }
};

function formatTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function formatDate(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
