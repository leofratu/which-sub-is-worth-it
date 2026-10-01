// Which Sub Is Worth It — rendering and interaction. Data lives in data.js.
(function () {
  const SUBS = window.WSIWI_SUBS, MODELS = window.WSIWI_MODELS;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (n) => n == null ? "—" : n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString("en-US");
  const money = (n) => n == null ? "—" : "$" + n.toFixed(2);
  const subColor = (s) => `var(--${s})`;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const key = (m, v) => `${m.id}|${v.effort}`;
  const SIZES = [0.25, 0.5, 1, 2, 3, 5, 10, 20, 50];
  const BAR_MIN = 34, BAR_MAX = 58;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PLANS = ["claude", "openai"];

  const DEFAULT_MIX = {
    claude: { main: "claude-sonnet-5-5|high", hard: "claude-opus-5-5|xhigh", h: 20 },
    openai: { main: "gpt-6-1-sol|xhigh", hard: "gpt-6-astra|max", h: 20 },
  };
  const DEFAULTS = {
    claude: SUBS.claude.weeklyValue,
    fable: SUBS.claude.fableShare * 100,
    sol: SUBS.openai.weeklyValueByModel["gpt-6-sol"],
    astra: SUBS.openai.weeklyValueByModel["gpt-6-astra"],
    era: "after",
    size: 2, hidden: [], bar: 48, preset: "balanced",
    mix: DEFAULT_MIX,
    cmp: { a: "claude-opus-5-5|medium", b: "gpt-6-1-sol|xhigh" },
  };
  const PRESETS = [
    { id: "volume", name: "Volume first", desc: "Lots of small, routine tasks", bar: 36, size: 2,
      mix: { claude: { main: "claude-sonnet-5-5|low", hard: "claude-sonnet-5-5|high", h: 10 }, openai: { main: "gpt-6-sol|low", hard: "gpt-6-sol|high", h: 10 } } },
    { id: "balanced", name: "Balanced", desc: "Solid quality for most weeks", bar: 48, size: 2, mix: DEFAULT_MIX },
    { id: "hard", name: "Hard problems", desc: "Frontier-level reasoning only", bar: 54, size: 2,
      mix: { claude: { main: "claude-opus-5-5|high", hard: "claude-opus-5-5|max", h: 40 }, openai: { main: "gpt-6-astra|high", hard: "gpt-6-astra|max", h: 40 } } },
    { id: "agentic", name: "Long agent runs", desc: "Each task costs about 10 AA tasks", bar: 51, size: 6,
      mix: { claude: { main: "claude-opus-5-5|medium", hard: "claude-opus-5-5|xhigh", h: 30 }, openai: { main: "gpt-6-astra|medium", hard: "gpt-6-astra|max", h: 30 } } },
  ];

  const STORE = "wsiwi-state-v6";
  let state = structuredClone(DEFAULTS);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && typeof saved === "object") state = { ...state, ...saved, mix: { ...state.mix, ...(saved.mix || {}) }, cmp: { ...state.cmp, ...(saved.cmp || {}) } };
  } catch (e) {}
  state.sortK = "tasks"; state.sortDir = -1; state.plan = "all"; state.pinned = null;
  const save = () => {
    try {
      const { sortK, sortDir, plan, pinned, ...keep } = state;
      localStorage.setItem(STORE, JSON.stringify(keep));
    } catch (e) {}
  };

  // ---------- small UI helpers ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
  // Count a number up/down to its new value.
  function tween(node, to, format) {
    const from = node._v ?? to;
    node._v = to;
    if (reduced || from === to || !Number.isFinite(from)) { node.textContent = format(to); return; }
    const t0 = performance.now(), dur = 450;
    cancelAnimationFrame(node._raf);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = format(from + (to - from) * e);
      if (p < 1) node._raf = requestAnimationFrame(step);
    };
    node._raf = requestAnimationFrame(step);
  }
  function flash(node) {
    if (!node) return;
    node.classList.remove("flash"); void node.offsetWidth; node.classList.add("flash");
  }

  // ---------- theme ----------
  const SUN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1"/></svg>';
  const MOON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z"/></svg>';
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  function paintThemeBtn() {
    const b = $("#theme");
    b.innerHTML = isDark() ? SUN : MOON;
    b.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
  }
  try { const t = localStorage.getItem("wsiwi-theme"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch (e) {}
  $("#theme").addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("wsiwi-theme", next); } catch (e) {}
    paintThemeBtn();
  });

  // ---------- model economics ----------
  // Full-week $ value if the whole limit went to this model, and the share of the limit it may use.
  function weekValue(m) {
    if (m.sub === "claude") return state.claude;
    return m.id === "gpt-6-astra" ? state.astra : state.sol;
  }
  const limitCap = (m) => m.id === "claude-fable-5-1" ? state.fable / 100 : 1;
  const size = () => SIZES[state.size];

  const NEW_MODEL = "gpt-6-1-sol";
  function rows(era = state.era) {
    const hidden = new Set(state.hidden);
    if (era === "before") hidden.add(NEW_MODEL);
    const out = [];
    MODELS.forEach((m) => m.variants.forEach((v) => {
      const b = weekValue(m) * limitCap(m);
      const ok = v.ii != null && v.cost != null;
      const use = ok && b > 0 && !hidden.has(m.id);
      out.push({
        m, v, key: key(m, v), sub: m.sub, subName: SUBS[m.sub].name, label: `${m.short} · ${v.effort}`,
        ii: v.ii, cost: v.cost, speed: v.speed, price: m.price.out, budget: b, ok, use,
        tasks: ok ? b / (v.cost * size()) : null, ipd: ok ? v.ii / v.cost : null,
      });
    }));
    const live = out.filter((r) => r.use);
    live.forEach((r) => {
      r.frontier = !live.some((o) => o !== r && o.ii >= r.ii && o.tasks >= r.tasks && (o.ii > r.ii || o.tasks > r.tasks));
    });
    return out;
  }
  const bestAt = (rs, sub, bar) =>
    rs.filter((r) => r.use && r.sub === sub && r.ii >= bar).sort((a, b) => b.tasks - a.tasks)[0] || null;
  const findRow = (rs, k) => rs.find((r) => r.key === k);

  // ---------- tooltip ----------
  const tip = $("#tip");
  function showTip(e, r, hint) {
    tip.innerHTML = `<b>${r.m.name} · ${r.v.effort}</b><br>${r.subName}<br>
      <span class="mono">Index ${r.ii} · ${money(r.cost)}/task<br>${fmt(r.tasks)} tasks/wk · ${r.speed ?? "—"} tok/s</span>${hint ? `<br><span style="opacity:.7">${hint}</span>` : ""}`;
    tip.style.opacity = 1; moveTip(e);
  }
  function moveTip(e) {
    const w = tip.offsetWidth, x = Math.min(e.clientX + 14, window.innerWidth - w - 8);
    tip.style.left = x + "px"; tip.style.top = (e.clientY + 14) + "px";
  }
  const hideTip = () => { tip.style.opacity = 0; };

  // ---------- svg helpers ----------
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function marker(g, shape, x, y, r, fill) {
    const a = { fill, stroke: "var(--panel)", "stroke-width": 2 };
    if (shape === "square") return el("rect", { ...a, x: x - r, y: y - r, width: 2 * r, height: 2 * r, rx: 1.5 }, g);
    if (shape === "diamond") return el("path", { ...a, d: `M${x},${y - r * 1.3}L${x + r * 1.3},${y}L${x},${y + r * 1.3}L${x - r * 1.3},${y}Z` }, g);
    return el("circle", { ...a, cx: x, cy: y, r }, g);
  }
  const shapeSvg = (shape, c) => {
    const s = document.createElementNS(NS, "svg"); s.setAttribute("width", 14); s.setAttribute("height", 14);
    marker(s, shape, 7, 7, 5, c); return s.outerHTML;
  };
  const logScale = (d0, d1, r0, r1) => (v) => r0 + (Math.log10(v) - Math.log10(d0)) / (Math.log10(d1) - Math.log10(d0)) * (r1 - r0);
  const linScale = (d0, d1, r0, r1) => (v) => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
  const tk = (v) => v >= 1000 ? (v / 1000) + "k" : String(v);
  // Log domain padded to 1-2-5 steps around the live data, so sliders never push marks off the chart.
  function logDomain(rs) {
    const t = rs.filter((r) => r.use).map((r) => r.tasks);
    if (!t.length) return { lo: 1, hi: 10, ticks: [1, 2, 5, 10] };
    const steps = [];
    for (let e = -2; e <= 6; e++) [1, 2, 5].forEach((m) => steps.push(m * 10 ** e));
    const lo = [...steps].reverse().find((s) => s <= Math.min(...t) * 0.8) || steps[0];
    const hi = steps.find((s) => s >= Math.max(...t) * 1.25) || steps[steps.length - 1];
    return { lo, hi, ticks: steps.filter((s) => s >= lo && s <= hi) };
  }

  // ---------- presets ----------
  function drawPresets(rs) {
    $("#presets").innerHTML = PRESETS.map((p) => {
      const c = bestAt(rs, "claude", p.bar), o = bestAt(rs, "openai", p.bar);
      let res = "No model qualifies";
      if (c && o) { const w = c.tasks >= o.tasks ? [c, o] : [o, c]; res = `${w[0].subName} · ${(w[0].tasks / w[1].tasks).toFixed(2)}×`; }
      else if (c || o) res = `Only ${(c || o).subName}`;
      return `<button type="button" class="preset" data-preset="${p.id}" aria-pressed="${state.preset === p.id}">
        <b>${p.name}</b><span>${p.desc} · index ≥ ${p.bar}</span><span class="mono" style="color:var(--ink)">→ ${res}</span></button>`;
    }).join("");
  }
  $("#presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]");
    if (!b) return;
    const p = PRESETS.find((x) => x.id === b.dataset.preset);
    state.bar = p.bar; state.size = p.size; state.mix = structuredClone(p.mix); state.preset = p.id;
    save(); syncInputs(); render();
    toast(`Scenario: ${p.name}`); flash($("#verdict"));
  });
  const manual = () => { state.preset = null; };

  // ---------- model toggles ----------
  function toggleModel(id) {
    const h = new Set(state.hidden);
    const m = MODELS.find((x) => x.id === id);
    h.has(id) ? h.delete(id) : h.add(id);
    state.hidden = [...h]; save(); render();
    toast(`${m.name} ${h.has(id) ? "hidden" : "shown"}`);
  }
  function drawChips() {
    const hidden = new Set(state.hidden);
    const chips = MODELS.map((m) =>
      `<button type="button" class="chip" data-model="${m.id}" aria-pressed="${!hidden.has(m.id)}"><span class="dot" style="background:${subColor(m.sub)}"></span>${m.name}</button>`).join("");
    $("#modelChips").innerHTML = `<span class="chips-label">Models in play</span>${chips}`;
    $("#legend1").innerHTML = MODELS.map((m) =>
      `<button type="button" data-model="${m.id}" aria-pressed="${!hidden.has(m.id)}">${shapeSvg(m.shape, subColor(m.sub))}${m.name}</button>`).join("")
      + `<span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--ink)" stroke-width="1.5"/></svg>Frontier</span>`;
    $("#legend2").innerHTML = PLANS.map((s) =>
      `<span><svg width="18" height="4"><rect width="18" height="3" rx="1.5" fill="${subColor(s)}"/></svg>${SUBS[s].name}</span>`).join("");
    $("#planFilter").innerHTML = [["all", "All plans"], ["claude", SUBS.claude.name], ["openai", SUBS.openai.name]].map(([k, n]) =>
      `<button type="button" class="chip" data-plan="${k}" aria-pressed="${state.plan === k}">${k === "all" ? "" : `<span class="dot" style="background:${subColor(k)}"></span>`}${n}</button>`).join("");
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-model]");
    if (t && (t.closest("#modelChips") || t.closest("#legend1"))) toggleModel(t.dataset.model);
    const p = e.target.closest("[data-plan]");
    if (p) { state.plan = p.dataset.plan; drawChips(); drawTable(rows()); }
  });

  // ---------- chart 1: scatter (animated between states) ----------
  const lastPos = new Map();
  function drawScatter(rs) {
    const W = 1080, H = 460, L = 52, R = 24, T = 16, B = 44;
    const D = logDomain(rs);
    const x = logScale(D.lo, D.hi, L + 90, W - R), y = linScale(30, 60, H - B, T);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Scatter of intelligence index versus tasks per week" });
    const grid = el("g", {}, svg);
    for (let v = 30; v <= 60; v += 5) {
      el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "var(--grid)" }, grid);
      el("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }, grid).textContent = v;
    }
    D.ticks.forEach((v) => {
      el("line", { x1: x(v), x2: x(v), y1: T, y2: H - B, stroke: "var(--grid)" }, grid);
      el("text", { x: x(v), y: H - B + 18, "text-anchor": "middle" }, grid).textContent = tk(v);
    });
    el("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle" }, grid).textContent = "Tasks finished per week (log scale) →";
    el("text", { x: 14, y: T + 4, transform: `rotate(-90 14 ${T + 4})`, "text-anchor": "end" }, grid).textContent = "AA Intelligence Index ↑";
    // shaded "qualifies" zone above the bar
    el("rect", { x: L, y: T, width: W - R - L, height: Math.max(0, y(state.bar) - T), fill: "var(--grid)", opacity: .45 }, grid);
    el("line", { x1: L, x2: W - R, y1: y(state.bar), y2: y(state.bar), stroke: "var(--ink)", "stroke-dasharray": "3 4", "stroke-width": 1 }, grid);
    el("text", { x: W - R, y: y(state.bar) - 6, "text-anchor": "end" }, grid).textContent = `your bar: ${state.bar}`;

    const lines = el("g", {}, svg), pts = el("g", {}, svg), labels = el("g", {}, svg);
    const anim = { pts: [], lines: [], labels: [] };
    MODELS.forEach((m) => {
      const mr = rs.filter((r) => r.m === m && r.use);
      if (!mr.length) return;
      const pl = el("polyline", { fill: "none", stroke: subColor(m.sub), "stroke-width": 2, "stroke-opacity": .55, "stroke-linejoin": "round" }, lines);
      anim.lines.push({ el: pl, keys: mr.map((r) => r.key) });
      mr.forEach((r) => {
        const to = [x(r.tasks), y(r.ii)];
        const g = el("g", { tabindex: 0, "data-key": r.key, role: "button", "aria-label": `${r.label}: index ${r.ii}, ${fmt(r.tasks)} tasks per week. Pin details.` }, pts);
        if (state.pinned === r.key) el("circle", { cx: 0, cy: 0, r: 15, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, g);
        if (r.frontier) el("circle", { cx: 0, cy: 0, r: 10, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5 }, g);
        marker(g, m.shape, 0, 0, r.ii >= state.bar ? 6 : 5, subColor(m.sub));
        el("circle", { cx: 0, cy: 0, r: 15, fill: "transparent" }, g);
        g.addEventListener("mouseenter", (e) => { showTip(e, r, "Click to pin"); highlight(r.key); });
        g.addEventListener("mousemove", moveTip);
        g.addEventListener("mouseleave", () => { hideTip(); highlight(null); });
        g.addEventListener("click", () => pin(r.key));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(r.key); } });
        g.addEventListener("focus", () => { const b = g.getBoundingClientRect(); showTip({ clientX: b.right, clientY: b.bottom }, r); });
        g.addEventListener("blur", hideTip);
        anim.pts.push({ g, key: r.key, to, from: lastPos.get(r.key) || to });
      });
      const top = mr[mr.length - 1];
      const t = el("text", { class: "lbl", "text-anchor": "end" }, labels);
      t.textContent = m.short;
      anim.labels.push({ el: t, key: top.key, dy: 0 });
    });
    // de-collide end labels at their final positions
    const finalOf = new Map(anim.pts.map((p) => [p.key, p.to]));
    const lf = anim.labels.map((l) => ({ l, x: finalOf.get(l.key)[0] - 14, y: finalOf.get(l.key)[1] + 4 })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < lf.length; i++) {
      if (Math.abs(lf[i].x - lf[i - 1].x) < 90 && lf[i].y - lf[i - 1].y < 15) { lf[i].y = lf[i - 1].y + 15; }
    }
    lf.forEach((o) => { o.l.dy = o.y - (finalOf.get(o.l.key)[1] + 4); });

    const place = (p) => {
      const pos = new Map();
      anim.pts.forEach((a) => {
        const xy = [a.from[0] + (a.to[0] - a.from[0]) * p, a.from[1] + (a.to[1] - a.from[1]) * p];
        pos.set(a.key, xy); a.g.setAttribute("transform", `translate(${xy[0]},${xy[1]})`);
      });
      anim.lines.forEach((l) => l.el.setAttribute("points", l.keys.map((k) => pos.get(k).join(",")).join(" ")));
      anim.labels.forEach((l) => { const xy = pos.get(l.key); l.el.setAttribute("x", xy[0] - 14); l.el.setAttribute("y", xy[1] + 4 + l.dy); });
    };
    const moved = anim.pts.some((a) => a.from[0] !== a.to[0] || a.from[1] !== a.to[1]);
    place(moved && !reduced ? 0 : 1);
    $("#scatter").replaceChildren(svg);
    if (moved && !reduced) {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 420);
        place(1 - Math.pow(1 - p, 3));
        if (p < 1 && svg.isConnected) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    lastPos.clear(); anim.pts.forEach((a) => lastPos.set(a.key, a.to));
  }

  // Linked highlight between table rows and scatter points.
  function highlight(k) {
    const svg = $("#scatter svg");
    if (svg) {
      svg.classList.toggle("focus", !!k);
      svg.querySelectorAll("g[data-key]").forEach((g) => g.classList.toggle("on", g.dataset.key === k));
    }
    $$("#ledger tr[data-key]").forEach((tr) => tr.classList.toggle("on", tr.dataset.key === k));
  }

  // ---------- pinned point ----------
  function pin(k) {
    state.pinned = state.pinned === k ? null : k;
    const rs = rows(); drawScatter(rs); drawPin(rs);
  }
  function drawPin(rs) {
    const r = state.pinned && findRow(rs, state.pinned);
    if (!r) { $("#pin").innerHTML = `<span class="pin-empty">Click any point to pin it here and compare it.</span>`; return; }
    $("#pin").innerHTML = `
      <h3><span class="dot" style="background:${subColor(r.sub)}"></span>${r.m.name} · ${r.v.effort}</h3>
      <dl>
        <div><dt>AA Index</dt><dd>${r.ii}</dd></div>
        <div><dt>Tasks / wk</dt><dd>${fmt(r.tasks)}</dd></div>
        <div><dt>$ / task</dt><dd>${money(r.cost)}</dd></div>
        <div><dt>Speed</dt><dd>${r.speed ?? "—"} tok/s</dd></div>
        <div><dt>Plan</dt><dd style="font-family:var(--f-body)">${r.subName}</dd></div>
      </dl>
      <div class="acts">
        <button class="btn sm" type="button" data-act="bar">Set bar to ${r.ii}</button>
        <button class="btn sm" type="button" data-act="a">Compare as A</button>
        <button class="btn sm" type="button" data-act="b">Compare as B</button>
        <button class="btn sm" type="button" data-act="unpin">Unpin</button>
      </div>`;
  }
  $("#pin").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || !state.pinned) return;
    const act = b.dataset.act, k = state.pinned;
    if (act === "bar") setBar(findRow(rows(), k).ii, true);
    else if (act === "a" || act === "b") setCmp(act, k);
    else pin(k);
  });

  // ---------- chart 2: best tasks/week vs quality bar ----------
  function drawCurve(rs) {
    const W = 1080, H = 380, L = 52, R = 20, T = 16, B = 44;
    const D = logDomain(rs);
    const x = linScale(BAR_MIN, BAR_MAX, L, W - R), y = logScale(D.lo, D.hi, H - B, T);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Best tasks per week by minimum intelligence. Click to set your quality bar." });
    const grid = el("g", {}, svg);
    D.ticks.forEach((v) => {
      el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "var(--grid)" }, grid);
      el("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }, grid).textContent = tk(v);
    });
    for (let v = BAR_MIN; v <= BAR_MAX; v += 2) el("text", { x: x(v), y: H - B + 18, "text-anchor": "middle" }, grid).textContent = v;
    el("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, stroke: "var(--rule)" }, grid);
    el("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle" }, grid).textContent = "Minimum AA Intelligence Index you accept → (click to set)";

    // winner band strip along the top
    for (let b = BAR_MIN; b <= BAR_MAX; b++) {
      const c = bestAt(rs, "claude", b), o = bestAt(rs, "openai", b);
      const w = c && o ? (c.tasks >= o.tasks ? "claude" : "openai") : c ? "claude" : o ? "openai" : null;
      if (w) el("rect", { x: x(Math.max(BAR_MIN, b - 0.5)), y: T - 12, width: x(Math.min(BAR_MAX, b + 0.5)) - x(Math.max(BAR_MIN, b - 0.5)), height: 5, fill: subColor(w), opacity: .8 }, grid);
    }
    const hover = el("line", { x1: 0, x2: 0, y1: T, y2: H - B, stroke: "var(--ink-3)", "stroke-width": 1, opacity: 0 }, svg);
    el("line", { x1: x(state.bar), x2: x(state.bar), y1: T, y2: H - B, stroke: "var(--ink)", "stroke-dasharray": "3 4", "stroke-width": 1.2 }, svg);

    PLANS.forEach((s) => {
      const segs = []; let cur = [];
      for (let b = BAR_MIN; b <= BAR_MAX; b++) {
        const r = bestAt(rs, s, b);
        if (r) cur.push([b, r]); else if (cur.length) { segs.push(cur); cur = []; }
      }
      if (cur.length) segs.push(cur);
      segs.forEach((seg) => {
        let d = "";
        seg.forEach(([b, r], i) => {
          const xs = x(Math.max(BAR_MIN, b - 0.5)), xe = x(Math.min(BAR_MAX, b + 0.5)), yy = y(r.tasks);
          d += (i === 0 ? `M${xs},${yy}` : `L${xs},${yy}`) + `L${xe},${yy}`;
        });
        el("path", { d, fill: "none", stroke: subColor(s), "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      });
      const r = bestAt(rs, s, state.bar);
      if (r) {
        el("circle", { cx: x(state.bar), cy: y(r.tasks), r: 5, fill: subColor(s), stroke: "var(--panel)", "stroke-width": 2 }, svg);
        const t = el("text", { class: "lbl", x: x(state.bar) + 10, y: y(r.tasks) + (s === "claude" ? -8 : 16) }, svg);
        t.textContent = `${r.label} · ${fmt(r.tasks)}`;
        if (x(state.bar) > W - 260) { t.setAttribute("x", x(state.bar) - 10); t.setAttribute("text-anchor", "end"); }
      }
    });
    // One full-height hit column per integer score: hover shows both plans, click sets the bar.
    const hits = el("g", {}, svg);
    for (let b = BAR_MIN; b <= BAR_MAX; b++) {
      const c = el("rect", { x: x(b - 0.5), y: T, width: x(1) - x(0), height: H - B - T, fill: "transparent", style: "cursor:pointer" }, hits);
      c.addEventListener("mouseenter", (e) => {
        const cl = bestAt(rs, "claude", b), op = bestAt(rs, "openai", b);
        hover.setAttribute("x1", x(b)); hover.setAttribute("x2", x(b)); hover.setAttribute("opacity", 1);
        tip.innerHTML = `<b>Minimum index ${b}</b><br><span class="mono">${SUBS.claude.name}: ${cl ? fmt(cl.tasks) + " · " + cl.label : "none"}<br>${SUBS.openai.name}: ${op ? fmt(op.tasks) + " · " + op.label : "none"}</span><br><span style="opacity:.7">Click to set as your bar</span>`;
        tip.style.opacity = 1; moveTip(e);
      });
      c.addEventListener("mousemove", moveTip);
      c.addEventListener("mouseleave", () => { hideTip(); hover.setAttribute("opacity", 0); });
      c.addEventListener("click", () => setBar(b, true));
    }
    $("#curve").replaceChildren(svg);

    const bands = []; let prev = null;
    for (let b = BAR_MIN; b <= BAR_MAX; b++) {
      const c = bestAt(rs, "claude", b), o = bestAt(rs, "openai", b);
      const w = c && o ? (c.tasks >= o.tasks ? "claude" : "openai") : c ? "claude" : o ? "openai" : null;
      if (prev && prev.w === w) prev.to = b; else { prev = { w, from: b, to: b }; bands.push(prev); }
    }
    const live = bands.filter((x) => x.w);
    $("#bands").innerHTML = live.length ? "Who finishes more tasks: " + live.map((x) =>
      `<strong>${SUBS[x.w].name}</strong> at ${x.from === x.to ? x.from : x.from + "–" + x.to}`).join(" · ") + "." : "No models selected.";
  }

  // ---------- verdict meter + unit chart ----------
  function buildVerdict() {
    $("#meter").innerHTML = PLANS.map((s) => `
      <div class="bar-label">${SUBS[s].name}<small id="vm-${s}"></small></div>
      <div class="track"><div class="fill" id="vf-${s}" style="width:0;background:${subColor(s)}"></div>
      <span class="fill-val"><span id="vn-${s}"></span> tasks/wk</span></div>`).join("");
    $("#units").innerHTML = `<div class="units-head"><span id="unitsHead"></span><span id="unitsKey"></span></div>` +
      PLANS.map((s) => `<div class="unit-row"><span>${SUBS[s].name}</span><div class="unit-grid" id="ug-${s}" aria-hidden="true"></div></div>`).join("");
  }
  let lastUnit = null;
  function drawVerdict(rs) {
    const bar = state.bar;
    const best = { claude: bestAt(rs, "claude", bar), openai: bestAt(rs, "openai", bar) };
    const max = Math.max(...PLANS.map((s) => best[s] ? best[s].tasks : 0)) || 1;
    PLANS.forEach((s) => {
      const r = best[s];
      $(`#vm-${s}`).textContent = r ? `${r.m.name} · ${r.v.effort} (index ${r.ii})` : "No model reaches this score";
      $(`#vf-${s}`).style.width = (r ? Math.max(2, r.tasks / max * 100) : 0) + "%";
      tween($(`#vn-${s}`), r ? r.tasks : 0, (v) => r ? fmt(v) : "—");
    });
    const c = best.claude, o = best.openai;
    let line;
    if (c && o) {
      const w = c.tasks >= o.tasks ? [c, o] : [o, c];
      line = `At index ${bar} or higher, <strong>${w[0].subName}</strong> finishes <strong>${(w[0].tasks / w[1].tasks).toFixed(2)}×</strong> as many tasks, using ${w[0].m.name} at ${w[0].v.effort} effort.`;
    } else if (c || o) {
      const r = c || o;
      line = `At index ${bar} or higher, only <strong>${r.subName}</strong> has a model that qualifies: ${r.m.name} at ${r.v.effort} effort.`;
    } else line = `No selected model reaches index ${bar}.`;
    $("#verdictLine").innerHTML = (state.era === "before" ? '<span class="pill" style="margin:0 8px 0 0">Before 6.1 Sol</span>' : "") + line;
    $("#barOut").textContent = bar; $("#bar").value = bar;
    $("#bar2Out").textContent = bar; $("#bar2").value = bar;

    // unit chart: one square = `unit` tasks
    const UNITS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
    const unit = UNITS.find((u) => max / u <= 160) || UNITS[UNITS.length - 1];
    $("#unitsHead").textContent = `A week of work at index ≥ ${bar}`;
    $("#unitsKey").innerHTML = `Each <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--ink-3);vertical-align:-1px"></span> = ${unit.toLocaleString("en-US")} tasks`;
    PLANS.forEach((s) => {
      const g = $(`#ug-${s}`), r = best[s];
      const exact = r ? r.tasks / unit : 0, full = Math.floor(exact), part = exact - full >= 0.25 ? 1 : 0;
      const n = full + part;
      if (unit !== lastUnit) g.replaceChildren();
      const have = g.children.length;
      for (let i = n; i < have; i++) g.lastElementChild.remove();
      for (let i = have; i < n; i++) {
        const sq = document.createElement("i");
        sq.style.background = subColor(s);
        sq.className = "in";
        sq.style.animationDelay = Math.min(600, (i - have) * 5) + "ms";
        g.appendChild(sq);
      }
      [...g.children].forEach((sq, i) => sq.classList.toggle("part", part === 1 && i === n - 1));
    });
    lastUnit = unit;

    // topbar scoreboard
    $("#score").innerHTML = PLANS.map((s) => {
      const r = best[s], other = best[s === "claude" ? "openai" : "claude"];
      const lose = !r || (other && other.tasks > r.tasks);
      return `<span class="${lose ? "lose" : ""}" style="border-left-color:${subColor(s)}">${s === "claude" ? "Claude" : "OpenAI"} ${r ? fmt(r.tasks) : "—"}</span>`;
    }).join("");
  }

  function setBar(b, announce) {
    const v = clamp(Math.round(b), BAR_MIN, BAR_MAX);
    if (v === state.bar && !announce) return;
    state.bar = v; manual(); save();
    const rs = rows(); drawVerdict(rs); drawScatter(rs); drawCurve(rs); drawPresets(rs);
    if (announce) { toast(`Quality bar set to ${v}`); flash($("#verdict")); }
  }

  // ---------- build your week ----------
  function mixOptions(sub, all) {
    return MODELS.filter((m) => m.sub === sub && (all || state.era === "after" || m.id !== NEW_MODEL)).flatMap((m) => m.variants
      .filter((v) => v.ii != null && v.cost != null)
      .map((v) => ({ key: key(m, v), m, v, text: `${m.short} · ${v.effort} (index ${v.ii})` })));
  }
  function computeMix(sub) {
    const opts = mixOptions(sub), cfg = state.mix[sub];
    // Before 6.1 Sol existed, fall back to the same effort on GPT-6 Sol.
    const pick = (k, dflt) => opts.find((o) => o.key === k) || opts.find((o) => o.key === k.replace(NEW_MODEL, "gpt-6-sol")) || dflt;
    const main = pick(cfg.main, opts[0]);
    const hard = pick(cfg.hard, opts[opts.length - 1]);
    const w = clamp(cfg.h, 0, 100) / 100, sz = size();
    // share of the weekly limit one task uses on each model
    const fM = main.v.cost * sz / weekValue(main.m), fH = hard.v.cost * sz / weekValue(hard.m);
    let n = 1 / ((1 - w) * fM + w * fH);
    // per-model limit caps (Fable) can stop the week early
    const use = {};
    use[main.m.id] = (use[main.m.id] || 0) + (1 - w) * fM;
    use[hard.m.id] = (use[hard.m.id] || 0) + w * fH;
    let capped = null;
    Object.keys(use).forEach((id) => {
      const m = MODELS.find((x) => x.id === id), cap = limitCap(m);
      if (use[id] > 0 && n * use[id] > cap + 1e-9) { n = cap / use[id]; capped = m; }
      if (!Number.isFinite(n)) n = 0;
    });
    const shareMain = n * (1 - w) * fM, shareHard = n * w * fH;
    return { main, hard, w, n, nMain: n * (1 - w), nHard: n * w, shareMain, shareHard, unused: Math.max(0, 1 - shareMain - shareHard), capped };
  }
  function buildMixUI() {
    $("#mix").innerHTML = PLANS.map((sub) => {
      const opts = mixOptions(sub).map((o) => `<option value="${o.key}">${o.text}</option>`).join("");
      return `<div class="mix-card" data-sub="${sub}">
        <h3><span class="dot" style="background:${subColor(sub)}"></span>${SUBS[sub].name}</h3>
        <label for="mixMain-${sub}">Routine tasks<select id="mixMain-${sub}" data-f="main">${opts}</select></label>
        <label for="mixHard-${sub}">Hard tasks<select id="mixHard-${sub}" data-f="hard">${opts}</select></label>
        <label for="mixH-${sub}"><span>Share of tasks that are hard: <b class="mono" id="mixHOut-${sub}"></b></span>
          <input type="range" id="mixH-${sub}" data-f="h" min="0" max="100" step="5"></label>
        <div class="mix-total"><span id="mixN-${sub}"></span><small>tasks / week</small></div>
        <div class="mix-split" id="mixSplit-${sub}"></div>
        <div class="stack" id="mixStack-${sub}" aria-hidden="true"></div>
        <p class="mix-note" id="mixNote-${sub}"></p>
      </div>`;
    }).join("");
    $("#mix").addEventListener("input", (e) => {
      const card = e.target.closest("[data-sub]"), f = e.target.dataset.f;
      if (!card || !f) return;
      state.mix = structuredClone(state.mix);
      state.mix[card.dataset.sub][f] = f === "h" ? +e.target.value : e.target.value;
      manual(); save(); drawMix(); drawPresets(rows());
    });
  }
  let mixEra = null;
  function drawMix() {
    const res = {};
    if (mixEra !== state.era) {
      PLANS.forEach((sub) => {
        const html = mixOptions(sub).map((o) => `<option value="${o.key}">${o.text}</option>`).join("");
        $(`#mixMain-${sub}`).innerHTML = html; $(`#mixHard-${sub}`).innerHTML = html;
      });
      mixEra = state.era;
    }
    PLANS.forEach((sub) => {
      const r = res[sub] = computeMix(sub), cfg = state.mix[sub];
      $(`#mixMain-${sub}`).value = r.main.key;
      $(`#mixHard-${sub}`).value = r.hard.key;
      $(`#mixH-${sub}`).value = cfg.h;
      $(`#mixHOut-${sub}`).textContent = cfg.h + "%";
      tween($(`#mixN-${sub}`), r.n, fmt);
      $(`#mixSplit-${sub}`).innerHTML =
        `<span>Routine · ${r.main.text}</span><b>${fmt(r.nMain)}</b>` +
        `<span>Hard · ${r.hard.text}</span><b>${fmt(r.nHard)}</b>`;
      const c = subColor(sub);
      $(`#mixStack-${sub}`).innerHTML =
        (r.shareMain > 0 ? `<div style="width:${r.shareMain * 100}%;background:${c};opacity:.55"></div>` : "") +
        (r.shareHard > 0 ? `<div style="width:${r.shareHard * 100}%;background:${c}"></div>` : "") +
        (r.unused > 0.005 ? `<div class="unused" style="width:${r.unused * 100}%"></div>` : "");
      $(`#mixNote-${sub}`).textContent = r.capped
        ? `${r.capped.short} hits its ${Math.round(limitCap(r.capped) * 100)}% limit cap. ${Math.round(r.unused * 100)}% of the week goes unused at this mix.`
        : `Weekly limit: light = routine, solid = hard.`;
    });
    const c = res.claude, o = res.openai;
    const w = c.n >= o.n ? ["claude", c, o] : ["openai", o, c];
    const lead = w[2].n > 0 ? `finishes <strong>${(w[1].n / w[2].n).toFixed(2)}×</strong> as many tasks` : "is the only one that finishes any tasks";
    $("#mixVerdict").innerHTML = `With this mix, <strong>${SUBS[w[0]].name}</strong> ${lead}. Hard tasks run at index ${c.hard.v.ii} on Claude and ${o.hard.v.ii} on OpenAI.`;
  }

  // ---------- head to head ----------
  function buildCmpUI() {
    const opts = PLANS.map((s) => `<optgroup label="${SUBS[s].name}">` + mixOptions(s, true).map((o) => `<option value="${o.key}">${o.text}</option>`).join("") + `</optgroup>`).join("");
    $("#cmpA").innerHTML = opts; $("#cmpB").innerHTML = opts;
    $("#cmpA").addEventListener("change", (e) => setCmp("a", e.target.value, true));
    $("#cmpB").addEventListener("change", (e) => setCmp("b", e.target.value, true));
    $("#swap").addEventListener("click", () => {
      state.cmp = { a: state.cmp.b, b: state.cmp.a }; save(); drawCmp(rows()); drawTable(rows()); toast("Swapped A and B");
    });
  }
  function setCmp(side, k, quiet) {
    state.cmp = { ...state.cmp, [side]: k }; save();
    const rs = rows(); drawCmp(rs); drawTable(rs);
    if (!quiet) { toast(`${findRow(rs, k).label} loaded as ${side.toUpperCase()}`); flash($("#compare .panel")); }
  }
  const CMP = [
    { k: "ii", name: "Intelligence", sub: "AA Index", hi: true, f: (v) => String(v) },
    { k: "tasks", name: "Tasks / week", sub: "at your budgets", hi: true, f: fmt },
    { k: "cost", name: "Cost / task", sub: "list API price", hi: false, f: money },
    { k: "speed", name: "Speed", sub: "output tok/s", hi: true, f: (v) => String(v) },
    { k: "ipd", name: "Index pts / $", sub: "efficiency", hi: true, f: (v) => v.toFixed(0) },
  ];
  function drawCmp(rs) {
    const A = findRow(rs, state.cmp.a) || rs.find((r) => r.ok), B = findRow(rs, state.cmp.b) || rs.filter((r) => r.ok)[1];
    $("#cmpA").value = A.key; $("#cmpB").value = B.key;
    const grid = $("#cmpGrid");
    if (!grid.children.length) {
      grid.innerHTML = CMP.map((m) => `<div class="cmp-row" data-m="${m.k}">
        <div class="cmp-side a"><div class="cmp-track"><div class="cmp-fill"></div></div><span class="cmp-val"></span></div>
        <div class="cmp-metric">${m.name}<small>${m.sub}</small></div>
        <div class="cmp-side b"><div class="cmp-track"><div class="cmp-fill"></div></div><span class="cmp-val"></span></div></div>`).join("");
    }
    CMP.forEach((m) => {
      const row = grid.querySelector(`[data-m="${m.k}"]`);
      const av = A[m.k], bv = B[m.k], mx = Math.max(av || 0, bv || 0) || 1;
      const win = av == null || bv == null || av === bv ? null : (m.hi ? av > bv : av < bv) ? "a" : "b";
      [["a", A, av], ["b", B, bv]].forEach(([side, r, v]) => {
        const s = row.querySelector(`.cmp-side.${side}`);
        s.querySelector(".cmp-fill").style.width = (v == null ? 0 : v / mx * 100) + "%";
        s.querySelector(".cmp-fill").style.background = subColor(r.sub);
        const val = s.querySelector(".cmp-val");
        val.classList.toggle("win", win === side);
        if (v == null) { val._v = undefined; val.textContent = "—"; } else tween(val, v, m.f);
      });
    });
    const dI = A.ii - B.ii, rT = A.tasks / B.tasks;
    const smart = dI === 0 ? "is as smart as" : `is ${Math.abs(dI)} point${Math.abs(dI) === 1 ? "" : "s"} ${dI > 0 ? "smarter than" : "less smart than"}`;
    const vol = !Number.isFinite(rT) || B.tasks === 0 ? "" : Math.abs(rT - 1) < 0.005 ? " and finishes the same number of tasks" :
      rT > 1 ? ` and finishes <strong>${Math.round((rT - 1) * 100)}% more</strong> tasks per week` : ` and finishes <strong>${Math.round((1 - rT) * 100)}% fewer</strong> tasks per week`;
    $("#cmpSum").innerHTML = `<strong>${A.label}</strong> ${smart} <strong>${B.label}</strong>${vol}.`;
  }

  // ---------- table ----------
  function drawTable(rs) {
    const k = state.sortK, d = state.sortDir;
    const shown = rs.filter((r) => state.plan === "all" || r.sub === state.plan);
    const sorted = [...shown].sort((a, b) => {
      if (a.use !== b.use) return a.use ? -1 : 1;
      const av = a[k], bv = b[k];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; if (bv == null) return -1;
      return typeof av === "string" ? d * av.localeCompare(bv) : d * (av - bv);
    });
    const live = rs.filter((r) => r.use);
    const maxT = live.length ? Math.max(...live.map((r) => r.tasks)) : 1;
    const minT = live.length ? Math.min(...live.map((r) => r.tasks)) : 1;
    const barW = (t) => Math.max(3, maxT === minT ? 60 : Math.log(t / minT) / Math.log(maxT / minT) * 60 + 3);
    let rank = 0;
    $("#ledger tbody").innerHTML = sorted.map((r) => `
      <tr data-key="${r.key}" class="${r.use ? "" : "off"}">
        <td class="n">${r.use ? ++rank : ""}</td>
        <td><span class="dot" style="background:${subColor(r.sub)}"></span><a href="${r.v.src}" target="_blank" rel="noopener">${r.m.name}</a> · ${r.v.effort}${r.frontier && r.use ? ' <span class="pill" title="No other option is at least as smart and finishes more tasks">Frontier</span>' : ""}</td>
        <td>${r.subName}</td>
        <td class="n">${r.ii ?? "—"}</td>
        <td class="n">${money(r.cost)}</td>
        <td class="n">${r.speed ?? "—"}</td>
        <td class="n">$${r.m.price.in} · $${r.m.price.out}</td>
        <td class="n">$${fmt(r.budget)}</td>
        <td class="n">${fmt(r.tasks)}${r.use ? `<span class="minibar" style="width:${barW(r.tasks)}px;background:${subColor(r.sub)}"></span>` : ""}</td>
        <td class="n">${r.ipd == null ? "—" : r.ipd.toFixed(0)}</td>
        <td>${r.ok ? `<span class="cmp-btns"><button type="button" data-cmp="a" aria-pressed="${state.cmp.a === r.key}" aria-label="Compare ${r.label} as A">A</button><button type="button" data-cmp="b" aria-pressed="${state.cmp.b === r.key}" aria-label="Compare ${r.label} as B">B</button></span>` : ""}</td>
      </tr>`).join("");
    $$("#ledger th button").forEach((b) => {
      if (b.dataset.k === k) b.setAttribute("aria-sort", d < 0 ? "descending" : "ascending"); else b.removeAttribute("aria-sort");
    });
  }
  const tbody = $("#ledger tbody");
  tbody.addEventListener("mouseover", (e) => { const tr = e.target.closest("tr[data-key]"); if (tr) highlight(tr.dataset.key); });
  tbody.addEventListener("mouseleave", () => highlight(null));
  tbody.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cmp]");
    if (b) setCmp(b.dataset.cmp, b.closest("tr").dataset.key);
  });

  // ---------- assumptions ----------
  const FIELDS = [
    { k: "claude", r: "#rClaude", n: "#nClaude", max: 5000 },
    { k: "fable", r: "#rFable", n: "#nFable", max: 100 },
    { k: "sol", r: "#rSol", n: "#nSol", max: 5000 },
    { k: "astra", r: "#rAstra", n: "#nAstra", max: 5000 },
  ];
  function syncInputs() {
    FIELDS.forEach((f) => {
      $(f.r).value = state[f.k];
      if (document.activeElement !== $(f.n)) $(f.n).value = state[f.k];
    });
    $("#rSize").value = state.size;
    $("#sizeOut").textContent = size() + "×";
    $("#fableHint").textContent = `Fable alone gets ${Math.round(state.fable)}% of $${fmt(state.claude)} = $${fmt(state.claude * state.fable / 100)}/week.`;
  }
  FIELDS.forEach((f) => {
    $(f.r).addEventListener("input", (e) => { state[f.k] = +e.target.value; save(); syncInputs(); render(); });
    $(f.n).addEventListener("input", (e) => {
      const v = e.target.valueAsNumber;
      if (Number.isFinite(v) && v > 0 && v <= f.max) { state[f.k] = v; save(); syncInputs(); render(); }
    });
    // on commit, snap any out-of-range or empty entry back to a valid value
    $(f.n).addEventListener("change", (e) => {
      const v = e.target.valueAsNumber;
      state[f.k] = Number.isFinite(v) ? clamp(v, f.k === "fable" ? 0 : 1, f.max) : state[f.k];
      e.target.value = state[f.k]; save(); syncInputs(); render();
    });
  });
  $("#rSize").addEventListener("input", (e) => { state.size = +e.target.value; manual(); save(); syncInputs(); render(); });
  $("#reset").addEventListener("click", () => {
    const { sortK, sortDir, plan } = state;
    state = { ...structuredClone(DEFAULTS), sortK, sortDir, plan, pinned: null };
    try { localStorage.removeItem(STORE); } catch (e) {}
    syncInputs(); render(); toast("Reset to defaults");
  });

  // ---------- scroll spy ----------
  const navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => {
          const on = a.getAttribute("href") === "#" + en.target.id;
          a.setAttribute("aria-current", on ? "true" : "false");
          if (on) a.scrollIntoView({ block: "nearest", inline: "nearest" });
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
  }

  // ---------- before / after GPT-6.1 Sol ----------
  const winnerAt = (rs, b) => {
    const c = bestAt(rs, "claude", b), o = bestAt(rs, "openai", b);
    if (!c && !o) return null;
    const w = c && o ? (c.tasks >= o.tasks ? c : o) : c || o, l = w === c ? o : c;
    return { sub: w.sub, w, l, ratio: l ? w.tasks / l.tasks : null };
  };
  function drawChange() {
    const eras = { before: rows("before"), after: rows("after") };
    $$("#eraSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === state.era)));
    const strip = (era) => {
      let cells = "";
      for (let b = BAR_MIN; b <= BAR_MAX; b++) {
        const w = winnerAt(eras[era], b);
        const t = w ? `Index ${b}: ${w.w.subName} via ${w.w.label}${w.ratio ? `, ${w.ratio.toFixed(2)}×` : ""}` : `Index ${b}: no model`;
        cells += `<i title="${t}" style="background:${w ? subColor(w.sub) : "var(--grid)"};opacity:${w && w.ratio && w.ratio < 1.1 ? .55 : 1}"></i>`;
      }
      return `<div class="strip-row${state.era === era ? " cur" : ""}"><span>${era === "before" ? "Before 6.1 Sol" : "After 6.1 Sol"}</span><div class="strip">${cells}</div></div>`;
    };
    let ticks = "";
    for (let b = BAR_MIN; b <= BAR_MAX; b++) ticks += `<span>${b % 2 === 0 ? b : ""}</span>`;
    $("#strips").innerHTML = strip("before") + strip("after") + `<div class="strip-row ticks"><span>Min. index</span><div class="strip">${ticks}</div></div>`;
    const cell = (w) => w ? `<span class="dot" style="background:${subColor(w.sub)}"></span>${w.w.subName}<small>${w.w.label} · ${fmt(w.w.tasks)}${w.ratio ? ` · ${w.ratio.toFixed(2)}×` : " · only option"}</small>` : "—";
    $("#delta tbody").innerHTML = [34, 40, 44, 48, 51, 52, 53, 56].map((b) => {
      const B = winnerAt(eras.before, b), A = winnerAt(eras.after, b);
      const flip = B && A && B.sub !== A.sub;
      return `<tr><td class="n">${b}</td><td>${cell(B)}</td><td>${cell(A)}</td><td>${flip ? '<span class="pill">Flipped</span>' : ""}</td></tr>`;
    }).join("");
  }
  $("#eraSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-era]");
    if (!b || b.dataset.era === state.era) return;
    state.era = b.dataset.era; save(); render();
    toast(state.era === "before" ? "Showing the page before GPT-6.1 Sol" : "Showing the page with GPT-6.1 Sol");
  });

  function render() {
    const rs = rows();
    drawChips(); drawPresets(rs); drawVerdict(rs); drawChange(); drawScatter(rs); drawPin(rs); drawCurve(rs); drawMix(); drawCmp(rs); drawTable(rs);
  }

  // ---------- wiring ----------
  $("#bar").addEventListener("input", (e) => setBar(+e.target.value));
  $("#bar2").addEventListener("input", (e) => setBar(+e.target.value));
  $$("#ledger th button").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.k;
    if (state.sortK === k) state.sortDir *= -1;
    else { state.sortK = k; state.sortDir = ["label", "subName", "cost", "price"].includes(k) ? 1 : -1; }
    drawTable(rows());
  }));
  $("#updated").textContent = "Data snapshot " + window.WSIWI_UPDATED;

  paintThemeBtn();
  buildVerdict();
  buildMixUI();
  buildCmpUI();
  syncInputs();
  render();
})();
