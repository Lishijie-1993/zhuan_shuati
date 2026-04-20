// 统一管理本地存储的键名
// 避免因拼写不一致导致的数据读写问题
module.exports = {
  STORAGE_KEYS: {
    FAVORITES: 'my_favorites',
    ERRORS: 'my_errors',
    USER_INFO: 'userInfo',
    // 其他可能用到的存储键
    QUIZ_HISTORY: 'quiz_history',
    SETTINGS: 'app_settings'
  }
};
