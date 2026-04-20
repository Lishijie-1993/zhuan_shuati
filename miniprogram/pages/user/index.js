// pages/user/index.js
const cloud = require('../../utils/cloud.js');
const { STORAGE_KEYS } = require('../../utils/constants.js');

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

  // 加载用户信息
  async loadUserInfo(forceRefresh = false) {
    try {
      // 先尝试从存储获取缓存数据用于快速显示
      const cachedUser = wx.getStorageSync(STORAGE_KEYS.USER_INFO);
      
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
        const userInfo = {
          ...userRes.userInfo,
          wrongQuestions: errorCount,
          favorites: favoriteCount
        };

        // 更新存储和页面数据
        wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo);
        this.setData({ userInfo });
      } else if (cachedUser) {
        // 如果云函数返回失败，但有缓存，更新缓存中的数量
        const updatedUser = {
          ...cachedUser,
          wrongQuestions: errorCount,
          favorites: favoriteCount
        };
        wx.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser);
        this.setData({ userInfo: updatedUser });
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
      const localUser = wx.getStorageSync(STORAGE_KEYS.USER_INFO);
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
          wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
          wx.removeStorageSync(STORAGE_KEYS.FAVORITES);
          wx.removeStorageSync(STORAGE_KEYS.ERRORS);
          wx.showToast({ title: '已退出登录', icon: 'success' });
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
