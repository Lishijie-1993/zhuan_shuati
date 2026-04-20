// pages/test/result.js
Page({
  data: {
    score: 0,
    correctCount: 0,
    totalCount: 0,
    accuracy: 0,
    paperTitle: '模拟考试',
    passed: false
  },

  onLoad(options) {
    const { score, correct, total, paperId } = options;

    const scoreNum = parseInt(score) || 0;
    const correctNum = parseInt(correct) || 0;
    const totalNum = parseInt(total) || 0;
    const accuracyNum = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0;

    this.setData({
      score: scoreNum,
      correctCount: correctNum,
      totalCount: totalNum,
      accuracy: accuracyNum,
      passed: scoreNum >= 60
    });
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
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
