// Публічна версія: Огляд (картки розділів) → розділ (список файлів) → Google Drive.
(() => {
  let D = window.PORTAL_DATA;
  // Бекенд (backend/src/public-server.js) віддає дерево папок з Drive наживо.
  // Той самий origin за замовчуванням; інший — через ?api=http://127.0.0.1:3000
  const API = (new URLSearchParams(location.search).get("api") ?? window.PORTAL_API ?? "").replace(/\/$/, "");
  const app = document.getElementById("app");
  const nav = document.getElementById("sidebar-nav");
  const crumbs = document.getElementById("crumbs");
  const globalSearch = document.getElementById("global-search");

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 18 9 12l6-6"/>',
  };
  const icon = (name, cls = "i") => `<svg viewBox="0 0 24 24" class="${cls}">${ICONS[name] || ""}</svg>`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  };
  const docsWord = (n) => `${n} ${plural(n, "документ", "документи", "документів")}`;
  const sectionById = (id) => D.sections.find((s) => s.id === id);
  const docsIn = (id) => (id === "all" ? D.documents : D.documents.filter((d) => d.section === id));

  // Обкладинка: фото розділу, а якщо його немає або воно не завантажилось — градієнт.
  const cover = (s, cls) => `<div class="${cls}">${s.photo ? `<img src="${esc(s.photo)}" alt="" loading="lazy" onerror="this.remove()" />` : ""}</div>`;

  let query = "";

  function renderNav(route) {
    const item = (href, ic, label, active) =>
      `<a class="nav-item${active ? " active" : ""}" href="${href}">${icon(ic)}<span class="label">${esc(label)}</span></a>`;
    nav.innerHTML =
      `<div class="nav-group"><p class="nav-group-head">Головне</p><div class="nav-items">
        ${item("#/", "home", "Огляд", route.name === "overview")}
        ${item("#/section/all", "file", "Усі документи", route.name === "section" && route.id === "all")}
      </div></div>
      <div class="nav-group"><p class="nav-group-head">Розділи</p><div class="nav-items">
        ${D.sections.map((s) => item(`#/section/${s.id}`, "folder", s.name, route.name === "section" && route.id === s.id)).join("")}
      </div></div>`;
  }

  function pageOverview() {
    return `
      <section class="hero">
        <h1 class="hero-title">Публічна інформація КШЕ</h1>
        <p class="hero-sub">Документи Київської школи економіки, згруповані за розділами. Оберіть розділ, щоб переглянути файли.</p>
      </section>
      <div class="program-grid">
        ${D.sections.map((s) => `
          <a class="program-card" href="#/section/${s.id}">
            ${cover(s, "program-photo")}
            <h2 class="program-title">${esc(s.name)}</h2>
            <p class="program-text">${esc(s.about || docsWord(docsIn(s.id).length))}</p>
            <span class="program-btn">Детальніше</span>
          </a>`).join("")}
      </div>`;
  }

  function pageSection(id) {
    const section = id === "all"
      ? { id: "all", name: "Усі документи", about: "Усі документи з усіх розділів.", url: D.root, photo: "" }
      : sectionById(id);
    if (!section) return pageMissing();
    const all = docsIn(id);
    const q = query.trim().toLowerCase();
    const shown = q ? all.filter((d) => d.title.toLowerCase().includes(q) || d.files.some((f) => f.name.toLowerCase().includes(q))) : all;

    return `
      <a class="back-link" href="#/">${icon("back")}Усі розділи</a>
      <section class="section-hero">
        ${id === "all" ? "" : cover(section, "section-photo")}
        <div class="section-info">
          <h1 class="page-title">${esc(section.name)}</h1>
          ${section.about ? `<p class="page-sub">${esc(section.about)}</p>` : ""}
          <p class="section-count">${docsWord(all.length)}</p>
        </div>
      </section>
      <section class="card">
        <div class="card-body files-head">
          <label class="field">${icon("search")}<input id="section-search" type="search" placeholder="Пошук документа..." value="${esc(query)}" autocomplete="off" /></label>
          ${q ? `<span class="muted small">Знайдено: ${shown.length}</span>` : ""}
        </div>
        ${shown.length ? fileLists(id, shown) : `<div class="empty"><b>Нічого не знайдено</b>Спробуйте інший запит.</div>`}
      </section>`;
  }

  const fileRow = (d, showWhere) => `
    <li><a class="file-row" href="${esc(d.url)}" target="_blank" rel="noopener">
      <span class="file-icon">${icon("file")}</span>
      <span class="file-name">${esc(d.title)}${showWhere ? `<small>${esc([sectionById(d.section).name, d.group].filter(Boolean).join(" · "))}</small>` : ""}</span>
      <span class="file-open">Відкрити${icon("external")}</span>
    </a>${d.files.length ? `<ul class="file-sub">${d.files.map((f) => `
      <li><a href="${esc(f.url)}" target="_blank" rel="noopener">${icon("file")}<span>${esc(f.name)}</span></a></li>`).join("")}</ul>` : ""}</li>`;

  // Документи розділу, а під ними групи (папки з папками в Drive) із заголовками.
  function fileLists(id, shown) {
    if (id === "all") return `<ul class="file-list">${shown.map((d) => fileRow(d, true)).join("")}</ul>`;
    const section = sectionById(id);
    const loose = shown.filter((d) => !d.group);
    return (loose.length ? `<ul class="file-list">${loose.map((d) => fileRow(d)).join("")}</ul>` : "") +
      section.groups.map((g) => {
        const docs = shown.filter((d) => d.group === g.name);
        return docs.length ? `
          <div class="file-group">
            <a class="file-group-head" href="${esc(g.url)}" target="_blank" rel="noopener">${icon("folder")}${esc(g.name)}<span class="muted">${docs.length}</span></a>
            <ul class="file-list">${docs.map((d) => fileRow(d)).join("")}</ul>
          </div>` : "";
      }).join("");
  }

  const pageMissing = () => `<div class="card empty"><b>Розділ не знайдено</b><a href="#/">Повернутися до огляду</a></div>`;

  const parseRoute = () => {
    const m = location.hash.match(/^#\/section\/([\w-]+)/);
    return m ? { name: "section", id: m[1] } : { name: "overview" };
  };

  let lastRoute = "";
  function render() {
    const route = parseRoute();
    const key = route.name + ":" + (route.id || "");
    if (key !== lastRoute) { if (lastRoute) query = ""; lastRoute = key; window.scrollTo(0, 0); }
    renderNav(route);
    const section = route.name === "section" ? (route.id === "all" ? { name: "Усі документи" } : sectionById(route.id)) : null;
    app.innerHTML = route.name === "section" ? pageSection(route.id) : pageOverview();
    crumbs.innerHTML = section ? `<a href="#/">Огляд</a> / <b>${esc(section.name)}</b>` : "<b>Огляд</b>";
    document.title = `${section ? section.name : "Публічна інформація"} | KSE`;
    document.body.classList.remove("drawer-open");
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    if (a === "toggle-theme") {
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
    if (e.target.id !== "section-search") return;
    query = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const inp = document.getElementById("section-search");
    inp.focus();
    inp.setSelectionRange(pos, pos);
  });

  // Пошук у сайдбарі: Enter → «Усі документи» з запитом.
  globalSearch.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    lastRoute = "section:all";
    query = globalSearch.value;
    if (location.hash !== "#/section/all") location.hash = "#/section/all";
    else render();
    globalSearch.value = "";
    globalSearch.blur();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (window.matchMedia("(max-width: 900px)").matches) document.body.classList.add("drawer-open");
      globalSearch.focus();
    }
  });

  // ---------- Живі дані з Drive ----------
  // Дерево з API → та сама форма, що й у data.js. Група = папка, в якій є інші папки.
  function fromTree(tree) {
    const documents = [];
    const sections = tree.sections.map((sec) => {
      const m = (D.meta && D.meta[sec.id]) || {};
      const s = { id: m.slug || sec.id, name: sec.name, folder: sec.id, url: sec.url, about: m.about || "", photo: m.photo || "", docs: [], groups: [] };
      const doc = (n, group) => {
        const files = n.kind === "folder" ? (n.children || []).filter((c) => c.kind === "file").map((f) => ({ name: f.name, url: f.url })) : [];
        const d = { id: n.id, section: s.id, group, title: n.name, url: n.url, files };
        documents.push(d);
        return d;
      };
      for (const n of sec.items) {
        const isGroup = n.kind === "folder" && (n.children || []).some((c) => c.kind === "folder");
        if (isGroup) s.groups.push({ name: n.name, url: n.url, docs: n.children.map((c) => doc(c, n.name)) });
        else s.docs.push(doc(n, null));
      }
      return s;
    });
    return { ...D, sections, documents, source: tree.source, updatedAt: tree.updatedAt };
  }

  let liveKey = "";
  async function loadLive() {
    try {
      const res = await fetch(`${API}/api/public/tree`, { headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const tree = await res.json();
      if (!Array.isArray(tree.sections) || !tree.sections.length) return;
      const key = JSON.stringify(tree.sections);
      if (key === liveKey) return;
      liveKey = key;
      D = fromTree(tree);
      // не перемальовувати під час набору в пошуку
      if (document.activeElement?.id !== "section-search") render();
    } catch (err) {
      // бекенду немає (наприклад, статичний сервер) — лишаємо знімок з data.js
    }
  }

  window.addEventListener("hashchange", render);
  render();
  loadLive();
  setInterval(loadLive, 120_000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loadLive(); });
})();
