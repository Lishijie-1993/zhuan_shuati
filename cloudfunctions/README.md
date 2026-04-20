# 安全工程师刷题小程序 - 云开发后端

## 项目结构

```
cloudfunctions/              # 云函数目录
├── auth/
│   └── getUserInfo/        # 获取用户信息
│       ├── index.js
│       └── package.json
├── quiz/
│   ├── getQuestions/       # 获取题目列表
│   │   ├── index.js
│   │   └── package.json
│   └── syncProgress/       # 同步刷题进度
│       ├── index.js
│       └── package.json
├── fav/
│   └── toggle/             # 收藏/取消收藏
│       ├── index.js
│       └── package.json
├── error/
│   └── report/             # 记录错题
│       ├── index.js
│       └── package.json
├── exam/
│   ├── startPaper/         # 开始考试
│   │   ├── index.js
│   │   └── package.json
│   └── submitPaper/        # 提交试卷
│       ├── index.js
│       └── package.json
├── rank/
│   └── getLeaderboard/     # 获取排行榜
│       ├── index.js
│       └── package.json
└── news/
    └── list/               # 获取资讯列表
        ├── index.js
        └── package.json
```

## 云函数列表

| 云函数 | 请求方式 | 入参 | 出参 | 说明 |
|--------|----------|------|------|------|
| auth.getUserInfo | - | 无 | {userInfo, isNewUser} | 自动初始化/拉取用户档案 |
| quiz.getQuestions | POST | {chapter, mode, page, limit} | {list, total, hasNext} | 获取题目列表 |
| quiz.syncProgress | POST | {chapter, currentIndex, correctCount} | {success} | 同步刷题进度 |
| fav.toggle | POST | {questionId, action} | {status} | 收藏/取消收藏 |
| error.report | POST | {questionId, wrongOption} | {status} | 记录错题 |
| exam.startPaper | POST | {paperId} | {snapshotId, questionIds, duration} | 开始考试 |
| exam.submitPaper | POST | {snapshotId, answers, timeUsed} | {score, detail} | 交卷判分 |
| rank.getLeaderboard | GET | {tab, page} | {list, myRank} | 获取排行榜 |
| news.list | GET | {tag, keyword, page} | {list, total} | 获取资讯列表 |

## 数据库集合

| 集合名 | 核心字段 | 说明 |
|--------|----------|------|
| users | _openid, nickname, avatar, total_questions, continue_days, medals, settings | 用户主档 |
| question_bank | id, subject_id, chapter_id, type, content, options, correct_answer, analysis, difficulty | 题库主表 |
| exam_papers | id, title, question_ids, duration, total_score, status | 试卷模板 |
| user_quiz_progress | user_id, chapter_id, last_index, correct_count | 刷题进度 |
| user_exam_records | user_id, paper_id, snapshot_id, score, answers, start_time, submit_time, status | 考试记录 |
| user_favorites | user_id, question_id, created_at | 收藏表 |
| user_errors | user_id, question_id, wrong_option, error_count, last_wrong_time | 错题表 |
| articles | id, title, content, cover, category, views, publish_time | 资讯表 |
| medals_config | id, name, icon, condition_type, condition_value, rule_desc | 勋章配置 |

## 部署步骤

### 1. 开通云开发

1. 在微信公众平台后台开通云开发
2. 创建云开发环境

### 2. 创建数据库集合

在云开发控制台创建以下集合：
- users
- question_bank
- exam_papers
- user_quiz_progress
- user_exam_records
- user_favorites
- user_errors
- articles
- medals_config

### 3. 上传云函数

在微信开发者工具中：
1. 右键点击 `cloudfunctions` 文件夹
2. 选择 "上传并部署"
3. 等待部署完成

### 4. 添加初始数据

在云数据库中添加：
- 勋章配置 (medals_config)
- 试卷模板 (exam_papers)
- 资讯内容 (articles)

## 前端调用示例

```javascript
// 引入云服务
const cloud = require('../../utils/cloud.js');

// 获取用户信息
const res = await cloud.getUserInfo();

// 获取题目
const questions = await cloud.getQuestions('第1章', 'normal', 1, 10);

// 收藏
await cloud.toggleFavorite('question_id_123', 'add');

// 记录错题
await cloud.reportError('question_id_123', 'A');

// 获取排行榜
const rankData = await cloud.getLeaderboard('total', 1);

// 获取资讯
const news = await cloud.getNewsList('考试动态', '', 1);
```

## 注意事项

1. 云函数需要部署后才能使用
2. 前端代码已做好降级处理，云函数不可用时会使用本地模拟数据
3. 确保数据库集合名称与代码中一致
4. 建议在生产环境添加适当的权限控制
