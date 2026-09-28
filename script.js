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
showTab(startTab === "packing" ? "packing" : "trip");
