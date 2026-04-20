// pages/user/index.js
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

  // 加载用户信息
  loadUserInfo() {
    // 实际项目中应该从本地存储或后端获取用户信息
    // 这里使用模拟数据
  },

  // 编辑资料
  goToProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 学习记录
  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/index'
    });
  },

  // 刷题记录
  goToQuizHistory() {
    wx.navigateTo({
      url: '/pages/history/index'
    });
  },

  // 我的收藏
  goToFavorites() {
    wx.navigateTo({
      url: '/pages/favorite/index'
    });
  },

  // 错题本
  goToWrongQuestions() {
    wx.navigateTo({
      url: '/pages/error/index'
    });
  },

  // 我的勋章
  goToMedals() {
    wx.navigateTo({
      url: '/pages/medals/index'
    });
  },

  // 分享好友
  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 意见反馈
  goToFeedback() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 关于我们
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '安全工程师刷题神器 v1.0.0\n\n专注安全工程师考试备考，助你顺利通过考试！',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 设置
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/index'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          // 实际项目中可能需要跳转到登录页
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
