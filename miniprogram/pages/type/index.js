Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPicker: false, // 控制选择器弹窗显示
    selectedIndustry: '安全生产法律法规', // 默认选中的科目名称
    selectedType: '公共科目', // 默认选中的科目类型
    tempSelected: '安全生产法律法规', // 弹窗中滑动时的临时状态
    pickerValue: [0], // 选择器默认选中第一项

    // 完整的科目配置数据
    allCategories: [
      {
        name: '安全生产法律法规',
        type: '公共科目',
        chapters: ['第1章 安全生产相关国家政策', '第2章 安全生产法律基础知识', '第3章 中华人民共和国安全生产法', '第4章 安全生产单行法律', '第5章 安全生产相关法律', '第6章 安全生产行政法规', '第7章 安全生产部门规章', '历年真题']
      },
      {
        name: '安全生产管理',
        type: '公共科目',
        chapters: ['第1章 安全生产管理基本理论', '第2章 安全生产管理内容', '第3章 安全评价', '第4章 职业病危害预防和管理', '第5章 安全生产应急管理', '第6章 生产安全事故调查与分析', '第7章 安全生产监管监察', '第8章 安全生产统计分析', '历年真题']
      },
      {
        name: '安全生产技术基础',
        type: '公共科目',
        chapters: ['第1章 机械安全技术', '第2章 电气安全技术', '第3章 特种设备安全技术', '第4章 防火防爆安全技术', '第5章 危险化学品安全基础知识', '历年真题']
      },
      {
        name: '煤矿安全',
        type: '专业科目',
        chapters: ['第1章 煤矿安全基础知识', '第2章 矿井通风', '第3章 矿井瓦斯灾害治理', '第4章 矿井火灾防治', '第5章 矿井水害防治', '第6章 矿井顶板灾害防治', '第7章 粉尘防治', '第8章 机电运输安全', '第9章 露天煤矿灾害防治', '第10章 矿山救护', '第11章 煤矿安全类案例', '历年真题']
      },
      {
        name: '建筑施工安全',
        type: '专业科目',
        chapters: ['第1章 建筑施工安全基础', '第2章 建筑施工机械安全技术', '第3章 建筑施工临时用电安全', '第4章 安全防护技术', '第5章 土石方及基坑工程安全', '第6章 脚手架、模板工程安全', '第7章 城市轨道交通工程施工', '第8章 专项工程施工安全技术', '第9章 建筑施工应急管理', '第10章 建筑施工安全类案例', '历年真题']
      },
      {
        name: '金属非金属矿山安全',
        type: '专业科目',
        chapters: ['第1章 金属非金属矿山安全基础知识', '第2章 金属非金属矿山排土场安全技术', '第3章 露天开采安全技术', '第4章 地下矿山安全技术', '第5章 尾矿库安全技术', '第6章 矿山自然灾害防治技术', '第7章 金属非金属矿山安全类案例详解', '第8章 金属非金属矿山安全管理', '第9章 矿山事故应急救援', '历年真题']
      },
      {
        name: '化工安全',
        type: '专业科目',
        chapters: ['第1章 化工安全生产概述', '第2章 化工运行安全技术', '第3章 通风、防火防爆及防静电安全技术', '第4章 化工工艺安全技术', '第5章 化工机械设备安全技术', '第6章 化工仪表及自动控制安全技术', '第7章 化工检修安全技术', '第8章 化工事故应急管理与案例分析', '历年真题']
      },
      {
        name: '金属冶炼安全',
        type: '专业科目',
        chapters: ['第1章 金属冶炼安全基础知识', '第2章 烧结球团安全技术', '第3章 焦化安全技术', '第4章 炼铁安全技术', '第5章 炼钢安全技术', '第6章 金属压力加工安全技术', '第7章 煤气安全技术', '第8章 冶金企业常用气体生产与使用安全技术', '第9章 铝冶炼安全技术', '第10章 重金属冶炼安全技术', '第11章 金属冶炼安全类案例详解', '历年真题']
      },
      {
        name: '道路运输安全',
        type: '专业科目',
        chapters: ['第1章 道路运输安全基础', '第2章 道路旅客运输安全技术', '第3章 道路普通货物运输安全技术', '第4章 道路危险货物运输安全技术', '第5章 道路运输站场安全生产技术', '第6章 道路运输安全管理信息化', '第7章 道路运输事故应急处置与救援', '第8章 其他安全生产技术', '历年真题']
      },
      {
        name: '其他安全',
        type: '专业科目',
        chapters: ['第1章 机械安全技术', '第2章 电气安全技术', '第3章 特种设备安全技术', '第4章 防火防爆安全技术', '第5章 职业危害控制技术', '第6章 危险化学品安全技术', '第7章 通用安全技术应用', '第8章 安全生产管理案例', '第9章 生产安全事故案例分析', '第10章 应急预案与演练案例分析', '第11章 安全评价与评审', '历年真题']
      }
    ],

    industryOptions: [], // 用于 Picker 显示的名称列表
    chapters: [] // 当前页面展示的章节列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    // 1. 提取所有科目名称用于选择器显示
    const options = this.data.allCategories.map(item => item.name);
    
    this.setData({
      industryOptions: options
    });

    // 2. 初始化页面数据
    this.refreshPageData(this.data.selectedIndustry);
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 打开弹窗
  openPicker() {
    // 自动定位到当前已选中的索引
    const currentIndex = this.data.industryOptions.indexOf(this.data.selectedIndustry);
    this.setData({
      showPicker: true,
      tempSelected: this.data.selectedIndustry,
      pickerValue: [currentIndex >= 0 ? currentIndex : 0]
    });
  },

  // 关闭弹窗
  closePicker() {
    this.setData({ showPicker: false });
  },

  // 选择器滚动
  onPickerChange(e) {
    const val = e.detail.value[0];
    this.setData({
      tempSelected: this.data.industryOptions[val]
    });
  },

  // 点击确定
  confirmSelection() {
    const targetName = this.data.tempSelected;
    this.refreshPageData(targetName);
    
    this.setData({
      selectedIndustry: targetName,
      showPicker: false
    });

    wx.showToast({
      title: `已切换至: ${targetName}`,
      icon: 'none'
    });
  },

  /**
   * 根据选中的科目名称，更新对应的类型(公共/专业)和章节列表
   */
  refreshPageData(name) {
    const category = this.data.allCategories.find(item => item.name === name);
    if (category) {
      this.setData({
        selectedType: category.type,
        chapters: category.chapters
      });
    }
  },

  // 开始刷题跳转
  startQuiz(e) {
    const title = e.currentTarget.dataset.title;
    wx.navigateTo({
      url: `/pages/quiz/index?title=${encodeURIComponent(title)}`
    });
  }
});