Page({
  data: {
    activeTab: 'today', // today 或 all
    errorCount: 0
  },

  onLoad() {
    // 可以在这里读取本地存储的错题数量
    const list = wx.getStorageSync('my_errors') || [];
    this.setData({ errorCount: list.length });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  }
});