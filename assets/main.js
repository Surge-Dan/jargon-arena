(function initJargonArena(root) {
  function start() {
    const core = root.QuizCore;
    const bank = root.QuizQuestionBank;
    const content = root.QuizContentData;
    const storageApi = root.QuizStorage;
    const posterApi = root.QuizPoster;

    if (!core || !bank || !content || !storageApi || !posterApi) {
      showFatalError('工具资源没有完整载入，请关闭后重新打开。');
      return;
    }

    try {
      core.validateQuestionBank(bank);
      if (content.RANK_DETAILS.length !== core.RANKS.length || content.GLOSSARY.length < 30) {
        throw new Error('段位或词典内容不完整');
      }
    } catch (error) {
      showFatalError(error.message || '内容校验失败，请关闭后重新打开。');
      return;
    }

    const elements = collectElements();
    if (elements.missing.length) {
      showFatalError(`页面结构不完整：${elements.missing.join('、')}`);
      return;
    }

    let localStore = null;
    try {
      localStore = root.localStorage;
    } catch (_error) {
      localStore = null;
    }

    const state = {
      answers: [],
      currentIndex: 0,
      currentResult: null,
      glossaryCategory: '全部',
      history: storageApi.loadHistory(localStore),
      playoffEvaluated: false,
      questions: [],
      routeTracks: [],
      seed: 0,
      selectedOptionIndex: null,
    };

    const screens = {
      home: elements.homeScreen,
      quiz: elements.quizScreen,
      loading: elements.loadingScreen,
      report: elements.reportScreen,
      ranks: elements.ranksScreen,
      glossary: elements.glossaryScreen,
      history: elements.historyScreen,
    };

    renderHomeRanks();
    renderRankGallery();
    renderGlossaryFilters();
    renderGlossary();
    renderHistory();
    bindEvents();

    function collectElements() {
      const ids = [
        'home-screen', 'quiz-screen', 'loading-screen', 'report-screen', 'ranks-screen', 'glossary-screen',
        'history-screen', 'start-button', 'next-button', 'restart-button', 'question-phase', 'phase-note',
        'question-counter', 'question-progress', 'progress-fill', 'question-category', 'question-code', 'quiz-title',
        'options-list', 'answer-feedback', 'route-hint', 'result-record-code', 'result-level', 'result-rank-name',
        'result-profile', 'result-quote', 'result-overall', 'result-description', 'result-meeting', 'result-badges',
        'result-strengths', 'result-pitfalls', 'result-advice', 'result-environment', 'result-mission', 'radar-canvas',
        'dimension-list', 'comparison-section', 'comparison-list', 'share-button', 'home-rank-list', 'rank-gallery',
        'glossary-search', 'glossary-filters', 'glossary-list', 'glossary-empty', 'history-list', 'history-empty',
        'clear-history-button', 'share-modal', 'poster-preview', 'poster-canvas', 'share-feedback',
        'save-poster-button', 'post-note-button', 'confirm-modal', 'confirm-clear-button',
      ];
      const output = { missing: [] };
      ids.forEach((id) => {
        const key = id.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
        output[key] = document.getElementById(id);
        if (!output[key]) output.missing.push(id);
      });
      return output;
    }

    function bindEvents() {
      elements.startButton.addEventListener('click', startQuiz);
      elements.nextButton.addEventListener('click', advanceQuiz);
      elements.restartButton.addEventListener('click', startQuiz);
      elements.shareButton.addEventListener('click', openSharePreview);
      elements.savePosterButton.addEventListener('click', savePoster);
      elements.postNoteButton.addEventListener('click', postPoster);
      elements.glossarySearch.addEventListener('input', renderGlossary);
      elements.clearHistoryButton.addEventListener('click', () => setModal(elements.confirmModal, true));
      elements.confirmClearButton.addEventListener('click', clearHistory);

      document.querySelectorAll('[data-screen]').forEach((button) => {
        button.addEventListener('click', () => showScreen(button.dataset.screen));
      });
      document.querySelectorAll('[data-start-quiz]').forEach((button) => button.addEventListener('click', startQuiz));
      document.querySelectorAll('[data-close-share]').forEach((button) => {
        button.addEventListener('click', () => setModal(elements.shareModal, false));
      });
      document.querySelectorAll('[data-cancel-clear]').forEach((button) => {
        button.addEventListener('click', () => setModal(elements.confirmModal, false));
      });
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!elements.shareModal.hidden) setModal(elements.shareModal, false);
        if (!elements.confirmModal.hidden) setModal(elements.confirmModal, false);
      });
    }

    function showScreen(name) {
      if (!screens[name]) return;
      Object.entries(screens).forEach(([screenName, screen]) => {
        const active = screenName === name;
        screen.hidden = !active;
        screen.classList.toggle('is-active', active);
      });
      if (name === 'history') renderHistory();
      if (name === 'glossary') renderGlossary();
      root.scrollTo(0, 0);
      const heading = screens[name].querySelector('h1, h2');
      if (heading) heading.setAttribute('tabindex', '-1');
    }

    function startQuiz() {
      state.seed = Date.now() + Math.floor(Math.random() * 100000);
      state.answers = [];
      state.currentIndex = 0;
      state.currentResult = null;
      state.playoffEvaluated = false;
      state.routeTracks = [];
      state.selectedOptionIndex = null;
      const seenQuestionIds = [...storageApi.getSeenQuestionIds(state.history)];
      state.questions = core.selectCalibrationQuestions(bank, { seed: state.seed, seenQuestionIds });
      showScreen('quiz');
      renderQuestion();
    }

    function getUsedQuestionIds() {
      return state.questions.map((question) => question.id);
    }

    function renderQuestion() {
      const question = state.questions[state.currentIndex];
      if (!question) return;
      const checkpoint = content.CHECKPOINTS[question.stage];
      const currentNumber = state.currentIndex + 1;
      const estimatedTotal = state.playoffEvaluated ? state.questions.length : 13;
      const displayedTotal = state.playoffEvaluated ? String(state.questions.length) : '13+';
      const progress = Math.min(100, ((currentNumber - 0.25) / estimatedTotal) * 100);

      elements.questionPhase.textContent = checkpoint.label;
      elements.phaseNote.textContent = checkpoint.note;
      elements.questionCounter.textContent = `${String(currentNumber).padStart(2, '0')} / ${displayedTotal}`;
      elements.questionProgress.setAttribute('aria-valuenow', String(currentNumber));
      elements.questionProgress.setAttribute('aria-valuetext', `第 ${currentNumber} 题，预计共 13 到 15 题`);
      elements.progressFill.style.width = `${progress}%`;
      elements.questionCategory.textContent = question.categoryLabel;
      elements.questionCode.textContent = `${question.stage.toUpperCase()} / ${String(currentNumber).padStart(2, '0')}`;
      elements.quizTitle.textContent = question.stem;
      elements.optionsList.replaceChildren();
      elements.answerFeedback.textContent = '';
      elements.answerFeedback.classList.remove('is-visible');
      elements.nextButton.disabled = true;
      elements.nextButton.firstChild.textContent = '先选一个答案 ';
      state.selectedOptionIndex = null;

      if (state.routeTracks.length) {
        const labels = state.routeTracks.map((key) => core.DIMENSIONS[key].short).join(' × ');
        elements.routeHint.textContent = `本轮专项路线：${labels}。题目会沿你的强弱项继续扫描。`;
      } else {
        elements.routeHint.textContent = '答完基础题后，系统会自动分配专项路线。';
      }

      question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-button';
        button.dataset.optionIndex = String(index);
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', 'false');
        button.tabIndex = index === 0 ? 0 : -1;
        const key = document.createElement('span');
        key.className = 'option-key';
        key.textContent = String.fromCharCode(65 + index);
        const text = document.createElement('span');
        text.textContent = option.text;
        button.append(key, text);
        button.addEventListener('click', () => selectOption(index));
        button.addEventListener('keydown', (event) => handleOptionKey(event, index, question.options.length));
        elements.optionsList.append(button);
      });
      elements.quizTitle.focus({ preventScroll: true });
    }

    function handleOptionKey(event, index, optionCount) {
      const offsets = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        selectOption(event.key === 'Home' ? 0 : optionCount - 1, true);
        return;
      }
      if (!(event.key in offsets)) return;
      event.preventDefault();
      selectOption((index + offsets[event.key] + optionCount) % optionCount, true);
    }

    function selectOption(index, focusButton) {
      const question = state.questions[state.currentIndex];
      const option = question.options[index];
      const buttons = [...elements.optionsList.querySelectorAll('.option-button')];
      state.selectedOptionIndex = index;
      buttons.forEach((button, buttonIndex) => {
        const selected = buttonIndex === index;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-checked', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      if (focusButton) buttons[index].focus();
      elements.answerFeedback.textContent = option.feedback;
      elements.answerFeedback.classList.add('is-visible');
      elements.nextButton.disabled = false;
      elements.nextButton.firstChild.textContent = '确认，下一题 ';
    }

    function recordAnswer() {
      if (state.selectedOptionIndex === null || state.answers.length !== state.currentIndex) return false;
      const question = state.questions[state.currentIndex];
      const option = question.options[state.selectedOptionIndex];
      if (!option) return false;
      state.answers.push(core.createAnswer(question, option));
      return true;
    }

    function advanceQuiz() {
      if (!recordAnswer()) return;
      elements.nextButton.disabled = true;

      if (state.answers.length === 8 && state.questions.length === 8) {
        const route = core.buildAdaptiveRoute(bank, state.answers, {
          seed: state.seed + 17,
          seenQuestionIds: [...storageApi.getSeenQuestionIds(state.history)],
          usedQuestionIds: getUsedQuestionIds(),
        });
        state.routeTracks = route.tracks;
        state.questions.push(...route.questions);
      }

      if (state.answers.length === 13 && !state.playoffEvaluated) {
        const summary = core.scoreAssessment(state.answers);
        const playoff = core.selectPlayoffQuestions(bank, summary, {
          seed: state.seed + 31,
          seenQuestionIds: [...storageApi.getSeenQuestionIds(state.history)],
          usedQuestionIds: getUsedQuestionIds(),
        });
        state.playoffEvaluated = true;
        state.questions.push(...playoff);
      }

      if (state.answers.length >= state.questions.length && state.playoffEvaluated) {
        finishQuiz();
        return;
      }
      state.currentIndex += 1;
      renderQuestion();
    }

    function finishQuiz() {
      const summary = core.scoreAssessment(state.answers);
      const rank = core.getRank(summary);
      const details = getRankDetails(rank.id);
      const now = new Date();
      const result = {
        id: `result-${now.getTime()}`,
        createdAt: now.toISOString(),
        recordCode: `JA-${String(now.getTime()).slice(-6)}`,
        rankId: rank.id,
        rank,
        overall: summary.overall,
        dimensions: summary.dimensions,
        badges: core.getBadges(summary.dimensions),
        quote: details.quote,
        routeTracks: [...state.routeTracks],
        questionIds: state.answers.map((answer) => answer.questionId),
      };
      state.currentResult = result;
      showScreen('loading');
      const reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.setTimeout(() => {
        renderReport(result, true);
        showScreen('report');
      }, reduceMotion ? 20 : 620);
    }

    function getRankDetails(rankId) {
      return content.RANK_DETAILS.find((item) => item.id === Number(rankId)) || content.RANK_DETAILS[0];
    }

    function renderReport(result, shouldSave) {
      const details = getRankDetails(result.rankId || (result.rank && result.rank.id));
      const rank = result.rank || core.RANKS.find((item) => item.id === details.id) || core.RANKS[0];
      const badges = result.badges || core.getBadges(result.dimensions);
      const previous = shouldSave ? state.history[0] : null;

      elements.resultRecordCode.textContent = result.recordCode || 'HISTORY';
      elements.resultLevel.textContent = `LV.${String(rank.id).padStart(2, '0')} / ${rank.code}`;
      elements.resultRankName.textContent = rank.name;
      elements.resultProfile.textContent = details.profile;
      elements.resultQuote.textContent = details.quote;
      elements.resultOverall.textContent = String(result.overall).padStart(2, '0');
      elements.resultDescription.textContent = details.description;
      elements.resultMeeting.textContent = details.meetingBehavior;
      elements.resultMission.textContent = details.nextMission;
      renderList(elements.resultStrengths, details.strengths);
      renderList(elements.resultPitfalls, details.pitfalls);
      renderList(elements.resultAdvice, details.advice);
      renderList(elements.resultEnvironment, details.environment);
      renderBadges(badges);
      renderDimensions(result.dimensions);
      drawRadar(elements.radarCanvas, result.dimensions);
      renderComparison(result.dimensions, previous && previous.dimensions);

      state.currentResult = { ...result, rank, badges, quote: details.quote };
      if (shouldSave) {
        state.history = storageApi.saveResult(localStore, state.currentResult);
      }
    }

    function renderList(element, items) {
      element.replaceChildren();
      items.forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        element.append(item);
      });
    }

    function renderBadges(badges) {
      elements.resultBadges.replaceChildren();
      badges.slice(0, 2).forEach((badge, index) => {
        const item = document.createElement('div');
        item.className = 'badge-chip';
        item.innerHTML = `<span>0${index + 1}</span><strong>${escapeHtml(badge.label)}</strong><small>${escapeHtml(badge.dimensionLabel)} ${badge.score}</small>`;
        elements.resultBadges.append(item);
      });
    }

    function renderDimensions(dimensions) {
      elements.dimensionList.replaceChildren();
      core.DIMENSION_KEYS.forEach((key) => {
        const insight = content.DIMENSION_INSIGHTS[key];
        const score = Number(dimensions[key]) || 0;
        const item = document.createElement('article');
        item.className = 'dimension-row';
        item.innerHTML = `<div><span>${escapeHtml(insight.label)}</span><strong>${score}</strong></div><div class="dimension-meter"><i style="width:${score}%"></i></div><p>${escapeHtml(score >= 70 ? insight.high : insight.low)}</p>`;
        elements.dimensionList.append(item);
      });
    }

    function drawRadar(canvas, dimensions) {
      const context = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2 + 5;
      const radius = Math.min(width, height) * 0.31;
      const keys = core.DIMENSION_KEYS;
      const points = keys.map((key, index) => ({
        key,
        score: Number(dimensions[key]) || 0,
        angle: -Math.PI / 2 + (Math.PI * 2 * index) / keys.length,
      }));
      context.clearRect(0, 0, width, height);
      context.lineWidth = 2;
      context.strokeStyle = 'rgba(34,36,33,0.17)';
      [0.25, 0.5, 0.75, 1].forEach((level) => {
        context.beginPath();
        points.forEach((point, index) => {
          const x = centerX + Math.cos(point.angle) * radius * level;
          const y = centerY + Math.sin(point.angle) * radius * level;
          if (!index) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.closePath();
        context.stroke();
      });
      points.forEach((point) => {
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(centerX + Math.cos(point.angle) * radius, centerY + Math.sin(point.angle) * radius);
        context.stroke();
      });
      context.beginPath();
      points.forEach((point, index) => {
        const scaled = radius * Math.max(0, Math.min(100, point.score)) / 100;
        const x = centerX + Math.cos(point.angle) * scaled;
        const y = centerY + Math.sin(point.angle) * scaled;
        if (!index) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.closePath();
      context.fillStyle = 'rgba(120,166,156,0.38)';
      context.strokeStyle = '#557b73';
      context.lineWidth = 4;
      context.fill();
      context.stroke();
      context.fillStyle = '#222421';
      context.font = '700 19px "Microsoft YaHei", sans-serif';
      context.textAlign = 'center';
      points.forEach((point) => {
        const labelRadius = radius + 52;
        context.fillText(core.DIMENSIONS[point.key].short, centerX + Math.cos(point.angle) * labelRadius, centerY + Math.sin(point.angle) * labelRadius + 7);
      });
    }

    function renderComparison(current, previous) {
      if (!previous) {
        elements.comparisonSection.hidden = true;
        return;
      }
      const comparison = storageApi.compareDimensions(current, previous);
      elements.comparisonList.replaceChildren();
      core.DIMENSION_KEYS.forEach((key) => {
        const delta = comparison[key];
        const item = document.createElement('div');
        item.className = `comparison-item ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}`;
        item.innerHTML = `<span>${escapeHtml(core.DIMENSIONS[key].label)}</span><strong>${delta > 0 ? '+' : ''}${delta}</strong>`;
        elements.comparisonList.append(item);
      });
      elements.comparisonSection.hidden = false;
    }

    function renderHomeRanks() {
      elements.homeRankList.replaceChildren();
      content.HOME_RANK_EXAMPLES.forEach((rank) => {
        const item = document.createElement('article');
        item.className = 'rank-teaser';
        item.innerHTML = `<span>LV.${String(rank.id).padStart(2, '0')}</span><h3>${escapeHtml(rank.name)}</h3><p>${escapeHtml(rank.profile)}</p>`;
        elements.homeRankList.append(item);
      });
    }

    function renderRankGallery() {
      elements.rankGallery.replaceChildren();
      content.RANK_DETAILS.forEach((rank) => {
        const item = document.createElement('article');
        item.className = 'rank-dossier';
        item.innerHTML = `<div class="rank-index"><span>LV.${String(rank.id).padStart(2, '0')}</span><i></i></div><div><p>${escapeHtml(rank.profile)}</p><h2>${escapeHtml(rank.name)}</h2><blockquote>${escapeHtml(rank.quote)}</blockquote><div class="rank-detail-grid"><p><b>会议状态</b>${escapeHtml(rank.meetingBehavior)}</p><p><b>晋级任务</b>${escapeHtml(rank.nextMission)}</p></div></div>`;
        elements.rankGallery.append(item);
      });
    }

    function renderGlossaryFilters() {
      const categories = ['全部', ...new Set(content.GLOSSARY.map((item) => item.category))];
      elements.glossaryFilters.replaceChildren();
      categories.forEach((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-button';
        button.textContent = category;
        button.classList.toggle('is-active', category === state.glossaryCategory);
        button.addEventListener('click', () => {
          state.glossaryCategory = category;
          [...elements.glossaryFilters.children].forEach((child) => child.classList.toggle('is-active', child === button));
          renderGlossary();
        });
        elements.glossaryFilters.append(button);
      });
    }

    function renderGlossary() {
      const query = elements.glossarySearch.value.trim().toLowerCase();
      const filtered = content.GLOSSARY.filter((item) => {
        const categoryMatch = state.glossaryCategory === '全部' || item.category === state.glossaryCategory;
        const queryMatch = !query || [item.term, item.translation, item.risk, item.question].join(' ').toLowerCase().includes(query);
        return categoryMatch && queryMatch;
      });
      elements.glossaryList.replaceChildren();
      filtered.forEach((entry, index) => {
        const item = document.createElement('article');
        item.className = 'glossary-item';
        item.innerHTML = `<div class="glossary-number">${String(index + 1).padStart(2, '0')}</div><div class="glossary-term"><span>${escapeHtml(entry.category)}</span><h2>${escapeHtml(entry.term)}</h2></div><dl><div><dt>人话翻译</dt><dd>${escapeHtml(entry.translation)}</dd></div><div><dt>使用风险</dt><dd>${escapeHtml(entry.risk)}</dd></div><div class="glossary-question"><dt>落地追问</dt><dd>${escapeHtml(entry.question)}</dd></div></dl>`;
        elements.glossaryList.append(item);
      });
      elements.glossaryEmpty.hidden = filtered.length > 0;
    }

    function renderHistory() {
      state.history = storageApi.loadHistory(localStore);
      elements.historyList.replaceChildren();
      elements.historyEmpty.hidden = state.history.length > 0;
      elements.clearHistoryButton.hidden = state.history.length === 0;
      state.history.forEach((record) => {
        const details = getRankDetails(record.rankId || (record.rank && record.rank.id));
        const item = document.createElement('article');
        item.className = 'history-item';
        const time = formatRecordTime(record.createdAt);
        item.innerHTML = `<div class="history-rank"><span>LV.${String(details.id).padStart(2, '0')}</span><strong>${escapeHtml(details.name)}</strong><small>${escapeHtml(time)}</small></div><div class="history-score"><strong>${Number(record.overall) || 0}</strong><span>/100</span></div><button class="text-button" type="button">查看报告 →</button>`;
        item.querySelector('button').addEventListener('click', () => {
          renderReport(record, false);
          showScreen('report');
        });
        elements.historyList.append(item);
      });
    }

    function formatRecordTime(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '本地记录';
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    function clearHistory() {
      storageApi.clearHistory(localStore);
      state.history = [];
      setModal(elements.confirmModal, false);
      renderHistory();
    }

    function openSharePreview() {
      if (!state.currentResult) return;
      posterApi.drawPoster(elements.posterCanvas, state.currentResult);
      elements.posterPreview.src = elements.posterCanvas.toDataURL('image/png');
      elements.shareFeedback.textContent = '';
      setModal(elements.shareModal, true);
    }

    async function savePoster() {
      if (!elements.posterPreview.src) return;
      elements.savePosterButton.disabled = true;
      const response = await posterApi.savePoster(root, elements.posterPreview.src);
      elements.shareFeedback.textContent = response.message;
      elements.savePosterButton.disabled = false;
    }

    async function postPoster() {
      if (!elements.posterPreview.src || !state.currentResult) return;
      elements.postNoteButton.disabled = true;
      const response = await posterApi.postPoster(root, elements.posterPreview.src, state.currentResult);
      elements.shareFeedback.textContent = response.message;
      elements.postNoteButton.disabled = false;
    }

    function setModal(modal, open) {
      modal.hidden = !open;
      document.body.classList.toggle('modal-open', open);
      if (open) {
        const focusable = modal.querySelector('button');
        if (focusable) focusable.focus();
      }
    }

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  function showFatalError(message) {
    const app = document.getElementById('app');
    if (!app) return;
    const section = document.createElement('section');
    section.className = 'screen screen-error is-active';
    section.setAttribute('role', 'alert');
    const label = document.createElement('p');
    label.className = 'eyebrow';
    label.textContent = 'LOCAL CHECK FAILED';
    const title = document.createElement('h1');
    title.textContent = '页面暂时打不开';
    const description = document.createElement('p');
    description.textContent = message;
    section.append(label, title, description);
    app.replaceChildren(section);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
