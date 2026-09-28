function updateCountdown() {
  const target = new Date(2026, 9, 6);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.ceil((target - today) / 86400000);
  const el = document.getElementById("countdown");
  if (diff > 0) {
    el.textContent = `${diff} ${diff === 1 ? "DAY" : "DAYS"} UNTIL DEPARTURE`;
    el.style.display = "block";
  } else {
    el.style.display = "none";
  }
}
updateCountdown();
setInterval(updateCountdown, 60 * 60 * 1000);

const sections = [
  {
    title: "🇺🇦 Київ → 🇭🇺 Будапешт",
    date: "6 жовтня",
    items: ["Квитки на потяг Київ → Будапешт"]
  },
  {
    title: "🇭🇺 Будапешт",
    date: "7 → 8 жовтня",
    items: ["Готель у Будапешті на ніч 7 → 8 жовтня"]
  },
  {
    title: "🇭🇺 Будапешт → 🇬🇧 Лондон",
    date: "8 жовтня",
    items: ["Квитки на літак Будапешт → Лондон"]
  },
  {
    title: "🇬🇧 Лондон → 🇬🇧 Ньюарк",
    date: "8 жовтня",
    items: ["Квитки на потяг Лондон → Ньюарк", "Готель у Ньюарку на 8 → 10 жовтня"]
  },
  {
    title: "🇬🇧 Ньюарк → Лондон",
    date: "10 жовтня",
    items: ["Квитки на потяг Ньюарк → Лондон", "Готель у Лондоні на 10 → 14 жовтня"]
  },
  {
    key: "lon-bud",
    editable: true,
    title: "🇬🇧 Лондон → 🇭🇺 Будапешт",
    date: "14 жовтня",
    items: ["Квитки на літак Лондон → Будапешт"]
  },
  {
    key: "bud-kyiv",
    editable: true,
    title: "🇭🇺 Будапешт → 🇺🇦 Київ",
    date: "14 жовтня",
    items: ["Квитки на потяг Будапешт → Київ"]
  }
];

const root = document.getElementById("sections");
const saved = JSON.parse(localStorage.getItem("tripChecklist2026") || "{}");

// Edits and removals for editable sections: { edits: {key: {title, date, items}}, removed: [key] }
const TRIP_EDITS_KEY = "tripSectionEdits2026";
function loadTripEdits() {
  try {
    const t = JSON.parse(localStorage.getItem(TRIP_EDITS_KEY) || "{}");
    return { edits: t.edits || {}, removed: t.removed || [] };
  } catch (e) {
    return { edits: {}, removed: [] };
  }
}
let tripEdits = loadTripEdits();
function saveTripEdits() {
  try { localStorage.setItem(TRIP_EDITS_KEY, JSON.stringify(tripEdits)); } catch (e) {}
}

