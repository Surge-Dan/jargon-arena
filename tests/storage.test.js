const test = require('node:test');
const assert = require('node:assert/strict');

let storageApi;
try {
  storageApi = require('../assets/storage.js');
} catch (_error) {
  storageApi = null;
}

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('loads corrupted history as an empty list', () => {
  assert.ok(storageApi, 'storage module should exist');
  const storage = createMemoryStorage({ 'jargon-arena-history-v2': '{bad-json' });
  assert.deepEqual(storageApi.loadHistory(storage), []);
});

test('keeps the newest eight results and exposes seen question ids', () => {
  assert.ok(storageApi, 'storage module should exist');
  const storage = createMemoryStorage();

  for (let index = 0; index < 10; index += 1) {
    storageApi.saveResult(storage, {
      id: `result-${index}`,
      createdAt: `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      rankId: index + 1,
      questionIds: [`q-${index}`, 'shared'],
      dimensions: { decode: index },
    });
  }

  const history = storageApi.loadHistory(storage);
  assert.equal(history.length, 8);
  assert.equal(history[0].id, 'result-9');
  assert.ok(storageApi.getSeenQuestionIds(history).has('q-9'));
  assert.ok(storageApi.getSeenQuestionIds(history).has('shared'));
});

test('compares every dimension with a previous result', () => {
  assert.ok(storageApi, 'storage module should exist');
  const comparison = storageApi.compareDimensions(
    { decode: 80, context: 60, culture: 70, filter: 50, translate: 90 },
    { decode: 70, context: 65, culture: 70, filter: 40, translate: 95 },
  );

  assert.deepEqual(comparison, { decode: 10, context: -5, culture: 0, filter: 10, translate: -5 });
});
