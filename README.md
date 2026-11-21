# ha-solar-router-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-solar-router-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/icon.svg" alt="Solar Router Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/shelly.png" alt="Shelly" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/esphome.png" alt="ESPHome" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/mqtt.png" alt="MQTT" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/solar-optimizer.png" alt="Solar Optimizer" height="36">
</p>

A Lovelace card for **solar surplus routing**: the surplus power, the devices it feeds (water heater, EV charger, pool pump…) and today's energy routed to each instead of being exported.

> [!NOTE]
> This card is being designed: there is no release yet. Watch the repository to know when the first version is out.

| Card | Type | What it shows |
|---|---|---|
| Solar router | `custom:solar-router-card` | The solar surplus and where it goes: water heater, EV charger, pool, with today's routed energy. |
| Solar router mini | `custom:solar-router-mini-card` | The surplus and the device it feeds on two lines, with a zoom to the full card. |

## Supported integrations

The card reads the grid and production meters, the routers and the surplus managers below; the devices are any `water_heater`, `switch`, `number` or charger entity:

| | Integration | What the cards show |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/shelly.png" alt="Shelly" height="16"> | [Shelly](https://www.home-assistant.io/integrations/shelly/) (built in) | Shelly EM / Pro 3EM grid and production meters |
| <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/esphome.png" alt="ESPHome" height="16"> | [ESPHome](https://www.home-assistant.io/integrations/esphome/) (built in) | Meters and DIY routers, including [Solar Router for ESPHome](https://github.com/XavierBerger/Solar-Router-for-ESPHome) |
| <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/mqtt.png" alt="MQTT" height="16"> | [MQTT](https://www.home-assistant.io/integrations/mqtt/) (built in) | MK2PVRouter, MSunPV and F1ATB routers |
| <img src="https://raw.githubusercontent.com/juju35/ha-solar-router-card/main/images/solar-optimizer.png" alt="Solar Optimizer" height="24"> | [Solar Optimizer](https://github.com/jmcollin78/solar_optimizer) (Marketplace) | Managed devices, their state and power |
|  | [PV Excess Control](https://github.com/InventoCasa/PV-Excess-Control) (Marketplace) | Appliances switched on the solar excess |

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-solar-router-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-solar-router-card` — Type: **Dashboard**
3. Open **Solar Router Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `ha-solar-router-card.js` and the `ha-solar-router-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-solar-router-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-solar-router-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## License

[MIT](https://github.com/juju35/ha-solar-router-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
