const state = { students: [], subjects: [], studentId: null, renderedStudentId: null, refreshing: false, submitting: false, version: 0 };
const byId = function (id) { return document.getElementById(id); };

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function selectedStudent() {
  return state.students.find(function (student) { return student.id === state.studentId; });
}

function updateGradeForm() {
  const ready = state.renderedStudentId !== null && state.renderedStudentId === state.studentId && !state.refreshing && !state.submitting;
  byId("add-grade").disabled = !ready;
  byId("subject").disabled = !ready;
  byId("grade").disabled = !ready;
}

function initials(name) {
  return name.split(" ").map(function (part) { return part[0]; }).slice(0, 2).join("");
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, Object.assign({ cache: "no-store" }, options || {}));
  } catch (error) {
    error.status = "Нет соединения";
    error.path = path;
    error.details = { message: "Сервер недоступен. Проверьте терминал и повторите запрос." };
    throw error;
  }
  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = { error: { message: "Сервер вернул ответ не в формате JSON. Проверьте терминал." } };
  }
  if (!response.ok) {
    const error = new Error("Ошибка запроса");
    error.status = response.status;
    error.path = path;
    error.details = data.error || { message: typeof data.detail === "string" ? data.detail : "Проверьте параметры запроса." };
    throw error;
  }
  return data;
}

function showError(container, error) {
  container.replaceChildren();
  container.hidden = false;

  const message = error.details?.message;
  let box;

  if (message === 'Нельзя поставить такую оценку.') {
    console.log('оценка баг');
    box = node('div', 'grade-error');
    const title = node('div', 'error-title', 'Ошибка внесения оценки');
    const textMessage = node('p', 'error-message', 'Нельзя поставить такую оценку (2, 3, 4, 5)');
    box.append(title, textMessage);
  } else {
    box = node('div', 'backend-error');

    const title = node('div', 'error-title', 'Бэкенд вернул ошибку');
    const textMessage = node('p', 'error-message', message || 'Неизвестная ошибка');

    const technical = node('div', 'error-technical');
    technical.append(
      node('code', '', `${error.status || ''} · ${error.details?.type || 'HTTP'}`),
      node('code', '', error.path || '')
    );

    if (error.details?.file) {
      technical.append(
        node('code', '', `${error.details.file}:${error.details.line || ''}`)
      );
    }

    box.append(title, textMessage, technical);
  }

  container.append(box);
}


function renderStudents() {
  const list = byId("students");
  list.replaceChildren();
  byId("student-count").textContent = state.students.length;
  state.students.forEach(function (student, index) {
    const button = node("button", "student-button" + (student.id === state.studentId ? " selected" : ""));
    button.type = "button";
    button.setAttribute("aria-pressed", String(student.id === state.studentId));
    button.append(node("span", "avatar avatar-" + index, initials(student.name)));
    const description = node("span", "student-description");
    description.append(node("span", "student-button-name", student.name));
    description.append(node("span", "student-meta", "Оценок в журнале: " + student.grades.length));
    button.append(description);
    button.addEventListener("click", function () {
      state.studentId = student.id;
      byId("grade-message").hidden = true;
      byId("grade-error").hidden = true;
      refresh();
    });
    list.append(button);
  });
}

function renderGrades(student) {
  byId("student-name").textContent = student.name;
  document.title = student.name + " — Перемена";
  const list = byId("grades-list");
  list.replaceChildren();
  state.subjects.forEach(function (subject) {
    const row = node("div", "subject-row");
    row.append(node("span", "subject-name", subject));
    const marks = node("div", "marks");
    const grades = student.grades.filter(function (grade) { return grade.subject === subject; });
    grades.forEach(function (grade) { marks.append(node("span", "mark mark-" + grade.value, grade.value)); });
    if (grades.length === 0) marks.append(node("span", "no-mark", "Пока без оценок"));
    row.append(marks);
    list.append(row);
  });
  const select = byId("subject");
  const previousSubject = select.value;
  select.replaceChildren();
  state.subjects.forEach(function (subject) {
    const option = node("option", "", subject);
    option.value = subject;
    select.append(option);
  });
  if (state.subjects.includes(previousSubject)) select.value = previousSubject;
  state.renderedStudentId = student.id;
  updateGradeForm();
}

function renderAverage(container, data) {
  container.replaceChildren();
  const number = data.average === null ? "—" : data.average.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const value = node("div", "metric-value");
  value.append(node("span", "metric-number", number), node("span", "metric-unit", "из 5"));
  container.append(value, node("p", "metric-description", data.count ? "По всем предметам. Оценок в расчёте: " + data.count + "." : "Добавьте первую оценку, чтобы посчитать среднее."));
  const dots = node("div", "grade-scale");
  for (let mark = 2; mark <= 5; mark++) {
    const item = node("span", "scale-item" + (data.average !== null && Math.round(data.average) === mark ? " active" : ""), mark);
    dots.append(item);
  }
  container.append(dots);
}

function renderAttendance(container, data) {
  container.replaceChildren();
  const value = node("div", "metric-value");
  value.append(node("span", "metric-number", data.percent === null ? "—" : data.percent.toLocaleString("ru-RU")));
  if (data.percent !== null) value.append(node("span", "metric-unit", "%"));
  container.append(value);
  container.append(node("p", "metric-description", data.total === 0 ? "Уроков ещё не было." : "Посещено " + data.present + " из " + data.total + " уроков."));
  const track = node("div", "attendance-track");
  const fill = node("div", "attendance-fill");
  fill.style.width = Math.max(0, Math.min(100, data.percent || 0)) + "%";
  track.append(fill);
  container.append(track);
}

