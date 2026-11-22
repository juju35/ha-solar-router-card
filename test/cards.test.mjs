import assert from "node:assert/strict";
import { test } from "node:test";
import { DEVICES, makeHass } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const sr = load();
const { cards } = sr;
const json = (v) => JSON.parse(JSON.stringify(v));

// A card whose shadow root answers every selector with nodes recording their click listeners.
const make = (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  return card;
};
const BASE = { surplus: "sensor.solar_surplus", devices: DEVICES };

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["solar-router-card", "solar-router-mini-card"]) {
    assert.ok(sr.customElements.get(tag), tag);
    assert.ok(sr.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(sr.window.customCards.map((c) => c.type)), ["solar-router-card", "solar-router-mini-card"]);
});

test("discovery: the surplus sensor by name, the devices' kinds, power and energy on their device", () => {
  const h = makeHass();
  assert.equal(sr.srSurplusSource(h), "sensor.solar_surplus");
  assert.deepEqual(json(cards["solar-router-card"].getStubConfig(h)), { surplus: "sensor.solar_surplus" });
  const d = sr.srDevices(h, DEVICES);
  assert.deepEqual(json(d.map((x) => x.kind)), ["water_heater", "ev", "pool"]);
  assert.equal(d[0].power, "sensor.cumulus_power");
  assert.equal(d[0].energy, "sensor.cumulus_energy_today");
  assert.equal(d[1].name, "EV charger", "the configured name wins");
  // No `devices`: the surplus managers' switches.
  assert.deepEqual(json(sr.srDevices(h).map((x) => x.entity)), ["switch.solar_optimizer_dryer"]);
  // Solar Optimizer's enable switch beside the device's is not a second device.
  h.entities["switch.enable_solar_optimizer_dryer"] = { device_id: "so", platform: "solar_optimizer", translation_key: "enable" };
  h.entities["switch.solar_optimizer_heater_enable"] = { device_id: "so", platform: "solar_optimizer" };
  assert.deepEqual(json(sr.srDevices(h).map((x) => x.entity)), ["switch.solar_optimizer_dryer"]);
  assert.equal(sr.srKind("switch.radiateur_salon"), "heater");
  assert.equal(sr.srKind("switch.dishwasher"), "other");
});

test("full card: the band, one tile per device with its state, power, progress and energy", () => {
  const card = make("solar-router-card", BASE);
  const m = card._items;
  assert.equal(m.state, "routing");
  assert.equal(m.surplus, 1800);
  assert.equal(m.routing, 1800, "1.18 + 0.62 kW on the surplus");
  assert.ok(Math.abs(m.routed - 6.8) < 1e-9, "the devices' energies added up");
  assert.equal(m.used, 1);
  const [heater, ev, pool] = m.devices;
  assert.deepEqual([heater.active, ev.active, pool.active], [true, true, false]);
  assert.equal(heater.progress.text, "58 °C → 65 °C");
  assert.equal(pool.progress.text, "4.2 h / 6 h");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<span class="bpt">Routing<\/span>/);
  assert.match(html, /<div class="subt">1\.8 kW surplus<\/div>/);
  assert.match(html, /<span class="bl">Surplus now<\/span><span class="bv">1\.80 kW<\/span>/);
  assert.equal((html.match(/class="dv on"/g) || []).length, 2);
  assert.match(html, /<span class="dn">Pool pump<\/span><span class="ds">Waiting for surplus<\/span>/);
  assert.match(html, /<span class="pb"><span style="width:86%"><\/span><\/span>/, "58 °C from 15 toward 65: 86 %");
  assert.match(html, /3\.1 kWh today/);
  assert.match(html, /class="flow"[^>]*stroke="#2f9e44"/, "the surplus runs to the devices in the banner");
});

