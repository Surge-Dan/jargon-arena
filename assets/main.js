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

    const missingElements = Object.entries(elements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missingElements.length) {
      showFatalError('页面结构不完整，请重新打开。');
      return;
    }

    const state = {
      currentIndex: 0,
      answers: [],
      questions: [],
      selectedOptionIndex: null,
    };

    function resetState() {
      state.currentIndex = 0;
      state.answers = [];
      state.questions = core.createSessionQuestionBank(questionBank, Date.now() + Math.floor(Math.random() * 1000000));
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
      const question = state.questions[state.currentIndex];
      const currentNumber = state.currentIndex + 1;
      const progress = (currentNumber / questionBank.length) * 100;

      elements.questionCategory.textContent = question.categoryLabel || '语境判断';
      elements.questionCounter.textContent = `${String(currentNumber).padStart(2, '0')} / ${questionBank.length}`;
      elements.progressFill.style.width = `${progress}%`;
      elements.progressFill.parentElement.setAttribute('aria-valuenow', String(currentNumber));
      elements.progressFill.parentElement.setAttribute('aria-valuetext', `第 ${currentNumber} 题，共 ${questionBank.length} 题`);
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
        button.tabIndex = index === 0 ? 0 : -1;
        button.dataset.optionIndex = String(index);

        key.className = 'option-key';
        key.textContent = String.fromCharCode(65 + index);
        text.textContent = option.text;

        button.append(key, text);
        button.addEventListener('click', () => selectOption(index));
        button.addEventListener('keydown', (event) => {
          const keyToOffset = {
            ArrowDown: 1,
            ArrowRight: 1,
            ArrowUp: -1,
            ArrowLeft: -1,
          };

          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const targetIndex = event.key === 'Home' ? 0 : question.options.length - 1;
            selectOption(targetIndex, true);
            return;
          }

          if (!(event.key in keyToOffset)) return;

          event.preventDefault();
          const targetIndex = (index + keyToOffset[event.key] + question.options.length) % question.options.length;
          selectOption(targetIndex, true);
        });
        elements.optionsList.append(button);
      });
    }

    function selectOption(index, focusButton = false) {
      const question = state.questions[state.currentIndex];
      const option = question.options[index];
      const buttons = Array.from(elements.optionsList.querySelectorAll('.option-button'));

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
      elements.nextButton.firstElementChild.textContent = state.currentIndex === questionBank.length - 1 ? '查看结果' : '下一题';
    }

    function recordAnswer() {
      if (state.answers.length !== state.currentIndex || state.selectedOptionIndex === null) return false;

      const question = state.questions[state.currentIndex];
      const option = question.options[state.selectedOptionIndex];

      if (!option) return false;

      state.answers.push({
        questionId: question.id,
        question,
        category: question.category,
        optionText: option.text,
        score: option.score,
      });

      return true;
    }

    function goToNextQuestion() {
      if (state.selectedOptionIndex === null) return;

      elements.nextButton.disabled = true;

      if (!recordAnswer()) return;
      state.selectedOptionIndex = null;

      if (state.currentIndex === questionBank.length - 1) {
        renderResult();
        showScreen('result');
        return;
      }

      state.currentIndex += 1;
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
        const questionNumber = document.createElement('span');
        const questionScore = document.createElement('span');
        const title = document.createElement('h3');
        const selected = document.createElement('p');
        const explanation = document.createElement('p');

        item.className = 'explanation-item';
        meta.className = 'explanation-meta';
        questionNumber.textContent = `Q${String(index + 1).padStart(2, '0')}`;
        questionScore.textContent = `${answer.score} / 10`;
        meta.append(questionNumber, questionScore);
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

    const section = document.createElement('section');
    const label = document.createElement('p');
    const title = document.createElement('h1');
    const description = document.createElement('p');

    section.className = 'screen screen-error is-active';
    section.setAttribute('role', 'alert');
    label.className = 'section-label';
    label.textContent = '工具状态';
    title.textContent = '页面暂时打不开';
    description.className = 'intro-lede';
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
