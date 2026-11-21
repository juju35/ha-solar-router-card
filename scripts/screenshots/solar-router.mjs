// Renders the solar router cards with a mock surplus and devices and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/solar-router.mjs
import { pair, shoot } from "./harness.mjs";
import { setup } from "./mock.mjs";

// Stills: animations: false stops the running surplus, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const scenes = ["routing", "surplus", "waiting", "night"].flatMap((scene) => still(scene, { scene }));
await shoot({ prefix: "sr", tag: "solar-router-card", shots: [...scenes, ...still("narrow", { scene: "routing", width: 300 })], setup });
await shoot({
  prefix: "sr-mini",
  tag: "solar-router-mini-card",
  shots: [...still("routing", { scene: "routing" }), ...still("night", { scene: "night" }), ...still("zoom", { scene: "routing", open: ".zoom" })],
  setup,
});
