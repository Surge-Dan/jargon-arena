const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../assets/quiz-core.js');
require('../assets/question-bank.js');

const bank = globalThis.QuizQuestionBank;

function answerQuestion(question, optionIndex) {
  const option = question.options[optionIndex];
  const maxWeights = Object.fromEntries(
    core.DIMENSION_KEYS.map((dimension) => [
      dimension,
      Math.max(...question.options.map((candidate) => candidate.weights[dimension] || 0)),
    ]),
  );

  return {
    questionId: question.id,
    dimension: question.dimension,
    weights: option.weights,
    maxWeights,
  };
}

test('validates a production bank with at least 40 questions and every adaptive stage', () => {
  assert.equal(core.validateQuestionBank(bank), true);
  assert.ok(bank.length >= 40);
  assert.ok(bank.filter((question) => question.stage === 'calibration').length >= 8);
  assert.ok(bank.filter((question) => question.stage === 'boss').length >= 3);
  assert.ok(bank.filter((question) => question.stage === 'playoff').length >= 5);

  core.DIMENSION_KEYS.forEach((dimension) => {
    assert.ok(bank.filter((question) => question.stage === 'branch' && question.dimension === dimension).length >= 4);
  });
});

test('normalizes each dimension independently and returns an equal-weight overall score', () => {
  const questions = bank.filter((question) => question.stage === 'calibration');
  const answers = questions.map((question) => {
    const bestIndex = question.options.reduce((best, option, index, options) => {
      const total = Object.values(option.weights).reduce((sum, value) => sum + value, 0);
      const bestTotal = Object.values(options[best].weights).reduce((sum, value) => sum + value, 0);
      return total > bestTotal ? index : best;
    }, 0);
    return answerQuestion(question, bestIndex);
  });

  const summary = core.scoreAssessment(answers);

  assert.deepEqual(Object.keys(summary.dimensions).sort(), [...core.DIMENSION_KEYS].sort());
  assert.ok(summary.overall >= 90 && summary.overall <= 100);
  Object.values(summary.dimensions).forEach((score) => assert.ok(score >= 0 && score <= 100));
});

test('requires filter and translation strength for the top rank', () => {
  const gated = core.getRank({
    overall: 96,
    dimensions: { decode: 99, context: 97, culture: 98, filter: 74, translate: 72 },
  });
  const master = core.getRank({
    overall: 96,
    dimensions: { decode: 95, context: 94, culture: 93, filter: 92, translate: 94 },
  });

  assert.equal(gated.id, 7);
  assert.equal(master.id, 8);
  assert.equal(master.name, '返璞归真人话掌门');
});

test('builds a deterministic five-question adaptive route from one weak and one strong track', () => {
  const calibration = core.selectCalibrationQuestions(bank, { seed: 20260823 });
  const answers = calibration.map((question) => {
    const optionIndex = question.dimension === 'decode' ? 0 : question.dimension === 'culture' ? 3 : 2;
    return answerQuestion(question, optionIndex);
  });

  const first = core.buildAdaptiveRoute(bank, answers, {
    seed: 20260823,
    usedQuestionIds: calibration.map((question) => question.id),
  });
  const second = core.buildAdaptiveRoute(bank, answers, {
    seed: 20260823,
    usedQuestionIds: calibration.map((question) => question.id),
  });

  assert.equal(first.questions.length, 5);
  assert.equal(new Set(first.questions.map((question) => question.id)).size, 5);
  assert.equal(first.questions.filter((question) => question.stage === 'branch').length, 4);
  assert.equal(first.questions.filter((question) => question.stage === 'boss').length, 1);
  assert.deepEqual(first, second);
  assert.equal(first.tracks.length, 2);
});

test('adds playoff questions only when a score is close to promotion or the top gate', () => {
  const none = core.selectPlayoffQuestions(bank, {
    overall: 68,
    dimensions: { decode: 68, context: 68, culture: 68, filter: 68, translate: 68 },
  }, { seed: 7, usedQuestionIds: [] });
  const promotion = core.selectPlayoffQuestions(bank, {
    overall: 72,
    dimensions: { decode: 73, context: 71, culture: 70, filter: 72, translate: 74 },
  }, { seed: 7, usedQuestionIds: [] });
  const topGate = core.selectPlayoffQuestions(bank, {
    overall: 94,
    dimensions: { decode: 96, context: 96, culture: 95, filter: 79, translate: 78 },
  }, { seed: 7, usedQuestionIds: [] });

  assert.equal(none.length, 0);
  assert.equal(promotion.length, 1);
  assert.equal(topGate.length, 2);
});

test('returns two stable specialist badges from the strongest dimensions', () => {
  const badges = core.getBadges({
    decode: 72,
    context: 91,
    culture: 83,
    filter: 96,
    translate: 78,
  });

  assert.deepEqual(badges.map((badge) => badge.id), ['filter', 'context']);
});

test('question and option shuffling is deterministic without mutating the source bank', () => {
  const source = bank[0].options.map((option) => option.text);
  const first = core.selectCalibrationQuestions(bank, { seed: 99 });
  const second = core.selectCalibrationQuestions(bank, { seed: 99 });

  assert.deepEqual(first, second);
  assert.deepEqual(bank[0].options.map((option) => option.text), source);
  assert.notEqual(first[0].options, bank.find((question) => question.id === first[0].id).options);
});

test('keeps 50 adaptive sessions within 13 to 15 unique questions', () => {
  for (let seed = 1; seed <= 50; seed += 1) {
    const calibration = core.selectCalibrationQuestions(bank, { seed });
    const answers = calibration.map((question, index) => answerQuestion(question, index % 4));
    const route = core.buildAdaptiveRoute(bank, answers, {
      seed: seed + 17,
      usedQuestionIds: calibration.map((question) => question.id),
    });
    const routeAnswers = route.questions.map((question, index) => answerQuestion(question, (index + 1) % 4));
    const usedQuestionIds = [...calibration, ...route.questions].map((question) => question.id);
    const playoff = core.selectPlayoffQuestions(bank, core.scoreAssessment([...answers, ...routeAnswers]), {
      seed: seed + 31,
      usedQuestionIds,
    });
    const sessionIds = [...usedQuestionIds, ...playoff.map((question) => question.id)];

    assert.ok(sessionIds.length >= 13 && sessionIds.length <= 15);
    assert.equal(new Set(sessionIds).size, sessionIds.length);
  }
});
