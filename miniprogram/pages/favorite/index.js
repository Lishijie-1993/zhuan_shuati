Page({
  data: {
    favorites: [],      // 题目数据源
    currentIndex: 0,
    mode: 'answer',
    isAutoNext: false,
    userAnswers: {},     // 记录用户答案，键为题目 ID
    showAnalysisMap: {}, // 记录解析显示状态，键为题目 ID
  },

  onShow() {
    // 从缓存读取数据
    const list = wx.getStorageSync('my_favorites') || [];
    // 【修改点1】确保调用了 setData 且键名为 favorites，界面才会刷新
    this.setData({ 
      favorites: list,
      currentIndex: 0, // 每次进入页面重置到第一题
      userAnswers: {},
      showAnalysisMap: {}
    });
    wx.setNavigationBarTitle({ title: '我的收藏' });
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

    const userAnswers = this.data.userAnswers;
    userAnswers[qId] = optId; 
    this.setData({ userAnswers });

    if (this.data.isAutoNext && optId === currentQuestion.correctAnswer) {
      if (index < this.data.favorites.length - 1) {
        setTimeout(() => { this.setData({ currentIndex: index + 1 }); }, 800);
      }
    }
  },

  onFavorite() {
    const index = this.data.currentIndex;
    let list = [...this.data.favorites]; // 使用展开运算符深拷贝
    
    if (list.length === 0) return;

    list.splice(index, 1);
    wx.setStorageSync('my_favorites', list);
    
    // 【修改点1】移除题目后立即 setData 更新视图
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
    if (this.data.favorites.length === 0) return;
    const currentQ = this.data.favorites[this.data.currentIndex];
    const showAnalysisMap = this.data.showAnalysisMap;
    showAnalysisMap[currentQ.id] = true;
    this.setData({ showAnalysisMap });
  },

  goBack() {
    wx.navigateBack();
  }
});