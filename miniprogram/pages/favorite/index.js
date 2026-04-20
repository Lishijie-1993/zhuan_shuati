// miniprogram/pages/favorite/index.js
const { STORAGE_KEYS } = require('../../utils/constants.js');

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
    console.log('📦 收藏页 onShow 执行');
    try {
      const list = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || [];
      console.log('📋 读取到的收藏数据:', list);
      console.log('📊 收藏数量:', list.length);
      
      // 调试：检查每条收藏数据的完整性
      if (list.length > 0) {
        console.log('🔍 第一条收藏数据:', JSON.stringify(list[0], null, 2));
        console.log('🔍 字段检查 - id:', list[0].id);
        console.log('🔍 字段检查 - questionText:', list[0].questionText);
        console.log('🔍 字段检查 - options:', list[0].options);
      }
      
      // 确保数据格式正确（兼容旧数据）
      const formattedList = list.map(item => ({
        id: item.id || `fallback_${Math.random()}`,
        chapterTitle: item.chapterTitle || '',
        questionText: item.questionText || item.currentQuestionText || '题目内容加载中...',
        options: item.options || [],
        correctAnswer: item.correctAnswer || '',
        analysisText: item.analysisText || '暂无解析'
      }));
      
      // 修正 currentIndex，确保不会越界
      let newIndex = 0;
      if (this.data.currentIndex >= formattedList.length && formattedList.length > 0) {
        newIndex = formattedList.length - 1;
      } else if (formattedList.length === 0) {
        newIndex = 0;
      } else {
        newIndex = this.data.currentIndex;
      }
      
      this.setData({ 
        favorites: formattedList,
        currentIndex: newIndex,
        userAnswers: {},
        showAnalysisMap: {}
      });
      
      wx.setNavigationBarTitle({ title: '我的收藏' });
    } catch (e) {
      console.error('❌ 读取收藏失败:', e);
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

  onFavorite() {
    const index = this.data.currentIndex;
    let list = [...this.data.favorites];
    
    if (list.length === 0) return;

    list.splice(index, 1);
    wx.setStorageSync(STORAGE_KEYS.FAVORITES, list);
    
    // 删除后修正 currentIndex
    let newIndex = index;
    if (list.length === 0) {
      // 全部删除
      newIndex = 0;
    } else if (index >= list.length) {
      // 删除的是最后一项，currentIndex 修正为最后一项
      newIndex = list.length - 1;
    }
    // 否则保持在当前位置（下一题自动显示）
    
    this.setData({ 
      favorites: list,
      currentIndex: newIndex,
      userAnswers: {},
      showAnalysisMap: {}
    });
    
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
    const showAnalysisMap = { ...this.data.showAnalysisMap, [currentQ.id]: true };
    this.setData({ showAnalysisMap });
  },

  goBack() {
    wx.navigateBack();
  }
});
