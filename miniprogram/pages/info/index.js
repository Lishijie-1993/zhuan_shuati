// pages/info/index.js
const cloud = require('../../utils/cloud.js');
const { STORAGE_KEYS } = require('../../utils/constants.js');

Page({
  data: {
    currentTag: '全部',
    newsList: [],
    isLoading: false,
    noMoreData: false,
    page: 1,
    pageSize: 10,
    searchKeyword: ''
  },

  onLoad(options) {
    this.loadNewsList();
  },

  onShow() {
    // 每次显示页面时刷新数据
  },

  // 切换标签
  switchTag(e) {
    const tag = e.currentTarget.dataset.tag;
    if (tag === this.data.currentTag) return;
    
    this.setData({
      currentTag: tag,
      newsList: [],
      page: 1,
      noMoreData: false
    });
    
    this.loadNewsList();
  },

  // 搜索
  onSearch(e) {
    const keyword = e.detail.value || e.detail.text;
    this.setData({
      searchKeyword: keyword,
      newsList: [],
      page: 1,
      noMoreData: false
    });
    
    this.loadNewsList();
  },

  // 加载资讯列表
  async loadNewsList() {
    if (this.data.isLoading || this.data.noMoreData) return;
    
    this.setData({ isLoading: true });
    
    try {
      const res = await cloud.getNewsList(
        this.data.currentTag,
        this.data.searchKeyword,
        this.data.page
      );
      
      if (res) {
        this.setData({
          newsList: this.data.page === 1 ? res.list : [...this.data.newsList, ...res.list],
          isLoading: false,
          page: this.data.page + 1,
          noMoreData: !res.hasNext
        });
      } else {
        // 使用本地模拟数据作为降级
        this.loadMockData();
      }
    } catch (err) {
      console.error('加载资讯失败:', err);
      this.loadMockData();
    }
  },

  // 本地模拟数据（云函数不可用时的降级方案）
  loadMockData() {
    const mockData = this.generateMockData();
    this.setData({
      newsList: this.data.page === 1 ? mockData : [...this.data.newsList, ...mockData],
      isLoading: false,
      page: this.data.page + 1,
      noMoreData: this.data.page >= 3
    });
  },

  // 加载更多
  loadMore() {
    this.loadNewsList();
  },

  // 跳转详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/info/detail/index?id=${id}`
    });
  },

  // 生成模拟数据
  generateMockData(page = 1) {
    const allData = [
      { id: 1, title: '2026年中级注册安全工程师考试时间确定，报名即将开始', category: '考试动态', views: '2.3万', publishTime: '2小时前', coverImage: '/images/news/news1.png' },
      { id: 2, title: '《安全生产法》最新修订解读，这些变化与你息息相关', category: '政策解读', views: '1.8万', publishTime: '5小时前', coverImage: '/images/news/news2.png' },
      { id: 3, title: '备考攻略：如何高效利用最后一个月冲刺注安考试', category: '备考技巧', views: '9564', publishTime: '1天前', coverImage: '/images/news/news3.png' },
      { id: 4, title: '应急管理部发布关于加强矿山安全监管的通知', category: '行业资讯', views: '1.2万', publishTime: '1天前', coverImage: '/images/news/news4.png' },
      { id: 5, title: '安全生产十五条硬措施解读，抓紧收藏！', category: '安全知识', views: '3.1万', publishTime: '2天前', coverImage: '/images/news/news5.png' },
      { id: 6, title: '注安考试成绩查询入口开通，快来查分！', category: '考试动态', views: '5.6万', publishTime: '3天前', coverImage: '/images/news/news6.png' },
      { id: 7, title: '特种作业人员安全技术培训考核有新规定', category: '政策解读', views: '7823', publishTime: '4天前', coverImage: '/images/news/news7.png' },
      { id: 8, title: '案例分析题答题技巧，助你多拿20分！', category: '备考技巧', views: '1.5万', publishTime: '5天前', coverImage: '/images/news/news8.png' }
    ];

    let filteredData = allData;
    if (this.data.currentTag !== '全部') {
      filteredData = allData.filter(item => item.category === this.data.currentTag);
    }

    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.title.toLowerCase().includes(keyword) || 
        item.category.toLowerCase().includes(keyword)
      );
    }

    const start = (page - 1) * this.data.pageSize;
    const end = start + this.data.pageSize;
    return filteredData.slice(start, end);
  },

  onPullDownRefresh() {
    this.setData({
      newsList: [],
      page: 1,
      noMoreData: false
    });
    
    this.loadNewsList();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  }
});