function renderTrip() {
  root.innerHTML = "";
  let idx = 0;
  sections.forEach(original => {
    // Keep item ids stable even when a section is removed.
    const firstIdx = idx;
    idx += original.items.length;
    if (original.editable && tripEdits.removed.includes(original.key)) return;
    const section = { ...original, ...(original.editable ? tripEdits.edits[original.key] : null) };

    const div = document.createElement("div");
    div.className = "section";
    const h2 = document.createElement("h2");
    h2.textContent = section.title;
    const date = document.createElement("div");
    date.className = "date";
    date.textContent = section.date;
    div.append(h2, date);

    const textSpans = [];
    section.items.forEach((item, i) => {
      const id = "item-" + (firstIdx + i);
      const label = document.createElement("label");
      const expenseId = id + "-expense";
      const noExpense = item === "Готель у Лондоні на 10 → 14 жовтня";
      label.innerHTML = `<input type="checkbox" id="${id}"><span></span>` +
        (noExpense ? "" : ` <span class="expense-wrap"><input type="checkbox" id="${expenseId}" class="expense-check"><span class="expense-label">expense report filed</span></span>`);
      const textSpan = label.querySelector(":scope > span");
      textSpan.textContent = item;
      textSpans.push(textSpan);
      const checkbox = label.querySelector(`#${id}`);
      checkbox.checked = !!saved[id];
      if (checkbox.checked) textSpan.classList.add("done");
      checkbox.addEventListener("change", () => {
        saved[id] = checkbox.checked;
        localStorage.setItem("tripChecklist2026", JSON.stringify(saved));
        textSpan.classList.toggle("done", checkbox.checked);
        updateProgress();
      });
      // While editing, a click on the text must not toggle the checkbox.
      label.addEventListener("click", e => {
        if (div.classList.contains("editing")) e.preventDefault();
      });

      if (!noExpense) {
        const expenseCheckbox = label.querySelector(`#${expenseId}`);
        expenseCheckbox.checked = !!saved[expenseId];
        expenseCheckbox.addEventListener("change", () => {
          saved[expenseId] = expenseCheckbox.checked;
          localStorage.setItem("tripChecklist2026", JSON.stringify(saved));
        });
      }
      div.appendChild(label);
    });

    if (original.editable) {
      const tools = document.createElement("span");
      tools.className = "section-tools";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.textContent = "✎";
      editBtn.title = "Редагувати";
      editBtn.setAttribute("aria-label", `Редагувати «${section.title}»`);
      const rmBtn = document.createElement("button");
      rmBtn.type = "button";
      rmBtn.className = "icon-btn remove-btn";
      rmBtn.textContent = "×";
      rmBtn.title = "Видалити етап";
      rmBtn.setAttribute("aria-label", `Видалити «${section.title}»`);
      tools.append(editBtn, rmBtn);
      div.insertBefore(tools, h2);

      const fields = [h2, date, ...textSpans];
      const finishEdit = () => {
        tripEdits.edits[original.key] = {
          title: h2.textContent.trim() || original.title,
          date: date.textContent.trim(),
          items: textSpans.map((s, i) => s.textContent.trim() || original.items[i])
        };
        saveTripEdits();
        renderTrip();
      };
      editBtn.addEventListener("click", () => {
        if (div.classList.contains("editing")) return finishEdit();
        div.classList.add("editing");
        fields.forEach(f => f.contentEditable = "true");
        editBtn.textContent = "✓";
        editBtn.title = "Зберегти";
        h2.focus();
      });
      fields.forEach(f => f.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); finishEdit(); }
        if (e.key === "Escape") renderTrip();
      }));
      rmBtn.addEventListener("click", () => {
        if (!confirm(`Видалити етап «${section.title}»?`)) return;
        tripEdits.removed.push(original.key);
        saveTripEdits();
        renderTrip();
      });
    }
    root.appendChild(div);
  });

  document.getElementById("restoreTrip").style.display = tripEdits.removed.length ? "" : "none";
  updateProgress();
}

function restoreTrip() {
  tripEdits.removed = [];
  saveTripEdits();
  renderTrip();
}

function updateProgress() {
  const boxes = [...document.querySelectorAll('#sections input[type="checkbox"]')];
  const done = boxes.filter(x => x.checked).length;
  document.getElementById("count").textContent = done;
  document.getElementById("total").textContent = boxes.length;
  document.getElementById("fill").style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
}
function resetAll() {
  document.querySelectorAll('#sections input[type="checkbox"]').forEach(x => {
    x.checked = false;
    const span = x.closest("label").querySelector(":scope > span");
    if (span) span.classList.remove("done");
  });
  localStorage.removeItem("tripChecklist2026");
  updateProgress();
}
renderTrip();

/* ---------- Packing checklist ---------- */
const PACK_KEY = "tripPacking2026";
const packDefaults = [
  { id: "docs", title: "📄 Документи", items: [
    "Закордонний паспорт",
    "Документи для в'їзду до Великої Британії",
    "Медична страховка",
    "Роздруковані / збережені офлайн квитки",
    "Підтвердження бронювань готелів",
    "Копії документів (фото в телефоні)"
  ]},
  { id: "money", title: "💳 Гроші", items: [
    "Банківська картка",
    "Трохи готівки у фунтах"
  ]},
  { id: "tech", title: "🔌 Електроніка", items: [
    "Телефон і зарядка",
    "Павербанк",
    "Перехідник для британських розеток (тип G)",
    "Ноутбук і зарядка",
    "Фотік",
    "Навушники"
  ]},
  { id: "clothes", title: "👕 Одяг", items: [
    "Halloween costume",
    "Куртка від дощу",
    "Теплий светр / худі",
    "Зручне взуття для ходьби",
    "Білизна і шкарпетки",
    "Тапки для душа",
    "Футболки",
    "Штани / джинси",
    "Одяг для сну",
    "Парасолька"
  ]},
  { id: "care", title: "🧴 Гігієна", items: [
    "Зубна щітка і паста",
    "Дезодорант",
    "Косметика (рідини більше 100 мл тільки в багаж)",
    "Гребінець",
    "Пінцет і манікюрні ножиці (тільки в багаж)"
  ]},
  { id: "health", title: "💊 Аптечка", items: [
    "Особисті ліки (антигістамінні, активоване вугілля)",
    "Знеболювальне",
    "Пластирі"
  ]},
  { id: "road", title: "🚆 В дорогу (потяг)", items: [
    "Вода і перекус",
    "Подушка для шиї",
    "Вологі серветки, антисептик",
    "Щось почитати / серіали офлайн"
  ]}
];

