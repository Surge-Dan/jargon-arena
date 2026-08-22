const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateScore,
  createSessionQuestionBank,
  getLevel,
  getResultTags,
  validateQuestionBank,
} = require('../assets/quiz-core.js');

require('../assets/question-bank.js');
const questionBank = globalThis.QuizQuestionBank;

test('calculates a 100-point score from ten answer scores', () => {
  const answers = [10, 7, 4, 10, 0, 10, 7, 10, 10, 10];

  assert.equal(calculateScore(answers), 78);
});

test('maps score boundaries to the six documented levels', () => {
  assert.equal(getLevel(0).id, 1);
  assert.equal(getLevel(20).id, 1);
  assert.equal(getLevel(21).id, 2);
  assert.equal(getLevel(75).id, 4);
  assert.equal(getLevel(76).id, 5);
  assert.equal(getLevel(100).id, 6);
});

test('ranks result tags by average category performance', () => {
  const answers = [
    { category: 'work', score: 10 },
    { category: 'work', score: 7 },
    { category: 'translation', score: 10 },
    { category: 'internet', score: 4 },
  ];

  assert.deepEqual(getResultTags(answers), ['人话翻译官', '会议求生', '热梗雷达']);
});

test('validates the production question bank and requires all category labels', () => {
  assert.equal(validateQuestionBank(questionBank), true);
  assert.equal(questionBank.length, 10);
  assert.ok(questionBank.every((question) => question.categoryLabel));
});

test('shuffles options per session without mutating the source bank', () => {
  const sourceOrder = questionBank[0].options.map((option) => option.text);
  const session = createSessionQuestionBank(questionBank, 20260822);
  const sessionOrder = session[0].options.map((option) => option.text);

  assert.notDeepEqual(sessionOrder, sourceOrder);
  assert.deepEqual(questionBank[0].options.map((option) => option.text), sourceOrder);
  assert.deepEqual(session, createSessionQuestionBank(questionBank, 20260822));
});

test('rejects a question bank with the wrong count or invalid options', () => {
  assert.throws(
    () => validateQuestionBank([]),
    /题库必须包含 10 道题/,
  );

  const invalidBank = questionBank.map((question) => ({
    ...question,
    options: question.options.map((option) => ({ ...option })),
  }));
  invalidBank[0].options[1].text = invalidBank[0].options[0].text;

  assert.throws(
    () => validateQuestionBank(invalidBank),
    /题目 work-01 的选项配置无效/,
  );
});
