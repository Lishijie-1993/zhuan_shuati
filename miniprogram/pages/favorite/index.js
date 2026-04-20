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
    loading: true,
    debugInfo: ''
  },

  onShow() {
    this.loadFavorites();
  },

  // 从云端加载收藏数据
  async loadFavorites() {
    console.log('[favorite] ========== 开始加载收藏数据 ==========');
    console.log('[favorite] 1. 开始调用云函数...');

    try {
      wx.showLoading({ title: '加载中...' });

      // 调用云函数获取收藏列表
      console.log('[favorite] 2. 调用 toggleFavorite 云函数...');
      const res = await cloud.toggleFavorite(null, 'list');

      console.log('[favorite] 3. 云函数返回结果:', JSON.stringify(res, null, 2));

      if (res && res.list) {
        console.log('[favorite] 4. 收藏数据条数:', res.list.length);
        console.log('[favorite] 5. 收藏数据详情:', JSON.stringify(res.list.slice(0, 2), null, 2));

        this.setData({
          favorites: res.list,
          loading: false,
          debugInfo: `加载成功，共 ${res.list.length} 条收藏`
        });

        console.log('[favorite] 6. 数据已设置到 favorites');
      } else {
        console.log('[favorite] 4. 云函数返回的 list 为空或 undefined');
        console.log('[favorite]    res:', JSON.stringify(res));

        this.setData({
          favorites: [],
          loading: false,
          debugInfo: '云函数返回数据为空'
        });
      }

      wx.hideLoading();
    } catch (err) {
      console.error('[favorite] ========== 加载收藏失败 ==========');
      console.error('[favorite] 错误详情:', err);
      console.error('[favorite] 错误消息:', err.message || err.errMsg || JSON.stringify(err));

      this.setData({
        favorites: [],
        loading: false,
        debugInfo: `加载失败: ${err.message || err.errMsg || '未知错误'}`
      });

      wx.hideLoading();
    }
  },

  onSwiperChange(e) {
    console.log('[favorite] 滑动切换，当前索引:', e.detail.current);
    this.setData({ currentIndex: e.detail.current });
  },

  switchMode(e) {
    console.log('[favorite] 切换模式:', e.currentTarget.dataset.mode);
    this.setData({
      mode: e.currentTarget.dataset.mode,
      userAnswers: {}
    });
  },

  toggleAutoNext() {
    const newAutoNext = !this.data.isAutoNext;
    console.log('[favorite] 切换自动下一题:', newAutoNext);
    this.setData({ isAutoNext: newAutoNext });
    wx.showToast({
      title: newAutoNext ? '已开启自动下一题' : '已切换为手动模式',
      icon: 'none'
    });
  },

  selectOption(e) {
    const { optId, qId } = e.currentTarget.dataset;
    console.log('[favorite] 选择选项:', { optId, qId });

    const currentQuestion = this.data.favorites[this.data.currentIndex];
    if (!currentQuestion) {
      console.log('[favorite] 题目不存在');
      return;
    }

    if (this.data.mode === 'recite' || this.data.userAnswers[qId]) {
      console.log('[favorite] 当前模式是背题模式或已作答，忽略');
      return;
    }

    const userAnswers = { ...this.data.userAnswers, [qId]: optId };
    console.log('[favorite] 更新用户答案:', userAnswers);

    this.setData({ userAnswers });

    // 答对后显示解析
    if (optId === currentQuestion.correctAnswer) {
      console.log('[favorite] 答对了');
    } else {
      console.log('[favorite] 答错了，正确答案是:', currentQuestion.correctAnswer);
    }

    // 自动下一题
    if (this.data.isAutoNext && optId === currentQuestion.correctAnswer) {
      console.log('[favorite] 答对了，自动下一题');
      if (this.data.currentIndex < this.data.favorites.length - 1) {
        setTimeout(() => {
          this.setData({ currentIndex: this.data.currentIndex + 1 });
        }, 800);
      }
    }
  },

  async onFavorite() {
    const index = this.data.currentIndex;
    const currentQ = this.data.favorites[index];

    console.log('[favorite] 点击收藏按钮，当前题目:', JSON.stringify(currentQ));

    if (!currentQ) {
      console.log('[favorite] 当前没有题目');
      return;
    }

    try {
      console.log('[favorite] 调用取消收藏云函数，questionId:', currentQ.id);
      const res = await cloud.toggleFavorite(currentQ.id, 'remove');
      console.log('[favorite] 取消收藏返回:', JSON.stringify(res));

      if (res) {
        // 从本地列表移除
        let list = [...this.data.favorites];
        console.log('[favorite] 原始收藏列表长度:', list.length);

        list.splice(index, 1);
        console.log('[favorite] 移除后列表长度:', list.length);

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
      console.error('[favorite] 取消收藏失败:', err);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  prevQuestion() {
    console.log('[favorite] 上一题，当前:', this.data.currentIndex);
    if (this.data.currentIndex > 0) {
      this.setData({
        currentIndex: this.data.currentIndex - 1,
        userAnswers: {}
      });
    } else {
      wx.showToast({ title: '已经是第一题了', icon: 'none' });
    }
  },

  nextQuestion() {
    console.log('[favorite] 下一题，当前:', this.data.currentIndex, '总共:', this.data.favorites.length);
    if (this.data.currentIndex < this.data.favorites.length - 1) {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
        userAnswers: {}
      });
    } else {
      wx.showToast({ title: '已经是最后一题了', icon: 'none' });
    }
  },

  onAnalysis() {
    console.log('[favorite] 点击查看解析');
    if (this.data.favorites.length === 0) return;
    const currentQ = this.data.favorites[this.data.currentIndex];
    const showAnalysisMap = { ...this.data.showAnalysisMap, [currentQ.id]: true };
    this.setData({ showAnalysisMap });
  },

  goBack() {
    console.log('[favorite] 返回上一页');
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});
