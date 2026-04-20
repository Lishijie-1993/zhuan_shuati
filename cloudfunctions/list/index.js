// cloudfunctions/news/list/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { tag, keyword, page = 1 } = event;

  try {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    let query = {};
    
    // 按标签筛选
    if (tag && tag !== '全部') {
      query.category = tag;
    }

    // 按关键词搜索
    if (keyword) {
      query.title = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }

    // 获取总数
    const countRes = await db.collection('articles')
      .where(query)
      .count();
    const total = countRes.total;

    // 分页查询
    const articlesRes = await db.collection('articles')
      .where(query)
      .orderBy('publish_time', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    const list = articlesRes.data.map(article => ({
      id: article._id,
      title: article.title,
      content: article.content,
      coverImage: article.cover || '/images/news/news1.png',
      category: article.category || '其他',
      views: formatViews(article.views || 0),
      publishTime: formatTime(article.publish_time),
      createdAt: article.publish_time
    }));

    return {
      list,
      total,
      hasNext: skip + list.length < total
    };
  } catch (err) {
    console.error('获取资讯列表失败:', err);
    return {
      list: [],
      total: 0,
      hasNext: false,
      error: err.message
    };
  }
};

// 格式化阅读量
function formatViews(views) {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万';
  }
  return views.toString();
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '未知';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}
