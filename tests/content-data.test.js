const test = require('node:test');
const assert = require('node:assert/strict');

let content;
try {
  content = require('../assets/content-data.js');
} catch (_error) {
  content = null;
}

test('provides eight complete rank dossiers', () => {
  assert.ok(content, 'content data module should exist');
  assert.equal(content.RANK_DETAILS.length, 8);
  content.RANK_DETAILS.forEach((rank, index) => {
    assert.equal(rank.id, index + 1);
    ['name', 'profile', 'description', 'meetingBehavior', 'nextMission', 'quote'].forEach((field) => {
      assert.ok(rank[field], `rank ${rank.id} should include ${field}`);
    });
    ['strengths', 'pitfalls', 'advice', 'environment'].forEach((field) => {
      assert.ok(Array.isArray(rank[field]) && rank[field].length >= 2, `rank ${rank.id} should include ${field}`);
    });
  });
});

test('provides a useful searchable jargon field guide', () => {
  assert.ok(content, 'content data module should exist');
  assert.ok(content.GLOSSARY.length >= 30);
  assert.ok(new Set(content.GLOSSARY.map((item) => item.term)).size === content.GLOSSARY.length);
  content.GLOSSARY.forEach((item) => {
    ['term', 'category', 'translation', 'risk', 'question'].forEach((field) => {
      assert.ok(item[field], `${item.term || 'entry'} should include ${field}`);
    });
  });
});

test('covers all dimensions and journey checkpoints', () => {
  assert.ok(content, 'content data module should exist');
  const dimensionKeys = ['decode', 'context', 'culture', 'filter', 'translate'];
  assert.deepEqual(Object.keys(content.DIMENSION_INSIGHTS).sort(), dimensionKeys.sort());
  assert.ok(content.CHECKPOINTS.calibration);
  assert.ok(content.CHECKPOINTS.branch);
  assert.ok(content.CHECKPOINTS.boss);
  assert.ok(content.CHECKPOINTS.playoff);
  assert.ok(content.HOME_RANK_EXAMPLES.length >= 3);
});
