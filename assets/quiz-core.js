(function attachQuizCore(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.QuizCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizCore() {
  const LEVELS = [
    {
      id: 1,
      min: 0,
      max: 20,
      name: '黑话村口观察员',
      description: '你听见黑话会先确认：这是在说人话吗？',
      tone: '先别急着接住，先问一句“具体要做什么”。',
    },
    {
      id: 2,
      min: 21,
      max: 40,
      name: '热词入门生',
      description: '已经认识几个关键词，但还需要语境辅助。',
      tone: '词汇量在增长，翻译器还在加载中。',
    },
    {
      id: 3,
      min: 41,
      max: 60,
      name: '会议纪要翻译官',
      description: '能看懂大部分表达，也开始发现它们很会绕。',
      tone: '你已经能把会后纪要改写成行动项。',
    },
    {
      id: 4,
      min: 61,
      max: 75,
      name: '黑话熟练工',
      description: '你能在会议结束前，把话术翻译成行动项。',
      tone: '大部分黑话已经不能阻止你下班。',
    },
    {
      id: 5,
      min: 76,
      max: 90,
      name: '组织语言架构师',
      description: '黑话的入口、抓手和闭环，你基本都能接住。',
      tone: '你听见一句“拉通”，已经开始寻找负责人和截止时间。',
    },
    {
      id: 6,
      min: 91,
      max: 100,
      name: '互联网黑话宗师',
      description: '你不只听得懂，还能判断哪些话其实可以直接说。',
      tone: '最高境界不是会说黑话，而是知道什么时候不用说。',
    },
  ];

  const TAGS = {
    work: '会议求生',
    translation: '人话翻译官',
    internet: '热梗雷达',
    context: '语境敏感',
  };

  function calculateScore(answers) {
    if (!Array.isArray(answers)) return 0;

    return answers.reduce((total, answer) => {
      const score = typeof answer === 'number' ? answer : answer && answer.score;
      return total + (Number.isFinite(score) ? score : 0);
    }, 0);
  }

  function getLevel(score) {
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
    return LEVELS.find((level) => safeScore >= level.min && safeScore <= level.max) || LEVELS[0];
  }

  function getResultTags(answers) {
    const totals = {};

    (Array.isArray(answers) ? answers : []).forEach((answer) => {
      if (!answer || !TAGS[answer.category]) return;
      totals[answer.category] = (totals[answer.category] || 0) + (Number(answer.score) || 0);
    });

    return Object.keys(TAGS)
      .filter((category) => totals[category])
      .sort((left, right) => totals[right] - totals[left] || Object.keys(TAGS).indexOf(left) - Object.keys(TAGS).indexOf(right))
      .slice(0, 3)
      .map((category) => TAGS[category]);
  }

  function validateQuestionBank(bank) {
    if (!Array.isArray(bank) || bank.length === 0) {
      throw new Error('题库格式无效');
    }

    bank.forEach((question) => {
      if (!question || !question.id || !question.stem || !question.category) {
        throw new Error('题目基础信息不完整');
      }

      if (
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        question.options.some((option) => !option || !option.text || !Number.isFinite(option.score) || option.score < 0 || option.score > 10)
      ) {
        throw new Error(`题目 ${question.id} 的选项配置无效`);
      }

      if (typeof question.explanation !== 'string' || !question.explanation.trim()) {
        throw new Error(`题目 ${question.id} 缺少解析`);
      }
    });

    return true;
  }

  return {
    LEVELS,
    TAGS,
    calculateScore,
    getLevel,
    getResultTags,
    validateQuestionBank,
  };
});
