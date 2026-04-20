// cloudfunctions/exam/submitPaper/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { snapshotId, answers, timeUsed } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查找考试记录
    const recordRes = await db.collection('user_exam_records').where({
      snapshot_id: snapshotId,
      user_id: openid
    }).get();

    if (recordRes.data.length === 0) {
      return {
        success: false,
        error: '考试记录不存在'
      };
    }

    const record = recordRes.data[0];
    const questionIds = record.question_ids || [];

    // 获取题目详情用于判分
    const questionsRes = await db.collection('question_bank').where({
      _id: _.in(questionIds)
    }).get();

    const questionsMap = {};
    questionsRes.data.forEach(q => {
      questionsMap[q._id] = q;
    });

    // 判分
    let score = 0;
    let correctCount = 0;
    const detail = [];
    const perQuestionScore = Math.floor(100 / questionIds.length); // 每题分值

    // 解析答案字段，确保格式统一
    function parseAnswer(correctAnswer) {
      if (!correctAnswer) return [];

      // 如果已经是数组，直接返回
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.map(a => String(a).trim().toUpperCase()).sort();
      }

      // 如果是字符串，尝试解析
      if (typeof correctAnswer === 'string') {
        // 尝试解析 JSON 数组
        try {
          const parsed = JSON.parse(correctAnswer);
          if (Array.isArray(parsed)) {
            return parsed.map(a => String(a).trim().toUpperCase()).sort();
          }
        } catch (e) {
          // JSON 解析失败
        }

        // 处理逗号分隔的格式如 "A,B,C"
        if (correctAnswer.includes(',')) {
          return correctAnswer.split(',').map(s => s.trim().toUpperCase()).sort();
        }

        // 处理连续字符串格式如 "ABC" (多选)
        return correctAnswer.split('').map(s => s.trim().toUpperCase()).filter(s => s).sort();
      }

      // 其他情况返回空数组
      return [];
    }

    for (const qId of questionIds) {
      const userAnswer = answers[qId] || '';
      const question = questionsMap[qId];

      if (question) {
        // 判断是否是多选题（答案可能是数组）
        const isMultipleChoice = question.type === 'multiple';
        let isCorrect;

        if (isMultipleChoice) {
          // 多选题：解析并排序后比较数组
          const correctArr = parseAnswer(question.correct_answer);
          const userArr = parseAnswer(userAnswer);
          isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr) && correctArr.length > 0;
        } else {
          // 单选题/判断题：标准化后比较字符串
          isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.correct_answer);
        }

        if (isCorrect) {
          score += perQuestionScore;
          correctCount++;
        }

        detail.push({
          questionId: qId,
          userAnswer,
          correctAnswer: question.correct_answer,
          isCorrect,
          analysis: question.analysis || '暂无解析'
        });
      }
    }

    // 更新考试记录
    const now = new Date();
    await db.collection('user_exam_records').where({
      _id: record._id
    }).update({
      data: {
        score,
        answers,
        submit_time: now,
        status: 'completed',
        time_used: timeUsed,
        updated_at: now
      }
    });

    // 更新用户总刷题数
    await updateUserTotalQuestions(openid, questionIds.length);

    // 检查并颁发勋章
    await checkMedals(openid);

    return {
      success: true,
      score,
      totalScore: 100,
      correctCount,
      totalQuestions: questionIds.length,
      detail
    };
  } catch (err) {
    console.error('提交试卷失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};

// 标准化答案（去除空格、转小写）
function normalizeAnswer(answer) {
  if (!answer) return '';
  return answer.toString().trim().toLowerCase();
}

// 更新用户总刷题数
async function updateUserTotalQuestions(openid, count) {
  try {
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userRes.data.length > 0) {
      const currentTotal = userRes.data[0].total_questions || 0;
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          total_questions: currentTotal + count,
          updated_at: new Date()
        }
      });
    }
  } catch (err) {
    console.error('更新用户刷题数失败:', err);
  }
}

// 检查并颁发勋章
async function checkMedals(openid) {
  try {
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userRes.data.length === 0) return;

    const user = userRes.data[0];
    const totalQuestions = user.total_questions || 0;
    const currentMedals = user.medals || [];

    // 获取所有勋章配置
    const medalsRes = await db.collection('medals_config').get();
    
    for (const medal of medalsRes.data) {
      // 检查是否已获得
      if (currentMedals.includes(medal._id)) continue;

      // 检查是否满足条件
      let shouldAward = false;
      
      if (medal.condition_type === 'total_questions') {
        shouldAward = totalQuestions >= medal.condition_value;
      }
      // 可以添加其他条件类型...

      if (shouldAward) {
        currentMedals.push(medal._id);
      }
    }

    // 更新用户勋章
    if (currentMedals.length !== user.medals?.length) {
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          medals: currentMedals,
          updated_at: new Date()
        }
      });
    }
  } catch (err) {
    console.error('检查勋章失败:', err);
  }
}
