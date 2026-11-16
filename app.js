(() => {
  let D = window.PORTAL_DATA;
  // Backend API (see backend/README.md). Same origin by default; override with ?api=http://127.0.0.1:3000
  const API = (new URLSearchParams(location.search).get("api") ?? window.PORTAL_API ?? "").replace(/\/$/, "");
  let LIVE = false; // true once data came from the API — enables status editing
  let writesRequireToken = false;
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
    missing: "Відсутній",
    under_review: "На розгляді",
    not_in_report: "Немає у звіті",
    unknown: "Не перевірено",
  };
  const STATUS_CLS = { ok: "s-ok", stale: "s-stale", broken: "s-broken", missing: "s-broken", under_review: "s-stale", not_in_report: "s-unknown", unknown: "s-unknown" };
  // API status keys → keys used in this file
  const FROM_API = { up_to_date: "ok", outdated: "stale", broken_link: "broken", missing: "missing", under_review: "under_review", not_in_report: "not_in_report" };
  // Status options for the dropdown: [API key, label]
  const EDITABLE = [["up_to_date", "Оновлений"], ["outdated", "Застарілий"], ["broken_link", "Посилання не працює"], ["missing", "Відсутній"], ["under_review", "На розгляді"]];
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
  let today = new Date(D.today + "T00:00:00");
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
  const statusBadge = (s) => `<span class="badge soft ${STATUS_CLS[s] || "s-unknown"}"><span class="dot"></span>${STATUS[s] || STATUS.unknown}</span>`;
  // Document name as a link to its Drive folder.
  const docLink = (d, cls = "") =>
    `<a class="doc-link ${cls}" href="${esc(d.url)}" target="_blank" rel="noopener" title="${esc(d.title)}">${esc(d.title)}</a>`;
  // "Періодичний: Щороку" / "Неперіодичний"
  const periodLabel = (d) => {
    const periodic = d.periodic ?? (d.type === "R" || d.type === "M");
    return periodic ? `Періодичний: ${esc(d.period || d.cycle || "період не вказано")}` : "Неперіодичний";
  };
  // Block status: up to date only if every applicable document is.
  const blockStatus = (s) => s.status || (docsIn(s.id).filter((d) => d.type !== "N").every((d) => d.status === "ok") ? "up_to_date" : "needs_renewal");
  const blockBadge = (s) => blockStatus(s) === "up_to_date"
    ? `<span class="badge soft s-ok"><span class="dot"></span>Актуальний</span>`
    : `<span class="badge soft s-broken"><span class="dot"></span>Потребує оновлення</span>`;
  // Editable status (live mode) or a plain badge (snapshot mode).
  // Responsible person: a dropdown of people from the «Відповідальні» tab (live
  // mode) or plain text, plus the free-text note from the table when it says
  // more than the name.
  const ownerControl = (d) => {
    if (!LIVE) {
      const note = d.ownerNote ? `<div class="doc-sub owner-note" title="${esc(d.ownerNote)}">${esc(d.ownerNote)}</div>` : "";
      return (d.owner ? esc(d.owner) : '<span class="muted">—</span>') + note;
    }
    // Click the note (or "+ примітка") to edit it in place; see startNoteEdit.
    const note = d.ownerNote
      ? `<button type="button" class="doc-sub owner-note note-edit" data-action="edit-note" data-doc="${esc(d.id)}" title="${esc(d.ownerNote)} — натисніть, щоб змінити">${esc(d.ownerNote)}</button>`
      : `<button type="button" class="note-add" data-action="edit-note" data-doc="${esc(d.id)}">+ примітка</button>`;
    const people = D.people || [];
    // A name typed into the table that isn't in the list still shows as selected.
    const options = d.owner && !people.includes(d.owner) ? [d.owner, ...people] : people;
    return `<select class="owner-select" data-doc="${esc(d.id)}" data-expected="${esc(d.owner || "")}" aria-label="Відповідальний">
      <option value=""${d.owner ? "" : " selected"}>—</option>
      ${options.map((n) => `<option value="${esc(n)}"${n === d.owner ? " selected" : ""}>${esc(n)}</option>`).join("")}
    </select>${note}`;
  };
  const statusControl = (d) => !LIVE ? statusBadge(d.status) : `
    <select class="status-select ${STATUS_CLS[d.status] || "s-unknown"}" data-doc="${esc(d.id)}" data-expected="${esc(d.statusKey)}" aria-label="Актуальність">
      ${EDITABLE.some(([k]) => k === d.statusKey) ? "" : `<option value="" selected disabled>${STATUS[d.status] || STATUS.unknown}</option>`}
      ${EDITABLE.map(([k, label]) => `<option value="${k}"${k === d.statusKey ? " selected" : ""}>${label}</option>`).join("")}
    </select>`;
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
                  <span style="align-self:flex-start">${blockBadge(s)}</span>
                  ${u ?`<span class="badge soft d-overdue" style="align-self:flex-start">${u} ${plural(u, "потребує", "потребують", "потребують")} оновлення</span>` : ""}
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
                  <div class="grow"><p>${docLink(d)}</p><span class="doc-sub">${esc(sectionById(d.section).name)} · ${fmtDate(d.due)}</span></div>
                  <span class="badge soft ${st.cls}">${st.d}&nbsp;дн.</span>
                </div>`;
              }).join("")}
            </div>
          </div></div>

          <div class="card"><div class="card-body">
            <div class="card-title">Проблеми з публікацією <span class="badge soft s-stale">${problems.length}</span></div>
            <div class="list">
              ${problems.slice(0, 6).map((d) => `<div class="list-row">
                <div class="grow"><p>${docLink(d)}</p><span class="doc-sub">${d.owner ? "Відповідальний: " + esc(d.owner) : esc(sectionById(d.section).name)}</span></div>
                ${statusBadge(d.status)}
              </div>`).join("")}
            </div>
          </div></div>
        </div>
      </div>`;
  }

  // стан фільтрів сторінки розділу
  const filters = { type: "all", q: "", owner: "all" };

  function pageSection(id) {
    const section = id === "all" ? { id: "all", name: "Усі документи", url: D.sources.root } : sectionById(id);
    if (!section) return pageNotFound();
    const all = docsIn(id);
    const q = filters.q.trim().toLowerCase();
    const shown = all
      .filter((d) => filters.type === "all" || d.type === filters.type)
      .filter((d) => filters.owner === "all" || (filters.owner === "none" ? !d.owner : d.owner === filters.owner))
      .filter((d) => !q || d.title.toLowerCase().includes(q) || (d.owner || "").toLowerCase().includes(q) || (d.ownerNote || "").toLowerCase().includes(q));

    // Owner filter: people who own something in this view, with counts.
    const ownerCounts = new Map();
    for (const d of all) if (d.owner) ownerCounts.set(d.owner, (ownerCounts.get(d.owner) || 0) + 1);
    const noOwner = all.filter((d) => !d.owner).length;
    const ownerFilter = `<label class="field owner-filter">${icon("users")}<select id="owner-filter" aria-label="Відповідальний">
        <option value="all">Усі відповідальні</option>
        ${[...ownerCounts].sort((a, b) => a[0].localeCompare(b[0], "uk")).map(([n, c]) => `<option value="${esc(n)}"${filters.owner === n ? " selected" : ""}>${esc(n)} (${c})</option>`).join("")}
        ${noOwner ? `<option value="none"${filters.owner === "none" ? " selected" : ""}>Без відповідального (${noOwner})</option>` : ""}
      </select></label>`;

    const tab = (key, label, n) =>
      `<button class="tab${filters.type === key ? " active" : ""}" data-action="filter-type" data-type="${key}">${label}<span class="n">${n}</span></button>`;

    const rows = shown.map((d) => {
      const st = d.type === "R" ? deadlineState(d) : null;
      return `<tr>
        <td class="cell-title"><div class="doc-title">${docLink(d)}</div>${id === "all" ? `<div class="doc-sub">${esc(sectionById(d.section).name)}</div>` : d.cycle ? `<div class="doc-sub">${esc(d.cycle)}</div>` : ""}</td>
        <td data-label="Тип">${typeBadge(d.type)}<div class="doc-sub">${periodLabel(d)}</div></td>
        <td data-label="Актуальність">${statusControl(d)}</td>
        <td data-label="Відповідальний">${ownerControl(d)}</td>
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
          <h1 class="page-title">${esc(section.name)} ${id === "all" ? "" : blockBadge(section)}</h1>
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
          <div class="toolbar-right">
            ${ownerFilter}
            <label class="field">${icon("search")}<input id="section-search" type="search" placeholder="Пошук у розділі" value="${esc(filters.q)}" /></label>
          </div>
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
        <td class="cell-title"><div class="doc-title">${docLink(d)}</div><div class="doc-sub">${esc(sectionById(d.section).name)}</div></td>
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
      filters.owner = "all";
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
    } else if (a === "edit-note") {
      startNoteEdit(el);
    }
  });

  // Turns a note into a text box. Enter or leaving the box saves (if changed),
  // Esc cancels. It starts from the raw table text, which may be a note the
  // page hides because it only repeats the person's name.
  function startNoteEdit(btn) {
    const d = D.documents.find((x) => x.id === btn.dataset.doc);
    if (!d) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "note-input";
    input.maxLength = 500;
    input.placeholder = "Примітка: де/у кого взяти оновлення";
    input.value = d.note || "";
    input.dataset.doc = d.id;
    input.dataset.expected = d.note || "";
    btn.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (save && input.value.replace(/\s+/g, " ").trim() !== (d.note || "")) saveField(input, "note");
      else render();
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    input.addEventListener("blur", () => finish(true));
  }

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
      filters.owner = "all";
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

  // ---------- Живі дані з бекенду ----------
  const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Converts /api/snapshot into the PORTAL_DATA shape used by this file.
  function fromSnapshot(snap) {
    const oldSections = window.PORTAL_DATA.sections;
    const sections = snap.sections.map((s) => ({
      id: s.slug,
      name: s.name,
      icon: oldSections.find((o) => o.id === s.slug)?.icon || "files",
      folder: s.id,
      url: s.url,
      status: s.status,
      counts: s.counts,
    }));
    const documents = snap.sections.flatMap((s) => s.documents.map((d) => ({
      id: d.id,
      section: s.slug,
      type: d.updateType?.code || "S",
      title: d.name,
      url: d.url,
      status: FROM_API[d.relevance.status] || "unknown",
      statusKey: d.relevance.status,
      owner: d.relevance.owner,
      ownerNote: d.relevance.ownerNote,
      note: d.relevance.note,
      periodic: d.periodicity.periodic,
      period: d.periodicity.period,
      cycle: d.nextUpdate?.cycle || d.periodicity.period,
      due: d.nextUpdate?.due || null,
      dueLabel: d.nextUpdate?.label || null,
    })));
    return { today: localISO(new Date()), sections, documents, people: snap.people || [], sources: window.PORTAL_DATA.sources, version: snap.version };
  }

  async function loadLive() {
    const res = await fetch(`${API}/api/snapshot`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    D = fromSnapshot(await res.json());
    today = new Date(D.today + "T00:00:00");
    LIVE = true;
  }

  function toast(msg, kind = "error") {
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
    el.className = `toast ${kind}`;
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add("hide"), 4000);
  }

  function adminToken(forceAsk) {
    let t = "";
    try { t = localStorage.getItem("kse-admin-token") || ""; } catch (e) {}
    if ((forceAsk || (writesRequireToken && !t))) {
      t = window.prompt("Токен адміністратора для внесення змін:") || "";
      try { localStorage.setItem("kse-admin-token", t); } catch (e) {}
    }
    return t;
  }

  // Saves a dropdown's value into the table. field: "status" | "owner".
  const FIELD_TEXT = {
    status: { saved: "Статус збережено в таблиці «Звіт по документах»", conflict: "Статус уже змінили в таблиці — показано актуальне значення." },
    owner: { saved: "Відповідального збережено в таблиці «Звіт по документах»", conflict: "Відповідального вже змінили в таблиці — показано актуальне значення." },
    note: { saved: "Примітку збережено в таблиці «Звіт по документах»", conflict: "Примітку вже змінили в таблиці — показано актуальне значення." },
  };
  async function saveField(sel, field, retried = false) {
    const id = sel.dataset.doc;
    const token = adminToken(retried);
    // Status: "" means unknown, so don't send it. Owner/note: "" means "was empty".
    const expected = field === "status" ? sel.dataset.expected || undefined : sel.dataset.expected;
    sel.disabled = true;
    try {
      const res = await fetch(`${API}/api/documents/${encodeURIComponent(id)}/${field}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ [field]: sel.value, expected }),
      });
      if (res.status === 401 && !retried) return saveField(sel, field, true);
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) toast(FIELD_TEXT[field].conflict);
      else if (!res.ok) toast(`Не вдалося зберегти: ${body.error || res.status}`);
      else toast(FIELD_TEXT[field].saved, "ok");
    } catch (err) {
      toast(`Не вдалося зберегти: ${err.message}`);
    }
    await loadLive().catch(() => {});
    render();
  }

  document.addEventListener("change", (e) => {
    if (e.target.matches?.(".status-select")) saveField(e.target, "status");
    else if (e.target.matches?.(".owner-select")) saveField(e.target, "owner");
    else if (e.target.id === "owner-filter") { filters.owner = e.target.value; render(); }
  });

  // Server pushes `change` whenever the table, Drive or a status on the site changes.
  function subscribe() {
    if (!window.EventSource) return;
    const EDITING = ".status-select, .owner-select, .note-input, #owner-filter, #section-search";
    let pending = false;
    const reload = () => { pending = false; loadLive().then(render).catch(() => {}); };
    const es = new EventSource(`${API}/api/events`);
    es.addEventListener("change", (e) => {
      const { version } = JSON.parse(e.data || "{}");
      if (version === D.version) return;
      // Don't re-render under the user's cursor; apply once they leave the field.
      if (document.activeElement?.matches?.(EDITING)) pending = true;
      else reload();
    });
    document.addEventListener("focusout", (e) => {
      if (pending && e.target.matches?.(EDITING)) setTimeout(() => { if (pending && !document.activeElement?.matches?.(EDITING)) reload(); }, 0);
    });
  }

  window.addEventListener("hashchange", render);
  loadLive()
    .then(() => fetch(`${API}/api/health`).then((r) => r.json()).then((h) => { writesRequireToken = !!h.writesRequireToken; }).catch(() => {}))
    .then(subscribe)
    .catch((err) => console.info(`[KSE] бекенд недоступний (${err.message}) — показано знімок з data.js`))
    .finally(render);
})();
