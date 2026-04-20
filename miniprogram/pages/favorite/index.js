// miniprogram/pages/favorite/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    favorites: [],
    currentIndex: 0,
    mode: 'answer',
    isAutoNext: false,
    userAnswers: {},
    showAnalysisMap: {},
    loading: true
  },

  onShow() {
    this.loadFavorites();
  },

  // 从云端加载收藏数据
  async loadFavorites() {
    try {
      wx.showLoading({ title: '加载中...' });

      const res = await cloud.toggleFavorite(null, 'list');

      if (res && res.list) {
        this.setData({
          favorites: res.list,
          loading: false
        });
      } else {
        this.setData({
          favorites: [],
          loading: false
        });
      }

      wx.hideLoading();
    } catch (err) {
      console.error('加载收藏失败:', err);
      this.setData({
        favorites: [],
        loading: false
      });
      wx.hideLoading();
    }
  },

  onSwiperChange(e) {
    this.setData({ currentIndex: e.detail.current });
  },

  switchMode(e) {
    this.setData({
      mode: e.currentTarget.dataset.mode,
      userAnswers: {}
    });
  },

  toggleAutoNext() {
    this.setData({ isAutoNext: !this.data.isAutoNext });
    wx.showToast({
      title: this.data.isAutoNext ? '已开启自动下一题' : '已切换为手动模式',
      icon: 'none'
    });
  },

  selectOption(e) {
    const { optId, qId, index } = e.currentTarget.dataset;
    const currentQuestion = this.data.favorites[index];

    if (this.data.mode === 'recite' || this.data.userAnswers[qId]) return;

    const userAnswers = { ...this.data.userAnswers, [qId]: optId };
    this.setData({ userAnswers });

    if (this.data.isAutoNext && optId === currentQuestion.correctAnswer) {
      if (index < this.data.favorites.length - 1) {
        setTimeout(() => {
          this.setData({ currentIndex: index + 1 });
        }, 800);
      }
    }
  },

  async onFavorite() {
    const index = this.data.currentIndex;
    const currentQ = this.data.favorites[index];

    if (!currentQ) return;

    try {
      const res = await cloud.toggleFavorite(currentQ.id, 'remove');

      if (res) {
        // 从本地列表移除
        let list = [...this.data.favorites];
        list.splice(index, 1);

        let newIndex = index;
        if (list.length === 0) {
          newIndex = 0;
        } else if (index >= list.length) {
          newIndex = list.length - 1;
        }

        this.setData({
          favorites: list,
          currentIndex: newIndex,
          userAnswers: {},
          showAnalysisMap: {}
        });

        wx.showToast({ title: '已移出收藏', icon: 'none' });
      }
    } catch (err) {
      console.error('取消收藏失败:', err);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  prevQuestion() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 });
    }
  },

  nextQuestion() {
    if (this.data.currentIndex < this.data.favorites.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 });
    }
  },

  onAnalysis() {
    if (this.data.favorites.length === 0) return;
    const currentQ = this.data.favorites[this.data.currentIndex];
    const showAnalysisMap = { ...this.data.showAnalysisMap, [currentQ.id]: true };
    this.setData({ showAnalysisMap });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});
