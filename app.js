(() => {
  const D = window.PORTAL_DATA;
  const app = document.getElementById("app");
  const nav = document.getElementById("sidebar-nav");
  const crumbs = document.getElementById("crumbs");
  const globalSearch = document.getElementById("global-search");

  // ---------- Словники ----------
  const TYPES = {
    R: { name: "Регулярний", plural: "Регулярні", color: "var(--primary)" },
    S: { name: "Стихійний", plural: "Стихійні", color: "var(--secondary)" },
    M: { name: "Змішаний", plural: "Змішані", color: "var(--accent)" },
    N: { name: "Не застосовується", plural: "Не застосовується", color: "var(--ink-50)" },
  };
  const TYPE_ORDER = ["R", "S", "M", "N"];
  const STATUS = {
    ok: "Оновлений",
    stale: "Застарілий",
    broken: "Посилання не працює",
    unknown: "Не перевірено",
  };
  const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
  const SOON_DAYS = 90;

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    files: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    door: '<path d="M4 21h16"/><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><circle cx="14.5" cy="12" r=".8"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    scale: '<path d="M12 3v18M7 21h10"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.2-9.4A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 9.2 4.3C19.5 15.4 12 20 12 20z"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    drive: '<path d="M8 3h8l6 10-4 7H6l-4-7z"/><path d="M8 3l6 10H2"/><path d="m16 3-6 10 4 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  };
  const icon = (name, cls = "i") => `<svg viewBox="0 0 24 24" class="${cls}">${ICONS[name] || ""}</svg>`;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Дати ----------
  const today = new Date(D.today + "T00:00:00");
  const daysLeft = (iso) => (iso ? Math.round((new Date(iso + "T00:00:00") - today) / 86400000) : null);
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  };
  const deadlineState = (doc) => {
    const d = daysLeft(doc.due);
    if (d === null) return { cls: "d-none", text: "Строк уточнюється", d };
    if (d < 0) return { cls: "d-overdue", text: `Прострочено на ${-d} ${plural(-d, "день", "дні", "днів")}`, d };
    if (d <= SOON_DAYS) return { cls: "d-soon", text: `Через ${d} ${plural(d, "день", "дні", "днів")}`, d };
    return { cls: "d-later", text: `Через ${d} ${plural(d, "день", "дні", "днів")}`, d };
  };
  // Регулярний документ потребує оновлення, якщо строк у межах 90 днів/прострочений
  // або аудит позначив його як застарілий / з непрацюючим посиланням.
  const needsUpdate = (doc) => {
    if (doc.type !== "R") return false;
    const d = daysLeft(doc.due);
    return (d !== null && d <= SOON_DAYS) || doc.status === "stale" || doc.status === "broken";
  };

  // ---------- Компоненти ----------
  const typeBadge = (t) => `<span class="badge soft t-${t}">${TYPES[t].name}</span>`;
  const statusBadge = (s) => `<span class="badge soft s-${s}"><span class="dot"></span>${STATUS[s]}</span>`;
  const sectionById = (id) => D.sections.find((s) => s.id === id);
  const docsIn = (id) => (id === "all" ? D.documents : D.documents.filter((d) => d.section === id));
  const urgentDocs = () => D.documents.filter(needsUpdate);

  const mixBar = (docs) => {
    if (!docs.length) return `<div class="mix-bar"></div>`;
    return `<div class="mix-bar">${TYPE_ORDER.map((t) => {
      const n = docs.filter((d) => d.type === t).length;
      return n ? `<i style="width:${(n / docs.length) * 100}%;background:${TYPES[t].color}" title="${TYPES[t].plural}: ${n}"></i>` : "";
    }).join("")}</div>`;
  };

  const statCard = ({ label, value, hint, cls = "", bar }) => `
    <div class="card stat">
      <p class="stat-label">${label}</p>
      <span class="stat-value ${cls}">${value}</span>
      <p class="stat-hint">${hint || ""}</p>
      ${bar || ""}
    </div>`;

  // ---------- Сайдбар ----------
  const collapsed = new Set();
  function renderNav(route) {
    const urgent = urgentDocs().length;
    const item = (href, ic, label, count, active, alert) => `
      <a class="nav-item${active ? " active" : ""}" href="${href}">
        ${icon(ic)}<span class="label">${esc(label)}</span>
        ${count !== undefined ? `<span class="nav-count${alert ? " alert" : ""}">${count}</span>` : ""}
      </a>`;
    const group = (key, title, body) => `
      <div class="nav-group${collapsed.has(key) ? " collapsed" : ""}" data-group="${key}">
        <button class="nav-group-head" data-action="toggle-group" data-key="${key}">
          <span>${title}</span>${icon("chevron", "i chev")}
        </button>
        <div class="nav-items">${body}</div>
      </div>`;

    nav.innerHTML =
      group("main", "Головне",
        item("#/", "home", "Огляд", undefined, route.name === "overview") +
        item("#/deadlines", "clock", "Дедлайни", urgent, route.name === "deadlines", urgent > 0) +
        item("#/section/all", "files", "Усі документи", D.documents.length, route.name === "section" && route.id === "all")
      ) +
      group("sections", "Розділи",
        D.sections.map((s) => item(`#/section/${s.id}`, s.icon, s.name, docsIn(s.id).length, route.name === "section" && route.id === s.id)).join("")
      );
  }

  // ---------- Сторінки ----------
  function pageOverview() {
    const docs = D.documents;
    const count = (t) => docs.filter((d) => d.type === t).length;
    const urgent = urgentDocs();
    const nextDue = docs.filter((d) => d.due && daysLeft(d.due) >= 0).sort((a, b) => a.due.localeCompare(b.due))[0];
    const problems = docs.filter((d) => d.status === "stale" || d.status === "broken");

    const typeBar = `<div class="stat-bar">${TYPE_ORDER.map((t) => `<i style="width:${(count(t) / docs.length) * 100}%;background:${TYPES[t].color}"></i>`).join("")}</div>`;

    const upcoming = docs
      .filter((d) => d.type === "R" && d.due)
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 6);

    return `
      <div class="page-head">
        <div>
          <span class="badge badge-lg soft lg-border s-ok">Оновлення публічної інформації</span>
        </div>
        <a class="btn-primary" href="${D.sources.root}" target="_blank" rel="noopener">${icon("drive")}Відкрити в Google Drive</a>
      </div>

      <div class="stats">
        ${statCard({ label: "Усього документів", value: docs.length, hint: `${D.sections.length} розділів`, cls: "c-primary", bar: typeBar })}
        ${statCard({ label: "Регулярні", value: count("R"), hint: `${count("S")} стихійних · ${count("M")} змішаних`, cls: "c-primary",
          bar: `<div class="stat-bar"><i style="width:${(count("R") / docs.length) * 100}%;background:var(--primary)"></i></div>` })}
        ${statCard({ label: "Потребують оновлення", value: urgent.length, hint: "регулярні · строк ≤ 90 днів або застарілі", cls: urgent.length ? "c-error" : "c-success",
          bar: `<div class="stat-bar"><i style="width:${(urgent.length / Math.max(count("R"), 1)) * 100}%;background:var(--error)"></i></div>` })}
        ${statCard({ label: "Найближчий дедлайн", value: nextDue ? fmtDate(nextDue.due).replace(/ \d{4}$/, "") : "—", hint: nextDue ? esc(nextDue.title.slice(0, 38)) + (nextDue.title.length > 38 ? "…" : "") : "", cls: "c-warning",
          bar: `<div class="stat-bar"><i style="width:${Math.max(0, 100 - (daysLeft(nextDue?.due) ?? 0) / SOON_DAYS * 100)}%;background:var(--warning)"></i></div>` })}
      </div>

      <div class="two-col">
        <div class="card"><div class="card-body">
          <div class="card-title">Розділи <span class="legend">${TYPE_ORDER.slice(0, 3).map(typeBadge).join("")}</span></div>
          <div class="section-grid">
            ${D.sections.map((s) => {
              const sd = docsIn(s.id);
              const r = sd.filter((d) => d.type === "R").length;
              const u = sd.filter(needsUpdate).length;
              return `
                <a class="section-tile" href="#/section/${s.id}">
                  <div class="top">
                    <span class="section-icon">${icon(s.icon)}</span>
                    <div><h3>${esc(s.name)}</h3><p class="meta">${sd.length} ${plural(sd.length, "документ", "документи", "документів")}${r ? ` · ${r} регул.` : ""}</p></div>
                  </div>
                  ${mixBar(sd)}
                  ${u ? `<span class="badge soft d-overdue" style="align-self:flex-start">${u} ${plural(u, "потребує", "потребують", "потребують")} оновлення</span>` : ""}
                </a>`;
            }).join("")}
          </div>
        </div></div>

        <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
          <div class="card"><div class="card-body">
            <div class="card-title">Найближчі строки <a href="#/deadlines">Усі дедлайни →</a></div>
            <div class="list">
              ${upcoming.map((d) => {
                const st = deadlineState(d);
                return `<div class="list-row">
                  <div class="grow"><p title="${esc(d.title)}">${esc(d.title)}</p><span class="doc-sub">${esc(sectionById(d.section).name)} · ${fmtDate(d.due)}</span></div>
                  <span class="badge soft ${st.cls}">${st.d}&nbsp;дн.</span>
                </div>`;
              }).join("")}
            </div>
          </div></div>

          <div class="card"><div class="card-body">
            <div class="card-title">Проблеми з публікацією <span class="badge soft s-stale">${problems.length}</span></div>
            <div class="list">
              ${problems.slice(0, 6).map((d) => `<div class="list-row">
                <div class="grow"><p title="${esc(d.title)}">${esc(d.title)}</p><span class="doc-sub">${d.owner ? "Відповідальний: " + esc(d.owner) : esc(sectionById(d.section).name)}</span></div>
                ${statusBadge(d.status)}
              </div>`).join("")}
            </div>
          </div></div>
        </div>
      </div>`;
  }

  // стан фільтрів сторінки розділу
  const filters = { type: "all", q: "" };

  function pageSection(id) {
    const section = id === "all" ? { id: "all", name: "Усі документи", url: D.sources.root } : sectionById(id);
    if (!section) return pageNotFound();
    const all = docsIn(id);
    const q = filters.q.trim().toLowerCase();
    const shown = all
      .filter((d) => filters.type === "all" || d.type === filters.type)
      .filter((d) => !q || d.title.toLowerCase().includes(q) || (d.owner || "").toLowerCase().includes(q));

    const tab = (key, label, n) =>
      `<button class="tab${filters.type === key ? " active" : ""}" data-action="filter-type" data-type="${key}">${label}<span class="n">${n}</span></button>`;

    const rows = shown.map((d) => {
      const st = d.type === "R" ? deadlineState(d) : null;
      return `<tr>
        <td class="cell-title"><div class="doc-title">${esc(d.title)}</div>${id === "all" ? `<div class="doc-sub">${esc(sectionById(d.section).name)}</div>` : d.cycle ? `<div class="doc-sub">${esc(d.cycle)}</div>` : ""}</td>
        <td data-label="Тип">${typeBadge(d.type)}</td>
        <td data-label="Актуальність">${statusBadge(d.status)}</td>
        <td data-label="Відповідальний" class="nowrap">${d.owner ? esc(d.owner) : '<span class="muted">—</span>'}</td>
        <td data-label="Наступне оновлення" class="nowrap">${
          st ? (d.due ? `${fmtDate(d.due)}<div class="doc-sub"><span class="badge soft ${st.cls}" style="min-height:20px;padding:0 8px">${st.text}</span></div>` : `<span class="muted">${esc(d.dueLabel || "Строк уточнюється")}</span>`)
             : `<span class="muted">${d.type === "S" ? "При зміні / події" : d.type === "M" ? "За потреби" : "—"}</span>`
        }</td>
        <td><a class="link-btn" href="${d.url}" target="_blank" rel="noopener">${icon("drive")}Drive</a></td>
      </tr>`;
    }).join("");

    return `
      <div class="card"><div class="card-body page-head">
        <div>
          <h1 class="page-title">${esc(section.name)}</h1>
          <p class="page-sub">${all.length} ${plural(all.length, "документ", "документи", "документів")} · ${all.filter(needsUpdate).length} ${plural(all.filter(needsUpdate).length, "потребує", "потребують", "потребують")} оновлення</p>
        </div>
        <a class="link-btn" href="${section.url}" target="_blank" rel="noopener">${icon("external")}Папка в Drive</a>
      </div></div>

      <div class="card"><div class="card-body">
        <div class="toolbar">
          <div class="tabs" role="tablist">
            ${tab("all", "Усі", all.length)}
            ${TYPE_ORDER.map((t) => tab(t, TYPES[t].plural, all.filter((d) => d.type === t).length)).join("")}
          </div>
          <label class="field">${icon("search")}<input id="section-search" type="search" placeholder="Пошук у розділі" value="${esc(filters.q)}" /></label>
        </div>
        <div class="table-wrap" style="margin-top:8px">
          ${all.length === 0
            ? `<div class="empty"><b>Розділ порожній</b>У папці Drive ще немає документів.</div>`
            : shown.length === 0
              ? `<div class="empty"><b>Нічого не знайдено</b>Спробуйте інший тип або запит.</div>`
              : `<table class="responsive">
                  <thead><tr><th>Назва</th><th>Тип</th><th>Актуальність</th><th>Відповідальний</th><th>Наступне оновлення</th><th>Дії</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>`}
        </div>
      </div></div>`;
  }

  function pageDeadlines() {
    const regular = D.documents.filter((d) => d.type === "R");
    const withDue = regular.filter((d) => d.due).sort((a, b) => a.due.localeCompare(b.due));
    const noDue = regular.filter((d) => !d.due);
    const overdue = withDue.filter((d) => daysLeft(d.due) < 0);
    const soon = withDue.filter((d) => daysLeft(d.due) >= 0 && daysLeft(d.due) <= SOON_DAYS);
    const stale = regular.filter((d) => d.status === "stale" || d.status === "broken");
    const urgent = urgentDocs().sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));

    const row = (d) => {
      const st = deadlineState(d);
      return `<tr>
        <td class="cell-title"><div class="doc-title">${esc(d.title)}</div><div class="doc-sub">${esc(sectionById(d.section).name)}</div></td>
        <td data-label="Цикл" class="nowrap">${esc(d.cycle || "—")}</td>
        <td data-label="Строк">${d.due ? `<b style="font-weight:500">${fmtDate(d.due)}</b>` : ""}<div class="doc-sub">${esc(d.dueLabel || "Строк не вказано в таблиці періодів")}</div></td>
        <td data-label="Залишилось"><span class="badge soft ${st.cls}">${st.text}</span></td>
        <td data-label="Актуальність">${statusBadge(d.status)}</td>
        <td><a class="link-btn" href="${d.url}" target="_blank" rel="noopener">${icon("drive")}Drive</a></td>
      </tr>`;
    };
    const table = (list) => `<div class="table-wrap"><table class="responsive">
      <thead><tr><th>Документ</th><th>Цикл</th><th>Строк</th><th>Залишилось</th><th>Актуальність</th><th>Дії</th></tr></thead>
      <tbody>${list.map(row).join("")}</tbody></table></div>`;

    return `
      <div class="card"><div class="card-body page-head">
        <div>
          <h1 class="page-title">Дедлайни</h1>
          <p class="page-sub">Регулярні документи, які треба оновити найближчим часом · станом на ${fmtDate(D.today)}</p>
        </div>
        <a class="link-btn" href="${D.sources.periods}" target="_blank" rel="noopener">${icon("external")}Таблиця періодів</a>
      </div></div>

      <div class="stats">
        ${statCard({ label: "Прострочено", value: overdue.length, cls: overdue.length ? "c-error" : "c-success", hint: overdue.length ? "потрібна дія" : "немає" })}
        ${statCard({ label: `До ${SOON_DAYS} днів`, value: soon.length, cls: "c-warning", hint: soon[0] ? "найближчий — " + fmtDate(soon[0].due) : "" })}
        ${statCard({ label: "Застарілі за аудитом", value: stale.length, cls: "c-error", hint: "регулярні документи" })}
        ${statCard({ label: "Без строку", value: noDue.length, cls: "c-secondary", hint: "уточнити у відповідальних" })}
      </div>

      <div class="card"><div class="card-body">
        <div class="card-title">Потребують оновлення зараз <span class="badge soft d-overdue">${urgent.length}</span></div>
        ${urgent.length ? table(urgent) : `<div class="empty"><b>Усе актуально</b>Немає регулярних документів зі строком у найближчі ${SOON_DAYS} днів.</div>`}
      </div></div>

      <div class="card"><div class="card-body">
        <div class="card-title">Календар регулярних оновлень <span class="badge soft t-R">${withDue.length}</span></div>
        ${table(withDue.filter((d) => !urgent.includes(d)))}
      </div></div>

      ${noDue.length ? `<div class="card"><div class="card-body">
        <div class="card-title">Строк не визначено <span class="badge soft d-none">${noDue.length}</span></div>
        <p class="note" style="margin-bottom:8px">${icon("info")}Для цих регулярних документів у таблиці «Періоди оновлення» ще немає конкретної дати.</p>
        ${table(noDue)}
      </div></div>` : ""}`;
  }

  function pageNotFound() {
    return `<div class="card"><div class="empty"><b>Сторінку не знайдено</b><a href="#/" style="color:var(--primary)">На головну</a></div></div>`;
  }

  // ---------- Роутер ----------
  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b] = h.split("/");
    if (!a) return { name: "overview" };
    if (a === "deadlines") return { name: "deadlines" };
    if (a === "section") return { name: "section", id: b || "all" };
    return { name: "404" };
  }

  let lastRouteKey = "";
  function render() {
    const route = parseRoute();
    const key = route.name + ":" + (route.id || "");
    if (key !== lastRouteKey) {
      filters.type = "all";
      filters.q = "";
      lastRouteKey = key;
      window.scrollTo(0, 0);
    }
    renderNav(route);

    let title = "Огляд";
    if (route.name === "overview") app.innerHTML = pageOverview();
    else if (route.name === "deadlines") { app.innerHTML = pageDeadlines(); title = "Дедлайни"; }
    else if (route.name === "section") {
      app.innerHTML = pageSection(route.id);
      title = route.id === "all" ? "Усі документи" : (sectionById(route.id)?.name || "Розділ");
    } else { app.innerHTML = pageNotFound(); title = "404"; }

    crumbs.innerHTML = `Документи / <b>${esc(title)}</b>`;
    document.title = `${title} | KSE Hub`;
    document.body.classList.remove("drawer-open");
  }

  // ---------- Події ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    if (a === "toggle-group") {
      const k = el.dataset.key;
      collapsed.has(k) ? collapsed.delete(k) : collapsed.add(k);
      el.closest(".nav-group").classList.toggle("collapsed");
    } else if (a === "filter-type") {
      filters.type = el.dataset.type;
      render();
    } else if (a === "toggle-theme") {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("kse-docs-theme", next); } catch (err) {}
    } else if (a === "toggle-drawer") {
      if (window.matchMedia("(max-width: 900px)").matches) document.body.classList.toggle("drawer-open");
      else document.body.classList.toggle("sidebar-hidden");
    } else if (a === "close-drawer") {
      document.body.classList.remove("drawer-open");
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "section-search") {
      filters.q = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const inp = document.getElementById("section-search");
      inp.focus();
      inp.setSelectionRange(pos, pos);
    }
  });

  // Глобальний пошук у сайдбарі → «Усі документи» з запитом
  globalSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      filters.q = globalSearch.value;
      filters.type = "all";
      lastRouteKey = "section:all";
      if (location.hash !== "#/section/all") location.hash = "#/section/all";
      else render();
      globalSearch.value = "";
      globalSearch.blur();
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (window.matchMedia("(max-width: 900px)").matches) document.body.classList.add("drawer-open");
      globalSearch.focus();
    }
    if (e.key === "Escape") document.body.classList.remove("drawer-open");
  });

  window.addEventListener("hashchange", render);
  render();
})();
