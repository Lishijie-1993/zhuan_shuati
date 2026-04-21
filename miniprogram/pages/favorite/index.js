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
    loadingMore: false,
    hasMore: true,
    page: 1,
    total: 0,
    debugInfo: ''
  },

  // 页面挂载标记，用于防止内存泄漏
  _isMounted: true,
  // 标记是否刚从子页面返回（避免刷新导致滚动位置重置）
  _returningFromChild: false,

  onLoad() {
    this._isMounted = true;
  },

  onUnload() {
    // 页面卸载时清理定时器，防止内存泄漏
    this._isMounted = false;
    if (this._autoNextTimer) {
      clearTimeout(this._autoNextTimer);
      this._autoNextTimer = null;
    }
  },

  // 收藏页面：智能刷新策略
  // - 从子页面返回 onShow -> 刷新数据（确保数据同步，例如取消收藏后能正确移除）
  // - 仅首次加载或数据为空时显示 loading
  onShow() {
    if (this._returningFromChild) {
      this._returningFromChild = false;
    }
    // 从子页面返回时刷新数据，确保数据同步（例如下面取消收藏后列表能正确移除）
    this.loadFavorites();
  },

  // 重置并重新加载
  resetAndLoad() {
    this.setData({
      page: 1,
      favorites: [],
      hasMore: true,
      loading: true,
      currentIndex: 0
    });
    this.loadFavorites();
  },

  // 从云端加载收藏数据
  async loadFavorites() {
    if (this.data.loadingMore || (!this.data.hasMore && this.data.page > 1)) return;

    console.log('[favorite] ========== 开始加载收藏数据 ==========');
    console.log('[favorite] 当前页:', this.data.page);

    try {
      if (this.data.page === 1) {
        wx.showLoading({ title: '加载中...' });
      }

      this.setData({ loadingMore: true });

      // 调用云函数获取收藏列表
      const res = await cloud.toggleFavorite(null, 'list', this.data.page, 50);

      console.log('[favorite] 云函数返回结果:', JSON.stringify(res, null, 2));

      if (res && res.list) {
        const newList = this.data.page === 1 ? res.list : [...this.data.favorites, ...res.list];

        console.log('[favorite] 收藏数据条数:', res.list.length, '总条数:', res.total);

        this.setData({
          favorites: newList,
          currentIndex: 0,
          loading: false,
          loadingMore: false,
          hasNext: res.hasNext !== false,
          hasMore: res.hasNext !== false,
          total: res.total || newList.length,
          page: this.data.page + 1,
          debugInfo: `加载成功，共 ${res.total} 条收藏`
        });

        console.log('[favorite] 数据已设置到 favorites');
      } else {
        console.log('[favorite] 云函数返回的 list 为空或 undefined');

        this.setData({
          favorites: this.data.page === 1 ? [] : this.data.favorites,
          loading: false,
          loadingMore: false,
          hasMore: false,
          debugInfo: '云函数返回数据为空'
        });
      }

      wx.hideLoading();
    } catch (err) {
      console.error('[favorite] ========== 加载收藏失败 ==========');
      console.error('[favorite] 错误详情:', err);

      this.setData({
        loading: false,
        loadingMore: false,
        debugInfo: `加载失败: ${err.message || err.errMsg || '未知错误'}`
      });

      wx.hideLoading();
    }
  },

  // 滚动到底部时加载更多
  onScrollToLower() {
    if (this.data.hasMore && !this.data.loadingMore) {
      console.log('[favorite] 滚动到底部，加载更多...');
      this.loadFavorites();
    }
  },

  // 获取当前题目（带安全检查）
  getCurrentQuestion() {
    const { favorites, currentIndex } = this.data;
    if (!favorites || favorites.length === 0) return null;
    if (currentIndex < 0 || currentIndex >= favorites.length) return null;
    return favorites[currentIndex];
  },

  onSwiperChange(e) {
    const newIndex = e.detail.current;
    if (newIndex >= 0 && newIndex < this.data.favorites.length) {
      console.log('[favorite] 滑动切换，当前索引:', newIndex);
      this.setData({
        currentIndex: newIndex,
        userAnswers: {},
        showAnalysisMap: {}
      });

      // 如果快到列表末尾且还有更多数据，自动加载
      if (newIndex >= this.data.favorites.length - 5 && this.data.hasMore && !this.data.loadingMore) {
        console.log('[favorite] 快到列表末尾，预加载更多...');
        this.loadFavorites();
      }
    }
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

    const currentQuestion = this.getCurrentQuestion();
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

    // 自动下一题（使用实例变量追踪定时器，防止内存泄漏）
    if (this.data.isAutoNext && optId === currentQuestion.correctAnswer) {
      console.log('[favorite] 答对了，自动下一题');
      if (this.data.currentIndex < this.data.favorites.length - 1) {
        this._autoNextTimer = setTimeout(() => {
          // 页面可能已卸载，需要检查
          if (this._isMounted !== false) {
            this.nextQuestion();
          }
        }, 800);
      }
    }
  },

  async onFavorite() {
    const index = this.data.currentIndex;
    const currentQ = this.getCurrentQuestion();

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

        // 安全地计算新的索引
        let newIndex = 0;
        if (list.length === 0) {
          newIndex = 0;
        } else if (index >= list.length) {
          newIndex = list.length - 1;
        } else {
          newIndex = index;
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
    if (this.data.favorites.length === 0) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    if (this.data.currentIndex > 0) {
      this.setData({
        currentIndex: this.data.currentIndex - 1,
        userAnswers: {},
        showAnalysisMap: {}
      });
    } else {
      wx.showToast({ title: '已经是第一题了', icon: 'none' });
    }
  },

  nextQuestion() {
    console.log('[favorite] 下一题，当前:', this.data.currentIndex, '总共:', this.data.favorites.length);
    if (this.data.favorites.length === 0) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    if (this.data.currentIndex < this.data.favorites.length - 1) {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
        userAnswers: {},
        showAnalysisMap: {}
      });

      // 如果快到列表末尾且还有更多数据，自动加载
      if (this.data.currentIndex >= this.data.favorites.length - 5 && this.data.hasMore && !this.data.loadingMore) {
        console.log('[favorite] 快到列表末尾，预加载更多...');
        this.loadFavorites();
      }
    } else {
      wx.showToast({ title: '已经是最后一题了', icon: 'none' });
    }
  },

  onAnalysis() {
    console.log('[favorite] 点击查看解析');
    if (this.data.favorites.length === 0) return;
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;
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
