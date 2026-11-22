// The mock home of the screenshots and animations: a solar surplus sensor and three devices — a water heater and an EV
// charger on the surplus, a pool pump waiting for it with its filtration time of the day — and the sun.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-06-21T00:00:00Z" });
const W = (id, v, name) => st(id, String(v), { device_class: "power", unit_of_measurement: "W", friendly_name: name });
const KWH = (id, v, name) => st(id, String(v), { device_class: "energy", unit_of_measurement: "kWh", friendly_name: name });

// `scene`: routing (two devices on the surplus), surplus (surplus, nothing routing yet), waiting (no surplus), night.
const SCENES = {
  routing: { surplus: 1800, heater: 1180, ev: 620, temp: 58, sun: "above_horizon" },
  surplus: { surplus: 1450, heater: 0, ev: 0, temp: 65, sun: "above_horizon" },
  waiting: { surplus: 30, heater: 0, ev: 0, temp: 52, sun: "above_horizon" },
  night: { surplus: 0, heater: 0, ev: 0, temp: 63, sun: "below_horizon" },
};

export const setup = (s) => {
  const v = SCENES[s.scene];
  const states = {
    "sun.sun": st("sun.sun", v.sun),
    "sensor.solar_surplus": W("sensor.solar_surplus", v.surplus, "Solar surplus"),
    "water_heater.cumulus": st("water_heater.cumulus", "eco", { friendly_name: "Water heater", current_temperature: v.temp, temperature: 65 }),
    "sensor.cumulus_power": W("sensor.cumulus_power", v.heater, "Water heater power"),
    "sensor.cumulus_energy_today": KWH("sensor.cumulus_energy_today", 3.1, "Water heater energy today"),
    "switch.ev_charger": st("switch.ev_charger", v.ev > 0 ? "on" : "off", { friendly_name: "EV charger" }),
    "sensor.ev_charger_power": W("sensor.ev_charger_power", v.ev, "EV charger power"),
    "sensor.ev_charger_energy_today": KWH("sensor.ev_charger_energy_today", 2.4, "EV charger energy today"),
    "switch.pool_pump": st("switch.pool_pump", "off", { friendly_name: "Pool pump" }),
    "sensor.pool_pump_power": W("sensor.pool_pump_power", 0, "Pool pump power"),
    "sensor.pool_pump_energy_today": KWH("sensor.pool_pump_energy_today", 1.3, "Pool pump energy today"),
    "sensor.pool_filtration_today": st("sensor.pool_filtration_today", "4.2", { unit_of_measurement: "h", friendly_name: "Filtration today" }),
  };
  const dev = (ids, device_id) => Object.fromEntries(ids.map((id) => [id, { entity_id: id, device_id, platform: "mock" }]));
  return {
    hass: {
      language: "en",
      locale: { language: "en" },
      config: { unit_system: { temperature: "°C" } },
      entities: {
        ...dev(["water_heater.cumulus", "sensor.cumulus_power", "sensor.cumulus_energy_today"], "wh"),
        ...dev(["switch.ev_charger", "sensor.ev_charger_power", "sensor.ev_charger_energy_today"], "ev"),
        ...dev(["switch.pool_pump", "sensor.pool_pump_power", "sensor.pool_pump_energy_today"], "pool"),
      },
      states,
    },
    config: {
      surplus: "sensor.solar_surplus",
      devices: ["water_heater.cumulus", "switch.ev_charger", { entity: "switch.pool_pump", progress: "sensor.pool_filtration_today", target: 6 }],
      ...s.config,
    },
    open: s.open,
  };
};
