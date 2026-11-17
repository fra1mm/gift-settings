/* Gift Terminal: клиент. Все данные приходят с локального server.py (только чтение). */
"use strict";

/* ============================== утилиты ============================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem("gt-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("gt-" + k, JSON.stringify(v)); } catch (e) {} },
};
const nf = (d) => new Intl.NumberFormat("ru-RU", {minimumFractionDigits: d, maximumFractionDigits: d});
const num = (v, d = 2) => v == null || isNaN(v) ? "—" : nf(d).format(v);
const pct = (v, d = 1, sign = true) => v == null || isNaN(v) ? "—" : (sign && v > 0 ? "+" : "") + nf(d).format(v) + "%";
const dt = (ts, withYear) => ts ? new Date(ts * 1000).toLocaleString("ru-RU", {day: "2-digit", month: "2-digit", ...(withYear ? {year: "2-digit"} : {}), hour: "2-digit", minute: "2-digit"}) : "—";
const tm = ts => ts ? new Date(ts * 1000).toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit"}) : "—";
const ago = ts => {
  if (!ts) return "—";
  const s = Math.max(0, Date.now() / 1000 - ts);
  if (s < 60) return "только что";
  if (s < 3600) return Math.floor(s / 60) + " мин назад";
  if (s < 86400) return Math.floor(s / 3600) + " ч назад";
  return Math.floor(s / 86400) + " дн назад";
};
const dur = s => {
  if (s == null) return "—";
  if (s < 3600) return Math.round(s / 60) + " мин";
  if (s < 86400) return nf(1).format(s / 3600) + " ч";
  return nf(1).format(s / 86400) + " дн";
};
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const sum = a => a.reduce((x, y) => x + (y || 0), 0);
const img = slug => slug ? `https://nft.fragment.com/gift/${slug.toLowerCase()}.webp` : null;
const nftLink = slug => slug ? `https://t.me/nft/${slug}` : null;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }

/* ============================== иконки ============================== */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  sniper: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  market: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  portfolio: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  trades: '<path d="M7 4v16M7 4 3 8M7 4l4 4"/><path d="M17 20V4M17 20l-4-4M17 20l4-4"/>',
  analytics: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  system: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  x: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M7 4v16l13-8z"/>', stop: '<rect x="5" y="5" width="14" height="14" rx="1.5"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  plug: '<path d="M9 2v6M15 2v6"/><path d="M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>', cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;

/* ============================== данные ============================== */
const cache = {};
async function api(path, {fresh} = {}) {
  if (!fresh && cache[path] && Date.now() - cache[path].t < 4000) return cache[path].d;
  let d;
  if (STATIC) d = await staticApi(path);
  else {
    const r = await fetch("/api/" + path, {cache: "no-store"});
    d = await r.json().catch(() => ({error: "сервер вернул не JSON"}));
    if (!r.ok || d.error) throw new Error(d.error || ("HTTP " + r.status));
  }
  cache[path] = {t: Date.now(), d};
  return d;
}
function resetData() { resetData(); if (STATIC) BUNDLE_T = 0; }

/* ---------- сайт на GitHub Pages: данные лежат одним зашифрованным файлом ---------- */
const STATIC = typeof window.GT_STATIC === "string" ? window.GT_STATIC : null;
let BUNDLE = null, BUNDLE_T = 0, KEY = null;
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function fetchEnc() {
  const r = await fetch(STATIC + "?t=" + Date.now(), {cache: "no-store"});
  if (r.status === 404) throw new Error("Данные ещё не загружены: запусти publish на ПК");
  if (!r.ok) throw new Error("Не удалось скачать данные: HTTP " + r.status);
  return r.json();
}
async function deriveKey(pass, env) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: b64(env.salt), iterations: env.iter}, base, 256);
  return new Uint8Array(bits);
}
async function decrypt(env, raw) {
  const k = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({name: "AES-GCM", iv: b64(env.iv)}, k, b64(env.ct));
  const text = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  return JSON.parse(text);
}
function unlockForm(env, msg = "") {
  return new Promise(resolve => {
    const box = document.createElement("div"); box.className = "lock";
    box.innerHTML = `<form class="lock-card"><img src="logo.svg" alt="" width="36" height="36"><h1>Gift Terminal</h1>
      <p>Данные зашифрованы. Введи пароль, который задал на ПК.</p>
      <input type="password" id="lk-p" autocomplete="current-password" placeholder="Пароль" required>
      <label><input type="checkbox" id="lk-r" checked> запомнить на этом устройстве</label>
      <div class="lock-err">${esc(msg)}</div><button class="btn primary" type="submit">Открыть</button></form>`;
    document.body.appendChild(box); $("#lk-p", box).focus();
    $("form", box).onsubmit = async e => {
      e.preventDefault(); const btn = $("button", box); btn.disabled = true; btn.textContent = "Проверяю…";
      try {
        const raw = await deriveKey($("#lk-p", box).value, env);
        const data = await decrypt(env, raw);
        if ($("#lk-r", box).checked) store.set("key", {salt: env.salt, k: btoa(String.fromCharCode(...raw))});
        box.remove(); resolve({raw, data});
      } catch (err) { btn.disabled = false; btn.textContent = "Открыть"; $(".lock-err", box).textContent = "Неверный пароль"; }
    };
  });
}
async function loadBundle() {
  if (BUNDLE && Date.now() - BUNDLE_T < 300000) return BUNDLE;
  const env = await fetchEnc();
  if (KEY && KEY.salt === env.salt) { BUNDLE = await decrypt(env, KEY.raw); }
  else {
    const saved = store.get("key", null);
    let ok = false;
    if (saved && saved.salt === env.salt) {
      try { const raw = b64(saved.k); BUNDLE = await decrypt(env, raw); KEY = {salt: env.salt, raw}; ok = true; } catch (e) { store.set("key", null); }
    }
    if (!ok) { const r = await unlockForm(env, KEY ? "Пароль сменился, введи новый" : ""); BUNDLE = r.data; KEY = {salt: env.salt, raw: r.raw}; }
  }
  BUNDLE_T = Date.now();
  return BUNDLE;
}
let bundlePromise = null;
async function staticApi(path) {
  if (!bundlePromise) bundlePromise = loadBundle().finally(() => { bundlePromise = null; });
  const B = await bundlePromise;
  const [name, qs] = path.split("?");
  if (name === "gift") {
    const p = new URLSearchParams(qs), col = p.get("collection"), mod = p.get("model") || "";
    const row = B.market.models.find(r => r.collection === col && r.model === mod) || null;
    const sig = B.signals.signals.filter(s => s.collection === col && s.model === mod);
    return {collection: col, model: mod, snapshot: row, slug: row?.slug || sig.find(s => s.slug)?.slug || null,
      sales: (B.sales || []).filter(s => s.collection === col && s.model === mod).slice(-300),
      trades: B.trades.trades.filter(t => t.collection === col && (!mod || t.model === mod)), signals: sig};
  }
  if (!(name in B)) throw new Error("нет данных: " + name);
  return B[name];
}
function lockSite() { store.set("key", null); KEY = null; BUNDLE = null; location.reload(); }

let META = null;

/* валюта: USD по умолчанию, если курс доступен */
let CCY = store.get("ccy", "USD");
function rate() { return META?.rate?.usd || null; }
function money(ton, {sign = false, d} = {}) {
  if (ton == null || isNaN(ton)) return "—";
  const s = sign && ton > 0 ? "+" : ton < 0 ? "−" : "";
  const a = Math.abs(ton);
  if (CCY === "USD" && rate()) return `<span title="${num(ton, 2)} TON">${s}$${num(a * rate(), d ?? 2)}</span>`;
  return `${s}${num(a, d ?? 2)} <span class="dim">TON</span>`;
}
const pnlCls = v => v == null ? "" : v > 0 ? "up" : v < 0 ? "down" : "";

/* ============================== компоненты ============================== */
const need = (text = "нужна интеграция с ботом") => `<span class="need" title="${esc(text)}">${ic("plug")}${esc(text)}</span>`;
const stateBox = (kind, title, text = "") => `<div class="state ${kind === "error" ? "err" : ""}">${ic(kind === "error" ? "alert" : kind === "need" ? "plug" : "help")}<b>${esc(title)}</b>${text ? `<div>${text}</div>` : ""}</div>`;
const empty = (title, text) => stateBox("empty", title, text);
const loading = () => `<div class="skel"></div>`;
function kpi(label, value, sub = "", {cls = "", na = false, title = ""} = {}) {
  return `<div class="kpi ${na ? "na" : ""}" title="${esc(title)}"><div class="l">${label}</div><div class="v ${cls}">${value}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>`;
}
function panel(title, body, {hint = "", actions = "", id = "", flush = false} = {}) {
  return `<section class="panel" ${id ? `id="${id}"` : ""}><div class="panel-h"><div><h2>${title}</h2>${hint ? `<div class="hint">${hint}</div>` : ""}</div><div>${actions}</div></div><div class="${flush ? "" : "panel-b"}">${body}</div></section>`;
}
const banner = (kind, html) => `<div class="banner ${kind}">${ic(kind === "bad" ? "alert" : kind === "warn" ? "alert" : "help")}<div>${html}</div></div>`;
function giftCell(slug, title, sub) {
  const src = img(slug);
  const th = src ? `<img class="thumb" loading="lazy" src="${src}" alt="" onerror="this.outerHTML='<span class=&quot;thumb&quot;>${ic("gift").replace(/"/g, "&quot;")}</span>'">` : `<span class="thumb">${ic("gift")}</span>`;
  return `<div class="gift-cell">${th}<div><div class="strong" style="color:var(--text)">${esc(title)}</div>${sub ? `<div class="sub2">${esc(sub)}</div>` : ""}</div></div>`;
}

