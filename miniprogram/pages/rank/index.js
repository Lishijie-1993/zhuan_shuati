// pages/rank/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    currentTab: 'total',
    rankList: [],
    myRank: null,
    weekCount: 0,
    todayCount: 0
  },

  onLoad(options) {
    this.loadRankData();
  },

  onShow() {
    this.loadRankData();
  },

  // Tab 切换
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    
    this.setData({ currentTab: tab });
    this.loadRankData();
  },

  // 加载排行数据
  async loadRankData() {
    try {
      const res = await cloud.getLeaderboard(this.data.currentTab);
      
      if (res && res.list) {
        this.setData({
          rankList: res.list,
          myRank: res.myRank
        });
      } else {
        this.loadMockData();
      }
    } catch (err) {
      console.error('加载排行榜失败:', err);
      this.loadMockData();
    }
  },

  // 本地模拟数据
  loadMockData() {
    const mockData = this.generateMockData();
    this.setData({
      rankList: mockData,
      myRank: {
        id: 100,
        nickName: '我',
        avatar: '/images/icons/user.png',
        rank: 68,
        count: 256,
        activeDays: 15,
        isMe: true
      }
    });
  },

  generateMockData() {
    const baseData = [
      { id: 1, nickName: '安全小达人', avatar: '/images/icons/user.png', count: 2847, weekCount: 156, todayCount: 23 },
      { id: 2, nickName: '考证达人', avatar: '/images/icons/user.png', count: 2654, weekCount: 142, todayCount: 18 },
      { id: 3, nickName: '安全生产员', avatar: '/images/icons/user.png', count: 2398, weekCount: 128, todayCount: 15 },
      { id: 4, nickName: '学习使我快乐', avatar: '/images/icons/user.png', count: 2156, weekCount: 115, todayCount: 12 },
      { id: 5, nickName: '注安必过', avatar: '/images/icons/user.png', count: 1987, weekCount: 98, todayCount: 10 },
      { id: 6, nickName: '安全工程师', avatar: '/images/icons/user.png', count: 1876, weekCount: 89, todayCount: 9 },
      { id: 7, nickName: '勤学苦练', avatar: '/images/icons/user.png', count: 1754, weekCount: 82, todayCount: 8 },
      { id: 8, nickName: '安全第一', avatar: '/images/icons/user.png', count: 1632, weekCount: 76, todayCount: 7 },
      { id: 9, nickName: '不忘初心', avatar: '/images/icons/user.png', count: 1521, weekCount: 68, todayCount: 6 },
      { id: 10, nickName: '砥砺前行', avatar: '/images/icons/user.png', count: 1456, weekCount: 62, todayCount: 5 },
      { id: 11, nickName: '持之以恒', avatar: '/images/icons/user.png', count: 1387, weekCount: 58, todayCount: 5 },
      { id: 12, nickName: '学无止境', avatar: '/images/icons/user.png', count: 1298, weekCount: 52, todayCount: 4 },
      { id: 13, nickName: '安全守护者', avatar: '/images/icons/user.png', count: 1234, weekCount: 48, todayCount: 4 },
      { id: 14, nickName: '每日一练', avatar: '/images/icons/user.png', count: 1165, weekCount: 45, todayCount: 3 },
      { id: 15, nickName: '努力奋斗', avatar: '/images/icons/user.png', count: 1089, weekCount: 42, todayCount: 3 },
      { id: 16, nickName: '安全使者', avatar: '/images/icons/user.png', count: 1023, weekCount: 38, todayCount: 3 },
      { id: 17, nickName: '考证先锋', avatar: '/images/icons/user.png', count: 987, weekCount: 35, todayCount: 2 },
      { id: 18, nickName: '精益求精', avatar: '/images/icons/user.png', count: 945, weekCount: 32, todayCount: 2 },
      { id: 19, nickName: '日积月累', avatar: '/images/icons/user.png', count: 898, weekCount: 28, todayCount: 2 },
      { id: 20, nickName: '平安是福', avatar: '/images/icons/user.png', count: 854, weekCount: 25, todayCount: 2 }
    ];

    let sortedData = [...baseData];
    if (this.data.currentTab === 'week') {
      sortedData.sort((a, b) => b.weekCount - a.weekCount);
    } else if (this.data.currentTab === 'today') {
      sortedData.sort((a, b) => b.todayCount - a.todayCount);
    } else {
      sortedData.sort((a, b) => b.count - a.count);
    }

    return sortedData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  },

  onPullDownRefresh() {
    this.loadRankData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  onShareAppMessage() {
    return {
      title: '刷题排行榜，等你来挑战！',
      path: '/pages/rank/index'
    };
  }
});
