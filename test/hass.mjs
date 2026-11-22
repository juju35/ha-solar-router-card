// A mock Home Assistant with a solar surplus sensor, a grid meter, and three devices: a water heater heating on the
// surplus (its power and energy on its device), an EV charger charging on it, and a pool pump waiting for it with its
// filtration time of the day; and a Solar Optimizer device for the discovery.
export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });

const W = (id, v, name) => st(id, String(v), { device_class: "power", unit_of_measurement: "W", friendly_name: name });
const KWH = (id, v, name) => st(id, String(v), { device_class: "energy", unit_of_measurement: "kWh", friendly_name: name });

export const DEVICES = [
  "water_heater.cumulus",
  { entity: "switch.ev_charger", name: "EV charger" },
  { entity: "switch.pool_pump", name: "Pool pump", progress: "sensor.pool_filtration_today", target: 6 },
];

export const makeHass = ({ surplus = 1800, grid = -600, heater = 1180, ev = 620, sun = "above_horizon", ...overrides } = {}) => {
  const states = {
    "sun.sun": st("sun.sun", sun),
    "sensor.solar_surplus": W("sensor.solar_surplus", surplus, "Solar surplus"),
    "sensor.grid_power": W("sensor.grid_power", grid, "Grid power"),
    "water_heater.cumulus": st("water_heater.cumulus", "eco", { friendly_name: "Water heater", current_temperature: 58, temperature: 65 }),
    "sensor.cumulus_power": W("sensor.cumulus_power", heater, "Water heater power"),
    "sensor.cumulus_energy_today": KWH("sensor.cumulus_energy_today", 3.1, "Water heater energy today"),
    "switch.ev_charger": st("switch.ev_charger", ev > 0 ? "on" : "off", { friendly_name: "Wallbox" }),
    "sensor.ev_charger_power": W("sensor.ev_charger_power", ev, "Wallbox power"),
    "sensor.ev_charger_energy_today": KWH("sensor.ev_charger_energy_today", 2.4, "Wallbox energy today"),
    "switch.pool_pump": st("switch.pool_pump", "off", { friendly_name: "Pool pump" }),
    "sensor.pool_pump_power": W("sensor.pool_pump_power", 0, "Pool pump power"),
    "sensor.pool_pump_energy_today": KWH("sensor.pool_pump_energy_today", 1.3, "Pool pump energy today"),
    "sensor.pool_filtration_today": st("sensor.pool_filtration_today", "4.2", { unit_of_measurement: "h", friendly_name: "Filtration today" }),
    "switch.solar_optimizer_dryer": st("switch.solar_optimizer_dryer", "off", { friendly_name: "Dryer" }),
  };
  const dev = (ids, device_id, platform) => Object.fromEntries(ids.map((id) => [id, { device_id, platform }]));
  return {
    language: "en",
    locale: { language: "en" },
    config: { unit_system: { temperature: "°C" } },
    themes: { darkMode: false },
    entities: {
      ...dev(["water_heater.cumulus", "sensor.cumulus_power", "sensor.cumulus_energy_today"], "wh", "overkiz"),
      ...dev(["switch.ev_charger", "sensor.ev_charger_power", "sensor.ev_charger_energy_today"], "ev", "easee"),
      ...dev(["switch.pool_pump", "sensor.pool_pump_power", "sensor.pool_pump_energy_today"], "pool", "shelly"),
      ...dev(["switch.solar_optimizer_dryer"], "so", "solar_optimizer"),
      "sensor.solar_surplus": { device_id: "router", platform: "esphome" },
    },
    states,
    calls: [],
    callService(domain, service, data) {
      this.calls.push([domain, service, data]);
    },
    ...overrides,
  };
};
