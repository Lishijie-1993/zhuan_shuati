Page({
  data: {
    historyList: [], // 后续对接数据库
    stats: {
      totalCount: 0,
      highScore: 0,
      avgScore: 0
    }
  },

  onLoad() {
    // 页面加载逻辑：后续此处调用云函数获取历史记录
  },

  // 返回功能
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 查看详情（预留）
  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/test/result?id=${id}` });
  }
});