function loadPack() {
  try {
    const p = JSON.parse(localStorage.getItem(PACK_KEY) || "{}");
    return { checked: p.checked || {}, custom: p.custom || [], removed: p.removed || [] };
  } catch (e) {
    return { checked: {}, custom: [], removed: [] };
  }
}
let pack = loadPack();
function savePack() {
  try { localStorage.setItem(PACK_KEY, JSON.stringify(pack)); } catch (e) {}
}

function packItems() {
  // Returns categories with their visible items: [{id, title, items:[{key, text, custom}]}]
  return packDefaults.map(cat => {
    const base = cat.items
      .map((text, i) => ({ key: `${cat.id}-${i}`, text, custom: false }))
      .filter(it => !pack.removed.includes(it.key));
    const extra = pack.custom
      .filter(c => c.cat === cat.id)
      .map(c => ({ key: c.key, text: c.text, custom: true }));
    return { ...cat, items: [...base, ...extra] };
  });
}

function renderPacking() {
  const root = document.getElementById("packSections");
  root.innerHTML = "";
  packItems().forEach(cat => {
    const div = document.createElement("div");
    div.className = "section";
    div.innerHTML = `<h2>${cat.title}</h2>`;
    cat.items.forEach(it => {
      const label = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!pack.checked[it.key];
      const span = document.createElement("span");
      span.className = "item-text" + (cb.checked ? " done" : "");
      span.textContent = it.text;
      cb.addEventListener("change", () => {
        pack.checked[it.key] = cb.checked;
        span.classList.toggle("done", cb.checked);
        savePack();
        updatePackProgress();
      });
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove-btn";
      rm.title = "Прибрати зі списку";
      rm.setAttribute("aria-label", `Прибрати «${it.text}»`);
      rm.textContent = "×";
      rm.addEventListener("click", e => {
        e.preventDefault();
        if (it.custom) pack.custom = pack.custom.filter(c => c.key !== it.key);
        else pack.removed.push(it.key);
        delete pack.checked[it.key];
        savePack();
        renderPacking();
      });
      label.append(cb, span, rm);
      div.appendChild(label);
    });
    root.appendChild(div);
  });
  updatePackProgress();
}

function updatePackProgress() {
  const boxes = [...document.querySelectorAll('#packSections input[type="checkbox"]')];
  const done = boxes.filter(x => x.checked).length;
  document.getElementById("packCount").textContent = done;
  document.getElementById("packTotal").textContent = boxes.length;
  document.getElementById("packFill").style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
}

function resetPacking() {
  pack.checked = {};
  savePack();
  renderPacking();
}

const catSelect = document.getElementById("newItemCat");
packDefaults.forEach(cat => {
  const opt = document.createElement("option");
  opt.value = cat.id;
  opt.textContent = cat.title;
  catSelect.appendChild(opt);
});
document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("newItem");
  const text = input.value.trim();
  if (!text) return;
  pack.custom.push({ key: "c-" + Date.now(), cat: catSelect.value, text });
  savePack();
  input.value = "";
  renderPacking();
});
renderPacking();

/* ---------- Calendar ---------- */
const CAL_KEY = "tripCalendar2026";
// Days from 6 to 15 October 2026, as "2026-10-06" ... "2026-10-15".
const calDays = Array.from({ length: 10 }, (_, i) => `2026-10-${String(6 + i).padStart(2, "0")}`);
// The return date can change, so the user can remove the days from 12 October.
const FIRST_REMOVABLE_DAY = "2026-10-12";

