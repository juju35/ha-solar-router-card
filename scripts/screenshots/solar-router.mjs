// Renders the solar router cards with a mock surplus and devices and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/solar-router.mjs
import { rmSync } from "node:fs";
import { pair, shoot } from "./harness.mjs";
import { setup } from "./mock.mjs";

// Stills: animations: false stops the running surplus, so a capture only changes when the card does. Routing has its
// GIF (animations.mjs) and no still: the same state twice would be one file too many.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const scenes = ["surplus", "waiting", "night"].flatMap((scene) => still(scene, { scene }));
await shoot({ prefix: "sr", tag: "solar-router-card", shots: [...scenes, ...still("narrow", { scene: "routing", width: 300 })], setup });
await shoot({
  prefix: "sr-mini",
  tag: "solar-router-mini-card",
  shots: [...still("night", { scene: "night" }), ...still("zoom", { scene: "routing", open: ".zoom" })],
  setup,
});
// The routing stills made before the GIFs took their place.
for (const name of ["sr-routing", "sr-mini-routing"]) for (const theme of ["", "-dark"]) rmSync(`screenshots/${name}${theme}.png`, { force: true });
