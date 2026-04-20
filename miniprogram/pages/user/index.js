// pages/user/index.js
const { STORAGE_KEYS } = require('../../utils/constants.js');

Page({
  data: {
    userInfo: {
      nickname: '安全学员',
      id: '888888',
      avatar: '/images/icons/user.png',
      totalQuestions: 1286,
      favorites: 56,
      wrongQuestions: 89,
      medals: 5,
      continueDays: 7
    }
  },

  onLoad(options) {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    // 从本地存储读取用户信息
    const userInfo = wx.getStorageSync(STORAGE_KEYS.USER_INFO);
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  goToProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/index'
    });
  },

  goToQuizHistory() {
    wx.navigateTo({
      url: '/pages/history/index'
    });
  },

  goToFavorites() {
    wx.navigateTo({
      url: '/pages/favorite/index'
    });
  },

  goToWrongQuestions() {
    wx.navigateTo({
      url: '/pages/error/index'
    });
  },

  goToMedals() {
    wx.navigateTo({
      url: '/pages/medals/index'
    });
  },

  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  goToFeedback() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
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
    wx.navigateTo({
      url: '/pages/settings/index'
    });
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
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
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