function renderRanking(container, data) {
  container.replaceChildren();
  if (!data.students.length) {
    container.append(node("p", "empty-state", "В классе пока нет учеников."));
    return;
  }
  const list = node("ol", "ranking-list");
  data.students.forEach(function (student, index) {
    const row = node("li", "ranking-row" + (student.id === state.studentId ? " current" : ""));
    row.append(node("span", "rank-position rank-" + index, index + 1));
    const name = node("div", "rank-name");
    name.append(node("span", "", student.name));
    if (student.id === state.studentId) name.append(node("span", "rank-current", "Открыт этот дневник"));
    row.append(name);
    const count = node("div", "rank-count");
    count.append(node("strong", "", student.fives), node("span", "", "пятёрок"));
    row.append(count);
    list.append(row);
  });
  container.append(list);
}

function renderHomework(container, data) {
  container.replaceChildren();
  if (!data.assignments.length) {
    container.append(node("div", "empty-symbol", "✓"), node("h3", "empty-title", "Всё сделано"), node("p", "empty-state", "Невыполненных домашних заданий нет."));
    return;
  }
  const list = node("ul", "homework-list");
  data.assignments.forEach(function (assignment) {
    const row = node("li", "homework-row");
    row.append(node("span", "homework-check" + (assignment.done ? " done" : ""), assignment.done ? "✓" : ""));
    const content = node("div", "homework-description");
    content.append(node("span", "homework-subject", assignment.subject), node("h3", "", assignment.title), node("span", "homework-due", assignment.due));
    if (assignment.done) content.append(node("span", "done-label", "Выполнено"));
    row.append(content);
    list.append(row);
  });
  container.append(list);
}

function renderSchedule(container, data) {
  container.replaceChildren();
  if (!data.lessons.length) {
    container.append(node("p", "empty-state", "На этот день уроков нет."));
    return;
  }
  const list = node("ol", "schedule-list");
  data.lessons.forEach(function (lesson, index) {
    const row = node("li", "lesson-row");
    row.append(node("span", "lesson-number", index + 1), node("span", "lesson-time", lesson.time), node("span", "lesson-subject", lesson.subject), node("span", "lesson-room", "Каб. " + lesson.room));
    list.append(row);
  });
  container.append(list);
}

async function loadSection(id, path, render, version) {
  const container = byId(id);
  container.replaceChildren(node("p", "loading-text", "Загружаем…"));
  try {
    const data = await request(path);
    if (version !== state.version) return;
    render(container, data);
  } catch (error) {
    if (version !== state.version) return;
    showError(container, error);
  }
}

async function refresh() {
  const version = ++state.version;
  state.refreshing = true;
  updateGradeForm();
  byId("refresh").disabled = true;
  byId("global-error").hidden = true;
  try {
    const data = await request("/api/students");
    if (version !== state.version) return;
    state.students = data.students;
    state.subjects = data.subjects;
    if (!selectedStudent()) state.studentId = state.students.length ? state.students[0].id : null;
    renderStudents();
    const student = selectedStudent();
    if (!student) {
      byId("student-name").textContent = "В классе пока нет учеников";
      state.renderedStudentId = null;
      byId("grades-list").replaceChildren();
      ["average-content", "attendance-content", "ranking-content", "homework-content", "schedule-content"].forEach(function (id) {
        byId(id).replaceChildren(node("p", "empty-state", "Добавьте учеников в JSON-файл."));
      });
      return;
    }
    renderGrades(student);
    await Promise.all([
      loadSection("average-content", "/api/average/" + student.id, renderAverage, version),
      loadSection("attendance-content", "/api/attendance/" + student.id, renderAttendance, version),
      loadSection("ranking-content", "/api/ranking", renderRanking, version),
      loadSection("homework-content", "/api/homework/" + student.id, renderHomework, version),
      loadSection("schedule-content", "/api/schedule?day=" + byId("day").value, renderSchedule, version)
    ]);
  } catch (error) {
    if (version === state.version) showError(byId("global-error"), error);
  } finally {
    if (version === state.version) {
      state.refreshing = false;
      byId("refresh").disabled = false;
      updateGradeForm();
    }
  }
}

byId("refresh").addEventListener("click", refresh);
byId("day").addEventListener("change", refresh);

byId("grade-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  if (state.refreshing || state.submitting || state.renderedStudentId === null || state.renderedStudentId !== state.studentId) return;
  const enteredGrade = byId("grade").value;
  const numericGrade = Number(enteredGrade);
  const value = enteredGrade.trim() !== "" && Number.isFinite(numericGrade) ? numericGrade : enteredGrade;
  const payload = { student_id: state.renderedStudentId, subject: byId("subject").value, value: value };
  state.submitting = true;
  updateGradeForm();
  // console.log(payload)
  const button = byId("add-grade");
  button.textContent = "Добавляем…";
  byId("grade-error").hidden = true;
  byId("grade-message").hidden = true;
  try {
    await request("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (state.studentId === payload.student_id) {
      byId("grade-message").textContent = "Оценка добавлена.";
      byId("grade-message").hidden = false;
    }
    await refresh();
  } catch (error) {
    showError(byId("grade-error"), error);
  } finally {
    state.submitting = false;
    updateGradeForm();
    button.textContent = "Добавить оценку";
  }
});

window.addEventListener("pageshow", function (event) {
  if (event.persisted) window.location.reload();
});

if (sessionStorage.getItem("diary_unlocked") === "1") {
  document.body.hidden = false;
  refresh();
} else {
  window.location.replace("/login");
}
