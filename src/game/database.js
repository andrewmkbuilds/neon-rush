// Database entries — characters, enemies, and locations discovered through
// story progress and side quests. Pure data; unlocked entries are revealed,
// locked ones show a hint.

export const DATABASE = {
  characters: [
    { id: "orion", name: "ORION", unlockChapter: 1, desc: "An enigmatic support AI that contacts the pilot after the grid malfunction. ORION's origins are unclear, even to itself." },
    { id: "the_pilot", name: "The Pilot (You)", unlockChapter: 1, desc: "Pilot of the experimental PHANTOM spacecraft. The grid's last hope." },
    { id: "the_null", name: "THE NULL", unlockChapter: 5, desc: "An unknown intelligence controlling THE NEXUS GRID defense systems. Its intent remains a mystery until the final signal." },
    { id: "orion_past", name: "ORION — Fragment", unlockSideQuest: "lost_transmission", desc: "Recovered fragments suggest ORION was once part of the grid itself — a fragment that gained awareness." },
    { id: "forgotten_pilot", name: "The Forgotten Pilot", unlockSideQuest: "forgotten_pilot", desc: "Records of a pilot who entered the Dead Sector years ago and never returned. Their flight logs guide you." },
    { id: "ghost_entity", name: "Ghost Entity", unlockSideQuest: "ghost_in_grid", desc: "A faint presence observed between corrupted sectors. It does not attack. It watches." },
  ],
  enemies: [
    { id: "sentry", name: "Sentry", unlockChapter: 1, desc: "A basic geometric sentinel. Slow and predictable, but deadly in numbers." },
    { id: "drifter", name: "Drifter", unlockChapter: 1, desc: "A drifting shard that bounces across the arena. Easy to dodge, hard to ignore." },
    { id: "tracker", name: "Tracker", unlockChapter: 2, desc: "A homing entity that follows the pilot's energy signature." },
    { id: "laser_node", name: "Laser Node", unlockChapter: 2, desc: "A stationary emitter that charges and fires beams. Watch the charge lines." },
    { id: "teleporter", name: "Teleporter", unlockChapter: 3, desc: "Blinks across the arena without warning. Position is everything." },
    { id: "rotator", name: "Rotator", unlockChapter: 4, desc: "A rotating barrier that sweeps the arena in arcs." },
    { id: "splitter", name: "Splitter", unlockChapter: 4, desc: "Divides into smaller threats when destroyed. Space carefully." },
    { id: "elite_warden", name: "Elite Warden", unlockChapter: 4, desc: "A multi-stage elite guarding the fracture. Adapts its pattern as it weakens." },
    { id: "null_sentinel", name: "Null Sentinel", unlockChapter: 5, desc: "THE NULL's core defenders. Coordinated, relentless, geometric." },
    { id: "null_hand", name: "NULL HAND", unlockChapter: 5, desc: "A boss-class entity with shifting attack phases. The first true test." },
    { id: "the_null_boss", name: "THE NULL", unlockChapter: 6, desc: "The intelligence itself. A multi-phase final encounter at the grid's core." },
  ],
  locations: [
    { id: "nexus_grid", name: "THE NEXUS GRID", unlockChapter: 1, desc: "The vast energy network and universe of NEON RUSH — powering cities and stations, now corrupted by an unknown signal." },
    { id: "dead_sector", name: "The Dead Sector", unlockChapter: 2, desc: "A sector gone dark. Energy fragments and corrupted data drift here." },
    { id: "dead_space", name: "Dead Space", unlockChapter: 3, desc: "A comms blackout zone where ORION's signal breaks apart." },
    { id: "the_fracture", name: "The Fracture", unlockChapter: 4, desc: "A collapsing sector where the grid splinters into unstable geometry." },
    { id: "null_core", name: "NULL Core", unlockChapter: 5, desc: "The defense ring around THE NULL's core. Heavily guarded." },
    { id: "the_core", name: "The Core", unlockChapter: 6, desc: "The heart of THE NEXUS GRID. Where the last signal originates." },
  ],
};

export function isEntryUnlocked(profile, entry) {
  if (entry.unlockChapter && (profile.storyProgress?.completed || []).includes(entry.unlockChapter)) return true;
  if (entry.unlockSideQuest && (profile.sideQuests?.completed || []).includes(entry.unlockSideQuest)) return true;
  return false;
}