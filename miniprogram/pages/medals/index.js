// pages/medals/index.js
Page({
  data: {
    totalMedals: 5,
    lockedMedals: 8,
    medals: [
      {
        id: 1,
        name: '初出茅庐',
        icon: '/images/medals/medal1.png',
        description: '恭喜你开始了刷题之旅，这是成长的第一步！',
        condition: '完成第一次刷题',
        progress: 100,
        unlocked: true,
        unlockedTime: '2026-03-15',
        isNew: false
      },
      {
        id: 2,
        name: '每日一练',
        icon: '/images/medals/medal2.png',
        description: '坚持每天学习，好习惯成就大未来！',
        condition: '连续学习7天',
        progress: 100,
        unlocked: true,
        unlockedTime: '2026-03-22',
        isNew: false
      },
      {
        id: 3,
        name: '小试牛刀',
        icon: '/images/medals/medal3.png',
        description: '你已经完成了100道题目，继续加油！',
        condition: '累计刷题100道',
        progress: 100,
        unlocked: true,
        unlockedTime: '2026-04-01',
        isNew: false
      },
      {
        id: 4,
        name: '勤学不辍',
        icon: '/images/medals/medal4.png',
        description: '连续学习30天，你已经超越了大多数人！',
        condition: '连续学习30天',
        progress: 100,
        unlocked: true,
        unlockedTime: '2026-04-15',
        isNew: true
      },
      {
        id: 5,
        name: '刷题达人',
        icon: '/images/medals/medal5.png',
        description: '累计刷题超过1000道，你真棒！',
        condition: '累计刷题1000道',
        progress: 100,
        unlocked: true,
        unlockedTime: '2026-04-18',
        isNew: false
      },
      {
        id: 6,
        name: '安全卫士',
        icon: '/images/medals/medal6.png',
        description: '完成安全生产法律法规全部章节练习',
        condition: '完成法律法规全部章节',
        progress: 75,
        unlocked: false
      },
      {
        id: 7,
        name: '防患未然',
        icon: '/images/medals/medal7.png',
        description: '安全生产管理知识掌握牢固',
        condition: '安全生产管理正确率90%',
        progress: 60,
        unlocked: false
      },
      {
        id: 8,
        name: '技术大牛',
        icon: '/images/medals/medal8.png',
        description: '安全生产技术基础全面掌握',
        condition: '技术基础正确率90%',
        progress: 45,
        unlocked: false
      },
      {
        id: 9,
        name: '持之以恒',
        icon: '/images/medals/medal9.png',
        description: '连续学习100天，毅力惊人！',
        condition: '连续学习100天',
        progress: 15,
        unlocked: false
      },
      {
        id: 10,
        name: '安全专家',
        icon: '/images/medals/medal10.png',
        description: '获得安全工程师证书，指日可待！',
        condition: '累计刷题5000道',
        progress: 25,
        unlocked: false
      }
    ],
    showDetail: false,
    currentMedal: null
  },

  onLoad(options) {
    this.updateMedalStats();
  },

  // 更新勋章统计
  updateMedalStats() {
    const medals = this.data.medals;
    const unlocked = medals.filter(m => m.unlocked).length;
    const locked = medals.filter(m => !m.unlocked).length;
    
    this.setData({
      totalMedals: unlocked,
      lockedMedals: locked
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 显示勋章详情
  showMedalDetail(e) {
    const medal = e.currentTarget.dataset.medal;
    this.setData({
      showDetail: true,
      currentMedal: medal
    });
  },

  // 关闭详情
  closeDetail() {
    this.setData({
      showDetail: false,
      currentMedal: null
    });
  },

  // 阻止事件冒泡
  preventBubble() {}
});
