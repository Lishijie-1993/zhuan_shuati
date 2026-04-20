Page({
  data: {
    favorites: [],
    currentIndex: 0,
    mode: 'answer',
    isAutoNext: false,
    userAnswers: {},
    showAnalysisMap: {},
  },

  onShow() {
    const list = wx.getStorageSync('my_favorites') || [];
    this.setData({ 
      favorites: list,
      userAnswers: {},
      showAnalysisMap: {}
    });
    // 固定设置标题
    wx.setNavigationBarTitle({ title: '我的收藏' });
  },

  onSwiperChange(e) {
    this.setData({ currentIndex: e.detail.current });
    // 删除了之前在这里动态修改标题的代码，保持标题为“我的收藏”
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
    const { id, index } = e.currentTarget.dataset;
    const currentQuestion = this.data.favorites[index];
    if (this.data.mode === 'recite' || this.data.userAnswers[index]) return;

    const userAnswers = this.data.userAnswers;
    userAnswers[index] = id;
    this.setData({ userAnswers });

    if (this.data.isAutoNext && id === currentQuestion.correctAnswer) {
      if (index < this.data.favorites.length - 1) {
        setTimeout(() => { this.setData({ currentIndex: index + 1 }); }, 800);
      }
    }
  },

  onFavorite() {
    const index = this.data.currentIndex;
    let list = this.data.favorites;
    list.splice(index, 1);
    wx.setStorageSync('my_favorites', list);
    this.setData({ favorites: list });
    if (this.data.currentIndex >= list.length && list.length > 0) {
      this.setData({ currentIndex: list.length - 1 });
    }
    wx.showToast({ title: '已移出收藏', icon: 'none' });
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
    const showAnalysisMap = this.data.showAnalysisMap;
    showAnalysisMap[this.data.currentIndex] = true;
    this.setData({ showAnalysisMap });
  },

  goBack() {
    wx.navigateBack();
  }
});