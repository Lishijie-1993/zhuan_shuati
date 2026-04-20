// pages/test/result.js
Page({
  data: {
    score: 0,
    correctCount: 0,
    totalCount: 0,
    paperTitle: '模拟考试',
    passed: false
  },

  onLoad(options) {
    const { score, correct, total, paperId } = options;

    this.setData({
      score: parseInt(score) || 0,
      correctCount: parseInt(correct) || 0,
      totalCount: parseInt(total) || 0,
      passed: parseInt(score) >= 60
    });
  },

  goHome() {
    wx.redirectTo({
      url: '/pages/test/index'
    });
  },

  doAgain() {
    wx.navigateBack({
      delta: 1
    });
  },

  viewAnalysis() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});
