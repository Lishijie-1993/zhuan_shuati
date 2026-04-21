// 统一管理本地存储的键名
// 避免因拼写不一致导致的数据读写问题

// 获取用户隔离的存储键
// 通过微信云开发获取用户唯一标识，确保不同用户的数据隔离
function getUserScopedKey(baseKey) {
  try {
    // 优先使用已保存的用户ID
    let userId = wx.getStorageSync('_user_id');
    
    // 如果没有用户ID，使用访客ID（只生成一次）
    if (!userId) {
      // 检查是否有临时的访客ID
      let guestId = wx.getStorageSync('_guest_id');
      if (!guestId) {
        // 生成访客ID（使用时间戳确保唯一性）
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        wx.setStorageSync('_guest_id', guestId);
      }
      userId = guestId;
    }
    
    return `${baseKey}_${userId}`;
  } catch (e) {
    // 如果获取失败，使用基础键
    console.error('获取用户隔离键失败:', e);
    return baseKey;
  }
}

// 设置当前用户ID（由登录模块调用）
function setCurrentUserId(userId) {
  try {
    wx.setStorageSync('_user_id', userId);
  } catch (e) {
    console.error('保存用户ID失败:', e);
  }
}

// 清除用户ID（由退出登录调用）
function clearCurrentUserId() {
  try {
    wx.removeStorageSync('_user_id');
  } catch (e) {
    console.error('清除用户ID失败:', e);
  }
}

// 获取当前用户ID
function getCurrentUserId() {
  try {
    return wx.getStorageSync('_user_id') || null;
  } catch (e) {
    return null;
  }
}

module.exports = {
  STORAGE_KEYS: {
    FAVORITES: 'my_favorites',
    ERRORS: 'my_errors',
    USER_INFO: 'userInfo',
    // 其他可能用到的存储键
    QUIZ_HISTORY: 'quiz_history',
    SETTINGS: 'app_settings',
    // 带用户隔离的存储键（防止多用户共用问题）
    USER_FAVORITES: 'user_favorites_',
    USER_ERRORS: 'user_errors_',
    USER_INFO_V2: 'userInfo_v2'
  },
  getUserScopedKey,
  setCurrentUserId,
  clearCurrentUserId,
  getCurrentUserId
};
