(function attachQuizStorage(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.QuizStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizStorage() {
  const HISTORY_KEY = 'jargon-arena-history-v2';
  const GROWTH_KEY = 'jargon-arena-growth-v1';
  const HISTORY_LIMIT = 8;

  function loadHistory(storage) {
    if (!storage || typeof storage.getItem !== 'function') return [];
    try {
      const parsed = JSON.parse(storage.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((record) => record && typeof record === 'object' && record.id && record.createdAt)
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
        .slice(0, HISTORY_LIMIT);
    } catch (_error) {
      return [];
    }
  }

  function saveResult(storage, result) {
    const history = loadHistory(storage).filter((record) => record.id !== result.id);
    const next = [{ ...result }, ...history].slice(0, HISTORY_LIMIT);
    try {
      storage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch (_error) {
      return history;
    }
    return next;
  }

  function clearHistory(storage) {
    try {
      storage.removeItem(HISTORY_KEY);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function loadGrowth(storage) {
    if (!storage || typeof storage.getItem !== 'function') return null;
    try {
      const parsed = JSON.parse(storage.getItem(GROWTH_KEY) || 'null');
      return parsed && typeof parsed === 'object' && Number.isFinite(Number(parsed.rankId)) ? parsed : null;
    } catch (_error) {
      return null;
    }
  }

  function saveGrowth(storage, progress) {
    if (!storage || typeof storage.setItem !== 'function' || !progress || typeof progress !== 'object') return null;
    try {
      storage.setItem(GROWTH_KEY, JSON.stringify(progress));
      return progress;
    } catch (_error) {
      return null;
    }
  }

  function getSeenQuestionIds(history) {
    const ids = new Set();
    (Array.isArray(history) ? history : []).forEach((record) => {
      (Array.isArray(record.questionIds) ? record.questionIds : []).forEach((id) => ids.add(id));
    });
    return ids;
  }

  function compareDimensions(current, previous) {
    const keys = ['decode', 'context', 'culture', 'filter', 'translate'];
    return Object.fromEntries(keys.map((key) => [
      key,
      Math.round((Number(current && current[key]) || 0) - (Number(previous && previous[key]) || 0)),
    ]));
  }

  return {
    HISTORY_KEY,
    GROWTH_KEY,
    HISTORY_LIMIT,
    clearHistory,
    compareDimensions,
    getSeenQuestionIds,
    loadHistory,
    loadGrowth,
    saveResult,
    saveGrowth,
  };
});