/* таблица: сортировка по клику, пагинация */
function table(el, {cols, rows, state, onRow, empty: emptyHtml, pageSize = 100}) {
  if (!rows.length) { el.innerHTML = emptyHtml || empty("Нет записей"); return; }
  const col = cols.find(c => c.k === state.sort);
  const get = col ? (col.v || (r => r[col.k])) : null;
  const sorted = get ? [...rows].sort((a, b) => { const x = get(a), y = get(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * state.dir; }) : rows;
  const lim = state.limit || pageSize;
  el.innerHTML = `<div class="tbl"><table><thead><tr>${cols.map(c => `<th class="${c.r ? "r" : ""}" data-k="${c.k}" title="${esc(c.title || "")}">${c.t}${state.sort === c.k ? (state.dir > 0 ? " ↑" : " ↓") : ""}</th>`).join("")}</tr></thead>
    <tbody>${sorted.slice(0, lim).map((r, i) => `<tr class="${onRow ? "click" : ""}" data-i="${i}">${cols.map(c => `<td class="${c.r ? "r" : ""} ${c.cls || ""}">${c.h ? c.h(r) : esc(r[c.k] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="pager"><span>${sorted.length > lim ? `Показано ${lim} из ${sorted.length}` : `Всего: ${sorted.length}`}</span>${sorted.length > lim ? `<button class="btn" data-more>Показать ещё</button>` : ""}</div>`;
  $$("th", el).forEach(th => th.onclick = () => { const k = th.dataset.k; state.dir = state.sort === k ? -state.dir : -1; state.sort = k; table(el, arguments[1]); });
  const more = $("[data-more]", el); if (more) more.onclick = () => { state.limit = lim + pageSize; table(el, arguments[1]); };
  if (onRow) $$("tbody tr", el).forEach(tr => tr.onclick = e => { if (e.target.closest("a,button")) return; onRow(sorted[+tr.dataset.i]); });
}

/* ============================== графики ============================== */
const charts = new Map();
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function destroyCharts() { charts.forEach(c => c.destroy()); charts.clear(); }
function baseOpts() {
  const grid = css("--line"), txt = css("--muted");
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: {mode: "index", intersect: false},
    plugins: {legend: {display: false}, tooltip: {backgroundColor: css("--panel-2"), borderColor: css("--line-2"), borderWidth: 1, titleColor: css("--text"), bodyColor: css("--text-2"), padding: 10, cornerRadius: 6, displayColors: false, titleFont: {weight: "500"}}},
    scales: {
      x: {grid: {display: false}, border: {color: grid}, ticks: {color: txt, maxRotation: 0, autoSkipPadding: 12, font: {size: 11}}},
      y: {grid: {color: grid}, border: {display: false}, ticks: {color: txt, font: {size: 11, family: "IBM Plex Mono"}}},
    },
  };
}
function mkChart(id, cfg) {
  const el = document.getElementById(id); if (!el) return;
  if (charts.has(id)) charts.get(id).destroy();
  charts.set(id, new Chart(el, cfg));
}
const chartBox = (id, cls = "") => `<div class="chart ${cls}"><canvas id="${id}"></canvas></div>`;
const tonTip = c => money(c.parsed.y ?? c.parsed.x).replace(/<[^>]+>/g, "");
function barPnL(id, labels, values) {
  const o = baseOpts(); o.plugins.tooltip.callbacks = {label: c => tonTip(c)};
  mkChart(id, {type: "bar", data: {labels, datasets: [{data: values.map(v => ccyVal(v)), backgroundColor: values.map(v => v >= 0 ? css("--up") : css("--down")), borderRadius: 3, maxBarThickness: 28}]}, options: withCcyAxis(o)});
}
function lineChart(id, labels, values, {color = "--accent", fill = true} = {}) {
  const o = baseOpts(); o.plugins.tooltip.callbacks = {label: c => tonTip(c)};
  const c = css(color);
  mkChart(id, {type: "line", data: {labels, datasets: [{data: values.map(v => ccyVal(v)), borderColor: c, backgroundColor: c + "1f", fill, borderWidth: 1.8, pointRadius: values.length < 30 ? 3 : 0, pointHoverRadius: 4, tension: .2, stepped: false}]}, options: withCcyAxis(o)});
}
function hbar(id, labels, values, {money: isMoney = true, color} = {}) {
  const o = baseOpts(); o.indexAxis = "y"; o.scales.y.ticks.font = {size: 11}; o.scales.x.grid = {color: css("--line")};
  o.plugins.tooltip.callbacks = {label: c => isMoney ? tonTip({parsed: {y: c.raw / (CCY === "USD" && rate() ? rate() : 1)}}) : String(c.raw)};
  mkChart(id, {type: "bar", data: {labels, datasets: [{data: values.map(v => isMoney ? ccyVal(v) : v), backgroundColor: values.map(v => color ? css(color) : v >= 0 ? css("--up") : css("--down")), borderRadius: 3, maxBarThickness: 18}]}, options: o});
}
function histo(id, labels, counts, color = "--accent", unit = "") {
  const o = baseOpts(); o.plugins.tooltip.callbacks = {label: c => `${c.raw}${unit}`};
  mkChart(id, {type: "bar", data: {labels, datasets: [{data: counts, backgroundColor: css(color), borderRadius: 3, maxBarThickness: 36}]}, options: o});
}
const ccyVal = v => v == null ? null : (CCY === "USD" && rate() ? v * rate() : v);
function withCcyAxis(o) { o.scales.y.ticks.callback = v => (CCY === "USD" && rate() ? "$" : "") + nf(Math.abs(v) < 10 ? 2 : 0).format(v); return o; }
function bucket(values, edges) {
  const labels = edges.slice(0, -1).map((e, i) => edges[i + 1] === Infinity ? `${e}+` : `${e}–${edges[i + 1]}`);
  const counts = labels.map(() => 0);
  for (const v of values) { const i = edges.findIndex((e, j) => v >= e && v < edges[j + 1]); if (i >= 0) counts[i]++; }
  return {labels, counts};
}

/* ============================== страницы ============================== */
const PAGES = [
  {id: "dashboard", t: "Dashboard", icon: "dashboard", grp: "Обзор", sub: "Сводка по боту, прибыли и событиям"},
  {id: "sniper", t: "Sniper", icon: "sniper", grp: "Торговля", sub: "Параметры автопокупки и найденные лоты"},
  {id: "market", t: "Market", icon: "market", grp: "Торговля", sub: "Срез рынка MRKT по коллекциям и моделям"},
  {id: "portfolio", t: "Portfolio", icon: "portfolio", grp: "Торговля", sub: "Подарки, купленные ботом"},
  {id: "trades", t: "Trades", icon: "trades", grp: "Торговля", sub: "История покупок и продаж"},
  {id: "analytics", t: "Analytics", icon: "analytics", grp: "Аналитика", sub: "Результаты торговли за период"},
  {id: "system", t: "System", icon: "system", grp: "Система", sub: "Состояние бота, MRKT и базы"},
  {id: "settings", t: "Settings", icon: "settings", grp: "Система", sub: "Настройки бота и панели"},
];
const S = {}; // состояние фильтров по страницам
const st = (p, d) => S[p] || (S[p] = d);

/* ---------- Dashboard ---------- */
async function pageDashboard(el) {
  el.innerHTML = `<div id="d-banner"></div><div class="kpis" id="d-kpi">${loading()}</div>
  <div class="grid g-2-1">
    <div class="stack">
      <div class="grid g2">
        ${panel("Накопленный PnL", chartBox("c-cum", "sm"), {hint: "реализованная прибыль после комиссий", id: "p-cum"})}
        ${panel("PnL по дням", chartBox("c-daily", "sm"), {hint: "по дате продажи", id: "p-daily"})}
        ${panel("Покупки и продажи", chartBox("c-bs", "sm"), {hint: "штук в день", id: "p-bs"})}
        ${panel("Прибыль по коллекциям", chartBox("c-col", "sm"), {hint: "реализованная", id: "p-col"})}
      </div>
    </div>
    ${panel("Живая лента", `<div class="feed" id="d-feed">${loading()}</div>`, {hint: "события бота из базы и лога", flush: true, actions: `<a class="btn" href="#/system">${ic("system")}Система</a>`})}
  </div>`;
  try {
    const [o, sys, ev] = await Promise.all([api("overview"), api("system"), api("events?limit=120")]);
    const k = o.kpi;
    if (sys.mrkt.status === "banned") $("#d-banner").innerHTML = banner("bad", `<b>MRKT заблокировал аккаунт бота</b> (403 banned, ${dt(sys.mrkt.first_ban)}). Панель работает только на чтение и к MRKT не обращается. ${sys.mrkt.auth_attempts_after_ban > 1 ? `После бана бот ещё ${sys.mrkt.auth_attempts_after_ban} раз пытался войти: <a href="#/system">подробнее</a>.` : ""}`);
    $("#d-kpi").innerHTML = [
      kpi(`${ic("coin")}Баланс`, need("бот не сохраняет баланс"), "", {na: true}),
      kpi("Реализованная прибыль", money(k.realized, {sign: true}), `${k.sales} продаж`, {cls: pnlCls(k.realized)}),
      kpi("Нереализованная", money(k.unrealized, {sign: true}), "оценка по цене выставления", {cls: pnlCls(k.unrealized)}),
      kpi("Сегодня", money(k.today, {sign: true}), "", {cls: pnlCls(k.today)}),
      kpi("7 дней", money(k.week, {sign: true}), "", {cls: pnlCls(k.week)}),
      kpi("30 дней", money(k.month, {sign: true}), "", {cls: pnlCls(k.month)}),
      kpi("Покупок", num(k.purchases, 0)), kpi("Продаж", num(k.sales, 0)),
      kpi("В инвентаре", num(k.inventory, 0), money(k.invested_open) + " вложено"),
      kpi("Win rate", k.win_rate == null ? "—" : pct(k.win_rate, 0, false), k.sales ? `из ${k.sales} закрытых` : "нет закрытых сделок"),
      kpi("Средняя скидка", k.avg_discount == null ? "—" : pct(k.avg_discount, 1, false), "к оценке при покупке"),
    ].join("");
    const D = o.daily;
    if (o.has_closed) {
      lineChart("c-cum", D.map(d => d.day.slice(5)), D.map(d => d.cum), {color: "--up"});
      barPnL("c-daily", D.map(d => d.day.slice(5)), D.map(d => d.pnl));
      hbar("c-col", o.by_collection.map(c => c.collection), o.by_collection.map(c => c.pnl));
    } else {
      ["p-cum", "p-daily", "p-col"].forEach(id => $(`#${id} .panel-b`).innerHTML = empty("Нет закрытых сделок", "График появится после первой продажи"));
    }
    if (D.length) {
      const o2 = baseOpts(); o2.plugins.legend = {display: true, position: "top", align: "end", labels: {color: css("--text-2"), boxWidth: 8, boxHeight: 8, font: {size: 11}}};
      o2.scales.y.ticks.precision = 0;
      mkChart("c-bs", {type: "bar", data: {labels: D.map(d => d.day.slice(5)), datasets: [
        {label: "покупки", data: D.map(d => d.buys), backgroundColor: css("--accent"), borderRadius: 3, maxBarThickness: 22},
        {label: "продажи", data: D.map(d => d.sells), backgroundColor: css("--up"), borderRadius: 3, maxBarThickness: 22}]}, options: o2});
    } else $("#p-bs .panel-b").innerHTML = empty("Нет сделок");
    renderFeed($("#d-feed"), ev.events);
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось загрузить данные", esc(e.message)); }
}
const EV = {
  gift_detected: ["Найден лот", "zap", "info"], purchase: ["Покупка", "cart", "ok"], sale: ["Продажа", "coin", "ok"],
  offer: ["Оффер", "mail", "info"], api_error: ["Ошибка API", "alert", "bad"], rate_limit: ["Лимит запросов", "alert", "warn"],
  warning: ["Предупреждение", "alert", "warn"], auth: ["Вход MRKT", "lock", "ok"], bot_started: ["Бот запущен", "play", "ok"],
  bot_stopped: ["Бот остановлен", "stop", "warn"], db_backup: ["Бэкап базы", "db", "ok"],
};
function renderFeed(el, events) {
  const f = store.get("feed-filter", "all");
  const rows = events.filter(e => f === "all" || (f === "trade" ? ["purchase", "sale", "offer", "gift_detected"].includes(e.type) : ["api_error", "rate_limit", "warning"].includes(e.type)));
  el.innerHTML = `<div class="filters" style="padding:10px 14px 0;margin:0"><div class="seg" id="feed-seg">
    ${[["all", "Все"], ["trade", "Торговля"], ["err", "Ошибки"]].map(([k, t]) => `<button data-k="${k}" class="${f === k ? "on" : ""}">${t}</button>`).join("")}</div></div>` +
    (rows.length ? rows.slice(0, 150).map(e => {
      const [name, icon, cls] = EV[e.type] || [e.type, "help", ""];
      const status = e.status === "ban" ? "bad" : cls;
      return `<div class="ev"><div class="t" title="${dt(e.ts)}">${tm(e.ts)}<br><span style="font-size:12px">${new Date(e.ts * 1000).toLocaleDateString("ru-RU", {day: "2-digit", month: "2-digit"})}</span></div>
        <div class="i ${status}">${ic(icon)}</div>
        <div><div class="txt">${esc(e.text)}</div><div class="meta">${name}${e.http ? ` · HTTP ${e.http}` : ""}${e.repeat ? ` · повторялось ${e.repeat} раз с ${tm(e.first_ts)}` : ""} · <span class="src">${e.source === "db" ? "база" : "лог"}</span></div></div>
        <div class="p">${e.price != null ? money(e.price) : ""}${e.pct != null ? `<div class="up" style="font-size:12px">${pct(e.pct)}</div>` : ""}</div></div>`;
    }).join("") : empty("Событий нет"));
  $$("#feed-seg button", el).forEach(b => b.onclick = () => { store.set("feed-filter", b.dataset.k); renderFeed(el, events); });
}

/* ---------- Sniper ---------- */
async function pageSniper(el) {
  const fs = st("sniper", {q: "", decision: "", col: "", minDisc: "", sort: "ts", dir: -1});
  el.innerHTML = `<div class="grid g3" id="sn-top">${loading()}</div><div class="section-t">Найденные лоты</div><div id="sn-table">${loading()}</div>`;
  try {
    const [set, sig, sys] = await Promise.all([api("settings"), api("signals"), api("system")]);
    const v = set.values, src = set.source;
    const banned = sys.mrkt.status === "banned";
    const reason = banned ? "MRKT заблокировал аккаунт бота. Запуск из панели отключён" : "У бота нет интерфейса управления: запуск через start.bat";
    const param = (label, key, fmt) => `<div class="k">${label}</div><div class="v">${v[key] == null ? "—" : fmt ? fmt(v[key]) : esc(v[key])}${src[key] ? `<span class="src">${src[key]}</span>` : ""}</div>`;
    $("#sn-top").innerHTML =
      panel("Управление", `
        ${banned ? `<div class="inline-alert">${ic("alert")}<div><b>Аккаунт заблокирован MRKT.</b> Автоматические запросы к MRKT должны быть остановлены до ручного решения с поддержкой.</div></div>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          <button class="btn" disabled title="${esc(reason)}">${ic("play")}Запустить</button>
          <button class="btn" disabled title="${esc(reason)}">${ic("stop")}Остановить</button>
          <button class="btn" disabled title="${esc(reason)}">${ic("pause")}Пауза</button>
        </div>
        <div class="kv">
          <div class="k">Бот</div><div class="v"><span class="dot ${sys.bot.running ? "ok" : ""}"></span> ${sys.bot.running ? "пишет в лог" : "остановлен"}</div>
          <div class="k">Учебный режим (без покупок)</div><div class="v">${v.SNIPER_DRY_RUN ? '<span class="tag up">включён</span>' : '<span class="tag down">выключен</span>'}</div>
          <div class="k">Автопокупка</div><div class="v">${v.AUTOBUY ? '<span class="tag warn">AUTOBUY=1</span>' : '<span class="tag">выкл</span>'}</div>
          <div class="k">Снайпер</div><div class="v">${v.SNIPER ? "SNIPER=1" : "выкл"}</div>
        </div>
        <div style="margin-top:12px">${need("кнопки заработают, когда у бота появится команда управления")}</div>`, {hint: "только просмотр"}) +
      panel("Параметры покупки", `<div class="kv">
        ${param("Мин. скидка к рынку", "SNIPER_MIN_DISCOUNT_PCT", x => pct(x, 0, false))}
        ${param("Макс. цена покупки", "SNIPER_MAX_PRICE_TON", x => num(x) + " TON")}
        ${param("Бюджет одной покупки", "SNIPER_MAX_BUY_TON", x => num(x) + " TON")}
        ${param("Бюджет на сутки", "SNIPER_DAILY_BUDGET_TON", x => x ? num(x) + " TON" : "без лимита")}
        ${param("Мин. подтверждающих продаж", "SNIPER_MIN_SALES")}
        ${param("Макс. разброс цен продаж", "SNIPER_MAX_SPREAD_PCT", x => pct(x, 0, false))}
        ${param("Макс. возраст оценки", "SNIPER_MAX_DATA_AGE_SEC", x => num(x, 0) + " с")}
        ${param("Разрешённые коллекции", "SNIPER_ALLOW", x => x ? esc(x) : "все")}
        ${param("Исключённые коллекции", "COLLECTIONS_SKIP", x => x ? esc(x) : "нет")}
      </div><div style="margin-top:10px" class="sub2">Меняются командой <span class="mono">/set</span> в Telegram или в <a href="#/settings">Settings</a>.</div>`, {hint: "из settings_override.json, .env и safe_sniper.py"}) +
      panel("Защита покупки", [
        ["Нет оценки рынка", "Safe Sniper не покупает модель без оценки по реальным продажам"],
        ["Оценка устарела", `старше SNIPER_MAX_DATA_AGE_SEC (${v.SNIPER_MAX_DATA_AGE_SEC ?? "?"} с): покупка запрещена`],
        ["Цены противоречат друг другу", `разброс продаж выше ${v.SNIPER_MAX_SPREAD_PCT ?? "?"}%: модель пропускается`],
        ["Цену лота нельзя проверить", v.SNIPER_REQUIRE_PRICE_VALIDATION ? "перед заявкой цена проверяется повторно" : "повторная проверка выключена"],
        ["Скидка меньше порога", `меньше ${v.SNIPER_MIN_DISCOUNT_PCT ?? "?"}%: пропуск`],
        ["Превышен бюджет", "резерв бюджета атомарный, свежий баланс обязателен"],
      ].map(([a, b]) => `<div class="check">${ic("ok", "up")}<div><b>${a}</b><div class="d">${esc(b)}</div></div></div>`).join(""), {hint: "правила в safe_sniper.py"});

    const S2 = sig.signals;
    const cols = [...new Set(S2.map(s => s.collection))].sort();
    const tbl = $("#sn-table");
    tbl.innerHTML = `<div class="filters">
      <input class="grow" placeholder="Поиск по коллекции, модели, фону" id="sn-q" value="${esc(fs.q)}">
      <select id="sn-col"><option value="">Все коллекции</option>${cols.map(c => `<option ${fs.col === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <select id="sn-dec"><option value="">Все решения</option><option value="signal" ${fs.decision === "signal" ? "selected" : ""}>Сигнал</option><option value="skip" ${fs.decision === "skip" ? "selected" : ""}>Пропуск</option></select>
      <input type="number" id="sn-min" placeholder="Скидка от, %" style="width:120px" value="${esc(fs.minDisc)}">
    </div><div class="panel" id="sn-t"></div>
    <div class="sub2" style="margin-top:8px">Источник: таблица <span class="mono">signals</span> в базе бота. Символ и свежесть цены бот не сохраняет. «Решение» здесь означает решение по сигналу; реальных заявок Safe Sniper в базе нет.</div>`;
    const draw = () => {
      const qq = fs.q.toLowerCase(), md = parseFloat(fs.minDisc);
      const rows = S2.filter(s => (!qq || [s.collection, s.model, s.backdrop].join(" ").toLowerCase().includes(qq)) && (!fs.col || s.collection === fs.col) && (!fs.decision || s.decision === fs.decision) && (isNaN(md) || (s.discount ?? -1) >= md));
      table($("#sn-t"), {state: fs, rows, onRow: s => openGift(s.collection, s.model), empty: empty("Лотов нет", "Бот ещё не нашёл ни одного лота"), cols: [
        {k: "title", t: "Подарок", h: s => giftCell(s.slug, s.collection, s.model + (s.number ? " · #" + s.number : ""))},
        {k: "symbol", t: "Символ", h: () => '<span class="dim">нет данных</span>'},
        {k: "backdrop", t: "Фон"},
        {k: "price", t: "Цена лота", r: 1, h: s => `<b>${money(s.price)}</b>`},
        {k: "est_value", t: "Оценка рынка", r: 1, title: "оценка бота, не цена сделки", h: s => money(s.est_value)},
        {k: "discount", t: "Скидка", r: 1, h: s => `<span class="${s.discount >= 20 ? "up" : ""}">${pct(s.discount, 1, false)}</span>`},
        {k: "pct", t: "Прибыль", r: 1, h: s => `<span class="${pnlCls(s.pct)}">${pct(s.pct)}</span>`},
        {k: "fresh", t: "Свежесть цены", h: () => '<span class="dim">нет данных</span>'},
        {k: "reasons", t: "Проверка", v: s => s.reasons.length, h: s => s.reasons.length ? s.reasons.map(r => `<span class="tag warn" title="${esc(r)}">${esc(r)}</span>`).join(" ") : '<span class="tag up">пройдена</span>'},
        {k: "ts", t: "Найден", h: s => dt(s.ts)},
        {k: "decision", t: "Решение", h: s => s.decision === "signal" ? '<span class="tag acc">сигнал</span>' : '<span class="tag">пропуск</span>'},
      ]});
    };
    const bind = (id, key) => $(id).addEventListener("input", e => { fs[key] = e.target.value; fs.limit = 0; draw(); });
    bind("#sn-q", "q"); bind("#sn-col", "col"); bind("#sn-dec", "decision"); bind("#sn-min", "minDisc");
    draw();
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось загрузить данные", esc(e.message)); }
}

/* ---------- Market ---------- */
async function pageMarket(el) {
  const fs = st("market", {tab: "collections", q: "", onlyVal: true, sort: "sales", dir: -1});
  el.innerHTML = loading();
  try {
    const m = await api("market");
    const M = m.models;
    const cmap = new Map();
    for (const r of M) {
      let c = cmap.get(r.collection); if (!c) cmap.set(r.collection, c = {collection: r.collection, sales: 0, models: 0, vals: [], slug: null, rare: 0});
      c.sales += r.sales; c.models++; if (r.value != null) c.vals.push(r.value); if (!c.slug && r.slug) c.slug = r.slug; if (r.rare) c.rare++;
    }
    const COLS = [...cmap.values()].map(c => ({...c, median: median(c.vals), min: c.vals.length ? Math.min(...c.vals) : null, volume: null}));
    const fresh = m.snapshot_mtime ? ago(m.snapshot_mtime) : "—";
    el.innerHTML = `
      ${banner("warn", `<b>Данные рынка неполные.</b> Срез sniper_rules.csv (${fresh}): число продаж и медиана за 72 ч по моделям. Флор, активные лоты, объём и изменение цен за 1ч/24ч/7д бот не сохраняет. Продаж в таблице <span class="mono">sales</span>: ${m.sales_count}. ${need("нужна история продаж и лотов")}`)}
      <div class="kpis">
        ${kpi("Продаж в срезе", num(sum(M.map(x => x.sales)), 0), "MRKT, 72 ч")}
        ${kpi("Коллекций", num(COLS.length, 0), `${num(M.length, 0)} моделей`)}
        ${kpi("Моделей с оценкой", num(M.filter(x => x.value != null).length, 0))}
        ${kpi("Медиана модели", money(median(M.filter(x => x.value != null).map(x => x.value))), "оценка, не сделка")}
        ${kpi("Флор", need("нет данных"), "", {na: true})}
        ${kpi("Активных лотов", need("нет данных"), "", {na: true})}
      </div>
      <div class="grid g3">
        ${panel("Продажи и объём по дням", m.daily.length ? chartBox("m-vol", "sm") : stateBox("need", "Нет истории продаж", "таблица sales пустая"), {hint: "реальные продажи"})}
        ${panel("Средняя цена продажи по дням", m.daily.length ? chartBox("m-avg", "sm") : stateBox("need", "Нет истории продаж"), {hint: "реальные продажи"})}
        ${panel("Скидки найденных лотов", m.signal_discounts.length ? chartBox("m-disc", "sm") : empty("Нет сигналов"), {hint: "к оценке бота, %"})}
      </div>
      <div class="filters" style="margin-top:16px">
        <div class="seg" id="m-tab">${[["collections", "Коллекции"], ["models", "Модели"], ["backdrops", "Фоны"], ["symbols", "Символы"]].map(([k, t]) => `<button data-k="${k}" class="${fs.tab === k ? "on" : ""}">${t}</button>`).join("")}</div>
        <input class="grow" id="m-q" placeholder="Поиск" value="${esc(fs.q)}">
        <label><input type="checkbox" id="m-ok" ${fs.onlyVal ? "checked" : ""}> только с оценкой</label>
      </div>
      <div class="panel" id="m-t"></div>`;
    if (m.daily.length) {
      const L = m.daily.map(d => d.day.slice(5));
      const o = baseOpts(); o.scales.y.ticks.precision = 0;
      mkChart("m-vol", {type: "bar", data: {labels: L, datasets: [{data: m.daily.map(d => d.sales), backgroundColor: css("--accent"), borderRadius: 3}]}, options: o});
      lineChart("m-avg", L, m.daily.map(d => d.avg));
    }
    if (m.signal_discounts.length) { const b = bucket(m.signal_discounts, [0, 5, 10, 15, 20, 30, 50, Infinity]); histo("m-disc", b.labels, b.counts, "--accent", " лотов"); }
    const draw = () => {
      const qq = fs.q.toLowerCase();
      const t = $("#m-t");
      if (fs.tab === "collections") {
        const rows = COLS.filter(c => (!qq || c.collection.toLowerCase().includes(qq)) && (!fs.onlyVal || c.median != null));
        table(t, {state: fs, rows, onRow: c => openCollection(c.collection, M), cols: [
          {k: "collection", t: "Коллекция", h: c => giftCell(c.slug, c.collection, `${c.models} моделей`)},
          {k: "min", t: "Флор", r: 1, h: () => '<span class="dim">нет данных</span>'},
          {k: "median", t: "Медиана оценок", r: 1, title: "медиана оценок моделей по продажам, не флор", h: c => `<b>${money(c.median)}</b>`},
          {k: "minv", t: "Дешёвая модель", r: 1, v: c => c.min, h: c => money(c.min)},
          {k: "sales", t: "Продаж 72 ч", r: 1, h: c => num(c.sales, 0)},
          {k: "s24", t: "Продаж 24 ч", r: 1, h: () => '<span class="dim">нет данных</span>'},
          {k: "listings", t: "Лотов", r: 1, h: () => '<span class="dim">нет данных</span>'},
          {k: "chg", t: "1ч / 24ч / 7д", r: 1, h: () => '<span class="dim">нет данных</span>'},
        ]});
      } else if (fs.tab === "models") {
        const rows = M.filter(r => (!qq || (r.collection + " " + r.model).toLowerCase().includes(qq)) && (!fs.onlyVal || r.value != null));
        table(t, {state: fs, rows, onRow: r => openGift(r.collection, r.model), cols: [
          {k: "model", t: "Модель", h: r => giftCell(r.slug, r.model, r.collection)},
          {k: "value", t: "Оценка", r: 1, title: "оценка Safe Sniper по продажам", h: r => `<b>${money(r.value)}</b>`},
          {k: "median", t: "Медиана продаж", r: 1, h: r => money(r.median)},
          {k: "sales", t: "Продаж 72 ч", r: 1, h: r => num(r.sales, 0)},
          {k: "spread", t: "Разброс", r: 1, h: r => r.spread == null ? "—" : `<span class="tag ${r.spread <= 10 ? "up" : r.spread > 30 ? "down" : ""}">${pct(r.spread, 1, false)}</span>`},
          {k: "max_buy", t: "Макс. покупка", r: 1, h: r => money(r.max_buy)},
          {k: "basis", t: "Основание", h: r => `<span class="sub2">${r.rare ? "редкая · " : ""}${esc(r.basis)}</span>`},
        ]});
      } else {
        const list = fs.tab === "backdrops" ? m.backdrops : m.symbols;
        if (!list.length) { t.innerHTML = stateBox("need", fs.tab === "backdrops" ? "Нет данных по фонам" : "Нет данных по символам", "Появятся, когда в таблице sales будут продажи"); return; }
        table(t, {state: fs, rows: list.map(([k, n]) => ({k, n})), cols: [{k: "k", t: fs.tab === "backdrops" ? "Фон" : "Символ"}, {k: "n", t: "Продаж", r: 1}]});
      }
    };
    $$("#m-tab button").forEach(b => b.onclick = () => { fs.tab = b.dataset.k; fs.sort = fs.tab === "collections" || fs.tab === "models" ? "sales" : "n"; fs.dir = -1; fs.limit = 0; $$("#m-tab button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    $("#m-q").oninput = e => { fs.q = e.target.value; fs.limit = 0; draw(); };
    $("#m-ok").onchange = e => { fs.onlyVal = e.target.checked; draw(); };
    draw();
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось загрузить рынок", esc(e.message)); }
}

/* ---------- Drawer: подарок / коллекция ---------- */
function openDrawer(html) { $("#drawer").innerHTML = html; $("#drawer").classList.add("open"); $("#drawer-bg").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); const c = $("#drawer [data-close]"); if (c) c.onclick = closeDrawer; }
function closeDrawer() { $("#drawer").classList.remove("open"); $("#drawer-bg").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); charts.forEach((c, k) => { if (k.startsWith("dr-")) { c.destroy(); charts.delete(k); } }); }
$("#drawer-bg").onclick = closeDrawer;
addEventListener("keydown", e => e.key === "Escape" && closeDrawer());
const dHead = (slug, title, sub) => `<div class="drawer-h">${img(slug) ? `<img src="${img(slug)}" alt="" onerror="this.outerHTML='<span class=&quot;thumb&quot;></span>'">` : `<span class="thumb">${ic("gift")}</span>`}<div style="flex:1;min-width:0"><h2>${esc(title)}</h2><div class="sub2">${sub}</div></div><button class="btn icon" data-close title="Закрыть">${ic("close")}</button></div>`;

async function openGift(collection, model) {
  openDrawer(dHead(null, model || collection, esc(collection)) + `<div class="drawer-b">${loading()}</div>`);
  try {
    const g = await api(`gift?collection=${encodeURIComponent(collection)}&model=${encodeURIComponent(model || "")}`);
    const s = g.snapshot;
    const link = nftLink(g.slug);
    openDrawer(dHead(g.slug, model, `${esc(collection)}${link ? ` · <a href="${link}" target="_blank" rel="noopener">пример в Telegram ${ic("ext")}</a>` : ""}`) + `<div class="drawer-b">
      <div class="kpis">
        ${kpi("Оценка рынка", s?.value != null ? money(s.value) : "—", "оценка Safe Sniper, не сделка")}
        ${kpi("Медиана продаж", s?.median != null ? money(s.median) : "—", s ? `${s.sales} продаж за 72 ч` : "")}
        ${kpi("Макс. покупка", s?.max_buy != null ? money(s.max_buy) : "—", s?.discount_req ? `скидка ${pct(s.discount_req, 0, false)}` : "")}
        ${kpi("Флор", need("нет данных"), "", {na: true})}
      </div>
      ${panel("История цены продаж", g.sales.length ? chartBox("dr-sales") : stateBox("need", "Нет продаж этой модели в базе", "таблица sales пустая"), {hint: "реальные продажи, TON"})}
      ${panel("Последние продажи", g.sales.length ? `<div id="dr-st"></div>` : empty("Нет продаж"), {flush: true})}
      ${panel("Активные лоты", stateBox("need", "Бот не хранит активные лоты", "нужна интеграция: снимок лотов модели"), {flush: true})}
      ${panel("Сигналы бота", g.signals.length ? g.signals.map(x => `<div class="ev"><div class="t">${tm(x.ts)}</div><div class="i info">${ic("zap")}</div><div><div class="txt">${esc(x.title)}</div><div class="meta">оценка ${money(x.est_value)}</div></div><div class="p">${money(x.price)}<div class="up" style="font-size:12px">${pct(x.pct)}</div></div></div>`).join("") : empty("Сигналов не было"), {flush: true})}
      ${panel("Сделки бота", g.trades.length ? g.trades.map(t => `<div class="ev"><div class="t">${tm(t.buy_ts)}</div><div class="i ok">${ic("cart")}</div><div><div class="txt">${esc(t.title)}</div><div class="meta">купил ${money(t.cost)}${t.sale_price != null ? ` · продал ${money(t.sale_price)}` : ""}</div></div><div class="p ${pnlCls(t.net_profit ?? t.unrealized)}">${money(t.net_profit ?? t.unrealized, {sign: true})}</div></div>`).join("") : empty("Бот эту модель не покупал"), {flush: true})}
    </div>`);
    if (g.sales.length) {
      const o = baseOpts(); o.scales.x = {type: "linear", grid: {display: false}, ticks: {color: css("--muted"), callback: v => new Date(v * 1000).toLocaleDateString("ru-RU", {day: "2-digit", month: "2-digit"})}};
      o.plugins.tooltip.callbacks = {title: c => dt(c[0].raw.x), label: c => money(c.raw.y / (CCY === "USD" && rate() ? rate() : 1)).replace(/<[^>]+>/g, "")};
      mkChart("dr-sales", {type: "scatter", data: {datasets: [{data: g.sales.map(x => ({x: x.ts, y: ccyVal(x.price)})), backgroundColor: css("--accent"), pointRadius: 3}]}, options: withCcyAxis(o)});
      table($("#dr-st"), {state: {sort: "ts", dir: -1}, rows: g.sales.map(x => ({...x})), pageSize: 30, cols: [
        {k: "ts", t: "Когда", h: x => dt(x.ts)}, {k: "backdrop", t: "Фон"}, {k: "symbol", t: "Символ"}, {k: "number", t: "№"},
        {k: "price", t: "Цена", r: 1, h: x => `<b>${money(x.price)}</b>`}]});
    }
  } catch (e) { $("#drawer .drawer-b").innerHTML = stateBox("error", "Не удалось загрузить подарок", esc(e.message)); }
}
function openCollection(name, M) {
  const ms = M.filter(r => r.collection === name).sort((a, b) => b.sales - a.sales);
  openDrawer(dHead(ms.find(x => x.slug)?.slug, name, `${ms.length} моделей · ${num(sum(ms.map(x => x.sales)), 0)} продаж за 72 ч`) + `<div class="drawer-b">
    ${panel("Оценка по моделям", chartBox("dr-col"), {hint: "оценка Safe Sniper, TON"})}
    <div class="panel" id="dr-ct"></div></div>`);
  const wv = ms.filter(x => x.value != null).sort((a, b) => b.value - a.value).slice(0, 25);
  if (wv.length) { $("#dr-col").parentElement.style.height = Math.max(200, wv.length * 20) + "px"; hbar("dr-col", wv.map(x => x.model), wv.map(x => x.value), {color: "--accent"}); }
  else $("#dr-col").parentElement.outerHTML = empty("Нет моделей с оценкой");
  table($("#dr-ct"), {state: {sort: "sales", dir: -1}, rows: ms, onRow: r => openGift(r.collection, r.model), pageSize: 50, cols: [
    {k: "model", t: "Модель", h: r => giftCell(r.slug, r.model)}, {k: "sales", t: "Продаж", r: 1},
    {k: "value", t: "Оценка", r: 1, h: r => money(r.value)}, {k: "max_buy", t: "Макс. покупка", r: 1, h: r => money(r.max_buy)}]});
}

/* ---------- Portfolio ---------- */
async function pagePortfolio(el) {
  const fs = st("portfolio", {q: "", status: "open", sort: "buy_ts", dir: -1});
  el.innerHTML = loading();
  try {
    const d = await api("trades");
    const T = d.trades.filter(t => t.mode === "real");
    const open = T.filter(t => !t.sell_ts);
    const closed = T.filter(t => t.net_profit != null);
    const invested = sum(open.map(t => t.cost + t.buy_fee));
    const valued = open.filter(t => t.est_value);
    const noEst = open.length - valued.length;
    const value = sum(valued.map(t => t.est_value * (1 - t.fee_sell_pct / 100)));
    const unreal = sum(valued.map(t => t.unrealized));
    const investedValued = sum(valued.map(t => t.cost + t.buy_fee));
    el.innerHTML = `<div class="kpis">
      ${kpi("Вложено", money(invested), `${open.length} позиций`)}
      ${kpi("Стоимость портфеля", money(value), noEst ? `без оценки: ${noEst} шт., в сумму не входят` : "оценка по цене выставления, после комиссии")}
      ${kpi("Нереализованная прибыль", money(unreal, {sign: true}), investedValued ? pct(unreal / investedValued * 100) + (noEst ? " · только с оценкой" : "") : "", {cls: pnlCls(unreal)})}
      ${kpi("Реализованная прибыль", money(sum(closed.map(t => t.net_profit)), {sign: true}), `${closed.length} продаж`, {cls: pnlCls(sum(closed.map(t => t.net_profit)))})}
      ${kpi("Активных позиций", num(open.length, 0))}
    </div>
    <div class="filters"><input class="grow" id="pf-q" placeholder="Поиск по названию" value="${esc(fs.q)}">
      <div class="seg" id="pf-s">${[["open", "Активные"], ["sold", "Проданные"], ["all", "Все"]].map(([k, t]) => `<button data-k="${k}" class="${fs.status === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <button class="btn" disabled title="Бот выставляет и снижает цену сам; ручное управление из панели не поддерживается">${ic("lock")}Выставить / продать</button>
    </div>
    <div class="panel" id="pf-t"></div>
    <div class="sub2" style="margin-top:8px">Комиссия продажи MRKT ${num(d.trades[0]?.fee_sell_pct ?? 5, 0)}% учтена во всех суммах. Ручное выставление: ${need("нужна команда в боте")}</div>`;
    const draw = () => {
      const qq = fs.q.toLowerCase();
      const rows = T.filter(t => (!qq || (t.title || "").toLowerCase().includes(qq)) && (fs.status === "all" || (fs.status === "open" ? !t.sell_ts : !!t.sell_ts)));
      table($("#pf-t"), {state: fs, rows, onRow: t => openTrade(t, d.offers), empty: empty(fs.status === "open" ? "Нет активных позиций" : "Нет записей"), cols: [
        {k: "title", t: "Подарок", h: t => giftCell(t.slug, t.collection, t.model)},
        {k: "cost", t: "Покупка", r: 1, h: t => `<b>${money(t.cost)}</b>`},
        {k: "est_value", t: "Оценка сейчас", r: 1, title: "цена выставления в боте", h: t => t.sell_ts ? money(t.sale_price) : t.est_value ? money(t.est_value) : '<span class="dim">нет оценки</span>'},
        {k: "unrealized", t: "PnL", r: 1, v: t => t.net_profit ?? t.unrealized, h: t => `<span class="${pnlCls(t.net_profit ?? t.unrealized)}">${money(t.net_profit ?? t.unrealized, {sign: true})}</span>${t.sell_ts ? "" : ' <span class="src">оценка</span>'}`},
        {k: "roi", t: "ROI", r: 1, v: t => t.roi ?? t.unrealized_roi, h: t => `<span class="${pnlCls(t.roi ?? t.unrealized_roi)}">${pct(t.roi ?? t.unrealized_roi)}</span>`},
        {k: "buy_ts", t: "Куплен", h: t => dt(t.buy_ts)},
        {k: "holding", t: "Держим", v: t => t.holding ?? t.duration, h: t => dur(t.holding ?? t.duration)},
        {k: "best_offer", t: "Лучший оффер", r: 1, h: t => t.best_offer ? money(t.best_offer) : "—"},
        {k: "state", t: "Статус", h: t => statusTag(t)},
      ]});
    };
    $("#pf-q").oninput = e => { fs.q = e.target.value; draw(); };
    $$("#pf-s button").forEach(b => b.onclick = () => { fs.status = b.dataset.k; $$("#pf-s button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    draw();
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось загрузить портфель", esc(e.message)); }
}
function statusTag(t) {
  if (t.sell_ts) return `<span class="tag up">продан</span>${t.source === "manual" ? ' <span class="src">вручную</span>' : ""}`;
  if (t.source === "manual") return '<span class="tag">в портфеле</span> <span class="src">вручную</span>';
  if (t.state === "listed") return '<span class="tag acc">выставлен</span>';
  if (t.state === "closed") return '<span class="tag">закрыт</span>';
  return `<span class="tag">${esc(t.state || "куплен")}</span>`;
}
function openTrade(t, offers) {
  const of = (offers || []).filter(o => o.trade_id === t.id);
  openDrawer(dHead(t.slug, t.title, `${esc(t.collection)} · ${esc(t.market || "")}`) + `<div class="drawer-b">
    <div class="kpis">${kpi("Покупка", money(t.cost), dt(t.buy_ts))}${kpi(t.sell_ts ? "Продажа" : "Выставлен за", money(t.sell_ts ? t.sale_price : t.est_value), t.sell_ts ? dt(t.sell_ts) : "")}
    ${kpi(t.sell_ts ? "Чистая прибыль" : "PnL (оценка)", money(t.net_profit ?? t.unrealized, {sign: true}), pct(t.roi ?? t.unrealized_roi), {cls: pnlCls(t.net_profit ?? t.unrealized)})}</div>
    ${panel("Детали", `<div class="kv">
      <div class="k">ID подарка</div><div class="v" style="font-size:12px">${esc(t.gift_id || "—")}</div>
      <div class="k">Комиссия покупки</div><div class="v">${money(t.buy_fee)}</div>
      <div class="k">Комиссия продажи</div><div class="v">${t.sell_fee != null ? money(t.sell_fee) : num(t.fee_sell_pct, 0) + "%"}</div>
      <div class="k">Скидка при покупке</div><div class="v">${pct(t.discount, 1, false)}</div>
      <div class="k">${t.sell_ts ? "Срок сделки" : "Держим"}</div><div class="v">${dur(t.duration ?? t.holding)}</div>
      <div class="k">Источник</div><div class="v">${t.source === "manual" ? "manual_trades.json (вручную)" : "база бота"}</div>
      ${t.note ? `<div class="k">Заметка</div><div class="v" style="font-family:inherit">${esc(t.note)}</div>` : ""}
    </div>`)}
    ${panel("Офферы", of.length ? of.map(o => `<div class="ev"><div class="t">${tm(o.ts)}</div><div class="i info">${ic("mail")}</div><div><div class="txt">${money(o.ton)}</div><div class="meta">${pct((o.ton / t.cost - 1) * 100)} к цене покупки · ${o.accepted ? "принят" : "не принят"}</div></div><div></div></div>`).join("") : empty("Офферов не было"), {flush: true})}
    <div><button class="btn" onclick="openGift(${esc(JSON.stringify(t.collection))}, ${esc(JSON.stringify(t.model))})">${ic("market")}Рынок этой модели</button></div>
  </div>`);
}

/* ---------- Trades ---------- */
async function pageTrades(el) {
  const fs = st("trades", {kind: "all", col: "", from: "", to: "", sort: "buy_ts", dir: -1});
  el.innerHTML = loading();
  try {
    const d = await api("trades");
    const T = d.trades.filter(t => t.mode === "real");
    const cols = [...new Set(T.map(t => t.collection))].sort();
    el.innerHTML = `<div class="filters">
      <div class="seg" id="tr-k">${[["all", "Все"], ["buy", "Покупки"], ["sell", "Продажи"], ["win", "Прибыльные"], ["loss", "Убыточные"]].map(([k, t]) => `<button data-k="${k}" class="${fs.kind === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <select id="tr-col"><option value="">Все коллекции</option>${cols.map(c => `<option ${fs.col === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <label>с <input type="date" id="tr-from" value="${fs.from}"></label><label>по <input type="date" id="tr-to" value="${fs.to}"></label>
      <span style="flex:1"></span><button class="btn" id="tr-csv">${ic("download")}CSV</button>
    </div><div class="panel" id="tr-t"></div>`;
    const filtered = () => {
      const f = fs.from ? new Date(fs.from).getTime() / 1000 : 0, to = fs.to ? new Date(fs.to).getTime() / 1000 + 86400 : Infinity;
      return T.filter(t => (!fs.col || t.collection === fs.col) && t.buy_ts >= f && t.buy_ts < to &&
        (fs.kind === "all" || (fs.kind === "buy" && !t.sell_ts) || (fs.kind === "sell" && t.sell_ts) || (fs.kind === "win" && t.net_profit > 0) || (fs.kind === "loss" && t.net_profit < 0)));
    };
    const draw = () => table($("#tr-t"), {state: fs, rows: filtered(), onRow: t => openTrade(t, d.offers), empty: empty("Сделок нет", "под выбранные фильтры ничего не подходит"), cols: [
      {k: "gift_id", t: "ID", h: t => `<span class="mono" title="${esc(t.gift_id)}">${esc((t.gift_id || "").slice(0, 8))}</span>`},
      {k: "collection", t: "Подарок", h: t => giftCell(t.slug, t.collection, t.model)},
      {k: "cost", t: "Покупка", r: 1, h: t => `<b>${money(t.cost)}</b>`},
      {k: "sale_price", t: "Продажа", r: 1, h: t => money(t.sale_price)},
      {k: "fees", t: "Комиссии", r: 1, v: t => (t.buy_fee || 0) + (t.sell_fee || 0), h: t => money((t.buy_fee || 0) + (t.sell_fee || 0))},
      {k: "net_profit", t: "Чистая прибыль", r: 1, h: t => `<span class="${pnlCls(t.net_profit)}">${money(t.net_profit, {sign: true})}</span>`},
      {k: "roi", t: "ROI", r: 1, h: t => `<span class="${pnlCls(t.roi)}">${pct(t.roi)}</span>`},
      {k: "buy_ts", t: "Куплен", h: t => dt(t.buy_ts, true)},
      {k: "sell_ts", t: "Продан", h: t => dt(t.sell_ts, true)},
      {k: "duration", t: "Срок", h: t => dur(t.duration)},
      {k: "discount", t: "Скидка", r: 1, h: t => pct(t.discount, 1, false)},
      {k: "state", t: "Статус", h: t => statusTag(t)},
    ]});
    $$("#tr-k button").forEach(b => b.onclick = () => { fs.kind = b.dataset.k; $$("#tr-k button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    $("#tr-col").onchange = e => { fs.col = e.target.value; draw(); };
    $("#tr-from").onchange = e => { fs.from = e.target.value; draw(); };
    $("#tr-to").onchange = e => { fs.to = e.target.value; draw(); };
    $("#tr-csv").onclick = () => exportCSV(filtered());
    draw();
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось загрузить сделки", esc(e.message)); }
}
function exportCSV(rows) {
  const iso = ts => ts ? new Date(ts * 1000).toISOString() : "";
  const head = ["gift_id", "collection", "model", "title", "buy_price_ton", "sale_price_ton", "buy_fee_ton", "sell_fee_ton", "net_profit_ton", "roi_pct", "bought_at", "sold_at", "duration_h", "discount_pct", "status", "source"];
  const lines = [head.join(";")].concat(rows.map(t => [t.gift_id, t.collection, t.model, t.title, t.cost, t.sale_price, t.buy_fee, t.sell_fee, t.net_profit, t.roi, iso(t.buy_ts), iso(t.sell_ts), t.duration != null ? (t.duration / 3600).toFixed(2) : "", t.discount, t.sell_ts ? "sold" : (t.state || ""), t.source]
    .map(v => { const s = v == null ? "" : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")));
  const blob = new Blob(["﻿" + lines.join("\n")], {type: "text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Выгружено строк: ${rows.length}`);
}

/* ---------- Analytics ---------- */
async function pageAnalytics(el) {
  const fs = st("analytics", {range: "all"});
  el.innerHTML = loading();
  try {
    const d = await api("trades");
    const ranges = {"24h": 86400, "7d": 7 * 86400, "30d": 30 * 86400, "90d": 90 * 86400, "all": Infinity};
    const since = Date.now() / 1000 - ranges[fs.range];
    const T = d.trades.filter(t => t.mode === "real");
    const C = T.filter(t => t.net_profit != null && t.sell_ts >= since).sort((a, b) => a.sell_ts - b.sell_ts);
    const open = T.filter(t => !t.sell_ts);
    const wins = C.filter(t => t.net_profit > 0), losses = C.filter(t => t.net_profit < 0);
    const invested = sum(C.map(t => t.cost + t.buy_fee));
    const realized = sum(C.map(t => t.net_profit));
    const bought = T.filter(t => t.buy_ts >= since);
    el.innerHTML = `<div class="filters"><div class="seg" id="an-r">${[["24h", "24 ч"], ["7d", "7 дн"], ["30d", "30 дн"], ["90d", "90 дн"], ["all", "Всё время"]].map(([k, t]) => `<button data-k="${k}" class="${fs.range === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <span class="sub2">Реализованная прибыль считается только по проданным подаркам.</span></div>
    <div class="kpis">
      ${kpi("Реализованный PnL", money(realized, {sign: true}), `${C.length} сделок`, {cls: pnlCls(realized)})}
      ${kpi("Нереализованный PnL", money(sum(open.map(t => t.unrealized)), {sign: true}), "оценка, все открытые", {cls: pnlCls(sum(open.map(t => t.unrealized)))})}
      ${kpi("Win rate", C.length ? pct(wins.length / C.length * 100, 0, false) : "—", C.length ? `${wins.length} из ${C.length}` : "")}
      ${kpi("Средняя прибыль", wins.length ? money(sum(wins.map(t => t.net_profit)) / wins.length, {sign: true}) : "—", "на прибыльную сделку", {cls: "up"})}
      ${kpi("Средний убыток", losses.length ? money(sum(losses.map(t => t.net_profit)) / losses.length, {sign: true}) : "—", "на убыточную сделку", {cls: "down"})}
      ${kpi("Средняя скидка", bought.filter(t => t.discount != null).length ? pct(sum(bought.map(t => t.discount)) / bought.filter(t => t.discount != null).length, 1, false) : "—", "при покупке")}
      ${kpi("Средний срок", C.length ? dur(sum(C.map(t => t.duration)) / C.length) : "—", "от покупки до продажи")}
      ${kpi("ROI", invested ? pct(realized / invested * 100) : "—", "на закрытые сделки", {cls: pnlCls(realized)})}
      ${kpi("Оборот", money(sum(C.map(t => t.sale_price)) + sum(bought.map(t => t.cost))), "покупки и продажи")}
    </div>
    ${C.length ? "" : banner("warn", "<b>За этот период нет закрытых сделок.</b> Графики заполнятся после продаж.")}
    <div class="grid g3" id="an-g">
      ${["Накопленный PnL", "PnL по дням", "PnL по неделям", "PnL по месяцам", "Win rate во времени", "Прибыль по коллекциям", "Прибыль по моделям", "Цена покупки и продажи", "Срок удержания", "Распределение ROI"]
        .map((t, i) => panel(t, C.length ? chartBox("an-" + i, "sm") : empty("Нет данных"), {hint: ["", "", "", "", "накопительно", "", "", "TON", "часов", "%"][i]})).join("")}
    </div>`;
    $$("#an-r button").forEach(b => b.onclick = () => { fs.range = b.dataset.k; render(); });
    if (!C.length) return;
    const group = (fmt) => { const m = new Map(); for (const t of C) { const k = fmt(new Date(t.sell_ts * 1000)); m.set(k, (m.get(k) || 0) + t.net_profit); } return m; };
    const dayK = x => x.toLocaleDateString("ru-RU", {day: "2-digit", month: "2-digit"});
    const weekK = x => { const d = new Date(x); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return "нед " + dayK(d); };
    const monK = x => x.toLocaleDateString("ru-RU", {month: "short", year: "2-digit"});
    let cum = 0;
    lineChart("an-0", C.map(t => dayK(new Date(t.sell_ts * 1000))), C.map(t => (cum += t.net_profit)), {color: "--up"});
    for (const [id, f] of [["an-1", dayK], ["an-2", weekK], ["an-3", monK]]) { const g = group(f); barPnL(id, [...g.keys()], [...g.values()]); }
    let w = 0; const wr = C.map((t, i) => { if (t.net_profit > 0) w++; return w / (i + 1) * 100; });
    const o = baseOpts(); o.scales.y.min = 0; o.scales.y.max = 100; o.scales.y.ticks.callback = v => v + "%"; o.plugins.tooltip.callbacks = {label: c => nf(0).format(c.raw) + "%"};
    mkChart("an-4", {type: "line", data: {labels: C.map(t => dayK(new Date(t.sell_ts * 1000))), datasets: [{data: wr, borderColor: css("--accent"), borderWidth: 1.8, pointRadius: 3, tension: .2}]}, options: o});
    const by = k => { const m = new Map(); for (const t of C) m.set(t[k] || "?", (m.get(t[k] || "?") || 0) + t.net_profit); return [...m].sort((a, b) => b[1] - a[1]).slice(0, 15); };
    const bc = by("collection"); hbar("an-5", bc.map(x => x[0]), bc.map(x => x[1]));
    const bm = by("model"); hbar("an-6", bm.map(x => x[0]), bm.map(x => x[1]));
    const so = baseOpts(); so.interaction = {mode: "nearest", intersect: true};
    so.scales.x = {type: "linear", title: {display: true, text: "покупка, TON", color: css("--muted")}, grid: {color: css("--line")}, ticks: {color: css("--muted")}};
    so.scales.y.title = {display: true, text: "продажа, TON", color: css("--muted")};
    so.plugins.tooltip.callbacks = {label: c => `${c.raw.t}: ${num(c.raw.x)} → ${num(c.raw.y)} TON`};
    const mx = Math.max(...C.map(t => Math.max(t.cost, t.sale_price))) * 1.1;
    mkChart("an-7", {type: "scatter", data: {datasets: [
      {data: C.map(t => ({x: t.cost, y: t.sale_price, t: t.title})), backgroundColor: C.map(t => t.net_profit >= 0 ? css("--up") : css("--down")), pointRadius: 5},
      {type: "line", data: [{x: 0, y: 0}, {x: mx, y: mx}], borderColor: css("--line-2"), borderDash: [4, 4], borderWidth: 1, pointRadius: 0}]}, options: so});
    const hb = bucket(C.map(t => t.duration / 3600), [0, 1, 6, 12, 24, 48, 96, 168, Infinity]); histo("an-8", hb.labels, hb.counts, "--accent", " сделок");
    const rb = bucket(C.map(t => t.roi), [-Infinity, -10, 0, 5, 10, 20, 50, Infinity]);
    rb.labels = rb.labels.map(l => l.replace("-Infinity–", "< ")); histo("an-9", rb.labels, rb.counts, "--up", " сделок");
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось построить аналитику", esc(e.message)); }
}

/* ---------- System ---------- */
async function pageSystem(el) {
  el.innerHTML = loading();
  try {
    const s = await api("system", {fresh: true});
    const stIc = {ok: ["ok", "up"], bad: ["x", "down"], warn: ["alert", "dim"], unknown: ["help", "dim"]};
    const mr = s.mrkt;
    el.innerHTML = `
      ${mr.status === "banned" ? banner("bad", `<b>MRKT: аккаунт заблокирован</b> (первый 403 banned ${dt(mr.first_ban)}, последний ${dt(mr.last_ban?.[0])}). ${mr.auth_attempts_after_ban > 1 ? `После бана в логе ещё <b>${mr.auth_attempts_after_ban}</b> попыток входа: бот должен был остановить все запросы к MRKT до ручного вмешательства. Это нужно исправить в коде бота.` : ""}`) : ""}
      <div class="kpis">
        ${kpi("Бот", `<span class="dot ${s.bot.running ? "ok" : ""}"></span> ${s.bot.running ? "работает" : "остановлен"}`, `лог: ${ago(s.bot.log_mtime)}`, {title: s.bot.rule})}
        ${kpi("MRKT", mr.status === "banned" ? '<span class="down">заблокирован</span>' : mr.status === "ok" ? '<span class="up">вход есть</span>' : "неизвестно", mr.last_ban ? `403 ${ago(mr.last_ban[0])}` : "")}
        ${kpi("Последний вход", mr.last_auth ? tm(mr.last_auth) : "—", mr.last_auth ? dt(mr.last_auth) : "")}
        ${kpi("Последний успешный запрос", mr.last_ok_request ? tm(mr.last_ok_request) : "—", "по логу")}
        ${kpi("База", s.db.exists ? '<span class="up">доступна</span>' : '<span class="down">нет файла</span>', s.db.mtime ? `изменена ${ago(s.db.mtime)}` : "")}
        ${kpi("Последний бэкап", s.db.last_backup ? tm(s.db.last_backup) : "—", s.db.last_backup ? dt(s.db.last_backup) : "")}
        ${kpi("Очередь задач", need("нет данных"), "", {na: true})}
        ${kpi("Задержка запросов", need("нет данных"), "", {na: true})}
      </div>
      <div class="grid g2">
        ${panel("Защита и безопасность", s.safety.map(x => { const [i, c] = stIc[x.state] || stIc.unknown; return `<div class="check">${ic(i, c)}<div><b>${esc(x.name)}</b><div class="d">${esc(x.detail)}</div></div></div>`; }).join(""))}
        ${panel("Последняя ошибка", s.last_error ? `<div class="kv"><div class="k">Когда</div><div class="v">${dt(s.last_error[0])}</div><div class="k">Уровень</div><div class="v">${esc(s.last_error[1])}</div><div class="k">Поток</div><div class="v">${esc(s.last_error[2])}</div></div><div class="mono" style="margin-top:10px;font-size:12px;color:var(--text-2);white-space:pre-wrap;word-break:break-word">${esc(s.last_error[3])}</div>` : empty("Ошибок нет"))}
        ${panel("HTTP-коды в логе", Object.keys(s.http).length ? `<div class="kv">${Object.entries(s.http).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="k"><span class="tag ${k >= 500 ? "warn" : k >= 400 ? "down" : "up"}">${k}</span> ${{"403": "доступ запрещён", "429": "слишком много запросов", "502": "ошибка шлюза", "404": "не найдено", "401": "нет входа", "405": "метод не разрешён"}[k] || ""}</div><div class="v">${n}</div>`).join("")}</div>` : empty("Кодов нет"), {hint: s.requests_accounting})}
        ${panel("Активность потоков бота", `<div class="kv">${s.threads.slice(0, 14).map(([k, n]) => `<div class="k mono" style="font-size:12px">${esc(k)}</div><div class="v">${n}</div>`).join("")}</div>`, {hint: "строк в логе по потокам"})}
        ${panel("Запросы по адресам", s.endpoints.length ? `<div class="kv">${groupEndpoints(s.endpoints).map(([k, n]) => `<div class="k mono" style="font-size:12px;overflow:hidden;text-overflow:ellipsis">${esc(k)}</div><div class="v">${n}</div>`).join("")}</div>` : empty("Нет данных"), {hint: "только запросы, попавшие в лог"})}
        ${panel("База данных", `<div class="kv">
          <div class="k">Размер</div><div class="v">${s.db.size ? num(s.db.size / 1048576, 1) + " МБ" : "—"}</div>
          <div class="k">Копия для панели</div><div class="v">${s.db.snapshot_at ? tm(s.db.snapshot_at) : "—"}</div>
          ${Object.entries(s.db.tables).map(([k, n]) => `<div class="k mono" style="font-size:12px">${esc(k)}</div><div class="v">${num(n, 0)}</div>`).join("")}
        </div>${s.db.snapshot_error ? banner("bad", esc(s.db.snapshot_error)) : ""}`, {hint: "панель читает копию, оригинал не меняется"})}
      </div>`;
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось получить состояние", esc(e.message)); }
}

function groupEndpoints(list) {
  const m = new Map();
  for (const [k, n] of list) { const g = k.replace(/\/gift\/[^/?]+$/, "/gift/*"); m.set(g, (m.get(g) || 0) + n); }
  return [...m].sort((a, b) => b[1] - a[1]);
}

/* ---------- Settings ---------- */
async function pageSettings(el) {
  el.innerHTML = loading();
  try {
    const s = await api("settings");
    const groups = {};
    for (const f of s.fields) (groups[f.group] = groups[f.group] || []).push(f);
    const val = f => { const v = s.values[f.key]; if (v == null) return '<span class="dim">—</span>'; if (f.type === "bool") return v ? '<span class="tag up">вкл</span>' : '<span class="tag">выкл</span>'; return `<span class="mono">${esc(v)}</span>`; };
    const refresh = store.get("refresh", 30);
    el.innerHTML = `
      ${banner("warn", `<b>Настройки бота здесь только для просмотра.</b> Меняй их командой <span class="mono">/set КЛЮЧ значение</span> в Telegram: бот сам проверит значение и сохранит в settings_override.json. Правка из панели ${need("нужна интеграция")}`)}
      <div class="grid g2">
        ${panel("Панель", `<div class="kv">
          <div class="k">Валюта</div><div class="v"><div class="seg" id="st-ccy">${["USD", "TON"].map(c => `<button data-k="${c}" class="${CCY === c ? "on" : ""}">${c}</button>`).join("")}</div></div>
          <div class="k">Тема</div><div class="v"><div class="seg" id="st-theme">${[["dark", "Тёмная"], ["light", "Светлая"]].map(([k, t]) => `<button data-k="${k}" class="${(document.documentElement.dataset.theme || "dark") === k ? "on" : ""}">${t}</button>`).join("")}</div></div>
          <div class="k">Обновление данных</div><div class="v"><select id="st-ref">${[[0, "вручную"], [15, "каждые 15 с"], [30, "каждые 30 с"], [60, "каждую минуту"]].map(([k, t]) => `<option value="${k}" ${refresh == k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div class="k">Курс TON/USD</div><div class="v">${rate() ? "$" + num(rate(), 3) + ` <span class="src">CoinGecko</span>` : '<span class="dim">недоступен, суммы в TON</span>'}</div>
          <div class="k">Экспорт сделок</div><div class="v"><a class="btn" href="#/trades">${ic("download")}CSV в Trades</a></div>
          ${STATIC ? `<div class="k">Доступ к сайту</div><div class="v"><button class="btn" id="st-lock">${ic("lock")}Выйти и забыть пароль</button></div>` : ""}
        </div>`)}
        ${panel("Аккаунт и режим", `<div class="kv">
          <div class="k">Учебный режим снайпера</div><div class="v">${s.values.SNIPER_DRY_RUN ? "вкл" : "выкл"}</div>
          <div class="k">Автопокупка</div><div class="v">${s.values.AUTOBUY ? "вкл" : "выкл"}</div>
          <div class="k">Покупки на MRKT</div><div class="v">${s.values.AUTOBUY_MRKT ? "вкл" : "выкл"}</div>
          <div class="k">Аккаунт Telegram</div><div class="v">${need("не передаётся в панель")}</div>
        </div><div class="sub2" style="margin-top:8px">Токены, initData и ключи из .env панель не читает и не показывает.</div>`)}
        ${panel("Уведомления в Telegram", `<div class="kv">
          ${[["Покупки", "OK"], ["Неудачные покупки", "OK"], ["Продажи", "OK"], ["Офферы", s.values.OFFERS_NOTIFY == null ? "?" : s.values.OFFERS_NOTIFY ? "вкл" : "выкл"], ["Ошибки API", "OK"], ["Остановка бота / потеря связи", "OK"]].map(([k, v]) => `<div class="k">${k}</div><div class="v">${v === "OK" ? '<span class="tag">всегда</span>' : esc(v)}</div>`).join("")}
        </div><div class="sub2" style="margin-top:8px">Бот шлёт эти сообщения сам. Отдельно включать или выключать каждый тип: ${need("нужна интеграция")}</div>`)}
        ${panel("Списки коллекций", `<div class="kv">
          <div class="k">Только эти (COLLECTIONS_ONLY)</div><div class="v">${esc(s.values.COLLECTIONS_ONLY || "все")}</div>
          <div class="k">Исключить (COLLECTIONS_SKIP)</div><div class="v">${esc(s.values.COLLECTIONS_SKIP || "нет")}</div>
          <div class="k">Снайпер: разрешено (SNIPER_ALLOW)</div><div class="v">${esc(s.values.SNIPER_ALLOW || "все")}</div>
        </div>`)}
      </div>
      ${Object.entries(groups).map(([g, fs]) => `<div class="section-t">${esc(g)}</div><div class="panel">${(() => {
        return `<div class="tbl" style="max-height:none"><table><thead><tr><th>Параметр</th><th>Ключ</th><th class="r">Значение</th><th>Откуда</th><th class="r">Допустимо</th></tr></thead><tbody>${fs.map(f => `<tr><td class="strong">${esc(f.label)}</td><td class="mono sec" style="font-size:12px">${esc(f.key)}</td><td class="r">${val(f)}</td><td><span class="src">${esc(s.source[f.key] || "—")}</span></td><td class="r dim">${f.min != null ? `${f.min} … ${f.max}` : ""}</td></tr>`).join("")}</tbody></table></div>`;
      })()}</div>`).join("")}`;
    $$("#st-ccy button").forEach(b => b.onclick = () => setCcy(b.dataset.k));
    $$("#st-theme button").forEach(b => b.onclick = () => { document.documentElement.dataset.theme = b.dataset.k; store.set("theme", b.dataset.k); render(); });
    if (STATIC) $("#st-lock").onclick = lockSite;
    $("#st-ref").onchange = e => { store.set("refresh", +e.target.value); setupRefresh(); toast("Сохранено"); };
  } catch (e) { el.innerHTML = stateBox("error", "Не удалось загрузить настройки", esc(e.message)); }
}

/* ============================== каркас ============================== */
const RENDER = {dashboard: pageDashboard, sniper: pageSniper, market: pageMarket, portfolio: pagePortfolio, trades: pageTrades, analytics: pageAnalytics, system: pageSystem, settings: pageSettings};
function current() { const p = location.hash.replace(/^#\/?/, "").split("?")[0]; return RENDER[p] ? p : "dashboard"; }
async function render() {
  const p = current(), meta = PAGES.find(x => x.id === p);
  $$("#nav a").forEach(a => a.classList.toggle("on", a.dataset.p === p));
  $("#page-title").textContent = meta.t; $("#page-sub").textContent = meta.sub;
  document.title = meta.t + " · Gift Terminal";
  destroyCharts();
  await RENDER[p]($("#page"));
}
function nav() {
  let g = "", html = "";
  for (const p of PAGES) { if (p.grp !== g) { g = p.grp; html += `<div class="grp">${g}</div>`; } html += `<a href="#/${p.id}" data-p="${p.id}">${ic(p.icon)}<span>${p.t}</span></a>`; }
  $("#nav").innerHTML = html;
}
async function sideStatus() {
  try {
    const [m, s, o] = await Promise.all([api("meta", {fresh: true}), api("system", {fresh: true}), api("overview", {fresh: true})]);
    META = m;
    const mr = s.mrkt.status;
    $("#side-status").innerHTML = `
      <div class="row"><span class="k">Бот</span><span><span class="dot ${s.bot.running ? "ok" : ""}"></span> ${s.bot.running ? "работает" : "остановлен"}</span></div>
      <div class="row"><span class="k">MRKT</span><span><span class="dot ${mr === "banned" ? "bad" : mr === "ok" ? "ok" : ""}"></span> ${mr === "banned" ? "заблокирован" : mr === "ok" ? "подключён" : "неизвестно"}</span></div>
      <div class="row"><span class="k">Режим</span><span>${m.account.bot_mode === "dry-run" ? "учебный" : '<span class="down">реальный</span>'}</span></div>
      <div class="row"><span class="k">Баланс</span><span class="dim" title="бот не сохраняет баланс">нет данных</span></div>
      <div class="row"><span class="k">В позициях</span><span class="num">${money(o.kpi.invested_open)}</span></div>`;
    $("#live").innerHTML = STATIC ? `<span class="dot ${Date.now() / 1000 - m.now < 7200 ? "ok" : "warn"}"></span><span title="данные выгружены с ПК">снимок от ${dt(m.now)}</span>` : `<span class="dot ${s.bot.running ? "ok" : ""}"></span>обновлено ${tm(m.now)}`;
    drawCcy();
  } catch (e) {
    $("#side-status").innerHTML = `<div class="row"><span class="k">Сервер</span><span class="down">нет связи</span></div>`;
    $("#live").innerHTML = `<span class="dot bad"></span>${STATIC ? esc(e.message) : "нет связи с server.py"}`;
  }
}
function drawCcy() {
  $("#ccy").innerHTML = ["USD", "TON"].map(c => `<button data-k="${c}" class="${CCY === c ? "on" : ""}" ${c === "USD" && !rate() ? 'disabled title="курс недоступен"' : ""}>${c}</button>`).join("");
  $$("#ccy button").forEach(b => b.onclick = () => setCcy(b.dataset.k));
}
function setCcy(c) { CCY = c; store.set("ccy", c); drawCcy(); render(); }
let timer = null;
function setupRefresh() {
  clearInterval(timer);
  const sec = store.get("refresh", 30);
  if (sec > 0) timer = setInterval(async () => {
    if ($("#drawer").classList.contains("open") || document.activeElement?.matches("input,select") || document.hidden) return;
    resetData();
    await sideStatus(); render();
  }, sec * 1000);
}

(async function boot() {
  const th = store.get("theme", "dark"); document.documentElement.dataset.theme = th;
  Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
  nav();
  $("#refresh").innerHTML = ic("refresh");
  $("#refresh").onclick = async () => { resetData(); await sideStatus(); await render(); toast("Данные обновлены"); };
  await sideStatus();
  if (CCY === "USD" && !rate()) CCY = "TON";
  drawCcy();
  addEventListener("hashchange", () => { closeDrawer(); render(); });
  await render();
  setupRefresh();
})();
