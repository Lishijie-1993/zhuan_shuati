// pages/point/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 状态栏高度，用于适配不同机型的自定义导航栏
    statusBarHeight: 20,
    // 知识点列表，初始为空数组以展示骨架屏占位页
    knowledgeList: [],
    // 加载状态控制
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 1. 获取系统信息，计算状态栏高度
    try {
      const res = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: res.statusBarHeight
      });
    } catch (e) {
      console.error('获取系统信息失败', e);
    }

    // 2. 模拟数据加载过程（未来连接后端数据库）
    this.fetchData();
  },

  /**
   * 返回上一页（首页）
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      // 如果有页面栈，返回上一页
      wx.navigateBack({
        delta: 1
      });
    } else {
      // 如果是直接打开的此页（没有页面栈），则跳转回首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 获取后端数据
   */
  fetchData() {
    // 目前保持为空，页面会显示“加载中/暂无内容”的骨架屏
    // 当你准备好连接后端时，可以取消下面的注释进行测试：
    
    /*
    wx.showLoading({ title: '加载中' });
    
    // 模拟网络请求延迟
    setTimeout(() => {
      this.setData({
        loading: false,
        knowledgeList: [
          { 
            id: 1, 
            title: '有限空间作业安全规范', 
            summary: '针对水利工程中下井及隧道作业的强制性安全标准...' 
          },
          { 
            id: 2, 
            title: '防汛物资储备清单', 
            summary: '松里岩项目部2026年度汛期应急物资储备要求详情...' 
          },
          {
            id: 3,
            title: '脚手架搭设验收要点',
            summary: '高处作业安全技术规范及现场验收标准说明...'
          }
        ]
      });
      wx.hideLoading();
    }, 1500);
    */
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新逻辑
    this.fetchData();
    wx.stopPullDownRefresh();
  }
})