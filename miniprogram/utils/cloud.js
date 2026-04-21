// miniprogram/utils/cloud.js
// 云函数调用封装
// 使用说明：
// 1. 需要在微信公众平台开通云开发
// 2. 在 cloudfunctions 目录创建对应的云函数并上传
// 3. 前端通过 require 引入后调用

class CloudService {
  constructor() {
    this.initialized = false;
  }

  // 初始化云能力
  async init() {
    if (this.initialized) return;
    
    try {
      if (wx.cloud) {
        await wx.cloud.init({
          env: wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true
        });
        this.initialized = true;
      }
    } catch (err) {
      console.warn('云开发初始化失败:', err);
    }
  }

  // 调用云函数
  async call(name, data = {}) {
    try {
      await this.init();
      
      const res = await wx.cloud.callFunction({
        name,
        data,
        timeout: 30000
      });
      
      return res.result;
    } catch (err) {
      console.error(`云函数 ${name} 调用失败:`, err);
      return null;
    }
  }

  // ========== 用户相关 ==========

  // 获取用户信息
  async getUserInfo() {
    return await this.call('getUserInfo');
  }

  // ========== 刷题相关 ==========

  // 获取题目列表（包含答案和解析）
  // 【修复4】默认 limit 改为 100，确保能加载足够多的题目
  async getQuestions(chapter, mode, page = 1, limit = 100) {
    return await this.call('getQuestions', { chapter, mode, page, limit, includeAnswer: true });
  }

  // 同步刷题进度
  async syncProgress(chapter, currentIndex, correctCount) {
    return await this.call('syncProgress', { chapter, currentIndex, correctCount });
  }

  // ========== 收藏相关 ==========

  // 切换收藏
  async toggleFavorite(questionId, action, page = 1, limit = 50) {
    return await this.call('toggle', { questionId, action, page, limit });
  }

  // ========== 错题相关 ==========

  // 报告错题
  async reportError(questionId, wrongOption) {
    return await this.call('report', { questionId, wrongOption });
  }

  // ========== 考试相关 ==========

  // 获取试卷列表
  async listPapers() {
    return await this.call('listPapers');
  }

  // 开始考试
  async startPaper(paperId) {
    return await this.call('startPaper', { paperId });
  }

  // 提交试卷（服务端计算用时）
  async submitPaper(snapshotId, answers) {
    return await this.call('submitPaper', { snapshotId, answers });
  }

  // ========== 考试记录相关 ==========

  // 获取用户考试记录
  async getExamHistory(page = 1, limit = 20) {
    return await this.call('getExamHistory', { page, limit });
  }

  // ========== 排行榜相关 ==========

  // 获取排行榜
  async getLeaderboard(tab = 'total', page = 1) {
    return await this.call('getLeaderboard', { tab, page });
  }

  // ========== 资讯相关 ==========

  // 获取资讯列表
  async getNewsList(tag, keyword, page = 1) {
    return await this.call('list', { tag, keyword, page });
  }
}

// 创建云服务实例
const cloudService = new CloudService();

module.exports = cloudService;
