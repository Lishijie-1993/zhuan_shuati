// pages/settings/index.js
Page({
  data: {
    cacheSize: '12.5MB'
  },

  onLoad(options) {
    this.calculateCache();
  },

  // 计算缓存大小
  calculateCache() {
    // 实际项目中应该调用 API 获取真实缓存大小
    // 这里使用模拟数据
    this.setData({ cacheSize: '12.5MB' });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 切换通知
  toggleNotify(e) {
    const enabled = e.detail.value;
    wx.showToast({
      title: enabled ? '已开启推送' : '已关闭推送',
      icon: 'none'
    });
  },

  // 切换音效
  toggleSound(e) {
    const enabled = e.detail.value;
    wx.showToast({
      title: enabled ? '音效已开启' : '音效已关闭',
      icon: 'none'
    });
  },

  // 切换震动
  toggleVibrate(e) {
    const enabled = e.detail.value;
    wx.showToast({
      title: enabled ? '震动已开启' : '震动已关闭',
      icon: 'none'
    });
  },

  // 切换主题
  changeTheme() {
    wx.showActionSheet({
      itemList: ['蓝色', '紫色', '绿色', '橙色'],
      success: (res) => {
        const themes = ['蓝色', '紫色', '绿色', '橙色'];
        wx.showToast({
          title: `已切换至${themes[res.tapIndex]}主题`,
          icon: 'none'
        });
      }
    });
  },

  // 切换字体大小
  changeFont() {
    wx.showActionSheet({
      itemList: ['小', '中', '大'],
      success: (res) => {
        const fonts = ['小', '中', '大'];
        wx.showToast({
          title: `字体已调整为${fonts[res.tapIndex]}`,
          icon: 'none'
        });
      }
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' });
          setTimeout(() => {
            wx.hideLoading();
            this.setData({ cacheSize: '0KB' });
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  // 导出数据
  exportData() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 检查更新
  checkUpdate() {
    wx.showToast({
      title: '已是最新版本',
      icon: 'success'
    });
  },

  // 隐私政策
  goToPrivacy() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 用户协议
  goToAgreement() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});
