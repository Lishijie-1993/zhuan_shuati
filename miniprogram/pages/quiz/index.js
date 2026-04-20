// miniprogram/pages/quiz/index.js
const { STORAGE_KEYS } = require('../../utils/constants.js');

Page({
  data: {
    chapterTitle: '第1章 金属非金属矿山概述',
    mode: 'answer',
    isAutoNext: false,
    currentIndex: 0,
    totalQuestions: 164,
    correctAnswer: 'C',
    userAnswer: null,
    isFavorited: false,
    analysisText: '裂隙水赋存于岩石裂隙中的地下水，其特点正是水量一般不大，但水压往往较大。当裂隙水与其他水源没有水力联系时，由于缺乏水源补给，其涌水量会逐渐减少，乃至疏干。相反，如果与其他水源存在水力联系，涌水量则会因得到补给而逐步增加，这种情况容易导致突水事故的发生。因此，题目描述的特点与裂隙水完全相符。',
    options: [
      { id: 'A', text: '涌水量介于100~500m³/h' },
      { id: 'B', text: '水压大，水量丰富，一般为500~1000m³/h' },
      { id: 'C', text: '静储量大，动储量小，一般为80~500m³/h' },
      { id: 'D', text: '以静储量为主，动储量变化范围大，可由每小时10m³至数万立方米' }
    ],
    currentQuestionText: '根据矿床充水主要含水层的类型，将固体矿床划分为以孔隙含水层为主的充水矿床、以裂隙含水层为主的充水矿床和以岩溶含水层为主的充水矿床。下列选项中属于构造裂隙含水层型矿坑涌水特点的是（ ）。'
  },

  onLoad(options) {
    if (options.title) {
      const decodedTitle = decodeURIComponent(options.title);
      this.setData({
        chapterTitle: decodedTitle
      });
      wx.setNavigationBarTitle({
        title: decodedTitle
      });
    }
    this.checkFavoriteStatus();
  },

  onShow() {
    this.checkFavoriteStatus();
  },

  checkFavoriteStatus() {
    try {
      const favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || [];
      const questionId = `${this.data.chapterTitle}_${this.data.currentIndex}`;
      const isFavorited = favorites.some(item => item.id === questionId);
      this.setData({ isFavorited });
    } catch (e) {
      console.error('读取收藏状态失败:', e);
      this.setData({ isFavorited: false });
    }
  },

  toggleAutoNext() {
    this.setData({
      isAutoNext: !this.data.isAutoNext
    });
    wx.showToast({
      title: this.data.isAutoNext ? '已开启自动下一题' : '已切换为手动模式',
      icon: 'none'
    });
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ 
      mode,
      userAnswer: null
    });
  },

  selectOption(e) {
    if (this.data.mode === 'recite' || this.data.userAnswer) {
      return;
    }

    const selectedId = e.currentTarget.dataset.id;
    this.setData({
      userAnswer: selectedId
    });

    if (this.data.mode === 'answer' && this.data.isAutoNext && selectedId === this.data.correctAnswer) {
      setTimeout(() => {
        this.nextQuestion();
      }, 800); 
    }
  },

  goBack() {
    wx.navigateBack();
  },

  prevQuestion() {
    if (this.data.currentIndex > 0) {
      this.setData({
        currentIndex: this.data.currentIndex - 1,
        userAnswer: null
      }, () => {
        this.checkFavoriteStatus();
      });
    } else {
      wx.showToast({
        title: '已经是第一题了',
        icon: 'none'
      });
    }
  },

  onAnalysis() {
    if(this.data.mode === 'answer' && !this.data.userAnswer) {
      this.setData({ userAnswer: 'SHOW_ANALYSIS' });
    }
    wx.showToast({
      title: '查看详细解析',
      icon: 'none'
    });
  },

  onFavorite() {
    try {
      let favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || [];
      const questionId = `${this.data.chapterTitle}_${this.data.currentIndex}`;
      const isNowFavorited = !this.data.isFavorited;

      if (isNowFavorited) {
        const favoriteItem = {
          id: questionId,
          chapterTitle: this.data.chapterTitle,
          questionText: this.data.currentQuestionText || this.data.options[0]?.text || '',
          options: this.data.options,
          correctAnswer: this.data.correctAnswer,
          analysisText: this.data.analysisText || '暂无解析',
          timestamp: Date.now()
        };
        
        const exists = favorites.some(item => item.id === questionId);
        if (!exists) {
          favorites.push(favoriteItem);
          wx.setStorageSync(STORAGE_KEYS.FAVORITES, favorites);
          wx.showToast({ title: '收藏成功', icon: 'success' });
        } else {
          wx.showToast({ title: '已收藏过该题', icon: 'none' });
        }
      } else {
        const beforeLength = favorites.length;
        favorites = favorites.filter(item => item.id !== questionId);
        
        if (favorites.length < beforeLength) {
          wx.setStorageSync(STORAGE_KEYS.FAVORITES, favorites);
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        }
      }

      this.setData({ isFavorited: isNowFavorited });
      
    } catch (e) {
      console.error('收藏操作失败:', e);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  nextQuestion() {
    if (this.data.currentIndex < this.data.totalQuestions - 1) {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
        userAnswer: null
      }, () => {
        this.checkFavoriteStatus();
      });
    } else {
      wx.showToast({
        title: '已经是最后一题了',
        icon: 'none'
      });
    }
  }
});