// Known travel times. The night train goes past midnight, so it has one part on each day.
// Times are local. 23:59 is the end of the day.
const calDefaults = [
  { id: "d-train-kyiv-1", day: "2026-10-06", start: "10:18", end: "23:59", text: "🚆 Відправлення потяга, Київ" },
  { id: "d-train-kyiv-2", day: "2026-10-07", start: "00:00", end: "06:00", text: "🚆 Прибуття в Будапешт" },
  { id: "d-plane-bud-lon", day: "2026-10-08", start: "09:35", end: "11:10", text: "✈️ Літак Будапешт → Лондон" }
];

function loadCal() {
  let c = {};
  try { c = JSON.parse(localStorage.getItem(CAL_KEY) || "{}"); } catch (e) {}
  const cal = { events: c.events || [], removed: c.removed || [], removedDays: c.removedDays || [] };
  // Add each known event once. An event that the user removed does not come back.
  calDefaults.forEach(d => {
    if (!cal.removed.includes(d.id) && !cal.events.some(ev => ev.id === d.id)) cal.events.push({ ...d });
  });
  return cal;
}
let cal = loadCal();
function saveCal() {
  try { localStorage.setItem(CAL_KEY, JSON.stringify(cal)); } catch (e) {}
}

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function dayLabel(day) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "long" });
}

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

// Makes the start, end, and text fields. Used by the add form and by the edit form.
function eventFields(ev) {
  const start = document.createElement("input");
  start.type = "time";
  start.required = true;
  start.value = ev ? ev.start : "";
  start.setAttribute("aria-label", "Початок");
  const end = document.createElement("input");
  end.type = "time";
  end.required = true;
  end.value = ev ? ev.end : "";
  end.setAttribute("aria-label", "Кінець");
  const text = document.createElement("input");
  text.type = "text";
  text.required = true;
  text.pattern = ".*\\S.*";
  text.placeholder = "Що плануємо…";
  text.autocomplete = "off";
  text.value = ev ? ev.text : "";
  text.setAttribute("aria-label", "Активність");
  // The end time must be later than the start time.
  const checkOrder = () => end.setCustomValidity(
    start.value && end.value && toMinutes(end.value) <= toMinutes(start.value) ? "Кінець має бути пізніше за початок" : ""
  );
  start.addEventListener("input", checkOrder);
  end.addEventListener("input", checkOrder);
  return { start, end, text };
}

