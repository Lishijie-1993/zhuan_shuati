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
    },
    // 【修复7】刷题记录数据
    correctCount: 0,
    wrongCount: 0,
    correctRate: 0,
    wrongRate: 0
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

        // 【修复5】云端 total_questions 存的是"答对数"，非"总题数"
        // 故 total = 答对数 + 错题数，避免出现负数或 0
        const wrongCount = errorCount;
        const correctCount = totalQuestions;
        const actualTotal = correctCount + wrongCount;
        const correctRate = actualTotal > 0 ? Math.round((correctCount / actualTotal) * 100) : 0;
        const wrongRate = 100 - correctRate;

        const userInfo = {
          ...userRes.userInfo,
          wrongQuestions: wrongCount,
          favorites: favoriteCount,
          // 【修复5】前端 totalQuestions 改为展示"总题数"，而非云端的"答对数"
          totalQuestions: actualTotal
        };

        // 使用用户隔离的存储键更新
        wx.setStorageSync(userScopedKey, userInfo);
        this.setData({
          userInfo,
          correctCount,
          wrongCount,
          correctRate,
          wrongRate
        });
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
          // 清除用户ID，后续 getUserScopedKey 会自动分配新的 guest_ 时间戳 key
          // 新用户重新登录时会自动拉取云端数据覆盖，不会串号
          clearCurrentUserId();

          // 清除旧版兼容存储
          wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
          wx.removeStorageSync(STORAGE_KEYS.FAVORITES);
          wx.removeStorageSync(STORAGE_KEYS.ERRORS);

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
