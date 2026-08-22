(function initQuizApp(root) {
  function start() {
    const core = root.QuizCore;
    const questionBank = root.QuizQuestionBank;

    if (!core || !questionBank) {
      showFatalError('工具资源加载失败，请重新打开。');
      return;
    }

    try {
      core.validateQuestionBank(questionBank);
    } catch (error) {
      showFatalError(error.message || '题库校验失败，请重新打开。');
      return;
    }

    const elements = {
      introScreen: document.querySelector('#intro-screen'),
      quizScreen: document.querySelector('#quiz-screen'),
      resultScreen: document.querySelector('#result-screen'),
      startButton: document.querySelector('#start-button'),
      nextButton: document.querySelector('#next-button'),
      restartButton: document.querySelector('#restart-button'),
      explanationButton: document.querySelector('#explanation-button'),
      explanationPanel: document.querySelector('#explanation-panel'),
      questionCategory: document.querySelector('#question-category'),
      questionCounter: document.querySelector('#question-counter'),
      progressFill: document.querySelector('#progress-fill'),
      quizTitle: document.querySelector('#quiz-title'),
      optionsList: document.querySelector('#options-list'),
      answerFeedback: document.querySelector('#answer-feedback'),
      resultLevel: document.querySelector('#result-level'),
      resultTitle: document.querySelector('#result-title'),
      resultDescription: document.querySelector('#result-description'),
      resultScore: document.querySelector('#result-score'),
      resultTags: document.querySelector('#result-tags'),
      resultTone: document.querySelector('#result-tone'),
      explanationList: document.querySelector('#explanation-list'),
    };

    const state = {
      currentIndex: 0,
      answers: [],
      selectedOptionIndex: null,
    };

    function resetState() {
      state.currentIndex = 0;
      state.answers = [];
      state.selectedOptionIndex = null;
    }

    function showScreen(screenName) {
      const screens = {
        intro: elements.introScreen,
        quiz: elements.quizScreen,
        result: elements.resultScreen,
      };

      Object.entries(screens).forEach(([name, screen]) => {
        const active = name === screenName;
        screen.classList.toggle('is-active', active);
        screen.hidden = !active;
      });
    }

    function renderQuestion() {
      const question = questionBank[state.currentIndex];
      const currentNumber = state.currentIndex + 1;
      const progress = (currentNumber / questionBank.length) * 100;

      elements.questionCategory.textContent = question.categoryLabel || '语境判断';
      elements.questionCounter.textContent = `${String(currentNumber).padStart(2, '0')} / ${questionBank.length}`;
      elements.progressFill.style.width = `${progress}%`;
      elements.quizTitle.textContent = question.stem;
      elements.optionsList.replaceChildren();
      elements.answerFeedback.textContent = '';
      elements.answerFeedback.classList.remove('is-visible');
      elements.nextButton.disabled = true;
      elements.nextButton.firstElementChild.textContent = '选择一个答案';

      question.options.forEach((option, index) => {
        const button = document.createElement('button');
        const key = document.createElement('span');
        const text = document.createElement('span');

        button.type = 'button';
        button.className = 'option-button';
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', 'false');
        button.dataset.optionIndex = String(index);

        key.className = 'option-key';
        key.textContent = String.fromCharCode(65 + index);
        text.textContent = option.text;

        button.append(key, text);
        button.addEventListener('click', () => selectOption(index));
        elements.optionsList.append(button);
      });
    }

    function selectOption(index) {
      const question = questionBank[state.currentIndex];
      const option = question.options[index];
      const buttons = Array.from(elements.optionsList.querySelectorAll('.option-button'));

      state.selectedOptionIndex = index;
      buttons.forEach((button, buttonIndex) => {
        const selected = buttonIndex === index;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-checked', String(selected));
      });

      elements.answerFeedback.textContent = option.feedback;
      elements.answerFeedback.classList.add('is-visible');
      elements.nextButton.disabled = false;
      elements.nextButton.firstElementChild.textContent = state.currentIndex === questionBank.length - 1 ? '查看结果' : '下一题';
    }

    function recordAnswer() {
      const question = questionBank[state.currentIndex];
      const option = question.options[state.selectedOptionIndex];

      state.answers.push({
        questionId: question.id,
        question,
        category: question.category,
        optionText: option.text,
        score: option.score,
      });
    }

    function goToNextQuestion() {
      if (state.selectedOptionIndex === null) return;

      recordAnswer();

      if (state.currentIndex === questionBank.length - 1) {
        renderResult();
        showScreen('result');
        return;
      }

      state.currentIndex += 1;
      state.selectedOptionIndex = null;
      renderQuestion();
    }

    function renderResult() {
      const score = core.calculateScore(state.answers);
      const level = core.getLevel(score);
      const tags = core.getResultTags(state.answers);

      elements.resultLevel.textContent = `LV.${level.id}`;
      elements.resultTitle.textContent = level.name;
      elements.resultDescription.textContent = level.description;
      elements.resultScore.textContent = String(score).padStart(2, '0');
      elements.resultTone.textContent = level.tone;
      elements.resultTags.replaceChildren();

      (tags.length ? tags : ['认真做完']).forEach((tag) => {
        const tagElement = document.createElement('span');
        tagElement.className = 'result-tag';
        tagElement.textContent = tag;
        elements.resultTags.append(tagElement);
      });

      renderExplanations();
      elements.explanationPanel.hidden = true;
      elements.explanationButton.textContent = '查看解析';
      elements.explanationButton.setAttribute('aria-expanded', 'false');
    }

    function renderExplanations() {
      elements.explanationList.replaceChildren();

      state.answers.forEach((answer, index) => {
        const item = document.createElement('article');
        const meta = document.createElement('div');
        const title = document.createElement('h3');
        const selected = document.createElement('p');
        const explanation = document.createElement('p');

        item.className = 'explanation-item';
        meta.className = 'explanation-meta';
        meta.innerHTML = `<span>Q${String(index + 1).padStart(2, '0')}</span><span>${answer.score} / 10</span>`;
        title.textContent = answer.question.stem;
        selected.textContent = `你的选择：${answer.optionText}`;
        explanation.textContent = `人话解析：${answer.question.explanation}`;

        item.append(meta, title, selected, explanation);
        elements.explanationList.append(item);
      });
    }

    elements.startButton.addEventListener('click', () => {
      resetState();
      showScreen('quiz');
      renderQuestion();
    });

    elements.nextButton.addEventListener('click', goToNextQuestion);

    elements.restartButton.addEventListener('click', () => {
      resetState();
      showScreen('quiz');
      renderQuestion();
    });

    elements.explanationButton.addEventListener('click', () => {
      const expanded = !elements.explanationPanel.hidden;
      elements.explanationPanel.hidden = expanded;
      elements.explanationButton.textContent = expanded ? '查看解析' : '收起解析';
      elements.explanationButton.setAttribute('aria-expanded', String(!expanded));
    });
  }

  function showFatalError(message) {
    const app = document.querySelector('#app');
    if (!app) return;

    app.innerHTML = `<section class="screen screen-error is-active"><p class="section-label">工具状态</p><h1>页面暂时打不开</h1><p class="intro-lede">${message}</p></section>`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