function renderCalendar() {
  const root = document.getElementById("calDays");
  // Keep the horizontal scroll position when the days are drawn again.
  const scrollLeft = root.scrollLeft;
  root.innerHTML = "";
  const today = todayKey();
  calDays.forEach(day => {
    // A removed day keeps its events, so they come back when the user restores the day.
    if (cal.removedDays.includes(day)) return;
    const events = cal.events
      .filter(ev => ev.day === day)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end));

    const div = document.createElement("div");
    div.className = "section cal-day" + (day === today ? " today" : "");
    const h2 = document.createElement("h2");
    h2.textContent = dayLabel(day);
    if (day >= FIRST_REMOVABLE_DAY) {
      const rmDay = document.createElement("button");
      rmDay.type = "button";
      rmDay.className = "icon-btn remove-btn section-tools";
      rmDay.textContent = "×";
      rmDay.title = "Видалити день";
      rmDay.setAttribute("aria-label", `Видалити день «${h2.textContent}»`);
      rmDay.addEventListener("click", () => {
        if (!confirm(`Видалити день «${h2.textContent}»?`)) return;
        cal.removedDays.push(day);
        saveCal();
        renderCalendar();
      });
      div.appendChild(rmDay);
    }
    div.appendChild(h2);

    // A bar for the full day (00:00 to 24:00) that shows the reserved time.
    const timeline = document.createElement("div");
    timeline.className = "timeline";
    events.forEach(ev => {
      const block = document.createElement("div");
      block.className = "block";
      block.style.left = toMinutes(ev.start) / 1440 * 100 + "%";
      block.style.width = (toMinutes(ev.end) - toMinutes(ev.start)) / 1440 * 100 + "%";
      block.title = `${ev.start}–${ev.end} ${ev.text}`;
      timeline.appendChild(block);
    });
    const ticks = document.createElement("div");
    ticks.className = "ticks";
    ticks.innerHTML = "<span>0</span><span>6</span><span>12</span><span>18</span><span>24</span>";
    div.append(timeline, ticks);

    events.forEach(ev => {
      const overlaps = events.some(o => o !== ev &&
        toMinutes(o.start) < toMinutes(ev.end) && toMinutes(ev.start) < toMinutes(o.end));
      const row = document.createElement("div");
      row.className = "cal-event" + (overlaps ? " overlap" : "");
      const time = document.createElement("span");
      time.className = "cal-time";
      time.textContent = `${ev.start}–${ev.end}`;
      const text = document.createElement("span");
      text.className = "item-text";
      text.textContent = ev.text;
      if (overlaps) text.title = "Час перетинається з іншою активністю";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.textContent = "✎";
      editBtn.title = "Редагувати";
      editBtn.setAttribute("aria-label", `Редагувати «${ev.text}»`);
      const rmBtn = document.createElement("button");
      rmBtn.type = "button";
      rmBtn.className = "icon-btn remove-btn";
      rmBtn.textContent = "×";
      rmBtn.title = "Видалити";
      rmBtn.setAttribute("aria-label", `Видалити «${ev.text}»`);
      row.append(time, text, editBtn, rmBtn);

      editBtn.addEventListener("click", () => {
        const f = eventFields(ev);
        const form = document.createElement("form");
        form.className = "cal-form";
        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = "✓";
        save.title = "Зберегти";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Скасувати";
        cancel.addEventListener("click", renderCalendar);
        form.append(f.start, f.end, f.text, save, cancel);
        form.addEventListener("submit", e => {
          e.preventDefault();
          Object.assign(ev, { start: f.start.value, end: f.end.value, text: f.text.value.trim() });
          saveCal();
          renderCalendar();
        });
        form.addEventListener("keydown", e => { if (e.key === "Escape") renderCalendar(); });
        row.replaceWith(form);
        f.text.focus();
      });
      rmBtn.addEventListener("click", () => {
        cal.events = cal.events.filter(o => o !== ev);
        if (calDefaults.some(d => d.id === ev.id)) cal.removed.push(ev.id);
        saveCal();
        renderCalendar();
      });
      div.appendChild(row);
    });

    const f = eventFields(null);
    const form = document.createElement("form");
    form.className = "cal-form";
    const add = document.createElement("button");
    add.type = "submit";
    add.textContent = "Додати";
    form.append(f.start, f.end, f.text, add);
    form.addEventListener("submit", e => {
      e.preventDefault();
      cal.events.push({ id: "e-" + Date.now(), day, start: f.start.value, end: f.end.value, text: f.text.value.trim() });
      saveCal();
      renderCalendar();
    });
    div.appendChild(form);
    root.appendChild(div);
  });

  root.scrollLeft = scrollLeft;
  document.getElementById("restoreDays").style.display = cal.removedDays.length ? "" : "none";
}

function restoreDays() {
  cal.removedDays = [];
  saveCal();
  renderCalendar();
}

// The PDF library is large, so the page loads it only when the user asks for a PDF.
const PDF_LIB = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js";
function loadPdfLib() {
  if (window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PDF_LIB;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function saveCalendarPdf() {
  const btn = document.getElementById("saveCalPdf");
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Готуємо PDF…";
  try {
    await loadPdfLib();
    // A light copy of the calendar without the buttons and forms.
    const page = document.createElement("div");
    page.className = "pdf-export";
    const title = document.createElement("h2");
    title.textContent = "📅 Календар";
    const days = document.getElementById("calDays").cloneNode(true);
    days.removeAttribute("id");
    days.className = "pdf-days";
    page.append(title, days);
    await html2pdf().set({
      margin: 8,
      filename: "calendar-october-2026.pdf",
      html2canvas: { scale: 2, backgroundColor: "#fff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      pagebreak: { avoid: ".cal-day" }
    }).from(page).save();
  } catch (e) {
    // Without the library (for example, offline), the browser print dialog can save a PDF.
    alert("Не вдалося створити PDF. Відкриваю друк — оберіть «Зберегти як PDF».");
    window.print();
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}
renderCalendar();

/* ---------- Tabs ---------- */
function showTab(name) {
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
  });
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + name));
  try { localStorage.setItem("tripActiveTab", name); } catch (e) {}
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
let startTab = "trip";
try { startTab = localStorage.getItem("tripActiveTab") || "trip"; } catch (e) {}
showTab(["packing", "calendar"].includes(startTab) ? startTab : "trip");
