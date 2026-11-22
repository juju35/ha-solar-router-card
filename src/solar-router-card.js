/**
 * solar-router-card / solar-router-mini-card: solar surplus routing. The surplus now and the energy routed today, then
 * one tile per device the surplus feeds (water heater, EV charger, pool pump…), on the surplus or waiting for it.
 * https://github.com/juju35/ha-solar-router-card
 */

// The badge's icon of each state (its colour is the stylesheet's).
const SR_STATE_ICONS = {
  routing: "mdi:sun-wireless",
  surplus: "mdi:sun-wireless-outline",
  waiting: "mdi:sun-wireless-outline",
  night: "mdi:weather-night",
  none: "mdi:sun-wireless-outline",
};
// The colour of each kind of device: its icon, its status, its progress bar and its outline while on the surplus.
const SR_COLORS = { water_heater: "#e8590c", ev: "#1971c2", pool: "#0c8599", heater: "#d6336c", other: "#7048e8" };
// One loop of the banner's animation (s): the surplus runs from the panels to the devices.
const SR_LOOP = 1.2;

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's scene: 200 × 80, drawn to the banner's right edge. Hills, a house with its panels, a
// water heater whose hot water rises with its progress (`level`), an EV charger and a pool beside it; the surplus runs
// as a dashed line from the panels to the devices while they route (`flowing`). The picture's night (`night`: the dark
// theme) darkens it; the real night (`moon`: the sun set) puts the moon in place of the sun and lights the windows.
const srScene = ({ night, moon, flowing, level, animate }) => {
  const hill = night ? "#24384f" : "#a8d58f";
  const wall = night ? "#3a4656" : "#f3e3c8";
  const roof = night ? "#5b3b30" : "#c8643a";
  const cells = night ? "#14243f" : "#24489c";
  const green = "#2f9e44";
  const hot = Math.round(15 * Math.min(1, Math.max(0.15, level ?? 0.5)));
  const run = animate && flowing ? `<animate attributeName="stroke-dashoffset" from="6" to="0" dur="${SR_LOOP}s" repeatCount="indefinite"/>` : "";
  const sky = moon
    ? `<circle cx="34" cy="18" r="7" fill="${night ? "#e8edf5" : "#f4f1e4"}"/><circle cx="37.5" cy="15.5" r="6" fill="${night ? "#1c3050" : "#cbe5f7"}"/>`
    : `<circle cx="34" cy="18" r="9" fill="#ffc53d"/>`;
  return `${sky}
    <path d="M30 80 Q100 58 200 66 V80Z" fill="${hill}"/>
    <rect x="86" y="42" width="56" height="38" fill="${wall}"/>
    <path d="M78 44 L114 20 L150 44Z" fill="${roof}"/>
    <path d="M92 38 L112 25 L130 37 L110 50Z" fill="${cells}"/>
    <path class="flow" d="M112 36 C112 30 126 26 160 30" fill="none" stroke="${flowing ? green : night ? "#4a5566" : "#9aa3ae"}" stroke-width="2" stroke-dasharray="3 3"${flowing ? "" : ' opacity=".6"'}>${run}</path>
    <rect x="154" y="44" width="16" height="30" rx="7" fill="${night ? "#4a515b" : "#fff"}" stroke="#b9c1cb"/><rect x="157" y="${71 - hot}" width="10" height="${hot}" rx="4" fill="#ff8a4c"/>
    <rect x="176" y="54" width="12" height="20" rx="2" fill="${night ? "#3d444e" : "#dfe4ea"}" stroke="#9aa3ae"/><path d="M182 58 l-3 6h4l-3 6" stroke="${flowing ? green : "#9aa3ae"}" stroke-width="1.5" fill="none"/>
    <path d="M60 74 h22" stroke="${night ? "#2f5d78" : "#7cc4e8"}" stroke-width="5" stroke-linecap="round"/>
    <rect x="104" y="62" width="9" height="18" fill="${night ? "#2a2f38" : "#8a5a3b"}"/>
    <rect x="92" y="56" width="8" height="7" fill="${moon ? "#f5d27a" : "#9cc7ec"}"/><rect x="126" y="56" width="8" height="7" fill="${moon ? "#f5d27a" : "#9cc7ec"}"/>`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const srPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// ── Card ─────────────────────────────────────────────────────────────────────
class SolarRouterCard extends RcCard {
  static tag = "solar-router-card";
  static i18n = SR_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, animations: true, threshold: 100 };

  // The surplus sensor of the home, when there is one.
  static getStubConfig(hass) {
    const surplus = hass ? srSurplusSource(hass) : undefined;
    return surplus ? { surplus } : {};
  }

  getCardSize() {
    return 2 + (this._items?.devices?.length || 1);
  }

  connectedCallback() {
    super.connectedCallback?.();
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  _fmt(v, digits) {
    try {
      return srIntl(Intl.NumberFormat, this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    } catch {
      return v.toFixed(digits);
    }
  }

  _kwh(v) {
    return v == null ? "—" : `${this._fmt(v, v >= 100 ? 0 : 1)} kWh`;
  }

  _kw(w, digits = 2) {
    return w == null ? "—" : `${this._fmt(w / 1000, digits)} kW`;
  }

  // A device's progress: a water heater's temperature toward its target (from 15 °C), else `progress` toward `target`.
  _progress(d, st) {
    const h = this._hass;
    const a = st?.attributes || {};
    const num = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
    let value;
    let target;
    let unit = d.unit || "";
    if (d.progress) {
      const p = h.states[d.progress];
      value = srNum(p);
      unit ||= p?.attributes?.unit_of_measurement || "";
      target = typeof d.target === "string" ? srNum(h.states[d.target]) : num(d.target);
    } else if (d.entity.startsWith("water_heater.")) {
      value = num(a.current_temperature);
      target = num(a.temperature);
      unit = h.config?.unit_system?.temperature || "°C";
    }
    if (value == null || !target) return null;
    const temp = /°/.test(unit);
    const from = temp ? 15 : 0;
    const share = Math.min(1, Math.max(0, (value - from) / (target - from)));
    const fmt = (v) => `${this._fmt(v, Number.isInteger(v) || temp ? 0 : 1)}${unit ? ` ${unit}` : ""}`;
    return { share, text: temp ? `${fmt(value)} → ${fmt(target)}` : `${fmt(value)} / ${fmt(target)}` };
  }

  // The surplus, the devices and the state.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const list = rcMemo((this._memo ||= {}), "devices", [c.devices, h.entities], () => srDevices(h, c.devices));
    const sun = h.states["sun.sun"];
    const moon = sun?.state === "below_horizon";
    const devices = list.map((d) => {
      const st = h.states[d.entity];
      const offline = !st || ["unavailable", "unknown"].includes(st.state);
      const watts = srWatts(d.power ? h.states[d.power] : undefined);
      const energy = srKwh(d.energy ? h.states[d.energy] : undefined);
      const running = !offline && (watts != null ? watts > 30 : ["on", "heat", "heating", "charging"].includes(st.state));
      return { ...d, offline, watts, energy, running, progress: this._progress(d, st), color: SR_COLORS[d.kind] };
    });
    const runningW = devices.filter((d) => d.running).reduce((s, d) => s + (d.watts || 0), 0);
    const surplusId = c.surplus || (c.grid ? null : rcMemo(this._memo, "surplus", [h.entities], () => srSurplusSource(h)));
    let surplus = null;
    if (surplusId) surplus = srWatts(h.states[surplusId]);
    else if (c.grid) {
      // What the devices run on, less what the home draws from the grid (or plus what it still exports).
      const g = srWatts(h.states[c.grid]);
      if (g != null) surplus = Math.max(0, runningW - (c.grid_invert ? -g : g));
    }
    // A running device is on the surplus only by day and while there is some: an EV charging at night, or while the
    // home draws all of its power from the grid, is not routed.
    const onSurplus = !moon && (surplus == null || surplus > 0);
    for (const d of devices) d.active = d.running && onSurplus;
    const routing = onSurplus ? Math.min(runningW, surplus ?? runningW) : 0;
    const energies = devices.map((d) => d.energy).filter((e) => e != null);
    const routed = c.routed ? srKwh(h.states[c.routed]) : energies.length ? energies.reduce((s, e) => s + e, 0) : null;
    const anyActive = devices.some((d) => d.active);
    const threshold = Number(c.threshold) || 100;
    let state;
    if (surplus == null && !devices.length) state = "none";
    else if (anyActive) state = "routing";
    else if (moon) state = "night";
    else if ((surplus || 0) >= threshold) state = "surplus";
    else state = "waiting";
    const heater = devices.find((d) => d.kind === "water_heater" && d.progress);
    return {
      none: state === "none",
      state,
      name: c.title || this._t("title"),
      devices,
      surplus,
      surplusId: surplusId || c.grid || null,
      routing,
      routed,
      routedId: c.routed || null,
      used: surplus ? Math.min(1, routing / surplus) : 0,
      level: heater ? heater.progress.share : null,
      moon,
    };
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // The banner's night: forced by `illustration_theme`, else Home Assistant's dark theme alone.
  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  // The illustrated header: the badge (the state's icon, in the state's colour), the title and `sub` on the sky at
  // the left, the house and its devices at the right, a 10 px grass strip edge to edge. `ring`: the mini card's share
  // of the surplus being routed, around the badge.
  _banner(m, sub, ring = "", pill = "") {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const scene = srScene({ night, moon: m.moon, flowing: m.state === "routing", level: m.level, animate: this._animate() });
    const chip = pill ? `<span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>` : "";
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge">${ring}<ha-icon icon="${SR_STATE_ICONS[m.state]}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${chip}</div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${scene}</svg>
        <div class="ground"></div>
      </div>`;
  }

  // The status pill's place, on the banner and on the classic header (see srPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      srPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  _sub(m) {
    if (m.none) return "";
    const e = this._kwh(m.routed);
    // The surplus (the band under it has the energy routed today), else the energy routed today.
    return m.surplus != null && m.surplus >= (Number(this._config.threshold) || 100) ? this._t("chip_surplus", { v: this._kw(m.surplus, 1) }) : this._t("sub_none", { e });
  }

  // The surplus now and the energy routed today, on a green band.
  _band(m) {
    const item = (label, value, id, cls) => `<button class="bi ${cls}"${id ? ` data-id="${rcEsc(id)}"` : ""}><span class="bl">${rcEsc(this._t(label))}</span><span class="bv">${rcEsc(value)}</span></button>`;
    return `<div class="band"><ha-icon icon="mdi:sun-wireless"></ha-icon>${item("surplus_now", this._kw(m.surplus), m.surplusId, "l")}${item("routed_today", this._kwh(m.routed), m.routedId, "r")}</div>`;
  }

  // One tile per device: its icon, its name and status, its power, its progress and its energy of the day.
  _device(d) {
    const status = d.offline ? this._t("dev_offline") : d.active ? this._t("on_surplus") : d.running ? this._t("on_grid") : this._t("waiting");
    const bar = d.progress ? `<span class="pb"><span style="width:${Math.round(d.progress.share * 100)}%"></span></span>` : "";
    const foot = d.progress || d.energy != null ? `<span class="df"><span>${rcEsc(d.progress?.text || "")}</span><span>${d.energy != null ? rcEsc(this._t("kwh_today", { v: this._kwh(d.energy) })) : ""}</span></span>` : "";
    return `<button class="dv${d.active ? " on" : d.running ? " grid" : ""}${d.offline ? " na" : ""}" style="--k:${d.color}" data-id="${rcEsc(d.entity)}" title="${rcEsc(`${d.name} — ${status}`)}">
      <span class="dh"><span class="di"><ha-icon icon="${rcEsc(d.icon)}"></ha-icon></span><span class="dt"><span class="dn">${rcEsc(d.name)}</span><span class="ds">${rcEsc(status)}</span></span><span class="dw">${d.running && d.watts != null ? `${rcEsc(this._fmt(d.watts / 1000, 2))}<small> kW</small>` : "—"}</span></span>
      ${bar}${foot}</button>`;
  }

  _draw(m) {
    const c = this._config;
    const status = this._t(`st_${m.state === "none" ? "offline" : m.state}`);
    const parts = [m.state, m.surplus, m.routed, m.devices.map((d) => [d.entity, d.name, d.active, d.running, d.offline, d.watts, d.energy, d.progress]), this._night(), m.moon];
    if (!this._changed(parts)) return;
    const sub = c.show_subtitle !== false ? this._sub(m) : "";
    const subHtml = sub ? `<div class="subt">${rcEsc(sub)}</div>` : "";
    const head =
      c.illustration !== false
        ? this._banner(m, subHtml, "", m.none ? "" : status)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="${SR_STATE_ICONS[m.state]}"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(m.name)}</div>${m.none ? "" : `<span class="pill" title="${rcEsc(status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`}</div>${subHtml}</div>
          </div>`;
    if (m.none) {
      this._paint("none", `${head}<div class="box hint">${rcEsc(this._t("no_router"))}</div>`, "");
      this._fitPill();
      return;
    }
    const devices = m.devices.length ? `<div class="dvs">${m.devices.map((d) => this._device(d)).join("")}</div>` : `<div class="box hint">${rcEsc(this._t("no_devices"))}</div>`;
    this._paint(m.state, head + this._band(m) + devices, "");
    this._fitPill();
  }

  _bindAfter(root) {
    for (const b of root.querySelectorAll(".bi[data-id], .dv[data-id]") || []) b.addEventListener("click", () => rcMoreInfo(this, b.dataset.id));
  }

  static styles = `
    ha-card.lvl-routing { --c: #2f9e44; }
    ha-card.lvl-surplus { --c: #f59f00; }
    ha-card.lvl-waiting, ha-card.lvl-night, ha-card.lvl-none { --c: var(--rc-idle); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .box { margin-top: 10px; border-radius: 12px; padding: 10px 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .hint { font-size: 13px; color: var(--secondary-text-color); }
    /* The surplus band: green while there is surplus, grey without. */
    .band { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding: 10px 12px; border-radius: 12px;
            --g: #2f9e44; background: color-mix(in srgb, var(--g) 13%, var(--card-background-color, #fff)); }
    .lvl-waiting .band, .lvl-night .band { --g: var(--rc-idle); }
    .band > ha-icon { --mdc-icon-size: 22px; color: var(--g); flex: none; }
    .bi { all: unset; cursor: pointer; display: flex; flex-direction: column; min-width: 0; border-radius: 6px; }
    .bi:not([data-id]) { cursor: default; }
    .bi:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .bi.r { margin-left: auto; text-align: right; }
    .bl { font-size: 12px; color: color-mix(in srgb, var(--g) 55%, var(--primary-text-color, #212121)); white-space: nowrap; }
    .bv { font-size: 20px; font-weight: 700; line-height: 1.2; color: color-mix(in srgb, var(--g) 45%, var(--primary-text-color, #212121)); white-space: nowrap; }
    .bi.r .bv { font-size: 18px; font-weight: 500; }
    .dvs { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .dv { all: unset; box-sizing: border-box; cursor: pointer; display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 12px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .dv.on { box-shadow: inset 0 0 0 2px var(--k); }
    .dv.grid { box-shadow: inset 0 0 0 2px var(--rc-idle); }
    .dv.na { opacity: .6; }
    .dv:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .dh { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .di { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--k);
          background: var(--card-background-color, #fff); }
    .di ha-icon { --mdc-icon-size: 20px; }
    .dt { display: flex; flex-direction: column; min-width: 0; }
    .dn { font-size: 14px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ds { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dv.on .ds { color: color-mix(in srgb, var(--k) 70%, var(--primary-text-color, #212121)); }
    .dw { margin-left: auto; font-size: 18px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; }
    .dw small { font-size: 12px; font-weight: 400; color: var(--secondary-text-color); }
    .pb { display: block; height: 8px; border-radius: 4px; overflow: hidden; background: color-mix(in srgb, var(--primary-text-color) 10%, transparent); }
    .pb > span { display: block; height: 100%; background: var(--k); }
    .df { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--secondary-text-color); }
    .df span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @container (max-width: 300px) { .bv { font-size: 17px; } .dw { font-size: 16px; } }
    /* Illustrated header (banner): 90 px, edge to edge, the title on the sky, the house and its devices at the right,
       a 10 px grass strip at the bottom. The badge's icon is in the state's colour, grey when idle, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #d6ecfb 0%, #bfe0f6 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #142339 0%, #1d3150 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .lvl-waiting .banner, .lvl-night .banner, .lvl-none .banner { --ic: #6b7680; }
    .lvl-waiting .banner.night, .lvl-night .banner.night, .lvl-none .banner.night { --ic: #a7b0b8; }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #5aa83c 0 22px, #6fbe4e 22px 44px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #1f3a2a 0 22px, #25442f 22px 44px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see sfPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the sky. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    /* Narrower cards: the scene is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.62); }
    .banner.night .r { background: rgba(10,20,40,.4); }
    .banner span.r { cursor: default; }
    .banner span.r:hover { background: rgba(255,255,255,.62); }
    .banner.night span.r:hover { background: rgba(10,20,40,.4); }
    .banner .ringb { position: absolute; inset: 0; }
    /* The surplus or flow chip of the mini card, in green; alone on its line, it shortens the device's name rather than
       wrap out of sight. */
    .banner .r.g { color: #14532d; background: #d3f0da; flex: 0 1 auto; min-width: 0; }
    .banner.night .r.g { color: #b9ecc6; background: rgba(47,158,68,.3); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const srSchema = (booleans) => (lang) => [
  { name: "surplus", selector: { entity: { domain: "sensor", device_class: "power" } } },
  { name: "grid", selector: { entity: { domain: "sensor", device_class: "power" } } },
  { name: "grid_invert", selector: { boolean: {} } },
  { name: "routed", selector: { entity: { domain: "sensor", device_class: "energy" } } },
  { name: "threshold", selector: { number: { min: 0, max: 5000, step: 10, mode: "box", unit_of_measurement: "W" } } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(SR_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(SR_I18N, lang, "devices", "language"),
];

const SR_HELPERS = ["surplus", "grid", "routed", "threshold", "title", "devices", "zoom", "language"];

const SolarRouterCardEditor = rcEditor({
  card: SolarRouterCard,
  helpers: SR_HELPERS,
  schema: srSchema(["show_title", "show_subtitle", "illustration", "animations"]),
});

rcRegister(SolarRouterCard, SolarRouterCardEditor, "Solar Router Card", "Solar surplus routing: the surplus now, the energy routed today and the devices it feeds");

// ── Mini card ────────────────────────────────────────────────────────────────
// The router on two lines: a ring with the share of the surplus being routed as the badge, the title and the state,
// then the power routed and the device it feeds as a chip; the banner's surplus runs to the devices; the zoom button opens the
// full card in place.
class SolarRouterMiniCard extends rcMini(
  SolarRouterCard,
  "solar-router-mini-card",
  `
    .mini > .badge { background: none; }
    .ringb { width: 40px; height: 40px; }
  `,
) {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    const night = this._night();
    const on = m.devices.filter((d) => d.active);
    if (!this._changed(["mini", m.state, m.surplus, m.routing, on.map((d) => d.name), night, m.moon, m.level])) return;
    const status = this._t(`st_${m.state === "none" ? "offline" : m.state}`);
    // A chip opens its entity's details; one with nothing to open is plain text.
    const chip = (text, id, cls = "") =>
      id
        ? `<button class="r${cls}" data-id="${rcEsc(id)}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`
        : `<span class="r${cls}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></span>`;
    // The flow in one chip, so that it always fits: the power routed → the first device on the surplus (+ the others).
    const flow = on.length ? `${this._kw(m.routing, 1)} → ${on[0].name}${on.length > 1 ? ` +${on.length - 1}` : ""}` : "";
    let chips = "";
    if (m.none) chips = chip(this._t("no_router"));
    else if (flow) chips = chip(flow, on[0].entity, " g");
    else if (m.surplus != null) chips = chip(this._t("chip_surplus", { v: this._kw(m.surplus, 1) }), m.surplusId, " g");
    // The ring around the badge: the share of the surplus being routed.
    const L = 2 * Math.PI * 17;
    const ring = `<svg class="ringb" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="color-mix(in srgb, var(--c) 18%, transparent)" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="var(--c)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(L * m.used).toFixed(1)} 999" transform="rotate(-90 20 20)"/></svg>`;
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} bn">${this._banner(m, chips ? `<div class="rs">${chips}</div>` : "", ring, m.none ? "" : status)}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    for (const el of root.querySelectorAll(".r[data-id]")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    this._fitPill();
  }
}

const SolarRouterMiniCardEditor = rcEditor({
  card: SolarRouterMiniCard,
  helpers: SR_HELPERS,
  schema: srSchema(["show_title", "show_subtitle", "illustration", "animations", "zoom"]),
});

rcRegister(
  SolarRouterMiniCard,
  SolarRouterMiniCardEditor,
  "Solar Router Mini Card",
  "The solar router on two lines: the share of the surplus routed, the surplus and the devices on it, with a zoom to the full card",
);
