/**
 * Shared by the solar router cards (its names are used by the other src/ files): the surplus and the devices, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-solar-router-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    unavailable: "Unavailable",
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    unavailable: "Indisponible",
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    unavailable: "Nicht verfügbar",
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    unavailable: "No disponible",
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    unavailable: "Недоступно",
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    unavailable: "Nedostupno",
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    unavailable: "Non disponibile",
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    unavailable: "Niet beschikbaar",
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    unavailable: "Indisponível",
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    unavailable: "Niedostępne",
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    unavailable: "Indisponibil",
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    unavailable: "Utilgængelig",
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    unavailable: "Ej tillgänglig",
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    unavailable: "Недостъпно",
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    unavailable: "Недоступно",
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    unavailable: "Недоступно",
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    unavailable: "Nem elérhető",
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    unavailable: "Ni na voljo",
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    unavailable: "Nav pieejams",
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    unavailable: "Μη διαθέσιμο",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── Solar router ─────────────────────────────────────────────────────────────
// The surplus is a power sensor (`surplus`, W, positive), else worked out from the grid meter (`grid`, W, negative while
// exporting): what the running devices draw, less what the home draws from the grid. The devices are `devices` (YAML), else the switches of
// Solar Optimizer and PV Excess Control. Each device's power and energy of the day are its own sensors (`power`,
// `energy`), else the power and energy sensors of its device; its progress (a water heater's temperature toward its
// target, a pool's filtration time…) is `progress` and `target`, else a water heater's own temperatures.
const SR_PLATFORMS = ["solar_optimizer", "pv_excess_control"];
// The managers' own switches that are not a device: Solar Optimizer's "enable" switch beside each device's.
const SR_NOT_DEVICE = /(^switch\.enable_|_enable$|_enabled$|^enable)/;
const SR_KINDS = {
  water_heater: /water.?heater|cumulus|chauffe.?eau|ballon|boiler|ecs|dhw/,
  ev: /\bev\b|charger|wallbox|borne|car|vehicle|voiture|zappi|easee|go.?e/,
  pool: /pool|piscine|filtr|pump|pompe|spa/,
  heater: /radiat|heater|heating|chauffage|convector|towel/,
};
const SR_ICONS = { water_heater: "mdi:water-boiler", ev: "mdi:ev-station", pool: "mdi:pool", heater: "mdi:radiator", other: "mdi:power-plug" };

const srNum = (st) => {
  if (!st || ["unavailable", "unknown", ""].includes(st.state)) return null;
  const v = Number(st.state);
  return Number.isFinite(v) ? v : null;
};
// A power in W, an energy in kWh, whatever the sensor's unit.
const srWatts = (st) => {
  const v = srNum(st);
  if (v == null) return null;
  const u = st.attributes?.unit_of_measurement || "W";
  return /^kW$/i.test(u) ? v * 1000 : /^MW$/i.test(u) ? v * 1e6 : v;
};
const srKwh = (st) => {
  const v = srNum(st);
  if (v == null) return null;
  const u = st.attributes?.unit_of_measurement || "kWh";
  return /^Wh$/i.test(u) ? v / 1000 : /^MWh$/i.test(u) ? v * 1000 : v;
};

// The kind of a device, from its domain and its name.
const srKind = (id, name = "") => {
  if (id.startsWith("water_heater.")) return "water_heater";
  const n = `${id} ${name}`.toLowerCase();
  if (id.startsWith("climate.")) return "heater";
  return Object.keys(SR_KINDS).find((k) => SR_KINDS[k].test(n)) || "other";
};

// The surplus sensor of the home: a power sensor named like one (surplus, excess, surplus…).
const srSurplusSource = (hass) =>
  Object.keys(hass.states || {}).find((id) => {
    if (!id.startsWith("sensor.")) return false;
    const st = hass.states[id];
    return st.attributes?.device_class === "power" && /surplus|excess|exc[eè]dent|surproduction|uberschuss|überschuss/i.test(`${id} ${st.attributes.friendly_name || ""}`);
  });

// The other sensors of a device's registry device: the first power and the first daily energy.
const srSiblings = (hass, id) => {
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
const srDevices = (hass, list) => {
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
const srIntlCache = new Map();
const srIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!srIntlCache.has(key)) srIntlCache.set(key, new Kind(lang, opts));
  return srIntlCache.get(key);
};

// Strings of the solar router cards; the shared ones above (editor basics) complete them.
const SR_I18N = {
  en: {
    title: "Solar router",
    st_routing: "Routing",
    st_surplus: "Surplus available",
    st_waiting: "Waiting for surplus",
    st_night: "Night",
    st_offline: "Unavailable",
    surplus_now: "Surplus now",
    routed_today: "Routed today",
    on_surplus: "On surplus",
    waiting: "Waiting for surplus",
    on_grid: "From the grid",
    dev_offline: "Unavailable",
    kwh_today: "{v} today",
    sub_none: "No surplus · {e} routed today",
    chip_surplus: "{v} surplus",
    no_router: "No surplus and no device found: set `surplus` or `grid`, and `devices`",
    no_devices: "No device: add them with `devices` (YAML)",
    ed_surplus: "Surplus power",
    ed_surplus_helper: "The power available for routing (W); empty: worked out from the grid power",
    ed_grid: "Grid power",
    ed_grid_helper: "The grid meter's power (W), negative while exporting; the surplus is what is exported plus what the devices route",
    ed_grid_invert: "Grid power sign inverted",
    ed_routed: "Routed energy today",
    ed_routed_helper: "Today's routed energy (kWh); empty: the devices' energies added up",
    ed_threshold: "Surplus threshold",
    ed_threshold_helper: "Below this surplus (W), there is nothing to route",
    ed_show_subtitle: "Show subtitle",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_animations: "Animations",
    ed_devices: "Devices (YAML)",
    ed_devices_helper: "One per device: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Empty: Solar router",
  },
  fr: {
    title: "Routeur solaire",
    st_routing: "Routage",
    st_surplus: "Surplus disponible",
    st_waiting: "En attente de surplus",
    st_night: "Nuit",
    st_offline: "Indisponible",
    surplus_now: "Surplus actuel",
    routed_today: "Routé aujourd'hui",
    on_surplus: "Sur le surplus",
    waiting: "En attente de surplus",
    on_grid: "Sur le réseau",
    dev_offline: "Indisponible",
    kwh_today: "{v} aujourd'hui",
    sub_none: "Pas de surplus · {e} routés aujourd'hui",
    chip_surplus: "{v} de surplus",
    no_router: "Aucun surplus ni appareil trouvé : définis `surplus` ou `grid`, et `devices`",
    no_devices: "Aucun appareil : ajoute-les avec `devices` (YAML)",
    ed_surplus: "Puissance de surplus",
    ed_surplus_helper: "La puissance disponible pour le routage (W) ; vide : calculée à partir de la puissance réseau",
    ed_grid: "Puissance réseau",
    ed_grid_helper: "La puissance du compteur réseau (W), négative à l'injection ; le surplus est ce qui est injecté plus ce que routent les appareils",
    ed_grid_invert: "Signe de la puissance réseau inversé",
    ed_routed: "Énergie routée aujourd'hui",
    ed_routed_helper: "L'énergie routée du jour (kWh) ; vide : la somme des énergies des appareils",
    ed_threshold: "Seuil de surplus",
    ed_threshold_helper: "Sous ce surplus (W), il n'y a rien à router",
    ed_show_subtitle: "Afficher le sous-titre",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_animations: "Animations",
    ed_devices: "Appareils (YAML)",
    ed_devices_helper: "Un par appareil : entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Vide : Routeur solaire",
  },
  de: {
    title: "Solarrouter",
    st_routing: "Leitet um",
    st_surplus: "Überschuss verfügbar",
    st_waiting: "Wartet auf Überschuss",
    st_night: "Nacht",
    st_offline: "Nicht verfügbar",
    surplus_now: "Überschuss jetzt",
    routed_today: "Heute umgeleitet",
    on_surplus: "Am Überschuss",
    waiting: "Wartet auf Überschuss",
    on_grid: "Aus dem Netz",
    dev_offline: "Nicht verfügbar",
    kwh_today: "{v} heute",
    sub_none: "Kein Überschuss · {e} heute umgeleitet",
    chip_surplus: "{v} Überschuss",
    no_router: "Kein Überschuss und kein Gerät gefunden: lege `surplus` oder `grid` und `devices` fest",
    no_devices: "Kein Gerät: füge sie mit `devices` (YAML) hinzu",
    ed_surplus: "Überschussleistung",
    ed_surplus_helper: "Die für die Umleitung verfügbare Leistung (W); leer: aus der Netzleistung berechnet",
    ed_grid: "Netzleistung",
    ed_grid_helper: "Die Leistung des Netzzählers (W), negativ bei Einspeisung; der Überschuss ist die Einspeisung plus das, was die Geräte umleiten",
    ed_grid_invert: "Vorzeichen der Netzleistung umgekehrt",
    ed_routed: "Heute umgeleitete Energie",
    ed_routed_helper: "Die heute umgeleitete Energie (kWh); leer: die Summe der Energien der Geräte",
    ed_threshold: "Überschussschwelle",
    ed_threshold_helper: "Unter diesem Überschuss (W) gibt es nichts umzuleiten",
    ed_devices: "Geräte (YAML)",
    ed_devices_helper: "Eines pro Gerät: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Leer: Solarrouter",
    ed_show_subtitle: "Untertitel anzeigen",
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_theme: "Design der Kopfzeile",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_animations: "Animationen",
  },
  es: {
    title: "Router solar",
    st_routing: "Derivando",
    st_surplus: "Excedente disponible",
    st_waiting: "Esperando excedente",
    st_night: "Noche",
    st_offline: "No disponible",
    surplus_now: "Excedente ahora",
    routed_today: "Derivado hoy",
    on_surplus: "Con excedente",
    waiting: "Esperando excedente",
    on_grid: "De la red",
    dev_offline: "No disponible",
    kwh_today: "{v} hoy",
    sub_none: "Sin excedente · {e} derivados hoy",
    chip_surplus: "{v} de excedente",
    no_router: "No se encontró excedente ni aparato: define `surplus` o `grid`, y `devices`",
    no_devices: "Ningún aparato: añádelos con `devices` (YAML)",
    ed_surplus: "Potencia de excedente",
    ed_surplus_helper: "La potencia disponible para derivar (W); vacío: calculada a partir de la potencia de red",
    ed_grid: "Potencia de red",
    ed_grid_helper: "La potencia del contador de red (W), negativa al inyectar; el excedente es lo inyectado más lo que derivan los aparatos",
    ed_grid_invert: "Signo de la potencia de red invertido",
    ed_routed: "Energía derivada hoy",
    ed_routed_helper: "La energía derivada hoy (kWh); vacío: la suma de las energías de los aparatos",
    ed_threshold: "Umbral de excedente",
    ed_threshold_helper: "Por debajo de este excedente (W), no hay nada que derivar",
    ed_devices: "Aparatos (YAML)",
    ed_devices_helper: "Uno por aparato: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Vacío: Router solar",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_animations: "Animaciones",
  },
  sr: {
    title: "Соларни рутер",
    st_routing: "Преусмерава",
    st_surplus: "Вишак доступан",
    st_waiting: "Чека вишак",
    st_night: "Ноћ",
    st_offline: "Недоступно",
    surplus_now: "Вишак сада",
    routed_today: "Преусмерено данас",
    on_surplus: "На вишку",
    waiting: "Чека вишак",
    on_grid: "Са мреже",
    dev_offline: "Недоступно",
    kwh_today: "{v} данас",
    sub_none: "Нема вишка · {e} преусмерено данас",
    chip_surplus: "{v} вишка",
    no_router: "Није пронађен вишак ни уређај: подесите `surplus` или `grid`, и `devices`",
    no_devices: "Нема уређаја: додајте их са `devices` (YAML)",
    ed_surplus: "Снага вишка",
    ed_surplus_helper: "Снага доступна за преусмеравање (W); празно: израчунава се из снаге мреже",
    ed_grid: "Снага мреже",
    ed_grid_helper: "Снага мрежног бројила (W), негативна при предаји; вишак је оно што се предаје плус оно што уређаји преусмеравају",
    ed_grid_invert: "Обрнут знак снаге мреже",
    ed_routed: "Енергија преусмерена данас",
    ed_routed_helper: "Енергија преусмерена данас (kWh); празно: збир енергије уређаја",
    ed_threshold: "Праг вишка",
    ed_threshold_helper: "Испод овог вишка (W) нема шта да се преусмери",
    ed_devices: "Уређаји (YAML)",
    ed_devices_helper: "Један по уређају: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Празно: Соларни рутер",
    ed_show_subtitle: "Прикажи поднаслов",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_animations: "Анимације",
  },
  "sr-Latn": {
    title: "Solarni ruter",
    st_routing: "Preusmerava",
    st_surplus: "Višak dostupan",
    st_waiting: "Čeka višak",
    st_night: "Noć",
    st_offline: "Nedostupno",
    surplus_now: "Višak sada",
    routed_today: "Preusmereno danas",
    on_surplus: "Na višku",
    waiting: "Čeka višak",
    on_grid: "Sa mreže",
    dev_offline: "Nedostupno",
    kwh_today: "{v} danas",
    sub_none: "Nema viška · {e} preusmereno danas",
    chip_surplus: "{v} viška",
    no_router: "Nije pronađen višak ni uređaj: podesite `surplus` ili `grid`, i `devices`",
    no_devices: "Nema uređaja: dodajte ih sa `devices` (YAML)",
    ed_surplus: "Snaga viška",
    ed_surplus_helper: "Snaga dostupna za preusmeravanje (W); prazno: izračunava se iz snage mreže",
    ed_grid: "Snaga mreže",
    ed_grid_helper: "Snaga mrežnog brojila (W), negativna pri predaji; višak je ono što se predaje plus ono što uređaji preusmeravaju",
    ed_grid_invert: "Obrnut znak snage mreže",
    ed_routed: "Energija preusmerena danas",
    ed_routed_helper: "Energija preusmerena danas (kWh); prazno: zbir energije uređaja",
    ed_threshold: "Prag viška",
    ed_threshold_helper: "Ispod ovog viška (W) nema šta da se preusmeri",
    ed_devices: "Uređaji (YAML)",
    ed_devices_helper: "Jedan po uređaju: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Prazno: Solarni ruter",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_animations: "Animacije",
  },
  it: {
    title: "Router solare",
    st_routing: "Instradamento",
    st_surplus: "Surplus disponibile",
    st_waiting: "In attesa di surplus",
    st_night: "Notte",
    st_offline: "Non disponibile",
    surplus_now: "Surplus adesso",
    routed_today: "Instradato oggi",
    on_surplus: "Sul surplus",
    waiting: "In attesa di surplus",
    on_grid: "Dalla rete",
    dev_offline: "Non disponibile",
    kwh_today: "{v} oggi",
    sub_none: "Nessun surplus · {e} instradati oggi",
    chip_surplus: "{v} di surplus",
    no_router: "Nessun surplus né apparecchio trovato: imposta `surplus` o `grid`, e `devices`",
    no_devices: "Nessun apparecchio: aggiungili con `devices` (YAML)",
    ed_surplus: "Potenza di surplus",
    ed_surplus_helper: "La potenza disponibile per l'instradamento (W); vuoto: calcolata dalla potenza di rete",
    ed_grid: "Potenza di rete",
    ed_grid_helper: "La potenza del contatore di rete (W), negativa in immissione; il surplus è quanto immesso più quanto instradano gli apparecchi",
    ed_grid_invert: "Segno della potenza di rete invertito",
    ed_routed: "Energia instradata oggi",
    ed_routed_helper: "L'energia instradata oggi (kWh); vuoto: la somma delle energie degli apparecchi",
    ed_threshold: "Soglia di surplus",
    ed_threshold_helper: "Sotto questo surplus (W) non c'è niente da instradare",
    ed_devices: "Apparecchi (YAML)",
    ed_devices_helper: "Uno per apparecchio: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Vuoto: Router solare",
    ed_show_subtitle: "Mostra sottotitolo",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_animations: "Animazioni",
  },
  nl: {
    title: "Zonnerouter",
    st_routing: "Routeert",
    st_surplus: "Overschot beschikbaar",
    st_waiting: "Wacht op overschot",
    st_night: "Nacht",
    st_offline: "Niet beschikbaar",
    surplus_now: "Overschot nu",
    routed_today: "Vandaag gerouteerd",
    on_surplus: "Op het overschot",
    waiting: "Wacht op overschot",
    on_grid: "Van het net",
    dev_offline: "Niet beschikbaar",
    kwh_today: "{v} vandaag",
    sub_none: "Geen overschot · {e} vandaag gerouteerd",
    chip_surplus: "{v} overschot",
    no_router: "Geen overschot en geen apparaat gevonden: stel `surplus` of `grid` en `devices` in",
    no_devices: "Geen apparaat: voeg ze toe met `devices` (YAML)",
    ed_surplus: "Overschotvermogen",
    ed_surplus_helper: "Het vermogen dat beschikbaar is om te routeren (W); leeg: berekend uit het netvermogen",
    ed_grid: "Netvermogen",
    ed_grid_helper: "Het vermogen van de netmeter (W), negatief bij teruglevering; het overschot is wat teruggeleverd wordt plus wat de apparaten routeren",
    ed_grid_invert: "Teken van het netvermogen omgekeerd",
    ed_routed: "Vandaag gerouteerde energie",
    ed_routed_helper: "De vandaag gerouteerde energie (kWh); leeg: de som van de energie van de apparaten",
    ed_threshold: "Overschotdrempel",
    ed_threshold_helper: "Onder dit overschot (W) is er niets te routeren",
    ed_devices: "Apparaten (YAML)",
    ed_devices_helper: "Eén per apparaat: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Leeg: Zonnerouter",
    ed_show_subtitle: "Ondertitel tonen",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_animations: "Animaties",
  },
  pt: {
    title: "Router solar",
    st_routing: "A encaminhar",
    st_surplus: "Excedente disponível",
    st_waiting: "À espera de excedente",
    st_night: "Noite",
    st_offline: "Indisponível",
    surplus_now: "Excedente agora",
    routed_today: "Encaminhado hoje",
    on_surplus: "No excedente",
    waiting: "À espera de excedente",
    on_grid: "Da rede",
    dev_offline: "Indisponível",
    kwh_today: "{v} hoje",
    sub_none: "Sem excedente · {e} encaminhados hoje",
    chip_surplus: "{v} de excedente",
    no_router: "Nenhum excedente nem aparelho encontrado: defina `surplus` ou `grid`, e `devices`",
    no_devices: "Nenhum aparelho: adicione-os com `devices` (YAML)",
    ed_surplus: "Potência de excedente",
    ed_surplus_helper: "A potência disponível para encaminhar (W); vazio: calculada a partir da potência da rede",
    ed_grid: "Potência da rede",
    ed_grid_helper: "A potência do contador da rede (W), negativa ao injetar; o excedente é o injetado mais o que os aparelhos encaminham",
    ed_grid_invert: "Sinal da potência da rede invertido",
    ed_routed: "Energia encaminhada hoje",
    ed_routed_helper: "A energia encaminhada hoje (kWh); vazio: a soma das energias dos aparelhos",
    ed_threshold: "Limiar de excedente",
    ed_threshold_helper: "Abaixo deste excedente (W), não há nada a encaminhar",
    ed_devices: "Aparelhos (YAML)",
    ed_devices_helper: "Um por aparelho: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Vazio: Router solar",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_animations: "Animações",
  },
  pl: {
    title: "Router solarny",
    st_routing: "Przekierowuje",
    st_surplus: "Dostępna nadwyżka",
    st_waiting: "Czeka na nadwyżkę",
    st_night: "Noc",
    st_offline: "Niedostępne",
    surplus_now: "Nadwyżka teraz",
    routed_today: "Przekierowano dziś",
    on_surplus: "Na nadwyżce",
    waiting: "Czeka na nadwyżkę",
    on_grid: "Z sieci",
    dev_offline: "Niedostępne",
    kwh_today: "{v} dziś",
    sub_none: "Brak nadwyżki · {e} przekierowano dziś",
    chip_surplus: "{v} nadwyżki",
    no_router: "Nie znaleziono nadwyżki ani urządzenia: ustaw `surplus` lub `grid` oraz `devices`",
    no_devices: "Brak urządzeń: dodaj je przez `devices` (YAML)",
    ed_surplus: "Moc nadwyżki",
    ed_surplus_helper: "Moc dostępna do przekierowania (W); puste: obliczana z mocy sieci",
    ed_grid: "Moc sieci",
    ed_grid_helper: "Moc licznika sieciowego (W), ujemna przy oddawaniu; nadwyżka to energia oddawana plus to, co przekierowują urządzenia",
    ed_grid_invert: "Odwrócony znak mocy sieci",
    ed_routed: "Energia przekierowana dziś",
    ed_routed_helper: "Energia przekierowana dziś (kWh); puste: suma energii urządzeń",
    ed_threshold: "Próg nadwyżki",
    ed_threshold_helper: "Poniżej tej nadwyżki (W) nie ma czego przekierowywać",
    ed_devices: "Urządzenia (YAML)",
    ed_devices_helper: "Jedno na urządzenie: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Puste: Router solarny",
    ed_show_subtitle: "Pokaż podtytuł",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatycznie (zgodnie z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_animations: "Animacje",
  },
  ro: {
    title: "Router solar",
    st_routing: "Redirecționează",
    st_surplus: "Surplus disponibil",
    st_waiting: "Așteaptă surplus",
    st_night: "Noapte",
    st_offline: "Indisponibil",
    surplus_now: "Surplus acum",
    routed_today: "Redirecționat azi",
    on_surplus: "Pe surplus",
    waiting: "Așteaptă surplus",
    on_grid: "De la rețea",
    dev_offline: "Indisponibil",
    kwh_today: "{v} azi",
    sub_none: "Fără surplus · {e} redirecționați azi",
    chip_surplus: "{v} surplus",
    no_router: "Nu s-a găsit niciun surplus și niciun aparat: setează `surplus` sau `grid`, și `devices`",
    no_devices: "Niciun aparat: adaugă-le cu `devices` (YAML)",
    ed_surplus: "Putere de surplus",
    ed_surplus_helper: "Puterea disponibilă pentru redirecționare (W); gol: calculată din puterea rețelei",
    ed_grid: "Puterea rețelei",
    ed_grid_helper: "Puterea contorului de rețea (W), negativă la injecție; surplusul este ce se injectează plus ce redirecționează aparatele",
    ed_grid_invert: "Semnul puterii rețelei inversat",
    ed_routed: "Energie redirecționată azi",
    ed_routed_helper: "Energia redirecționată azi (kWh); gol: suma energiilor aparatelor",
    ed_threshold: "Prag de surplus",
    ed_threshold_helper: "Sub acest surplus (W) nu e nimic de redirecționat",
    ed_devices: "Aparate (YAML)",
    ed_devices_helper: "Unul pe aparat: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Gol: Router solar",
    ed_show_subtitle: "Afișează subtitlul",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_animations: "Animații",
  },
  da: {
    title: "Solrouter",
    st_routing: "Omdirigerer",
    st_surplus: "Overskud tilgængeligt",
    st_waiting: "Venter på overskud",
    st_night: "Nat",
    st_offline: "Utilgængelig",
    surplus_now: "Overskud nu",
    routed_today: "Omdirigeret i dag",
    on_surplus: "På overskud",
    waiting: "Venter på overskud",
    on_grid: "Fra nettet",
    dev_offline: "Utilgængelig",
    kwh_today: "{v} i dag",
    sub_none: "Intet overskud · {e} omdirigeret i dag",
    chip_surplus: "{v} overskud",
    no_router: "Intet overskud og ingen enhed fundet: angiv `surplus` eller `grid` og `devices`",
    no_devices: "Ingen enhed: tilføj dem med `devices` (YAML)",
    ed_surplus: "Overskudseffekt",
    ed_surplus_helper: "Effekten, der er til rådighed til omdirigering (W); tom: beregnet ud fra neteffekten",
    ed_grid: "Neteffekt",
    ed_grid_helper: "Netmålerens effekt (W), negativ ved eksport; overskuddet er det eksporterede plus det, enhederne omdirigerer",
    ed_grid_invert: "Neteffektens fortegn omvendt",
    ed_routed: "Omdirigeret energi i dag",
    ed_routed_helper: "Den omdirigerede energi i dag (kWh); tom: summen af enhedernes energi",
    ed_threshold: "Overskudstærskel",
    ed_threshold_helper: "Under dette overskud (W) er der intet at omdirigere",
    ed_devices: "Enheder (YAML)",
    ed_devices_helper: "Én pr. enhed: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Tom: Solrouter",
    ed_show_subtitle: "Vis undertitel",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_animations: "Animationer",
  },
  sv: {
    title: "Solrouter",
    st_routing: "Styr om",
    st_surplus: "Överskott tillgängligt",
    st_waiting: "Väntar på överskott",
    st_night: "Natt",
    st_offline: "Otillgänglig",
    surplus_now: "Överskott nu",
    routed_today: "Omstyrt i dag",
    on_surplus: "På överskott",
    waiting: "Väntar på överskott",
    on_grid: "Från nätet",
    dev_offline: "Otillgänglig",
    kwh_today: "{v} i dag",
    sub_none: "Inget överskott · {e} omstyrt i dag",
    chip_surplus: "{v} överskott",
    no_router: "Inget överskott och ingen apparat hittades: ange `surplus` eller `grid` och `devices`",
    no_devices: "Ingen apparat: lägg till dem med `devices` (YAML)",
    ed_surplus: "Överskottseffekt",
    ed_surplus_helper: "Effekten som finns för omstyrning (W); tom: beräknad från näteffekten",
    ed_grid: "Näteffekt",
    ed_grid_helper: "Nätmätarens effekt (W), negativ vid export; överskottet är det som exporteras plus det som apparaterna styr om",
    ed_grid_invert: "Näteffektens tecken omvänt",
    ed_routed: "Omstyrd energi i dag",
    ed_routed_helper: "Den omstyrda energin i dag (kWh); tom: summan av apparaternas energi",
    ed_threshold: "Överskottströskel",
    ed_threshold_helper: "Under detta överskott (W) finns inget att styra om",
    ed_devices: "Apparater (YAML)",
    ed_devices_helper: "En per apparat: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Tom: Solrouter",
    ed_show_subtitle: "Visa underrubrik",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_animations: "Animationer",
  },
  bg: {
    title: "Соларен рутер",
    st_routing: "Пренасочва",
    st_surplus: "Наличен излишък",
    st_waiting: "Изчаква излишък",
    st_night: "Нощ",
    st_offline: "Недостъпно",
    surplus_now: "Излишък сега",
    routed_today: "Пренасочено днес",
    on_surplus: "На излишък",
    waiting: "Изчаква излишък",
    on_grid: "От мрежата",
    dev_offline: "Недостъпно",
    kwh_today: "{v} днес",
    sub_none: "Няма излишък · {e} пренасочени днес",
    chip_surplus: "{v} излишък",
    no_router: "Не е намерен излишък, нито уред: задайте `surplus` или `grid` и `devices`",
    no_devices: "Няма уреди: добавете ги с `devices` (YAML)",
    ed_surplus: "Мощност на излишъка",
    ed_surplus_helper: "Мощността, налична за пренасочване (W); празно: изчислена от мощността на мрежата",
    ed_grid: "Мощност на мрежата",
    ed_grid_helper: "Мощността на мрежовия електромер (W), отрицателна при отдаване; излишъкът е отдаденото плюс пренасоченото от уредите",
    ed_grid_invert: "Обърнат знак на мощността на мрежата",
    ed_routed: "Пренасочена енергия днес",
    ed_routed_helper: "Пренасочената днес енергия (kWh); празно: сборът от енергията на уредите",
    ed_threshold: "Праг на излишъка",
    ed_threshold_helper: "Под този излишък (W) няма какво да се пренасочва",
    ed_devices: "Уреди (YAML)",
    ed_devices_helper: "По един на уред: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Празно: Соларен рутер",
    ed_show_subtitle: "Показване на подзаглавие",
    ed_illustration: "Илюстрирано заглавие",
    ed_illustration_theme: "Тема на заглавието",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_animations: "Анимации",
  },
  ru: {
    title: "Солнечный маршрутизатор",
    st_routing: "Перенаправляет",
    st_surplus: "Есть излишек",
    st_waiting: "Ожидание излишка",
    st_night: "Ночь",
    st_offline: "Недоступно",
    surplus_now: "Излишек сейчас",
    routed_today: "Перенаправлено сегодня",
    on_surplus: "На излишке",
    waiting: "Ожидание излишка",
    on_grid: "От сети",
    dev_offline: "Недоступно",
    kwh_today: "{v} сегодня",
    sub_none: "Нет излишка · {e} перенаправлено сегодня",
    chip_surplus: "Излишек {v}",
    no_router: "Не найдено ни излишка, ни устройства: задайте `surplus` или `grid` и `devices`",
    no_devices: "Нет устройств: добавьте их через `devices` (YAML)",
    ed_surplus: "Мощность излишка",
    ed_surplus_helper: "Мощность, доступная для перенаправления (Вт); пусто: вычисляется из мощности сети",
    ed_grid: "Мощность сети",
    ed_grid_helper: "Мощность сетевого счётчика (Вт), отрицательная при отдаче; излишек — это отдача плюс то, что перенаправляют устройства",
    ed_grid_invert: "Обратный знак мощности сети",
    ed_routed: "Перенаправленная энергия за сегодня",
    ed_routed_helper: "Энергия, перенаправленная сегодня (кВт·ч); пусто: сумма энергии устройств",
    ed_threshold: "Порог излишка",
    ed_threshold_helper: "Ниже этого излишка (Вт) перенаправлять нечего",
    ed_devices: "Устройства (YAML)",
    ed_devices_helper: "По одному на устройство: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Пусто: Солнечный маршрутизатор",
    ed_show_subtitle: "Показывать подзаголовок",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_animations: "Анимации",
  },
  uk: {
    title: "Сонячний маршрутизатор",
    st_routing: "Перенаправляє",
    st_surplus: "Є надлишок",
    st_waiting: "Очікування надлишку",
    st_night: "Ніч",
    st_offline: "Недоступно",
    surplus_now: "Надлишок зараз",
    routed_today: "Перенаправлено сьогодні",
    on_surplus: "На надлишку",
    waiting: "Очікування надлишку",
    on_grid: "Від мережі",
    dev_offline: "Недоступно",
    kwh_today: "{v} сьогодні",
    sub_none: "Немає надлишку · {e} перенаправлено сьогодні",
    chip_surplus: "Надлишок {v}",
    no_router: "Не знайдено ні надлишку, ні пристрою: задайте `surplus` або `grid` і `devices`",
    no_devices: "Немає пристроїв: додайте їх через `devices` (YAML)",
    ed_surplus: "Потужність надлишку",
    ed_surplus_helper: "Потужність, доступна для перенаправлення (Вт); порожньо: обчислюється з потужності мережі",
    ed_grid: "Потужність мережі",
    ed_grid_helper: "Потужність мережевого лічильника (Вт), від'ємна при віддачі; надлишок — це віддача плюс те, що перенаправляють пристрої",
    ed_grid_invert: "Обернений знак потужності мережі",
    ed_routed: "Перенаправлена енергія за сьогодні",
    ed_routed_helper: "Енергія, перенаправлена сьогодні (кВт·год); порожньо: сума енергії пристроїв",
    ed_threshold: "Поріг надлишку",
    ed_threshold_helper: "Нижче цього надлишку (Вт) перенаправляти нічого",
    ed_devices: "Пристрої (YAML)",
    ed_devices_helper: "По одному на пристрій: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Порожньо: Сонячний маршрутизатор",
    ed_show_subtitle: "Показувати підзаголовок",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_animations: "Анімації",
  },
  hu: {
    title: "Napelemes router",
    st_routing: "Átirányít",
    st_surplus: "Többlet elérhető",
    st_waiting: "Többletre vár",
    st_night: "Éjszaka",
    st_offline: "Nem elérhető",
    surplus_now: "Többlet most",
    routed_today: "Ma átirányítva",
    on_surplus: "Többleten",
    waiting: "Többletre vár",
    on_grid: "Hálózatról",
    dev_offline: "Nem elérhető",
    kwh_today: "{v} ma",
    sub_none: "Nincs többlet · {e} ma átirányítva",
    chip_surplus: "{v} többlet",
    no_router: "Nem található többlet és eszköz: állítsd be a `surplus` vagy `grid` és a `devices` értékét",
    no_devices: "Nincs eszköz: add hozzá őket a `devices` (YAML) mezővel",
    ed_surplus: "Többletteljesítmény",
    ed_surplus_helper: "Az átirányításra elérhető teljesítmény (W); üres: a hálózati teljesítményből számolva",
    ed_grid: "Hálózati teljesítmény",
    ed_grid_helper: "A hálózati mérő teljesítménye (W), betápláláskor negatív; a többlet a betáplált plusz amit az eszközök átirányítanak",
    ed_grid_invert: "Hálózati teljesítmény előjele fordított",
    ed_routed: "Ma átirányított energia",
    ed_routed_helper: "A ma átirányított energia (kWh); üres: az eszközök energiájának összege",
    ed_threshold: "Többletküszöb",
    ed_threshold_helper: "E többlet (W) alatt nincs mit átirányítani",
    ed_devices: "Eszközök (YAML)",
    ed_devices_helper: "Eszközönként egy: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Üres: Napelemes router",
    ed_show_subtitle: "Alcím megjelenítése",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_animations: "Animációk",
  },
  sk: {
    title: "Solárny router",
    st_routing: "Presmerúva",
    st_surplus: "Prebytok k dispozícii",
    st_waiting: "Čaká na prebytok",
    st_night: "Noc",
    st_offline: "Nedostupné",
    surplus_now: "Prebytok teraz",
    routed_today: "Dnes presmerované",
    on_surplus: "Na prebytku",
    waiting: "Čaká na prebytok",
    on_grid: "Zo siete",
    dev_offline: "Nedostupné",
    kwh_today: "{v} dnes",
    sub_none: "Žiadny prebytok · {e} dnes presmerované",
    chip_surplus: "{v} prebytku",
    no_router: "Nenašiel sa prebytok ani zariadenie: nastavte `surplus` alebo `grid` a `devices`",
    no_devices: "Žiadne zariadenie: pridajte ich cez `devices` (YAML)",
    ed_surplus: "Výkon prebytku",
    ed_surplus_helper: "Výkon dostupný na presmerovanie (W); prázdne: vypočítaný z výkonu siete",
    ed_grid: "Výkon siete",
    ed_grid_helper: "Výkon sieťového elektromera (W), záporný pri dodávke; prebytok je dodávka plus to, čo presmerúvajú zariadenia",
    ed_grid_invert: "Obrátené znamienko výkonu siete",
    ed_routed: "Dnes presmerovaná energia",
    ed_routed_helper: "Dnes presmerovaná energia (kWh); prázdne: súčet energie zariadení",
    ed_threshold: "Prah prebytku",
    ed_threshold_helper: "Pod týmto prebytkom (W) nie je čo presmerovať",
    ed_devices: "Zariadenia (YAML)",
    ed_devices_helper: "Jedno na zariadenie: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Prázdne: Solárny router",
    ed_show_subtitle: "Zobraziť podnadpis",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_animations: "Animácie",
  },
  cs: {
    title: "Solární router",
    st_routing: "Přesměrovává",
    st_surplus: "Přebytek k dispozici",
    st_waiting: "Čeká na přebytek",
    st_night: "Noc",
    st_offline: "Nedostupné",
    surplus_now: "Přebytek teď",
    routed_today: "Dnes přesměrováno",
    on_surplus: "Na přebytku",
    waiting: "Čeká na přebytek",
    on_grid: "Ze sítě",
    dev_offline: "Nedostupné",
    kwh_today: "{v} dnes",
    sub_none: "Žádný přebytek · {e} dnes přesměrováno",
    chip_surplus: "{v} přebytku",
    no_router: "Nebyl nalezen přebytek ani zařízení: nastavte `surplus` nebo `grid` a `devices`",
    no_devices: "Žádné zařízení: přidejte je přes `devices` (YAML)",
    ed_surplus: "Výkon přebytku",
    ed_surplus_helper: "Výkon dostupný k přesměrování (W); prázdné: vypočten z výkonu sítě",
    ed_grid: "Výkon sítě",
    ed_grid_helper: "Výkon síťového elektroměru (W), záporný při dodávce; přebytek je dodávka plus to, co přesměrovávají zařízení",
    ed_grid_invert: "Obrácené znaménko výkonu sítě",
    ed_routed: "Dnes přesměrovaná energie",
    ed_routed_helper: "Dnes přesměrovaná energie (kWh); prázdné: součet energie zařízení",
    ed_threshold: "Práh přebytku",
    ed_threshold_helper: "Pod tímto přebytkem (W) není co přesměrovat",
    ed_devices: "Zařízení (YAML)",
    ed_devices_helper: "Jedno na zařízení: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Prázdné: Solární router",
    ed_show_subtitle: "Zobrazit podtitul",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_animations: "Animace",
  },
  sl: {
    title: "Sončni usmerjevalnik",
    st_routing: "Preusmerja",
    st_surplus: "Presežek na voljo",
    st_waiting: "Čaka na presežek",
    st_night: "Noč",
    st_offline: "Ni na voljo",
    surplus_now: "Presežek zdaj",
    routed_today: "Danes preusmerjeno",
    on_surplus: "Na presežku",
    waiting: "Čaka na presežek",
    on_grid: "Iz omrežja",
    dev_offline: "Ni na voljo",
    kwh_today: "{v} danes",
    sub_none: "Ni presežka · {e} danes preusmerjeno",
    chip_surplus: "{v} presežka",
    no_router: "Ni najdenega presežka ne naprave: nastavite `surplus` ali `grid` in `devices`",
    no_devices: "Ni naprav: dodajte jih z `devices` (YAML)",
    ed_surplus: "Moč presežka",
    ed_surplus_helper: "Moč, ki je na voljo za preusmerjanje (W); prazno: izračunana iz moči omrežja",
    ed_grid: "Moč omrežja",
    ed_grid_helper: "Moč omrežnega števca (W), negativna pri oddajanju; presežek je oddano plus tisto, kar preusmerjajo naprave",
    ed_grid_invert: "Obrnjen predznak moči omrežja",
    ed_routed: "Danes preusmerjena energija",
    ed_routed_helper: "Danes preusmerjena energija (kWh); prazno: vsota energije naprav",
    ed_threshold: "Prag presežka",
    ed_threshold_helper: "Pod tem presežkom (W) ni česa preusmeriti",
    ed_devices: "Naprave (YAML)",
    ed_devices_helper: "Ena na napravo: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Prazno: Sončni usmerjevalnik",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_animations: "Animacije",
  },
  lv: {
    title: "Saules maršrutētājs",
    st_routing: "Novirza",
    st_surplus: "Pieejams pārpalikums",
    st_waiting: "Gaida pārpalikumu",
    st_night: "Nakts",
    st_offline: "Nav pieejams",
    surplus_now: "Pārpalikums tagad",
    routed_today: "Šodien novirzīts",
    on_surplus: "Uz pārpalikuma",
    waiting: "Gaida pārpalikumu",
    on_grid: "No tīkla",
    dev_offline: "Nav pieejams",
    kwh_today: "{v} šodien",
    sub_none: "Nav pārpalikuma · {e} šodien novirzīts",
    chip_surplus: "{v} pārpalikums",
    no_router: "Nav atrasts ne pārpalikums, ne ierīce: iestatiet `surplus` vai `grid` un `devices`",
    no_devices: "Nav ierīču: pievienojiet tās ar `devices` (YAML)",
    ed_surplus: "Pārpalikuma jauda",
    ed_surplus_helper: "Novirzīšanai pieejamā jauda (W); tukšs: aprēķināta no tīkla jaudas",
    ed_grid: "Tīkla jauda",
    ed_grid_helper: "Tīkla skaitītāja jauda (W), negatīva, nododot tīklā; pārpalikums ir nodotais plus tas, ko novirza ierīces",
    ed_grid_invert: "Tīkla jaudas zīme apgriezta",
    ed_routed: "Šodien novirzītā enerģija",
    ed_routed_helper: "Šodien novirzītā enerģija (kWh); tukšs: ierīču enerģijas summa",
    ed_threshold: "Pārpalikuma slieksnis",
    ed_threshold_helper: "Zem šī pārpalikuma (W) nav ko novirzīt",
    ed_devices: "Ierīces (YAML)",
    ed_devices_helper: "Viena katrai ierīcei: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Tukšs: Saules maršrutētājs",
    ed_show_subtitle: "Rādīt apakšvirsrakstu",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (pēc motīva)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_animations: "Animācijas",
  },
  el: {
    title: "Ηλιακός δρομολογητής",
    st_routing: "Δρομολόγηση",
    st_surplus: "Διαθέσιμο πλεόνασμα",
    st_waiting: "Αναμονή πλεονάσματος",
    st_night: "Νύχτα",
    st_offline: "Μη διαθέσιμο",
    surplus_now: "Πλεόνασμα τώρα",
    routed_today: "Δρομολογήθηκε σήμερα",
    on_surplus: "Σε πλεόνασμα",
    waiting: "Αναμονή πλεονάσματος",
    on_grid: "Από το δίκτυο",
    dev_offline: "Μη διαθέσιμο",
    kwh_today: "{v} σήμερα",
    sub_none: "Χωρίς πλεόνασμα · {e} δρομολογήθηκαν σήμερα",
    chip_surplus: "{v} πλεόνασμα",
    no_router: "Δεν βρέθηκε πλεόνασμα ούτε συσκευή: ορίστε `surplus` ή `grid` και `devices`",
    no_devices: "Καμία συσκευή: προσθέστε τες με `devices` (YAML)",
    ed_surplus: "Ισχύς πλεονάσματος",
    ed_surplus_helper: "Η ισχύς που είναι διαθέσιμη για δρομολόγηση (W)· κενό: υπολογίζεται από την ισχύ δικτύου",
    ed_grid: "Ισχύς δικτύου",
    ed_grid_helper: "Η ισχύς του μετρητή δικτύου (W), αρνητική κατά την έγχυση· το πλεόνασμα είναι η έγχυση συν ό,τι δρομολογούν οι συσκευές",
    ed_grid_invert: "Αντεστραμμένο πρόσημο ισχύος δικτύου",
    ed_routed: "Ενέργεια που δρομολογήθηκε σήμερα",
    ed_routed_helper: "Η ενέργεια που δρομολογήθηκε σήμερα (kWh)· κενό: το άθροισμα της ενέργειας των συσκευών",
    ed_threshold: "Όριο πλεονάσματος",
    ed_threshold_helper: "Κάτω από αυτό το πλεόνασμα (W) δεν υπάρχει τίποτα για δρομολόγηση",
    ed_devices: "Συσκευές (YAML)",
    ed_devices_helper: "Μία ανά συσκευή: entity, name, icon, kind (water_heater, ev, pool, heater, other), power, energy, progress, target, unit",
    ed_title_helper: "Κενό: Ηλιακός δρομολογητής",
    ed_show_subtitle: "Εμφάνιση υπότιτλου",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_animations: "Κινούμενα σχέδια",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-solar-router-card",
  });
};

if (!customElements.get("solar-router-card")) {
  console.info(`%c HA-SOLAR-ROUTER-CARD %c v${RC_VERSION} `, "background:#2f9e44;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
