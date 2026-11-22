# Changelog

## 1.0.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.0.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.0.0 - 2026-11-22

### Features
- First release: `solar-router-card` and `solar-router-mini-card`. The surplus now and the energy routed today; one tile per device (water heater, EV charger, pool pump, heater…) on the surplus or waiting for it, with its power, its progress and its energy of the day; an illustrated header where the surplus runs from the panels to the devices. The surplus from a sensor or from the grid meter; the devices from `devices` or from Solar Optimizer and PV Excess Control.
