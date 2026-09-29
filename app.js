// Which Sub Is Worth It — rendering and interaction. Data lives in data.js.
(function () {
  const SUBS = window.WSIWI_SUBS, MODELS = window.WSIWI_MODELS;
  const $ = (s) => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (n) => n == null ? "—" : n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString("en-US");
  const money = (n) => n == null ? "—" : "$" + n.toFixed(2);
  const subColor = (s) => `var(--${s})`;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const key = (m, v) => `${m.id}|${v.effort}`;
  const SIZES = [0.25, 0.5, 1, 2, 3, 5, 10, 20, 50];
  const BAR_MIN = 34, BAR_MAX = 58;

  const DEFAULTS = {
    claude: SUBS.claude.weeklyValue,
    fable: SUBS.claude.fableShare * 100,
    sol: SUBS.openai.weeklyValueByModel["gpt-6-sol"],
    astra: SUBS.openai.weeklyValueByModel["gpt-6-astra"],
    size: 2,
    hidden: [],
    bar: 48,
    mix: {
      claude: { main: "claude-sonnet-5-5|high", hard: "claude-opus-5-5|xhigh", h: 20 },
      openai: { main: "gpt-6-sol|xhigh", hard: "gpt-6-astra|max", h: 20 },
    },
  };
  const STORE = "wsiwi-state-v2";
  let state = structuredClone(DEFAULTS);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && typeof saved === "object") state = { ...state, ...saved, mix: { ...state.mix, ...(saved.mix || {}) } };
  } catch (e) {}
  state.sortK = "tasks"; state.sortDir = -1; state.plan = "all";
  const save = () => {
    try {
      const { sortK, sortDir, plan, ...keep } = state;
      localStorage.setItem(STORE, JSON.stringify(keep));
    } catch (e) {}
  };

  // ---------- model economics ----------
  // Full-week $ value if the whole limit went to this model, and the share of the limit it may use.
  function weekValue(m) {
    if (m.sub === "claude") return state.claude;
    return m.id === "gpt-6-sol" ? state.sol : state.astra;
  }
  const limitCap = (m) => m.id === "claude-fable-5-1" ? state.fable / 100 : 1;
  const size = () => SIZES[state.size];

  function rows() {
    const hidden = new Set(state.hidden);
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
  // Log domain padded to 1-2-5 steps around the live data, so the task-size slider never pushes marks off the chart.
  function logDomain(rs) {
    const t = rs.filter((r) => r.use).map((r) => r.tasks);
    if (!t.length) return { lo: 1, hi: 10, ticks: [1, 2, 5, 10] };
    const steps = [];
    for (let e = -2; e <= 6; e++) [1, 2, 5].forEach((m) => steps.push(m * 10 ** e));
    const lo = [...steps].reverse().find((s) => s <= Math.min(...t) * 0.8) || steps[0];
    const hi = steps.find((s) => s >= Math.max(...t) * 1.25) || steps[steps.length - 1];
    return { lo, hi, ticks: steps.filter((s) => s >= lo && s <= hi) };
  }

  // ---------- model toggles ----------
  function toggleModel(id) {
    const h = new Set(state.hidden);
    h.has(id) ? h.delete(id) : h.add(id);
    state.hidden = [...h]; save(); render();
  }
  function drawChips() {
    const hidden = new Set(state.hidden);
    const chips = MODELS.map((m) =>
      `<button type="button" class="chip" data-model="${m.id}" aria-pressed="${!hidden.has(m.id)}"><span class="dot" style="background:${subColor(m.sub)}"></span>${m.name}</button>`).join("");
    $("#modelChips").innerHTML = `<span class="chips-label">Models in play</span>${chips}`;
    $("#legend1").innerHTML = MODELS.map((m) =>
      `<button type="button" data-model="${m.id}" aria-pressed="${!hidden.has(m.id)}">${shapeSvg(m.shape, subColor(m.sub))}${m.name}</button>`).join("")
      + `<span><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="var(--ink)" stroke-width="1.5"/></svg>Frontier</span>`;
    $("#legend2").innerHTML = ["claude", "openai"].map((s) =>
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

  // ---------- chart 1: scatter ----------
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
    el("line", { x1: L, x2: W - R, y1: y(state.bar), y2: y(state.bar), stroke: "var(--ink)", "stroke-dasharray": "3 4", "stroke-width": 1 }, grid);
    el("text", { x: W - R, y: y(state.bar) - 6, "text-anchor": "end" }, grid).textContent = `your bar: ${state.bar}`;

    const lines = el("g", {}, svg), pts = el("g", {}, svg), labels = el("g", {}, svg);
    MODELS.forEach((m) => {
      const mr = rs.filter((r) => r.m === m && r.use);
      if (!mr.length) return;
      el("polyline", { points: mr.map((r) => `${x(r.tasks)},${y(r.ii)}`).join(" "), fill: "none", stroke: subColor(m.sub), "stroke-width": 2, "stroke-opacity": .55, "stroke-linejoin": "round" }, lines);
      mr.forEach((r) => {
        const g = el("g", { tabindex: 0, "data-key": r.key, role: "button", "aria-label": `${r.label}: index ${r.ii}, ${fmt(r.tasks)} tasks per week. Set as quality bar.` }, pts);
        if (r.frontier) el("circle", { cx: x(r.tasks), cy: y(r.ii), r: 10, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5 }, g);
        marker(g, m.shape, x(r.tasks), y(r.ii), 5.5, subColor(m.sub));
        el("circle", { cx: x(r.tasks), cy: y(r.ii), r: 14, fill: "transparent" }, g);
        const pick = () => setBar(r.ii);
        g.addEventListener("mouseenter", (e) => { showTip(e, r, "Click to use this score as your bar"); highlight(r.key); });
        g.addEventListener("mousemove", moveTip);
        g.addEventListener("mouseleave", () => { hideTip(); highlight(null); });
        g.addEventListener("click", pick);
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        g.addEventListener("focus", () => { const b = g.getBoundingClientRect(); showTip({ clientX: b.right, clientY: b.bottom }, r); });
        g.addEventListener("blur", hideTip);
      });
      const top = mr[mr.length - 1];
      el("text", { class: "lbl", x: x(top.tasks) - 14, y: y(top.ii) + 4, "text-anchor": "end" }, labels).textContent = m.short;
    });
    const ls = [...labels.children].sort((a, b) => +a.getAttribute("y") - +b.getAttribute("y"));
    for (let i = 1; i < ls.length; i++) {
      const p = ls[i - 1], c = ls[i];
      if (Math.abs(+p.getAttribute("x") - +c.getAttribute("x")) < 90 && +c.getAttribute("y") - +p.getAttribute("y") < 15) c.setAttribute("y", +p.getAttribute("y") + 15);
    }
    $("#scatter").replaceChildren(svg);
  }

  // Linked highlight between table rows and scatter points.
  function highlight(k) {
    const svg = $("#scatter svg");
    if (svg) {
      svg.classList.toggle("focus", !!k);
      svg.querySelectorAll("g[data-key]").forEach((g) => g.classList.toggle("on", g.dataset.key === k));
    }
    document.querySelectorAll("#ledger tr[data-key]").forEach((tr) => tr.classList.toggle("on", tr.dataset.key === k));
  }

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
    el("line", { x1: x(state.bar), x2: x(state.bar), y1: T, y2: H - B, stroke: "var(--ink)", "stroke-dasharray": "3 4", "stroke-width": 1.2 }, svg);

    ["claude", "openai"].forEach((s) => {
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
        tip.innerHTML = `<b>Minimum index ${b}</b><br><span class="mono">${SUBS.claude.name}: ${cl ? fmt(cl.tasks) + " · " + cl.label : "none"}<br>${SUBS.openai.name}: ${op ? fmt(op.tasks) + " · " + op.label : "none"}</span>`;
        tip.style.opacity = 1; moveTip(e);
      });
      c.addEventListener("mousemove", moveTip);
      c.addEventListener("mouseleave", hideTip);
      c.addEventListener("click", () => setBar(b));
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

  // ---------- verdict meter ----------
  function drawVerdict(rs) {
    const bar = state.bar;
    const c = bestAt(rs, "claude", bar), o = bestAt(rs, "openai", bar);
    const max = Math.max(c ? c.tasks : 0, o ? o.tasks : 0) || 1;
    const row = (s, r) => `
      <div class="bar-label">${SUBS[s].name}<small>${r ? `${r.m.name} · ${r.v.effort} (index ${r.ii})` : "No model reaches this score"}</small></div>
      <div class="track"><div class="fill" style="width:${r ? Math.max(2, r.tasks / max * 100) : 0}%;background:${subColor(s)}"></div>
      <span class="fill-val">${r ? fmt(r.tasks) + " tasks/wk" : "—"}</span></div>`;
    $("#meter").innerHTML = row("claude", c) + row("openai", o);
    let line;
    if (c && o) {
      const w = c.tasks >= o.tasks ? [c, o] : [o, c];
      line = `At index ${bar} or higher, <strong>${w[0].subName}</strong> finishes <strong>${(w[0].tasks / w[1].tasks).toFixed(2)}×</strong> as many tasks, using ${w[0].m.name} at ${w[0].v.effort} effort.`;
    } else if (c || o) {
      const r = c || o;
      line = `At index ${bar} or higher, only <strong>${r.subName}</strong> has a model that qualifies: ${r.m.name} at ${r.v.effort} effort.`;
    } else line = `No selected model reaches index ${bar}.`;
    $("#verdictLine").innerHTML = line;
    $("#barOut").textContent = bar;
    $("#bar").value = bar;
  }

  function setBar(b) {
    state.bar = clamp(Math.round(b), BAR_MIN, BAR_MAX);
    save();
    const rs = rows(); drawVerdict(rs); drawScatter(rs); drawCurve(rs);
  }

  // ---------- build your week ----------
  function mixOptions(sub) {
    return MODELS.filter((m) => m.sub === sub).flatMap((m) => m.variants
      .filter((v) => v.ii != null && v.cost != null)
      .map((v) => ({ key: key(m, v), m, v, text: `${m.short} · ${v.effort} (index ${v.ii})` })));
  }
  function computeMix(sub) {
    const opts = mixOptions(sub), cfg = state.mix[sub];
    const main = opts.find((o) => o.key === cfg.main) || opts[0];
    const hard = opts.find((o) => o.key === cfg.hard) || opts[opts.length - 1];
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
    $("#mix").innerHTML = ["claude", "openai"].map((sub) => {
      const opts = mixOptions(sub).map((o) => `<option value="${o.key}">${o.text}</option>`).join("");
      return `<div class="mix-card" data-sub="${sub}">
        <h3><span class="dot" style="background:${subColor(sub)}"></span>${SUBS[sub].name}</h3>
        <label for="mixMain-${sub}">Routine tasks<select id="mixMain-${sub}" data-f="main">${opts}</select></label>
        <label for="mixHard-${sub}">Hard tasks<select id="mixHard-${sub}" data-f="hard">${opts}</select></label>
        <label for="mixH-${sub}"><span>Share of tasks that are hard: <b class="mono" id="mixHOut-${sub}"></b></span>
          <input type="range" id="mixH-${sub}" data-f="h" min="0" max="100" step="5"></label>
        <div class="mix-total" id="mixTotal-${sub}"></div>
        <div class="mix-split" id="mixSplit-${sub}"></div>
        <div class="stack" id="mixStack-${sub}" aria-hidden="true"></div>
        <p class="mix-note" id="mixNote-${sub}"></p>
      </div>`;
    }).join("");
    $("#mix").addEventListener("input", (e) => {
      const card = e.target.closest("[data-sub]"), f = e.target.dataset.f;
      if (!card || !f) return;
      state.mix[card.dataset.sub][f] = f === "h" ? +e.target.value : e.target.value;
      save(); drawMix();
    });
  }
  function drawMix() {
    const res = {};
    ["claude", "openai"].forEach((sub) => {
      const r = res[sub] = computeMix(sub), cfg = state.mix[sub];
      $(`#mixMain-${sub}`).value = r.main.key;
      $(`#mixHard-${sub}`).value = r.hard.key;
      $(`#mixH-${sub}`).value = cfg.h;
      $(`#mixHOut-${sub}`).textContent = cfg.h + "%";
      $(`#mixTotal-${sub}`).innerHTML = `${fmt(r.n)}<small>tasks / week</small>`;
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
        <td><span class="dot" style="background:${subColor(r.sub)}"></span><a href="${r.v.src}" target="_blank" rel="noopener">${r.m.name}</a> · ${r.v.effort}</td>
        <td>${r.subName}</td>
        <td class="n">${r.ii ?? "—"}</td>
        <td class="n">${money(r.cost)}</td>
        <td class="n">${r.speed ?? "—"}</td>
        <td class="n">$${r.m.price.in} · $${r.m.price.out}</td>
        <td class="n">$${fmt(r.budget)}</td>
        <td class="n">${fmt(r.tasks)}${r.use ? `<span class="minibar" style="width:${barW(r.tasks)}px;background:${subColor(r.sub)}"></span>` : ""}</td>
        <td class="n">${r.ipd == null ? "—" : r.ipd.toFixed(0)}</td>
        <td>${r.frontier && r.use ? '<span class="pill" title="No other option is at least as smart and finishes more tasks">Frontier</span>' : ""}</td>
      </tr>`).join("");
    document.querySelectorAll("#ledger th button").forEach((b) => {
      if (b.dataset.k === k) b.setAttribute("aria-sort", d < 0 ? "descending" : "ascending"); else b.removeAttribute("aria-sort");
    });
  }
  const tbody = $("#ledger tbody");
  tbody.addEventListener("mouseover", (e) => { const tr = e.target.closest("tr[data-key]"); if (tr) highlight(tr.dataset.key); });
  tbody.addEventListener("mouseleave", () => highlight(null));

  // ---------- assumptions ----------
  const FIELDS = [
    { k: "claude", r: "#rClaude", n: "#nClaude", min: 0, max: 5000 },
    { k: "fable", r: "#rFable", n: "#nFable", min: 0, max: 100 },
    { k: "sol", r: "#rSol", n: "#nSol", min: 0, max: 5000 },
    { k: "astra", r: "#rAstra", n: "#nAstra", min: 0, max: 5000 },
  ];
  function syncInputs() {
    FIELDS.forEach((f) => {
      $(f.r).value = state[f.k];
      if (document.activeElement !== $(f.n)) $(f.n).value = state[f.k];
    });
    $("#rSize").value = state.size;
    const s = size();
    $("#sizeOut").textContent = s + "×";
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
  $("#rSize").addEventListener("input", (e) => { state.size = +e.target.value; save(); syncInputs(); render(); });
  $("#reset").addEventListener("click", () => {
    const { sortK, sortDir, plan } = state;
    state = { ...structuredClone(DEFAULTS), sortK, sortDir, plan };
    try { localStorage.removeItem(STORE); } catch (e) {}
    syncInputs(); render();
  });

  function render() {
    const rs = rows();
    drawChips(); drawVerdict(rs); drawScatter(rs); drawCurve(rs); drawMix(); drawTable(rs);
  }

  // ---------- wiring ----------
  $("#bar").addEventListener("input", (e) => setBar(+e.target.value));
  document.querySelectorAll("#ledger th button").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.k;
    if (state.sortK === k) state.sortDir *= -1;
    else { state.sortK = k; state.sortDir = ["label", "subName", "cost", "price"].includes(k) ? 1 : -1; }
    drawTable(rows());
  }));
  $("#updated").textContent = "Data snapshot " + window.WSIWI_UPDATED;

  buildMixUI();
  syncInputs();
  render();
})();
