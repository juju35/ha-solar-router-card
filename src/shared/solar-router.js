// ── Solar router ─────────────────────────────────────────────────────────────
// The surplus is a power sensor (`surplus`, W, positive), else worked out from the grid meter (`grid`, W, negative while
// exporting): what the running devices draw, less what the home draws from the grid. The devices are `devices` (YAML), else the switches of
// Solar Optimizer and PV Excess Control. Each device's power and energy of the day are its own sensors (`power`,
// `energy`), else the power and energy sensors of its device; its progress (a water heater's temperature toward its
// target, a pool's filtration time…) is `progress` and `target`, else a water heater's own temperatures.
export const SR_PLATFORMS = ["solar_optimizer", "pv_excess_control"];
// The managers' own switches that are not a device: Solar Optimizer's "enable" switch beside each device's.
export const SR_NOT_DEVICE = /(^switch\.enable_|_enable$|_enabled$|^enable)/;
export const SR_KINDS = {
  water_heater: /water.?heater|cumulus|chauffe.?eau|ballon|boiler|ecs|dhw/,
  ev: /\bev\b|charger|wallbox|borne|car|vehicle|voiture|zappi|easee|go.?e/,
  pool: /pool|piscine|filtr|pump|pompe|spa/,
  heater: /radiat|heater|heating|chauffage|convector|towel/,
};
export const SR_ICONS = { water_heater: "mdi:water-boiler", ev: "mdi:ev-station", pool: "mdi:pool", heater: "mdi:radiator", other: "mdi:power-plug" };

export const srNum = (st) => {
  if (!st || ["unavailable", "unknown", ""].includes(st.state)) return null;
  const v = Number(st.state);
  return Number.isFinite(v) ? v : null;
};
// A power in W, an energy in kWh, whatever the sensor's unit.
export const srWatts = (st) => {
  const v = srNum(st);
  if (v == null) return null;
  const u = st.attributes?.unit_of_measurement || "W";
  return /^kW$/i.test(u) ? v * 1000 : /^MW$/i.test(u) ? v * 1e6 : v;
};
export const srKwh = (st) => {
  const v = srNum(st);
  if (v == null) return null;
  const u = st.attributes?.unit_of_measurement || "kWh";
  return /^Wh$/i.test(u) ? v / 1000 : /^MWh$/i.test(u) ? v * 1000 : v;
};

// The kind of a device, from its domain and its name.
export const srKind = (id, name = "") => {
  if (id.startsWith("water_heater.")) return "water_heater";
  const n = `${id} ${name}`.toLowerCase();
  if (id.startsWith("climate.")) return "heater";
  return Object.keys(SR_KINDS).find((k) => SR_KINDS[k].test(n)) || "other";
};

// The surplus sensor of the home: a power sensor named like one (surplus, excess, surplus…).
export const srSurplusSource = (hass) =>
  Object.keys(hass.states || {}).find((id) => {
    if (!id.startsWith("sensor.")) return false;
    const st = hass.states[id];
    return st.attributes?.device_class === "power" && /surplus|excess|exc[eè]dent|surproduction|uberschuss|überschuss/i.test(`${id} ${st.attributes.friendly_name || ""}`);
  });

// The other sensors of a device's registry device: the first power and the first daily energy.
export const srSiblings = (hass, id) => {
  const reg = hass.entities || {};
  const dev = reg[id]?.device_id;
  if (!dev) return {};
  const out = {};
  for (const other of Object.keys(reg)) {
    if (other === id || reg[other].device_id !== dev || !other.startsWith("sensor.")) continue;
    const a = hass.states[other]?.attributes || {};
    if (!out.power && a.device_class === "power") out.power = other;
    if (!out.energy && a.device_class === "energy" && /today|daily|day|jour|heute|oggi|hoy/i.test(`${other} ${a.friendly_name || ""}`)) out.energy = other;
  }
  return out;
};

// The devices: `devices` (an entity id, or { entity, name, icon, kind, power, energy, progress, target, unit }), else the
// switches of the surplus managers.
export const srDevices = (hass, list) => {
  const reg = hass.entities || {};
  const items =
    Array.isArray(list) && list.length
      ? list
      : Object.keys(reg).filter(
          (id) => id.startsWith("switch.") && SR_PLATFORMS.includes(reg[id].platform) && !SR_NOT_DEVICE.test(id) && !SR_NOT_DEVICE.test(reg[id].translation_key || ""),
        );
  return items
    .map((d) => (typeof d === "string" ? { entity: d } : d || {}))
    .filter((d) => d.entity)
    .map((d) => {
      const st = hass.states[d.entity];
      const name = d.name || st?.attributes?.friendly_name || d.entity;
      const sib = srSiblings(hass, d.entity);
      const kind = d.kind && SR_ICONS[d.kind] ? d.kind : srKind(d.entity, name);
      return { ...d, name, kind, icon: d.icon || SR_ICONS[kind], power: d.power || sib.power, energy: d.energy || sib.energy };
    });
};

// The Intl formats, made once per language and options (a render formats many numbers).
export const srIntlCache = new Map();
export const srIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!srIntlCache.has(key)) srIntlCache.set(key, new Kind(lang, opts));
  return srIntlCache.get(key);
};
