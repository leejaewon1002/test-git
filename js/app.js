const quotes = [
  "작은 진전이 쌓이면 큰 실력이 됩니다.",
  "완벽한 하루보다 꾸준한 하루가 더 강합니다.",
  "어제의 나보다 1%만 성장해도 충분합니다.",
  "계획은 부담이 아니라 집중을 돕는 지도입니다."
];

const qs = (selector) => document.querySelector(selector);

function setTodayCard() {
  const dateNode = qs("#todayDate");
  const quoteNode = qs("#dailyQuote");
  if (!dateNode || !quoteNode) return;

  const now = new Date();
  const randomQuote = quotes[now.getDate() % quotes.length];
  dateNode.textContent = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
  quoteNode.textContent = randomQuote;
}

function initPlanner() {
  const form = qs("#plannerForm");
  const list = qs("#plannerList");
  const clearBtn = qs("#clearPlanner");
  if (!form || !list || !clearBtn) return;

  const STORAGE_KEY = "ai-study-planner-items";

  const readItems = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const writeItems = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  const render = () => {
    const items = readItems();
    list.innerHTML = "";

    if (items.length === 0) {
      list.innerHTML = '<li class="item-meta">아직 등록된 학습 일정이 없습니다.</li>';
      return;
    }

    items.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div>
          <strong>${item.subject}</strong>
          <div class="item-meta">${item.studyDate} | ${item.hours}시간 | 우선순위 ${item.priority}</div>
        </div>
        <button class="btn btn-ghost" data-remove="${idx}">삭제</button>
      `;
      list.appendChild(li);
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const subject = qs("#subject").value.trim();
    const studyDate = qs("#studyDate").value;
    const hours = qs("#hours").value;
    const priority = qs("#priority").value;

    if (!subject || !studyDate || !hours) return;

    const items = readItems();
    items.push({ subject, studyDate, hours, priority });
    writeItems(items);
    form.reset();
    qs("#hours").value = 2;
    qs("#priority").value = "중간";
    render();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove]");
    if (!button) return;

    const removeIndex = Number(button.dataset.remove);
    const items = readItems();
    items.splice(removeIndex, 1);
    writeItems(items);
    render();
  });

  clearBtn.addEventListener("click", () => {
    writeItems([]);
    render();
  });

  render();
}

function initGoals() {
  const form = qs("#goalForm");
  const weeklyBar = qs("#weeklyBar");
  const monthlyBar = qs("#monthlyBar");
  const weeklyText = qs("#weeklyText");
  const monthlyText = qs("#monthlyText");
  if (!form || !weeklyBar || !monthlyBar || !weeklyText || !monthlyText) return;

  const STORAGE_KEY = "ai-study-goals";

  const readGoal = () =>
    JSON.parse(
      localStorage.getItem(STORAGE_KEY) ||
        JSON.stringify({
          weeklyGoal: 15,
          monthlyGoal: 60,
          weeklyDone: 0,
          monthlyDone: 0
        })
    );

  const writeGoal = (goal) => localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));

  const render = () => {
    const goal = readGoal();

    qs("#weeklyGoal").value = goal.weeklyGoal;
    qs("#monthlyGoal").value = goal.monthlyGoal;
    qs("#weeklyDone").value = goal.weeklyDone;
    qs("#monthlyDone").value = goal.monthlyDone;

    const weeklyRate = Math.min(100, Math.round((goal.weeklyDone / goal.weeklyGoal) * 100) || 0);
    const monthlyRate = Math.min(100, Math.round((goal.monthlyDone / goal.monthlyGoal) * 100) || 0);

    weeklyBar.style.width = `${weeklyRate}%`;
    monthlyBar.style.width = `${monthlyRate}%`;
    weeklyText.textContent = `${weeklyRate}%`;
    monthlyText.textContent = `${monthlyRate}%`;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const goal = {
      weeklyGoal: Number(qs("#weeklyGoal").value),
      monthlyGoal: Number(qs("#monthlyGoal").value),
      weeklyDone: Number(qs("#weeklyDone").value),
      monthlyDone: Number(qs("#monthlyDone").value)
    };
    writeGoal(goal);
    render();
  });

  render();
}

function initRecommendations() {
  const form = qs("#recommendForm");
  const output = qs("#recommendOutput");
  if (!form || !output) return;

  const buildRecommendation = (level, hours, style) => {
    let warmup;
    let deep;
    let review;

    if (level === "초급") {
      warmup = "핵심 개념 20분 복습";
      deep = "기초 예제 40분 따라 풀기";
      review = "오답 노트 20분 정리";
    } else if (level === "중급") {
      warmup = "핵심 개념 15분 스캔";
      deep = "실전 문제 60분 집중 풀이";
      review = "헷갈린 개념 25분 보강";
    } else {
      warmup = "고난도 개념 15분 체크";
      deep = "심화 문제 70분 풀이 + 해설 분석";
      review = "약점 주제 30분 정밀 복습";
    }

    const styleTip =
      style === "문제풀이"
        ? "문제풀이 비중을 70% 이상으로 유지하세요."
        : style === "이론학습"
          ? "개념 요약 노트를 직접 작성해 이해도를 높이세요."
          : "개념 40% + 문제풀이 60%로 혼합 루틴을 추천합니다.";

    return [
      `추천 루틴 (${hours}시간 기준)`,
      `1) ${warmup}`,
      `2) ${deep}`,
      `3) ${review}`,
      `추가 팁: ${styleTip}`
    ].join("\n");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const level = qs("#level").value;
    const hours = Number(qs("#availableHours").value);
    const style = qs("#style").value;

    output.textContent = buildRecommendation(level, hours, style);
  });
}

setTodayCard();
initPlanner();
initGoals();
initRecommendations();
