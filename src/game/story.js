// Story campaign: THE LAST SIGNAL. Six chapters. Each chapter is a survival
// encounter with a clear objective evaluated from the run summary, so it
// reuses the existing engine without modification. Real multi-phase boss
// fights are deferred — climactic chapters are styled survival challenges
// for now.

export const CHAPTERS = [
  {
    num: 1, id: "first_contact", title: "FIRST CONTACT",
    setting: "THE NEXUS GRID — Outer Sector",
    enemies: ["Sentry", "Drifter"],
    difficulty: "easy",
    objective: { metric: "time", target: 30, label: "Survive for 30 seconds" },
    briefing: [
      { who: "ORION", text: "Pilot, can you hear me? I am ORION, your support AI." },
      { who: "ORION", text: "THE NEXUS GRID is malfunctioning. Defense systems have turned hostile." },
      { who: "ORION", text: "Take the PHANTOM through the outer sector. Move, dodge, and dash. Stay alive." },
    ],
    debriefSuccess: [
      { who: "ORION", text: "Good. You're still in one piece. The PHANTOM responds to you." },
      { who: "ORION", text: "Something is controlling the grid. We call it THE NULL. We need answers." },
    ],
    debriefFail: [
      { who: "ORION", text: "You drifted. Stay sharp — the grid shows no mercy. Retry when ready." },
    ],
    reward: { skin: "phantom", credits: 50, xp: 200, title: "First Contact" },
  },
  {
    num: 2, id: "dead_sector", title: "THE DEAD SECTOR",
    setting: "Corrupted Energy Sector",
    enemies: ["Tracker", "Laser Node", "Mover"],
    difficulty: "normal",
    objective: { metric: "orbsCollected", target: 3, label: "Recover 3 energy fragments and survive 45 seconds", extra: { metric: "time", target: 45 } },
    briefing: [
      { who: "ORION", text: "A sector has gone dark. Energy fragments are scattered through the corruption." },
      { who: "ORION", text: "Recover three fragments and stay alive for 45 seconds. Trackers will follow you." },
    ],
    debriefSuccess: [
      { who: "ORION", text: "Fragments secured. The data inside is... fragmented. Pieces of a signal." },
    ],
    debriefFail: [
      { who: "ORION", text: "The sector overwhelmed you. We'll try again." },
    ],
    reward: { credits: 80, xp: 250, title: "Sector Scout" },
  },
  {
    num: 3, id: "signal_lost", title: "SIGNAL LOST",
    setting: "Dead Space — Comms Blackout",
    enemies: ["Teleporter", "Wildcard", "Hazard"],
    difficulty: "normal",
    objective: { metric: "time", target: 60, label: "Survive 60 seconds and recover communication data", extra: { metric: "orbsCollected", target: 2 } },
    briefing: [
      { who: "ORION", text: "...pilot? I'm losing you. The signal is breaking up." },
      { who: "ORION", text: "...survive... recover the data... don't let them take the signal..." },
    ],
    debriefSuccess: [
      { who: "ORION", text: "Connection restored. I found something — a signal beneath the signal. It's not human." },
    ],
    debriefFail: [
      { who: "ORION", text: "...static..." },
    ],
    reward: { skin: "signal_hunter", credits: 100, xp: 300, title: "Signal Hunter" },
  },
  {
    num: 4, id: "the_fracture", title: "THE FRACTURE",
    setting: "Collapsing Grid Sector",
    enemies: ["Rotator", "Splitter", "Elite Warden"],
    difficulty: "hard",
    objective: { metric: "score", target: 6000, label: "Hold the fracture — reach 6,000 points", extra: { metric: "time", target: 50 } },
    briefing: [
      { who: "ORION", text: "The grid is fracturing. Reality splinters here. An Elite Warden guards the break." },
      { who: "ORION", text: "Hold the line. Score 6,000 and survive 50 seconds." },
    ],
    debriefSuccess: [
      { who: "ORION", text: "The Warden is down. Behind it — a protocol. NULL PROTOCOL." },
    ],
    debriefFail: [
      { who: "ORION", text: "The fracture consumed you. Regroup." },
    ],
    reward: { credits: 120, xp: 350, title: "Fracture Survivor" },
  },
  {
    num: 5, id: "null_protocol", title: "NULL PROTOCOL",
    setting: "THE NULL — Core Defense Ring",
    enemies: ["Null Sentinel", "Phase Caster", "Boss: NULL HAND"],
    difficulty: "hard",
    objective: { metric: "wave", target: 8, label: "Break the NULL defense — reach wave 8", extra: { metric: "maxCombo", target: 15 } },
    briefing: [
      { who: "ORION", text: "THE NULL. It's not a malfunction. It's an intelligence." },
      { who: "ORION", text: "Its core is defended. Break through the sentinels. Reach wave 8." },
    ],
    debriefSuccess: [
      { who: "ORION", text: "The protocol cracks. The core opens. One signal remains." },
    ],
    debriefFail: [
      { who: "ORION", text: "The NULL repelled you. We are not ready." },
    ],
    reward: { skin: "null_hunter", credits: 150, xp: 400, title: "Null Hunter" },
  },
  {
    num: 6, id: "the_last_signal", title: "THE LAST SIGNAL",
    setting: "THE NULL — Core",
    enemies: ["Boss: THE NULL", "Echo", "Final Guard"],
    difficulty: "hard",
    objective: { metric: "score", target: 12000, label: "Confront THE NULL — reach 12,000 points", extra: { metric: "time", target: 75 } },
    briefing: [
      { who: "ORION", text: "This is it. The source of the signal. THE NULL waits." },
      { who: "ORION", text: "End it, pilot. Whatever happens — fly true." },
    ],
    debriefSuccess: [
      { who: "ORION", text: "The signal is silent. The grid breathes again." },
      { who: "ORION", text: "You did it, pilot. The PHANTOM remembers." },
    ],
    debriefFail: [
      { who: "ORION", text: "Not yet. The NULL persists. Fly again." },
    ],
    reward: { skin: "legendary_phantom", credits: 300, xp: 600, title: "The Last Signal" },
    ending: true,
  },
];

export function getChapter(num) {
  return CHAPTERS[num - 1];
}

export function chapterStatus(profile, num) {
  const done = profile.storyProgress?.completed || [];
  if (done.includes(num)) return "completed";
  if (num === 1) return "available";
  if (done.includes(num - 1)) return "available";
  return "locked";
}

function metricValue(summary, m) {
  return summary ? summary[m] || 0 : 0;
}

export function evaluateObjective(chapter, summary) {
  const o = chapter.objective;
  const ok = (m, t) => metricValue(summary, m) >= t;
  let pass = ok(o.metric, o.target);
  if (pass && o.extra) pass = ok(o.extra.metric, o.extra.target);
  return pass;
}