test("surplus from the grid meter: what is exported plus what the devices route", () => {
  const card = make("solar-router-card", { grid: "sensor.grid_power", devices: DEVICES });
  assert.equal(card._items.surplus, 600 + 1800);
  const inverted = make("solar-router-card", { grid: "sensor.grid_power", grid_invert: true, devices: DEVICES }, makeHass({ grid: 600 }));
  assert.equal(inverted._items.surplus, 600 + 1800);
});

test("a device running without surplus is not routed: at night, or on the grid", () => {
  const night = make("solar-router-card", BASE, makeHass({ heater: 0, ev: 7200, surplus: 0, sun: "below_horizon" }));
  const ev = night._items.devices[1];
  assert.deepEqual([ev.running, ev.active], [true, false], "an EV charging at night");
  assert.equal(night._items.routing, 0);
  assert.equal(night._items.state, "night");
  assert.match(night.shadowRoot.innerHTML, /class="dv grid"[\s\S]*?<span class="ds">From the grid<\/span>/);
  // From the grid meter: the home draws 5 kW of the EV's 7.2 kW, so 2.2 kW come from the panels.
  const grid = make("solar-router-card", { grid: "sensor.grid_power", devices: DEVICES }, makeHass({ heater: 0, ev: 7200, grid: 5000 }));
  assert.equal(grid._items.surplus, 2200);
  assert.equal(grid._items.routing, 2200);
  const all = make("solar-router-card", { grid: "sensor.grid_power", devices: DEVICES }, makeHass({ heater: 0, ev: 7200, grid: 7300 }));
  assert.equal(all._items.surplus, 0, "all of it from the grid");
  assert.equal(all._items.devices[1].active, false);
  assert.notEqual(all._items.state, "routing");
});

test("states: surplus available, waiting, night, nothing found", () => {
  const surplus = make("solar-router-card", BASE, makeHass({ heater: 0, ev: 0 }));
  assert.equal(surplus._items.state, "surplus");
  const waiting = make("solar-router-card", BASE, makeHass({ heater: 0, ev: 0, surplus: 40 }));
  assert.equal(waiting._items.state, "waiting");
  assert.match(waiting.shadowRoot.innerHTML, /No surplus · 6\.8 kWh routed today/);
  const night = make("solar-router-card", BASE, makeHass({ heater: 0, ev: 0, surplus: 0, sun: "below_horizon" }));
  assert.equal(night._items.state, "night");
  const none = make("solar-router-card", {}, { ...makeHass(), entities: {}, states: {} });
  assert.equal(none._items.state, "none");
  assert.match(none.shadowRoot.innerHTML, /No surplus and no device found/);
});

test("tiles open their entity's details", () => {
  const card = make("solar-router-card", BASE);
  const events = [];
  card.dispatchEvent = (e) => events.push(e.detail?.entityId);
  const buttons = [{ dataset: { id: "switch.ev_charger" } }].map((b) => ({ ...b, addEventListener(_type, fn) { this.fn = fn; } }));
  card.shadowRoot.querySelectorAll = () => buttons;
  card._bindAfter(card.shadowRoot);
  buttons[0].fn();
  assert.deepEqual(events, ["switch.ev_charger"]);
});

test("mini card: the ring, the surplus and the devices on it, and the zoom to the full card", () => {
  const card = make("solar-router-mini-card", BASE);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-routing bn">/);
  assert.match(html, /class="ringb"/);
  assert.match(html, /<button class="r g" data-id="sensor.solar_surplus" title="1\.8 kW surplus">/);
  assert.match(html, /→ Water heater/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="dvs"/);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(sr.SR_I18N.en);
  for (const [lang, table] of Object.entries(sr.SR_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(sr.SR_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (sr.customElements.get("solar-router-card-editor"))();
  ed.setConfig({ type: "custom:solar-router-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["surplus", "grid", "grid_invert", "routed", "threshold", "illustration_theme", "devices", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:solar-router-card", threshold: 100, surplus: "sensor.solar_surplus" } } });
  assert.deepEqual(json(out), { type: "custom:solar-router-card", surplus: "sensor.solar_surplus" });
});
