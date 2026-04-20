// cloudfunctions/fav/toggle/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { questionId, action, page = 1, limit = 50 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 兼容 questionId 和 question_id 两种字段名
    const qId = questionId || event.question_id;

    if (action === 'list') {
      // 【修复】获取收藏列表 - 支持真正的分页
      const skip = (page - 1) * limit;

      // 先获取符合条件的总记录数
      const countRes = await db.collection('user_favorites')
        .where({ user_id: openid })
        .count();

      const total = countRes.total;

      // 使用真正的分页查询
      const favRes = await db.collection('user_favorites')
        .where({ user_id: openid })
        .orderBy('created_at', 'desc')
        .skip(skip)
        .limit(limit)
        .get();

      // 获取题目详情
      const questionIds = favRes.data.map(f => f.question_id);
      if (questionIds.length === 0) {
        return { status: 'ok', list: [], total: 0, hasNext: false };
      }

      // 批量获取题目详情（支持分页）
      const questionsRes = await db.collection('question_bank')
        .where({ _id: _.in(questionIds) })
        .get();

      const list = questionIds
        .map(id => questionsRes.data.find(q => q._id === id))
        .filter(q => q)
        .map(q => ({
          id: q._id,
          chapterTitle: q.chapter_id,
          questionText: q.content,
          options: formatOptions(q.options),
          correctAnswer: q.correct_answer,
          analysisText: q.analysis || '暂无解析',
          type: q.type
        }));

      return {
        status: 'ok',
        list,
        total,
        page,
        limit,
        hasNext: skip + list.length < total
      };
    }

    if (action === 'add') {
      // 添加收藏
      // 检查是否已收藏
      const existRes = await db.collection('user_favorites').where({
        user_id: openid,
        question_id: qId
      }).get();

      if (existRes.data.length > 0) {
        return { status: 'already_exists' };
      }

      await db.collection('user_favorites').add({
        data: {
          user_id: openid,
          question_id: qId,
          created_at: new Date()
        }
      });

      // 更新用户收藏数量
      await updateUserFavoritesCount(openid, 1);

      return { status: 'added' };
    } else if (action === 'remove') {
      // 取消收藏
      await db.collection('user_favorites').where({
        user_id: openid,
        question_id: qId
      }).remove();

      // 更新用户收藏数量
      await updateUserFavoritesCount(openid, -1);

      return { status: 'removed' };
    }

    return { status: 'unknown_action' };
  } catch (err) {
    console.error('收藏操作失败:', err);
    return {
      status: 'error',
      error: err.message
    };
  }
};

// 更新用户收藏数量（原子操作）
async function updateUserFavoritesCount(openid, delta) {
  try {
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        favorites: _.inc(delta),
        updated_at: new Date()
      }
    });
  } catch (err) {
    console.error('更新收藏数量失败:', err);
  }
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
      return options.split('\n').filter(s => s.trim()).map((s, i) => ({
        id: String.fromCharCode(65 + i),
        text: s.trim()
      }));
    }
  }

  // 如果是数组
  if (Array.isArray(options)) {
    return options.map((opt, index) => {
      // 如果是对象 {key: 'A', content: 'xxx'} 或 {id: 'A', text: 'xxx'}
      if (typeof opt === 'object') {
        return {
          id: opt.key || opt.id || String.fromCharCode(65 + index),
          text: opt.content || opt.value || opt.text || ''
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
