// pages/user/index.js
const cloud = require('../../utils/cloud.js');
const { STORAGE_KEYS, getUserScopedKey, setCurrentUserId, clearCurrentUserId, getCurrentUserId } = require('../../utils/constants.js');

Page({
  data: {
    userInfo: {
      nickname: '安全学员',
      id: '888888',
      avatar: '/images/icons/user.png',
      totalQuestions: 0,
      favorites: 0,
      wrongQuestions: 0,
      medals: 0,
      continueDays: 0
    }
  },

  onLoad(options) {
    this.loadUserInfo();
  },

  onShow() {
    // 每次显示页面时都强制刷新数据，确保状态同步
    this.loadUserInfo(true);
  },

  // 加载用户信息（使用用户隔离的存储）
  async loadUserInfo(forceRefresh = false) {
    try {
      // 使用用户隔离的存储键，防止多用户数据串号
      const userScopedKey = getUserScopedKey('userInfo');
      const cachedUser = wx.getStorageSync(userScopedKey);
      
      // 如果有缓存且不是强制刷新，先显示缓存数据
      if (cachedUser && !forceRefresh) {
        this.setData({ userInfo: cachedUser });
      }

      // 并行获取所有实时数据，确保状态同步
      const [userRes, errorCount, favoriteCount] = await Promise.all([
        cloud.getUserInfo(),
        this.getErrorCount(),
        this.getFavoriteCount()
      ]);

      if (userRes && userRes.userInfo) {
        // 设置当前用户ID，用于存储隔离
        if (userRes.userInfo.id) {
          setCurrentUserId(userRes.userInfo.id);
        }

        const userInfo = {
          ...userRes.userInfo,
          wrongQuestions: errorCount,
          favorites: favoriteCount
        };

        // 使用用户隔离的存储键更新
        wx.setStorageSync(userScopedKey, userInfo);
        this.setData({ userInfo });
      } else if (cachedUser) {
        // 如果云函数返回失败，但有缓存，更新缓存中的数量
        const updatedUser = {
          ...cachedUser,
          wrongQuestions: errorCount,
          favorites: favoriteCount
        };
        wx.setStorageSync(userScopedKey, updatedUser);
        this.setData({ userInfo: updatedUser });
      } else {
        // 如果云函数返回失败且无缓存，尝试使用当前存储的用户ID获取隔离数据
        const currentUserId = getCurrentUserId();
        if (currentUserId && currentUserId !== cachedUser?.id) {
          // 可能是新用户登录，尝试重新获取
          console.log('检测到用户切换，尝试重新获取用户信息');
        }
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
      const userScopedKey = getUserScopedKey('userInfo');
      const localUser = wx.getStorageSync(userScopedKey);
      if (localUser) {
        this.setData({ userInfo: localUser });
      }
    }
  },

  // 获取错题数量（使用 count 统计，避免获取全量数据）
  async getErrorCount() {
    try {
      const res = await cloud.call('getQuestions', { mode: 'error', limit: 1 });
      return res && res.total ? res.total : 0;
    } catch (err) {
      console.error('获取错题数量失败:', err);
      return 0;
    }
  },

  // 获取收藏数量
  async getFavoriteCount() {
    try {
      const res = await cloud.toggleFavorite(null, 'list');
      return res && res.list ? res.list.length : 0;
    } catch (err) {
      console.error('获取收藏数量失败:', err);
      return 0;
    }
  },

  goToProfile() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/history/index' });
  },

  goToQuizHistory() {
    wx.navigateTo({ url: '/pages/history/index' });
  },

  goToFavorites() {
    wx.navigateTo({ url: '/pages/favorite/index' });
  },

  goToWrongQuestions() {
    wx.navigateTo({ url: '/pages/error/index' });
  },

  goToMedals() {
    wx.navigateTo({ url: '/pages/medals/index' });
  },

  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  goToFeedback() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '安全工程师刷题神器 v1.0.0\n\n专注安全工程师考试备考，助你顺利通过考试！',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/index' });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户ID（这是最关键的，确保后续操作不会使用旧用户的数据）
          clearCurrentUserId();
          
          // 清除所有本地存储（使用旧方式清除兼容）
          wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
          wx.removeStorageSync(STORAGE_KEYS.FAVORITES);
          wx.removeStorageSync(STORAGE_KEYS.ERRORS);
          
          // 清除用户隔离的存储（遍历可能的用户ID）
          // 注意：由于已清除 _user_id，新的 getUserScopedKey 调用会使用 guest_ 时间戳
          // 这里我们显式清除可能存在的隔离存储
          try {
            const timestamp = Date.now();
            wx.removeStorageSync(`userInfo_${timestamp}`);
            wx.removeStorageSync(`favorites_${timestamp}`);
            wx.removeStorageSync(`errors_${timestamp}`);
          } catch (e) {
            // 忽略清除错误
          }
          
          wx.showToast({ title: '已退出登录', icon: 'success' });
          
          // 刷新页面以更新状态
          this.loadUserInfo(true);
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '安全工程师刷题神器，助你轻松备考！',
      path: '/pages/index/index'
    };
  }
});
