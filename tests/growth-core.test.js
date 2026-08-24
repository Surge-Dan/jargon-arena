const test = require('node:test');
const assert = require('node:assert/strict');

let growth;
let missions;
try {
  growth = require('../assets/growth-core.js');
  missions = require('../assets/growth-data.js');
} catch (_error) {
  growth = null;
  missions = null;
}

test('initializes growth at the latest certified assessment rank', () => {
  assert.ok(growth, 'growth core should exist');
  const state = growth.createGrowthState(5, '2026-08-24T00:00:00.000Z');
  assert.equal(state.rankId, 5);
  assert.equal(state.lastBaselineRankId, 5);
  assert.equal(state.xp, 0);
  assert.deepEqual(state.completedMissionIds, []);
});

test('recommends three missions from weak dimensions before generic missions', () => {
  assert.ok(growth && Array.isArray(missions), 'growth modules should exist');
  const selected = growth.recommendMissions(
    missions,
    { decode: 82, context: 38, culture: 71, filter: 44, translate: 90 },
    [],
    3,
  );
  assert.equal(selected.length, 3);
  assert.ok(selected.some((mission) => mission.dimension === 'context'));
  assert.ok(selected.some((mission) => mission.dimension === 'filter'));
});

test('awards xp once, carries overflow, and reports rank-up', () => {
  assert.ok(growth, 'growth core should exist');
  const initial = { ...growth.createGrowthState(4), xp: 85 };
  const mission = { id: 'm-raise', xp: 35 };
  const first = growth.completeMission(initial, mission, '2026-08-24T01:00:00.000Z');
  assert.equal(first.rankUp, true);
  assert.equal(first.previousRankId, 4);
  assert.equal(first.state.rankId, 5);
  assert.equal(first.state.xp, 20);

  const duplicate = growth.completeMission(first.state, mission, '2026-08-24T02:00:00.000Z');
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.state, first.state);
});

test('syncs a stronger baseline without lowering earned growth rank', () => {
  assert.ok(growth, 'growth core should exist');
  const current = { ...growth.createGrowthState(6), xp: 48 };
  const lower = growth.syncBaseline(current, 4, '2026-08-24T03:00:00.000Z');
  const higher = growth.syncBaseline(current, 8, '2026-08-24T04:00:00.000Z');
  assert.equal(lower.rankId, 6);
  assert.equal(lower.lastBaselineRankId, 4);
  assert.equal(higher.rankId, 8);
  assert.equal(higher.xp, 0);
});
