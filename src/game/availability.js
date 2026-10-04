import { todayKey, weekKey } from "./missions";
import { SIDE_QUESTS } from "./sidequests";

// Compute newly-available missions / side-quests the player hasn't been
// pinged about yet. Returns { notifications, notified } where `notified` is
// the merged state to persist so the same pings don't fire twice.
export function getNewAvailability(profile) {
  const notified = profile.notified || { dailyDate: null, week: null, sq: [] };
  const d = todayKey();
  const w = weekKey();
  const out = [];

  if (notified.dailyDate !== d) {
    out.push({ id: "daily", title: "New Daily Missions", body: "Fresh daily objectives are ready at the Mission terminal.", color: "#00F5FF" });
  }
  if (notified.week !== w) {
    out.push({ id: "weekly", title: "New Weekly Missions", body: "A new week of objectives has arrived.", color: "#8B5CF6" });
  }

  const storyDone = profile.storyProgress?.completed || [];
  const sqSeen = notified.sq || [];
  const newlyUnlocked = SIDE_QUESTS.filter(
    (sq) => storyDone.includes(sq.unlockChapter) && !sqSeen.includes(sq.id)
  );
  for (const sq of newlyUnlocked) {
    out.push({ id: "sq_" + sq.id, title: "Side Quest Unlocked", body: `${sq.name} — ${sq.desc}`, color: "#FFD166" });
  }

  const allUnlockedSq = SIDE_QUESTS.filter((sq) => storyDone.includes(sq.unlockChapter)).map((sq) => sq.id);
  const merged = {
    dailyDate: d,
    week: w,
    sq: [...new Set([...sqSeen, ...allUnlockedSq])],
  };
  return { notifications: out, notified: merged };
}