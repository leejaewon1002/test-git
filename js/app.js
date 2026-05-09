const quotes = [
  "작은 진전이 쌓이면 큰 실력이 됩니다.",
  "완벽한 하루보다 꾸준한 하루가 더 강합니다.",
  "어제의 나보다 1%만 성장해도 충분합니다.",
  "계획은 부담이 아니라 집중을 돕는 지도입니다."
];

const qs = (selector) => document.querySelector(selector);

const SUBJECT_TAG_COLORS = {
  수학: "#e67e22",
  영어: "#1f8f8b",
  코딩: "#2d6cdf",
  과학: "#8f5ccf",
  기타: "#6b7f8f"
};

const CUSTOM_TAGS_STORAGE = "ai-study-custom-tags";

const getCustomTags = () => JSON.parse(localStorage.getItem(CUSTOM_TAGS_STORAGE) || "[]");
const saveCustomTags = (tags) => localStorage.setItem(CUSTOM_TAGS_STORAGE, JSON.stringify(tags));

const generateColorForTag = (tagName) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i += 1) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 55%)`;
};

const getTagColor = (tag) => SUBJECT_TAG_COLORS[tag] || generateColorForTag(tag);

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
  const filterPriority = qs("#filterPriority");
  const filterTag = qs("#filterTag");
  const filterDate = qs("#filterDate");
  const calendarGrid = qs("#calendarGrid");
  const calendarMonth = qs("#calendarMonth");
  const prevMonthBtn = qs("#prevMonth");
  const nextMonthBtn = qs("#nextMonth");
  if (
    !form ||
    !list ||
    !clearBtn ||
    !filterPriority ||
    !filterTag ||
    !filterDate ||
    !calendarGrid ||
    !calendarMonth ||
    !prevMonthBtn ||
    !nextMonthBtn
  ) {
    return;
  }

  const STORAGE_KEY = "ai-study-planner-items";

  const viewDate = new Date();

  const normalizeTag = (tag) => (SUBJECT_TAG_COLORS[tag] ? tag : "기타");
  const normalizePriority = (priority) => {
    if (["높음", "중간", "낮음"].includes(priority)) return priority;
    return "중간";
  };
  const normalizeDate = (studyDate) => {
    if (typeof studyDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(studyDate)) return studyDate;
    return "";
  };
  const normalizeHours = (hours) => {
    const num = Number(hours);
    if (!Number.isFinite(num) || num < 1) return 1;
    return Math.min(12, Math.round(num));
  };
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const readItems = () => {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];

    return raw.map((item) => ({
      id: item.id || createId(),
      subject: typeof item.subject === "string" && item.subject.trim() ? item.subject.trim() : "이름 없는 과목",
      subjectTag: normalizeTag(item.subjectTag || item.tag || "기타"),
      studyDate: normalizeDate(item.studyDate),
      hours: normalizeHours(item.hours),
      priority: normalizePriority(item.priority)
    }));
  };

  const writeItems = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  const formatDisplayDate = (yyyyMMdd) => {
    if (!yyyyMMdd) return "날짜 미지정";
    const [year, month, day] = yyyyMMdd.split("-").map(Number);
    if (!year || !month || !day) return yyyyMMdd;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  const applyFilters = (items) => {
    return items.filter((item) => {
      const passPriority =
        filterPriority.value === "전체" ? true : item.priority === filterPriority.value;
      const passTag = filterTag.value === "전체" ? true : item.subjectTag === filterTag.value;
      const passDate = filterDate.value ? item.studyDate === filterDate.value : true;
      return passPriority && passTag && passDate;
    });
  };

  const createBadge = (item) => {
    const badge = document.createElement("span");
    badge.className = "tag-badge";
    badge.textContent = item.subjectTag;
    badge.style.backgroundColor = SUBJECT_TAG_COLORS[item.subjectTag] || SUBJECT_TAG_COLORS.기타;
    return badge;
  };

  const renderCalendar = (items) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const totalDays = monthEnd.getDate();
    const startWeekday = monthStart.getDay();

    calendarMonth.textContent = `${year}년 ${month + 1}월`;
    calendarGrid.innerHTML = "";

    const daySummary = items.reduce((acc, item) => {
      if (!item.studyDate) return acc;
      const [y, m] = item.studyDate.split("-").map(Number);
      if (y !== year || m !== month + 1) return acc;

      if (!acc[item.studyDate]) {
        acc[item.studyDate] = { totalHours: 0, count: 0 };
      }
      acc[item.studyDate].totalHours += Number(item.hours);
      acc[item.studyDate].count += 1;
      return acc;
    }, {});

    for (let i = 0; i < startWeekday; i += 1) {
      const empty = document.createElement("div");
      empty.className = "calendar-cell calendar-empty";
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const summary = daySummary[dateKey];

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "calendar-cell";
      if (filterDate.value && filterDate.value === dateKey) {
        cell.classList.add("calendar-selected");
      }

      const dayLabel = document.createElement("span");
      dayLabel.className = "calendar-day";
      dayLabel.textContent = String(day);
      cell.appendChild(dayLabel);

      if (summary) {
        const note = document.createElement("span");
        note.className = "calendar-note";
        note.textContent = `${summary.totalHours}h / ${summary.count}개`;
        cell.appendChild(note);
        cell.classList.add("calendar-has-plan");
      }

      cell.addEventListener("click", () => {
        filterDate.value = filterDate.value === dateKey ? "" : dateKey;
        render();
      });

      calendarGrid.appendChild(cell);
    }
  };

  const render = () => {
    const items = readItems();
    const filteredItems = applyFilters(items);
    list.innerHTML = "";

    if (filteredItems.length === 0) {
      list.innerHTML = '<li class="item-meta">아직 등록된 학습 일정이 없습니다.</li>';
      renderCalendar(items);
      return;
    }

    const selectedDate = filterDate.value;
    filteredItems.forEach((item) => {
      const li = document.createElement("li");
      li.className = "list-item";
      if (selectedDate && item.studyDate === selectedDate) {
        li.classList.add("highlight-pulse");
      }

      const infoWrap = document.createElement("div");
      const subjectRow = document.createElement("p");
      subjectRow.className = "list-item-title";

      const subjectTitle = document.createElement("strong");
      subjectTitle.textContent = item.subject;
      subjectRow.appendChild(subjectTitle);
      subjectRow.appendChild(createBadge(item));

      const meta = document.createElement("div");
      meta.className = "item-meta";
      meta.textContent = `${formatDisplayDate(item.studyDate)} | ${item.hours}시간 | 우선순위 ${item.priority}`;

      infoWrap.appendChild(subjectRow);
      infoWrap.appendChild(meta);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-ghost";
      removeBtn.dataset.removeId = item.id;
      removeBtn.textContent = "삭제";

      li.appendChild(infoWrap);
      li.appendChild(removeBtn);
      list.appendChild(li);
    });

    renderCalendar(items);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const subject = qs("#subject").value.trim();
    const subjectTag = qs("#subjectTag").value;
    const studyDate = qs("#studyDate").value;
    const hours = qs("#hours").value;
    const priority = qs("#priority").value;

    if (!subject || !studyDate || !hours) return;

    const items = readItems();
    items.push({
      id: createId(),
      subject,
      subjectTag: normalizeTag(subjectTag),
      studyDate: normalizeDate(studyDate),
      hours: normalizeHours(hours),
      priority: normalizePriority(priority)
    });
    writeItems(items);
    form.reset();
    qs("#hours").value = 2;
    qs("#priority").value = "중간";
    qs("#subjectTag").value = "수학";
    render();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove-id]");
    if (!button) return;

    const removeId = String(button.dataset.removeId || "");
    const remained = readItems().filter((item) => item.id !== removeId);
    writeItems(remained);
    render();
  });

  clearBtn.addEventListener("click", () => {
    writeItems([]);
    render();
  });

  filterPriority.addEventListener("change", render);
  filterTag.addEventListener("change", render);
  filterDate.addEventListener("change", render);

  prevMonthBtn.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    render();
  });

  nextMonthBtn.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    render();
  });

  const customTagInput = qs("#customTagInput");
  const addCustomTagBtn = qs("#addCustomTag");
  const customTagList = qs("#customTagList");
  const tagSelectNode = qs("#subjectTag");
  const filterTagSelectNode = qs("#filterTag");

  if (customTagInput && addCustomTagBtn && customTagList) {
    const renderCustomTags = () => {
      customTagList.innerHTML = "";
      const tags = getCustomTags();
      tags.forEach((tag) => {
        const tagItem = document.createElement("span");
        tagItem.className = "custom-tag-item";
        tagItem.style.backgroundColor = generateColorForTag(tag) + "26";
        tagItem.style.borderColor = generateColorForTag(tag);
        tagItem.innerHTML = `
          ${tag}
          <span class="custom-tag-remove" data-remove-tag="${tag}">×</span>
        `;
        customTagList.appendChild(tagItem);
      });
    };

    const syncTagSelects = () => {
      const tags = getCustomTags();
      const allTags = ["전체", "수학", "영어", "코딩", "과학", "기타", ...tags];
      
      const currentValue = tagSelectNode.value;
      tagSelectNode.innerHTML = allTags
        .filter((t, i, arr) => arr.indexOf(t) === i)
        .map((tag) => `<option value="${tag}">${tag}</option>`)
        .join("");
      tagSelectNode.value = currentValue;

      const currentFilterValue = filterTagSelectNode.value;
      filterTagSelectNode.innerHTML = allTags
        .filter((t, i, arr) => arr.indexOf(t) === i)
        .map((tag) => `<option value="${tag}">${tag}</option>`)
        .join("");
      filterTagSelectNode.value = currentFilterValue;
    };

    addCustomTagBtn.addEventListener("click", () => {
      const newTag = customTagInput.value.trim();
      if (!newTag || newTag.length === 0) return;

      const tags = getCustomTags();
      if (!tags.includes(newTag)) {
        tags.push(newTag);
        saveCustomTags(tags);
        syncTagSelects();
        renderCustomTags();
      }
      customTagInput.value = "";
    });

    customTagInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addCustomTagBtn.click();
      }
    });

    customTagList.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".custom-tag-remove");
      if (!removeBtn) return;

      const tagToRemove = removeBtn.dataset.removeTag;
      const tags = getCustomTags().filter((t) => t !== tagToRemove);
      saveCustomTags(tags);
      syncTagSelects();
      renderCustomTags();
    });

    renderCustomTags();
    syncTagSelects();
  }

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
    let warmup = "핵심 개념 리마인드";
    let deep = "집중 문제 풀이";
    let review = "복습 및 오답 정리";

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

    const startHour = 19;
    const totalMinutes = Math.max(60, Math.min(12 * 60, hours * 60));
    const planRatios = [0.2, 0.55, 0.25];
    const durations = planRatios.map((ratio) => Math.max(20, Math.round(totalMinutes * ratio)));
    const diff = totalMinutes - durations.reduce((acc, cur) => acc + cur, 0);
    durations[1] += diff;

    const makeSlot = (index, title, focus) => {
      const prevMins = durations.slice(0, index).reduce((acc, cur) => acc + cur, 0);
      const slotStart = new Date(2026, 0, 1, startHour, prevMins);
      const slotEnd = new Date(slotStart.getTime() + durations[index] * 60000);
      const formatTime = (date) =>
        `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      return {
        time: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
        title,
        focus
      };
    };

    const slots = [
      makeSlot(0, "워밍업", warmup),
      makeSlot(1, "집중 학습", deep),
      makeSlot(2, "정리", review)
    ];

    return {
      title: `추천 루틴 (${hours}시간 기준)`,
      styleTip,
      slots
    };
  };

  let draggedCardIndex = null;

  const renderRecommendationCards = (recommendation) => {
    output.innerHTML = "";

    const title = document.createElement("h3");
    title.className = "recommend-title";
    title.textContent = recommendation.title;

    const table = document.createElement("div");
    table.className = "recommend-timetable";

    recommendation.slots.forEach((slot, index) => {
      const card = document.createElement("article");
      card.className = "recommend-card";
      card.draggable = true;
      card.dataset.index = index;

      const time = document.createElement("p");
      time.className = "recommend-time";
      time.textContent = slot.time;

      const slotTitle = document.createElement("h4");
      slotTitle.className = "recommend-slot-title";
      slotTitle.textContent = slot.title;

      const focus = document.createElement("p");
      focus.className = "recommend-focus";
      focus.textContent = slot.focus;

      card.appendChild(time);
      card.appendChild(slotTitle);
      card.appendChild(focus);

      card.addEventListener("dragstart", (e) => {
        draggedCardIndex = index;
        card.classList.add("dragging");
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document.querySelectorAll(".recommend-card").forEach((c) => {
          c.classList.remove("drag-over");
        });
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        card.classList.add("drag-over");
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        const targetIndex = Number(card.dataset.index);
        if (draggedCardIndex !== null && draggedCardIndex !== targetIndex) {
          const newSlots = [...recommendation.slots];
          const draggedSlot = newSlots[draggedCardIndex];
          newSlots.splice(draggedCardIndex, 1);
          newSlots.splice(targetIndex, 0, draggedSlot);
          recommendation.slots = newSlots;
          recommendation = { ...recommendation, slots: newSlots };
          renderRecommendationCards(recommendation);
        }
      });

      table.appendChild(card);
    });

    const tip = document.createElement("p");
    tip.className = "recommend-tip";
    tip.textContent = `추가 팁: ${recommendation.styleTip}`;

    output.appendChild(title);
    output.appendChild(table);
    output.appendChild(tip);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const level = qs("#level").value;
    const hours = Number(qs("#availableHours").value);
    const style = qs("#style").value;

    const recommendation = buildRecommendation(level, hours, style);
    renderRecommendationCards(recommendation);
  });
}

setTodayCard();
initPlanner();
initGoals();
initRecommendations();
