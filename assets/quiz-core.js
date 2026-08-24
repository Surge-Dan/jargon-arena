(function attachQuizCore(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.QuizCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizCore() {
  const DIMENSIONS = {
    decode: { label: '术语破译', badge: '新词雷达站', short: '破译' },
    context: { label: '语境雷达', badge: '会议拆弹员', short: '语境' },
    culture: { label: '梗文化考古', badge: '热梗活化石', short: '考古' },
    filter: { label: '废话鉴别', badge: '废话过滤器', short: '鉴别' },
    translate: { label: '人话翻译', badge: '人话同传', short: '翻译' },
  };
  const DIMENSION_KEYS = Object.keys(DIMENSIONS);
  const RANKS = [
    { id: 1, min: 0, max: 24, tier: '黑铁', name: '人话萌新', code: 'IRON-01' },
    { id: 2, min: 25, max: 39, tier: '青铜', name: '黑话观察员', code: 'BRONZE-02' },
    { id: 3, min: 40, max: 51, tier: '白银', name: '热词练习生', code: 'SILVER-03' },
    { id: 4, min: 52, max: 63, tier: '黄金', name: '会议室生还者', code: 'GOLD-04' },
    { id: 5, min: 64, max: 73, tier: '铂金', name: '语境翻译官', code: 'PLATINUM-05' },
    { id: 6, min: 74, max: 82, tier: '钻石', name: '抓手装配师', code: 'DIAMOND-06' },
    { id: 7, min: 83, max: 91, tier: '大师', name: '组织语言架构师', code: 'MASTER-07' },
    { id: 8, min: 92, max: 100, tier: '王者', name: '人话掌门', code: 'KING-08' },
  ];
  const VALID_STAGES = new Set(['calibration', 'branch', 'boss', 'playoff']);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function createRandom(seed) {
    let state = (Number(seed) >>> 0) || 1;
    return function random() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function shuffle(items, random) {
    const output = [...items];
    for (let index = output.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
    }
    return output;
  }

  function cloneAndShuffleQuestion(question, random) {
    return {
      ...question,
      options: shuffle(question.options.map((option) => ({
        ...option,
        weights: { ...option.weights },
      })), random),
    };
  }

  function prioritizeQuestions(candidates, count, options) {
    const settings = options || {};
    const random = settings.random || createRandom(settings.seed);
    const seen = new Set(settings.seenQuestionIds || []);
    const used = new Set(settings.usedQuestionIds || []);
    const eligible = candidates.filter((question) => !used.has(question.id));
    const unseen = shuffle(eligible.filter((question) => !seen.has(question.id)), random);
    const repeated = shuffle(eligible.filter((question) => seen.has(question.id)), random);

    return [...unseen, ...repeated]
      .slice(0, count)
      .map((question) => cloneAndShuffleQuestion(question, random));
  }

  function getQuestionMaxWeights(question) {
    return Object.fromEntries(DIMENSION_KEYS.map((dimension) => [
      dimension,
      Math.max(...question.options.map((option) => Number(option.weights[dimension]) || 0)),
    ]));
  }

  function createAnswer(question, option) {
    return {
      questionId: question.id,
      dimension: question.dimension,
      stage: question.stage,
      categoryLabel: question.categoryLabel,
      stem: question.stem,
      selectedText: option.text,
      feedback: option.feedback,
      explanation: question.explanation,
      weights: { ...option.weights },
      maxWeights: getQuestionMaxWeights(question),
    };
  }

  function scoreAssessment(answers) {
    const earned = Object.fromEntries(DIMENSION_KEYS.map((dimension) => [dimension, 0]));
    const possible = Object.fromEntries(DIMENSION_KEYS.map((dimension) => [dimension, 0]));

    (Array.isArray(answers) ? answers : []).forEach((answer) => {
      DIMENSION_KEYS.forEach((dimension) => {
        const value = Number(answer && answer.weights && answer.weights[dimension]);
        const maximum = Number(answer && answer.maxWeights && answer.maxWeights[dimension]);
        if (Number.isFinite(value) && Number.isFinite(maximum) && maximum > 0) {
          earned[dimension] += clamp(value, 0, maximum);
          possible[dimension] += maximum;
        }
      });
    });

    const dimensions = Object.fromEntries(DIMENSION_KEYS.map((dimension) => [
      dimension,
      possible[dimension] > 0 ? Math.round((earned[dimension] / possible[dimension]) * 100) : 0,
    ]));
    const overall = Math.round(
      DIMENSION_KEYS.reduce((sum, dimension) => sum + dimensions[dimension], 0) / DIMENSION_KEYS.length,
    );

    return { dimensions, overall, earned, possible };
  }

  function getRank(summary) {
    const safeSummary = summary || {};
    const overall = clamp(safeSummary.overall, 0, 100);
    const dimensions = safeSummary.dimensions || {};
    let rank = [...RANKS].reverse().find((candidate) => overall >= candidate.min) || RANKS[0];

    if (
      rank.id === 8 &&
      (clamp(dimensions.filter, 0, 100) < 80 || clamp(dimensions.translate, 0, 100) < 80)
    ) {
      rank = RANKS[6];
    }

    return { ...rank };
  }

  function getBadges(dimensions) {
    const safeDimensions = dimensions || {};
    return DIMENSION_KEYS
      .map((dimension, index) => ({
        id: dimension,
        label: DIMENSIONS[dimension].badge,
        dimensionLabel: DIMENSIONS[dimension].label,
        score: clamp(safeDimensions[dimension], 0, 100),
        index,
      }))
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 2)
      .map(({ index, ...badge }) => badge);
  }

  function selectCalibrationQuestions(bank, options) {
    const settings = options || {};
    return prioritizeQuestions(
      bank.filter((question) => question.stage === 'calibration'),
      8,
      {
        seed: settings.seed,
        seenQuestionIds: settings.seenQuestionIds,
        usedQuestionIds: settings.usedQuestionIds,
      },
    );
  }

  function getRouteTracks(summary) {
    const rows = DIMENSION_KEYS.map((dimension, index) => ({
      dimension,
      score: summary.dimensions[dimension],
      index,
    }));
    const weakest = [...rows].sort((left, right) => left.score - right.score || left.index - right.index)[0];
    const strongest = [...rows]
      .filter((row) => row.dimension !== weakest.dimension)
      .sort((left, right) => right.score - left.score || left.index - right.index)[0];
    return [weakest.dimension, strongest.dimension];
  }

  function buildAdaptiveRoute(bank, answers, options) {
    const settings = options || {};
    const summary = scoreAssessment(answers);
    const tracks = getRouteTracks(summary);
    const usedQuestionIds = new Set(settings.usedQuestionIds || []);
    const random = createRandom(settings.seed);
    const questions = [];

    tracks.forEach((dimension) => {
      const level = summary.dimensions[dimension] >= 70 ? 'advanced' : 'foundation';
      const exact = bank.filter((question) => (
        question.stage === 'branch' && question.dimension === dimension && question.difficulty === level
      ));
      const fallback = bank.filter((question) => question.stage === 'branch' && question.dimension === dimension);
      const selected = prioritizeQuestions(exact.length >= 2 ? exact : fallback, 2, {
        random,
        seenQuestionIds: settings.seenQuestionIds,
        usedQuestionIds: [...usedQuestionIds],
      });
      selected.forEach((question) => usedQuestionIds.add(question.id));
      questions.push(...selected);
    });

    const boss = prioritizeQuestions(
      bank.filter((question) => question.stage === 'boss'),
      1,
      {
        random,
        seenQuestionIds: settings.seenQuestionIds,
        usedQuestionIds: [...usedQuestionIds],
      },
    );
    questions.push(...boss);

    return { questions, tracks, summary };
  }

  function getPromotionDistance(overall) {
    return Math.min(...RANKS.slice(1).map((rank) => Math.abs(rank.min - overall)));
  }

  function selectPlayoffQuestions(bank, summary, options) {
    const settings = options || {};
    const dimensions = (summary && summary.dimensions) || {};
    const overall = clamp(summary && summary.overall, 0, 100);
    const nearTopGate = overall >= 92 && (
      (clamp(dimensions.filter, 0, 100) >= 76 && clamp(dimensions.filter, 0, 100) < 80) ||
      (clamp(dimensions.translate, 0, 100) >= 76 && clamp(dimensions.translate, 0, 100) < 80)
    );
    const count = nearTopGate ? 2 : getPromotionDistance(overall) <= 2 ? 1 : 0;
    if (!count) return [];

    const priority = nearTopGate
      ? ['filter', 'translate']
      : [...DIMENSION_KEYS].sort((left, right) => (
        clamp(dimensions[left], 0, 100) - clamp(dimensions[right], 0, 100) ||
        DIMENSION_KEYS.indexOf(left) - DIMENSION_KEYS.indexOf(right)
      ));
    const candidates = priority.flatMap((dimension) => (
      bank.filter((question) => question.stage === 'playoff' && question.dimension === dimension)
    ));

    return prioritizeQuestions(candidates, count, {
      seed: settings.seed,
      seenQuestionIds: settings.seenQuestionIds,
      usedQuestionIds: settings.usedQuestionIds,
    });
  }

  function validateQuestionBank(bank) {
    if (!Array.isArray(bank) || bank.length < 64) {
      throw new Error('题库必须至少包含 64 道题');
    }

    const ids = new Set();
    bank.forEach((question) => {
      if (
        !question || !question.id || !question.stem || !question.categoryLabel ||
        !VALID_STAGES.has(question.stage) || !DIMENSION_KEYS.includes(question.dimension)
      ) {
        throw new Error('题目基础信息不完整');
      }
      if (ids.has(question.id)) throw new Error(`题目 ID 重复：${question.id}`);
      ids.add(question.id);

      if (
        !Array.isArray(question.options) || question.options.length !== 4 ||
        new Set(question.options.map((option) => option.text)).size !== 4
      ) {
        throw new Error(`题目 ${question.id} 的选项配置无效`);
      }

      question.options.forEach((option) => {
        if (!option || !option.text || !option.feedback || !option.weights) {
          throw new Error(`题目 ${question.id} 的选项配置无效`);
        }
        DIMENSION_KEYS.forEach((dimension) => {
          const value = option.weights[dimension];
          if (!Number.isFinite(value) || value < 0 || value > 4) {
            throw new Error(`题目 ${question.id} 的维度权重无效`);
          }
        });
      });

      if (!question.explanation || typeof question.explanation !== 'string') {
        throw new Error(`题目 ${question.id} 缺少解析`);
      }
    });

    if (bank.filter((question) => question.stage === 'calibration').length < 14) {
      throw new Error('校准题不足');
    }
    if (bank.filter((question) => question.stage === 'boss').length < 6) {
      throw new Error('综合题不足');
    }
    if (bank.filter((question) => question.stage === 'playoff').length < 8) {
      throw new Error('晋级题不足');
    }
    DIMENSION_KEYS.forEach((dimension) => {
      if (bank.filter((question) => question.stage === 'branch' && question.dimension === dimension).length < 8) {
        throw new Error(`${DIMENSIONS[dimension].label}支线题不足`);
      }
    });

    return true;
  }

  return {
    DIMENSIONS,
    DIMENSION_KEYS,
    RANKS,
    buildAdaptiveRoute,
    createAnswer,
    getBadges,
    getQuestionMaxWeights,
    getRank,
    scoreAssessment,
    selectCalibrationQuestions,
    selectPlayoffQuestions,
    validateQuestionBank,
  };
});
