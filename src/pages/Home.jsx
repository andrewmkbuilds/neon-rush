import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CommandCenter from "@/components/CommandCenter";
import StoryMode from "@/components/StoryMode";
import Missions from "@/components/Missions";
import SideQuests from "@/components/SideQuests";
import Arcade from "@/components/Arcade";
import DatabaseView from "@/components/Database";
import MissionLogs from "@/components/MissionLogs";
import SkillChallenges from "@/components/SkillChallenges";
import LaserDodge from "@/components/arcade/LaserDodge";
import HowToPlay from "@/components/HowToPlay";
import Hangar from "@/components/Hangar";
import Leaderboard from "@/components/Leaderboard";
import PlayerProfile from "@/components/PlayerProfile";
import GameCanvas from "@/components/game/GameCanvas";
import AchievementToast from "@/components/AchievementToast";
import { loadProfile, saveProfile, submitScoreLocal, submitGlobalScore, getBestPath, saveBestPath, clearAllLocalData, flushPendingScores } from "@/game/storage";
import Store from "@/components/Store";
import Settings from "@/components/Settings";
import Stats from "@/components/Stats";
import DailyChallenge from "@/components/DailyChallenge";
import { getDailyChallenge } from "@/game/dailyChallenge";
import DifficultySelect from "@/components/DifficultySelect";
import RunModifiers from "@/components/RunModifiers";
import { useAuth } from "@/lib/AuthContext";
import { evaluateRun, ACHIEVEMENTS, getTodayChallenge } from "@/game/challenges";
import { grantRewards } from "@/game/progression";
import { applyRunToMissions, getMissionView } from "@/game/missions";
import { applyRunToSideQuests, getActiveSideQuests } from "@/game/sidequests";
import { getStartEnergy } from "@/game/upgrades";
import { getNewAvailability } from "@/game/availability";
import { CHAPTERS, evaluateObjective } from "@/game/story";
import { earnedBadges } from "@/game/badges";
import { base44 } from "@/api/base44Client";
import { SHIP_SKINS, getSkin } from "@/game/skins";
import { audioManager } from "@/game/audio";
import { getLastSeen, setLastSeen, ensurePermission, showStreakReminder, notifSupported } from "@/game/notifications";
import OfflineIndicator from "@/components/OfflineIndicator";
import Assistants from "@/components/Assistants";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2, ease: "easeOut" },
};

export default function Home() {
  const { user, isAuthenticated, navigateToLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const NAV_SCREENS = ["menu", "hangar", "store", "leaderboard", "profile", "settings", "stats", "difficulty", "modifiers", "howto", "story", "missions", "sidequests", "arcade", "database", "missionlogs", "skillchallenges", "daily", "assistants"];
  const initialScreen = (() => {
    const s = searchParams.get("screen");
    return s && NAV_SCREENS.includes(s) ? s : "menu";
  })();
  const [screen, setRawScreen] = useState(initialScreen);
  const setScreen = useCallback((s) => {
    setRawScreen(s);
    if (NAV_SCREENS.includes(s)) {
      navigate(s === "menu" ? "/" : `/?screen=${s}`);
    }
  }, [navigate]);
  // keep screen state in sync with the browser back/forward stack
  useEffect(() => {
    const s = searchParams.get("screen");
    const target = s && NAV_SCREENS.includes(s) ? s : "menu";
    setRawScreen(target);
  }, [searchParams]);
  // in-app back: pop history when available, else fall back to menu
  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else setScreen("menu");
  }, [navigate, setScreen]);
  const [profile, setProfile] = useState(() => loadProfile());
  const [toasts, setToasts] = useState([]);
  const [gameKey, setGameKey] = useState(0);
  const [lastRunIsNewBest, setLastRunIsNewBest] = useState(false);
  const [bestPath, setBestPath] = useState(() => getBestPath());
  const [ghostOn, setGhostOn] = useState(false);
  const runDiffRef = useRef("normal");
  const runModsRef = useRef({});
  const dailyChallengeRef = useRef(null);
  const challengeHandledRef = useRef(false);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [storyResult, setStoryResult] = useState(null);
  const [arcadeGameId, setArcadeGameId] = useState(null);
  const [skillChallenge, setSkillChallenge] = useState(null);
  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // apply settings to audio on load
  useEffect(() => {
    audioManager.setMusic(profile.settings.musicOn);
    audioManager.setSfx(profile.settings.sfxOn);
    audioManager.setMusicVolume(profile.settings.musicVolume);
    audioManager.setSfxVolume(profile.settings.sfxVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // backfill achievement-based ship skins for achievements earned before the
  // achievement-skin system existed
  useEffect(() => {
    const prev = profileRef.current;
    const earned = prev.achievements || {};
    const missing = SHIP_SKINS.filter(
      (s) => s.currency === "achievement" && earned[s.unlockAchievement] && !prev.ownedSkins.includes(s.id)
    );
    if (missing.length === 0) return;
    const updated = { ...prev, ownedSkins: [...prev.ownedSkins, ...missing.map((s) => s.id)] };
    saveProfile(updated);
    setProfile(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // daily login streak: grant Neon Credits on first login of each new day,
  // with a bonus that grows with the consecutive-day streak
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const prev = profileRef.current;
    if (!prev || prev.lastDailyReward === today) return;
    // Don't hand out a "daily reward" before the pilot has ever played —
    // the bonus is for coming back, not for opening the app for the first time.
    if (!prev.totalRuns) return;
    const yd = new Date();
    yd.setUTCDate(yd.getUTCDate() - 1);
    const yesterday = yd.toISOString().slice(0, 10);
    const streak = prev.lastLoginDate === yesterday ? (prev.loginStreak || 0) + 1 : 1;
    const streakBonus = Math.min(streak - 1, 9) * 10; // +10 per consecutive day, capped at +90
    const reward = 50 + streakBonus;
    const updated = {
      ...prev,
      neonCredits: (prev.neonCredits ?? 0) + reward,
      lastDailyReward: today,
      lastLoginDate: today,
      loginStreak: streak,
    };
    saveProfile(updated);
    setProfile(updated);
    audioManager.achievement();
    pushToast({
      title: streak > 1 ? `${streak}-Day Streak!` : "Daily Reward",
      body: `+${reward} Neon Credits — ${streak > 1 ? "streak bonus active." : "welcome back, pilot."}`,
      color: streak > 1 ? "#FF2E93" : "#00F5FF",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // desktop notification: remind players who haven't opened the game in 24h about their login streak
  useEffect(() => {
    if (!notifSupported()) return;
    const prevSeen = getLastSeen();
    const now = Date.now();
    const due = prevSeen && now - prevSeen >= 24 * 3600 * 1000;
    setLastSeen(now);
    const fire = () => showStreakReminder(profileRef.current.loginStreak || 0);
    let onGesture = null;
    if (Notification.permission === "granted") {
      if (due) fire();
    } else if (Notification.permission !== "denied") {
      onGesture = async () => {
        const granted = await ensurePermission();
        if (granted && due) fire();
        window.removeEventListener("click", onGesture);
        window.removeEventListener("keydown", onGesture);
      };
      window.addEventListener("click", onGesture, { once: true });
      window.addEventListener("keydown", onGesture, { once: true });
    }
    // schedule a reminder 24h from now if the app stays open
    const t = setTimeout(() => { ensurePermission().then((g) => { if (g) showStreakReminder(profileRef.current.loginStreak || 0); }); }, 24 * 3600 * 1000);
    return () => {
      clearTimeout(t);
      if (onGesture) { window.removeEventListener("click", onGesture); window.removeEventListener("keydown", onGesture); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // availability notifications: ping the player when new missions or side
  // quests become available (daily/weekly rollover, newly unlocked side quests)
  useEffect(() => {
    const prev = profileRef.current;
    const { notifications, notified } = getNewAvailability(prev);
    if (notifications.length === 0) return;
    const updated = { ...prev, notified };
    saveProfile(updated);
    setProfile(updated);
    notifications.forEach((n, i) => {
      setTimeout(() => pushToast({ title: n.title, body: n.body, color: n.color }), 700 + i * 900);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { ...toast, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  // online/offline: flush queued score submissions when connectivity returns
  const online = useOnlineStatus();
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    flushPendingScores().then((n) => {
      if (!cancelled && n > 0) {
        pushToast({ title: "Scores Synced", body: `${n} queued run${n === 1 ? "" : "s"} uploaded to the global leaderboard.`, color: "#34D399" });
      }
    });
    return () => { cancelled = true; };
  }, [online, pushToast]);

  // Challenge link acceptance: when a pilot opens a shared "?challenge=" link,
  // acknowledge it and drop them at the difficulty screen ready to beat the score.
  useEffect(() => {
    const ch = searchParams.get("challenge");
    if (!ch || challengeHandledRef.current) return;
    challengeHandledRef.current = true;
    audioManager.init();
    audioManager.achievement();
    pushToast({ title: "Challenge Accepted", body: "A rival dared you to beat their run. Show them what you've got, pilot.", color: "#FF2E93" });
    setScreen("difficulty");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = useCallback(() => {
    audioManager.init();
    audioManager.resume();
    audioManager.click();
    setScreen("difficulty");
  }, []);

  const startRun = useCallback((difficulty) => {
    runDiffRef.current = difficulty;
    runModsRef.current = {};
    dailyChallengeRef.current = null;
    audioManager.init();
    audioManager.resume();
    audioManager.startMusic("game");
    setLastRunIsNewBest(false);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handlePlayDaily = useCallback(() => {
    const dc = getDailyChallenge();
    runDiffRef.current = "normal";
    runModsRef.current = dc.modifiers;
    dailyChallengeRef.current = dc.date;
    audioManager.init();
    audioManager.resume();
    audioManager.startMusic("game");
    setLastRunIsNewBest(false);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleOpenModifiers = useCallback(() => {
    audioManager.click();
    setScreen("modifiers");
  }, [setScreen]);

  const handleLaunchModifiers = useCallback((difficulty, mods) => {
    runDiffRef.current = difficulty;
    runModsRef.current = mods || {};
    audioManager.init();
    audioManager.resume();
    audioManager.startMusic("game");
    setLastRunIsNewBest(false);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, [setScreen]);

  const startTutorial = useCallback(() => {
    runDiffRef.current = "normal";
    audioManager.init();
    audioManager.resume();
    audioManager.startMusic("game");
    setGameKey((k) => k + 1);
    setScreen("tutorial");
  }, []);

  const handleSignIn = useCallback(() => { navigateToLogin(); }, [navigateToLogin]);
  const handleLogout = useCallback(() => { logout(); }, [logout]);

  const handleNav = useCallback((s) => {
    audioManager.init();
    audioManager.click();
    setScreen(s);
  }, []);

  const handleRunComplete = useCallback((summary) => {
    const prev = profileRef.current;
    const isNewBest = summary.score > prev.bestScore;
    setLastRunIsNewBest(isNewBest && summary.score > 0);
    if (isNewBest && summary.score > 0 && Array.isArray(summary.path) && summary.path.length >= 4) {
      saveBestPath(summary.path, summary.score);
      setBestPath({ path: summary.path, score: summary.score });
    }
    const updated = {
      ...prev,
      totalRuns: prev.totalRuns + 1,
      bestScore: Math.max(prev.bestScore, summary.score),
      totalSurvival: prev.totalSurvival + summary.time,
      totalEnergy: prev.totalEnergy + summary.energy,
      totalNearMisses: (prev.totalNearMisses ?? 0) + (summary.nearMisses || 0),
      bestSurvival: Math.max(prev.bestSurvival ?? 0, summary.time),
      bestCombo: Math.max(prev.bestCombo, summary.maxCombo),
      maxWave: Math.max(prev.maxWave, summary.wave),
      unlockedAbilities: { ...prev.unlockedAbilities },
    };
    if (updated.totalEnergy >= 150) updated.unlockedAbilities.shield = true;
    if (updated.totalEnergy >= 500) updated.unlockedAbilities.slow = true;

    const { achievements, newlyUnlocked, challenge } = evaluateRun(updated, { ...summary, isNewBest });
    updated.achievements = achievements;
    updated.challenge = challenge;
    updated.missions = applyRunToMissions(updated, summary).missions;
    updated.sideQuests = applyRunToSideQuests(updated, summary);

    const playerName = isAuthenticated ? (user?.full_name || user?.email || prev.name) : prev.name;
    submitScoreLocal({ name: playerName, score: summary.score, time: summary.time, wave: summary.wave, energy: summary.energy, orbs: summary.orbsCollected, maxCombo: summary.maxCombo, difficulty: runDiffRef.current });
    if (summary.score > 0) {
      submitGlobalScore({ name: playerName, score: summary.score, time: summary.time, wave: summary.wave, maxCombo: summary.maxCombo, skin: prev.equippedSkin, energy: summary.energy, path: summary.path, difficulty: runDiffRef.current, badges: earnedBadges(updated), daily_challenge: dailyChallengeRef.current });
    }
    if (isNewBest && summary.score > 0 && prev.settings?.discordWebhook) {
      try {
        fetch(prev.settings.discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "NEON RUSH",
            embeds: [{
              title: "🏆 New Personal Best!",
              description: `**${playerName}** just scored **${summary.score.toLocaleString()}** in NEON RUSH — Wave ${summary.wave}, ${summary.time}s survival, ${summary.nearMisses} near misses, max combo x${summary.maxCombo}.`,
              color: 0xFF2E93,
              footer: { text: "THE NEXUS GRID" },
            }],
          }),
        }).catch(() => {});
      } catch { /* best-effort */ }
    }

    const unlockedSkins = [];
    newlyUnlocked.forEach((id) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) {
        audioManager.achievement();
        pushToast({ title: "Achievement Unlocked", body: ach.name, color: "#FFD166" });
      }
      const skin = SHIP_SKINS.find((s) => s.currency === "achievement" && s.unlockAchievement === id);
      if (skin && !updated.ownedSkins.includes(skin.id)) unlockedSkins.push(skin);
    });
    if (unlockedSkins.length) {
      updated.ownedSkins = [...updated.ownedSkins, ...unlockedSkins.map((s) => s.id)];
      unlockedSkins.forEach((s) => pushToast({ title: "Ship Unlocked", body: `${s.name} — view in Hangar.`, color: s.color }));
    }
    setProfile(updated);
    saveProfile(updated);
    base44.analytics.track({
      eventName: "run_completed",
      properties: {
        score: summary.score,
        wave: summary.wave,
        time: summary.time,
        maxCombo: summary.maxCombo,
        energy: summary.energy,
        nearMisses: summary.nearMisses,
      },
    });
  }, [pushToast]);

  // ---- STORY MODE ----
  const handleStartChapter = useCallback((ch) => {
    setCurrentChapter(ch);
    setStoryResult(null);
    runDiffRef.current = ch.difficulty;
    audioManager.init();
    audioManager.resume();
    audioManager.startMusic("game");
    setGameKey((k) => k + 1);
    setScreen("storyrun");
  }, [setScreen]);

  const handleStoryRunComplete = useCallback((summary) => {
    const ch = currentChapter;
    if (!ch) return;
    const success = evaluateObjective(ch, summary);
    const prev = profileRef.current;
    const done = prev.storyProgress?.completed || [];
    const firstCompletion = success && !done.includes(ch.num);
    let updated = { ...prev };
    updated.missions = applyRunToMissions(updated, summary).missions;
    updated.sideQuests = applyRunToSideQuests(updated, summary);
    updated.totalRuns = prev.totalRuns + 1;
    updated.bestScore = Math.max(prev.bestScore, summary.score || 0);
    updated.totalSurvival = prev.totalSurvival + (summary.time || 0);
    updated.totalEnergy = prev.totalEnergy + (summary.energy || 0);
    updated.totalNearMisses = (prev.totalNearMisses || 0) + (summary.nearMisses || 0);
    updated.bestSurvival = Math.max(prev.bestSurvival || 0, summary.time || 0);
    updated.bestCombo = Math.max(prev.bestCombo, summary.maxCombo || 0);
    updated.maxWave = Math.max(prev.maxWave, summary.wave || 0);
    if (firstCompletion) {
      const r = ch.reward || {};
      const res = grantRewards(updated, { xp: r.xp || 0, credits: r.credits || 0 });
      updated = res.profile;
      if (res.leveledUp) pushToast({ title: "Level Up!", body: `You reached Level ${res.newLevel}.`, color: "#FFD166" });
      if (r.skin && !updated.ownedSkins.includes(r.skin)) {
        updated.ownedSkins = [...updated.ownedSkins, r.skin];
        pushToast({ title: "Ship Unlocked", body: `${getSkin(r.skin).name} — view in Hangar.`, color: "#00F5FF" });
      }
      if (r.title && !(updated.titles || []).includes(r.title)) updated.titles = [...(updated.titles || []), r.title];
      updated.storyProgress = { ...updated.storyProgress, completed: [...done, ch.num], current: ch.num + 1 };
    }
    setProfile(updated);
    saveProfile(updated);
    // ping newly-unlocked side quests from this chapter completion
    if (firstCompletion) {
      const { notifications, notified } = getNewAvailability(updated);
      if (notifications.length) {
        const u2 = { ...updated, notified };
        saveProfile(u2);
        setProfile(u2);
        notifications.forEach((n, i) => setTimeout(() => pushToast({ title: n.title, body: n.body, color: n.color }), 500 + i * 900));
      }
    }
    setStoryResult({ chapter: ch, success, firstCompletion, score: summary.score, time: summary.time, wave: summary.wave });
    setScreen("story");
  }, [currentChapter, pushToast, setScreen]);

  const handleResultSeen = useCallback(() => setStoryResult(null), []);

  // ---- MISSIONS / SIDE QUESTS claim ----
  const handleClaimMission = useCallback((def, group) => {
    setProfile((prev) => {
      const view = getMissionView(prev);
      const list = group === "daily" ? view.daily : view.weekly;
      const m = list.find((x) => x.id === def.id);
      if (!m || !m.complete || m.claimed) return prev;
      const mult = m.multiplier || 1;
      const credits = Math.round(m.reward.credits * mult);
      const res = grantRewards(prev, { xp: m.reward.xp, credits });
      let updated = res.profile;
      if (res.leveledUp) pushToast({ title: "Level Up!", body: `Level ${res.newLevel}`, color: "#FFD166" });
      if (mult > 1) pushToast({ title: "Difficulty Bonus!", body: `+${credits - m.reward.credits} credits for clearing on ${m.bestDiff >= 3 ? "Hard" : "Normal"}.`, color: "#FF2E93" });
      const missions = { ...updated.missions };
      const grp = { ...missions[group], items: { ...missions[group].items } };
      grp.items[def.id] = { ...grp.items[def.id], claimed: true };
      missions[group] = grp;
      updated = { ...updated, missions };
      saveProfile(updated);
      audioManager.achievement();
      return updated;
    });
  }, [pushToast]);

  const handleClaimSideQuest = useCallback((sq) => {
    setProfile((prev) => {
      const active = getActiveSideQuests(prev);
      const q = active.find((x) => x.id === sq.id);
      if (!q || !q.complete || q.claimed) return prev;
      const res = grantRewards(prev, { xp: q.reward.xp, credits: q.reward.credits });
      let updated = {
        ...res.profile,
        sideQuests: { ...res.profile.sideQuests, completed: [...(res.profile.sideQuests.completed || []), q.id] },
      };
      if (res.leveledUp) pushToast({ title: "Level Up!", body: `Level ${res.newLevel}`, color: "#FFD166" });
      saveProfile(updated);
      audioManager.achievement();
      return updated;
    });
  }, [pushToast]);

  // ---- ARCADE ----
  const handlePlayArcade = useCallback((gameId) => {
    setArcadeGameId(gameId);
    audioManager.init();
    audioManager.resume();
    setScreen("arcadegame");
  }, [setScreen]);

  // ---- SKILL CHALLENGES ----
  const handlePlaySkillChallenge = useCallback((ch) => {
    setSkillChallenge(ch);
    runDiffRef.current = "normal";
    audioManager.init();
    audioManager.resume();
    audioManager.startMusic("game");
    setGameKey((k) => k + 1);
    setScreen("skillrun");
  }, [setScreen]);

  const handleSkillRunComplete = useCallback((summary) => {
    const ch = skillChallenge;
    if (!ch) return;
    const pass = ch.check ? ch.check(summary) : false;
    setProfile((prev) => {
      const sc = { ...(prev.skillChallenges || {}) };
      const rec = sc[ch.id] || {};
      const wasDone = !!rec.completed;
      let updated = { ...prev };
      if (pass && !wasDone) {
        const res = grantRewards(updated, { xp: ch.reward.xp, credits: ch.reward.credits });
        updated = res.profile;
        if (res.leveledUp) pushToast({ title: "Level Up!", body: `Level ${res.newLevel}`, color: "#FFD166" });
        sc[ch.id] = { completed: true, best: summary };
        updated.skillChallenges = sc;
        audioManager.achievement();
        pushToast({ title: "Challenge Complete", body: `${ch.name} — +${ch.reward.credits} Neon Credits`, color: "#34D399" });
      } else {
        sc[ch.id] = { ...rec, best: summary };
        updated.skillChallenges = sc;
      }
      saveProfile(updated);
      return updated;
    });
    setSkillChallenge(null);
    setScreen("skillchallenges");
  }, [skillChallenge, pushToast, setScreen]);

  const handleArcadeResult = useCallback((summary) => {
    const id = arcadeGameId;
    if (!id) return;
    setProfile((prev) => {
      const hi = Math.max(prev.arcade?.highScores?.[id] || 0, summary.score || 0);
      const played = [...(prev.arcade?.played || [])];
      if (!played.includes(id)) played.push(id);
      const res = grantRewards(prev, { xp: 40, credits: 20 });
      const updated = { ...res.profile, arcade: { highScores: { ...(res.profile.arcade?.highScores || {}), [id]: hi }, played } };
      if (res.leveledUp) pushToast({ title: "Level Up!", body: `Level ${res.newLevel}`, color: "#FFD166" });
      saveProfile(updated);
      return updated;
    });
  }, [arcadeGameId, pushToast]);

  const handlePurchase = useCallback((skinId) => {
    setProfile((prev) => {
      const skin = SHIP_SKINS.find((s) => s.id === skinId);
      if (!skin || prev.ownedSkins.includes(skinId) || prev.totalEnergy < skin.price) return prev;
      const updated = {
        ...prev,
        totalEnergy: prev.totalEnergy - skin.price,
        ownedSkins: [...prev.ownedSkins, skinId],
        equippedSkin: skinId,
      };
      saveProfile(updated);
      audioManager.achievement();
      return updated;
    });
  }, []);

  const handlePurchaseCredits = useCallback((skinId) => {
    setProfile((prev) => {
      const skin = SHIP_SKINS.find((s) => s.id === skinId);
      if (!skin || prev.ownedSkins.includes(skinId) || (prev.neonCredits ?? 0) < (skin.creditPrice || 0)) return prev;
      const updated = {
        ...prev,
        neonCredits: (prev.neonCredits ?? 0) - skin.creditPrice,
        ownedSkins: [...prev.ownedSkins, skinId],
        equippedSkin: skinId,
      };
      saveProfile(updated);
      audioManager.achievement();
      return updated;
    });
  }, []);

  const handleBuyCredits = useCallback((pack) => {
    setProfile((prev) => {
      const updated = { ...prev, neonCredits: (prev.neonCredits ?? 0) + (pack.credits || 0) };
      saveProfile(updated);
      audioManager.achievement();
      pushToast({ title: "Credits Added", body: `+${pack.credits} Neon Credits`, color: "#00F5FF" });
      return updated;
    });
  }, [pushToast]);

  // Permanent upgrade purchase (Neon Credits → starting-energy tier)
  const handleBuyUpgrade = useCallback((upg) => {
    setProfile((prev) => {
      const tier = prev.upgrades?.[upg.id] || 0;
      if (tier >= upg.maxTier || (prev.neonCredits ?? 0) < upg.cost) return prev;
      const updated = {
        ...prev,
        neonCredits: (prev.neonCredits ?? 0) - upg.cost,
        upgrades: { ...(prev.upgrades || {}), [upg.id]: tier + 1 },
      };
      saveProfile(updated);
      audioManager.achievement();
      return updated;
    });
    pushToast({ title: "Upgrade Purchased", body: `${upg.name} → Tier ${upg.tier + 1}`, color: "#FFD166" });
  }, [pushToast]);

  // elite enemy near-miss: bonus Neon Credits + toast
  const handleElite = useCallback((data) => {
    setProfile((prev) => {
      const updated = { ...prev, neonCredits: (prev.neonCredits ?? 0) + (data?.reward || 5) };
      saveProfile(updated);
      return updated;
    });
    audioManager.achievement();
    pushToast({ title: "Elite Threaded!", body: `+${data?.reward || 5} Neon Credits`, color: "#E879F9" });
  }, [pushToast]);

  // in-run milestone: grant bonus Neon Credits + toast
  const handleMilestone = useCallback((m) => {
    setProfile((prev) => {
      const updated = { ...prev, neonCredits: (prev.neonCredits ?? 0) + m.reward };
      saveProfile(updated);
      return updated;
    });
    audioManager.achievement();
    pushToast({ title: "Milestone!", body: `${m.name} — +${m.reward} Neon Credits`, color: "#FFD166" });
    // record the milestone id in profile.milestones so the tracker can show it
    setProfile((prev) => {
      const achieved = prev.milestones || [];
      if (achieved.includes(m.id)) return prev;
      const updated = { ...prev, milestones: [...achieved, m.id] };
      saveProfile(updated);
      return updated;
    });
  }, [pushToast]);

  const handleEquip = useCallback((skinId) => {
    const skin = SHIP_SKINS.find((s) => s.id === skinId);
    setProfile((prev) => {
      if (!prev.ownedSkins.includes(skinId)) return prev;
      const updated = { ...prev, equippedSkin: skinId };
      saveProfile(updated);
      return updated;
    });
    if (skin) pushToast({ title: "Skin Equipped", body: skin.name, color: skin.color });
  }, [pushToast]);

  const handleRename = useCallback((name) => {
    setProfile((prev) => {
      const updated = { ...prev, name: name.slice(0, 16) };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const handleClaim = useCallback(() => {
    setProfile((prev) => {
      if (!prev.challenge.completed || prev.challenge.claimed) return prev;
      const ch = getTodayChallenge();
      const updated = {
        ...prev,
        neonCredits: (prev.neonCredits ?? 0) + ch.reward,
        challenge: { ...prev.challenge, claimed: true },
      };
      saveProfile(updated);
      audioManager.achievement();
      pushToast({ title: "Reward Claimed", body: `+${ch.reward} Neon Credits`, color: "#FFD166" });
      return updated;
    });
  }, [pushToast]);

  // "Delete Account": for signed-in players, best-effort delete remote scores and
  // the account via the base44 SDK first, then wipe all locally stored progress.
  const handleDeleteAccount = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      try { await base44.entities.Score.deleteMany({ created_by_id: user.id }); } catch (e) { /* best-effort: RLS may restrict */ }
      try { await base44.entities.User.delete(user.id); } catch (e) { /* best-effort */ }
    }
    clearAllLocalData();
    logout(false);
    const fresh = loadProfile();
    setProfile(fresh);
    setBestPath(getBestPath());
    setScreen("menu");
    pushToast({ title: "Account Deleted", body: "All local progress has been erased.", color: "#FF3B5C" });
  }, [isAuthenticated, user, setScreen, pushToast, logout]);

  const toggleSound = useCallback(() => {
    setProfile((prev) => {
      const on = !prev.settings.musicOn;
      audioManager.setMusic(on);
      audioManager.setSfx(on);
      const updated = { ...prev, settings: { ...prev.settings, musicOn: on, sfxOn: on } };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    setProfile((prev) => {
      const on = !prev.settings.musicOn;
      audioManager.setMusic(on);
      const updated = { ...prev, settings: { ...prev.settings, musicOn: on } };
      saveProfile(updated);
      return updated;
    });
  }, []);
  const handleToggleSfx = useCallback(() => {
    setProfile((prev) => {
      const on = !prev.settings.sfxOn;
      audioManager.setSfx(on);
      const updated = { ...prev, settings: { ...prev.settings, sfxOn: on } };
      saveProfile(updated);
      return updated;
    });
  }, []);
  const handleMusicVolume = useCallback((v) => {
    setProfile((prev) => {
      audioManager.setMusicVolume(v);
      const updated = { ...prev, settings: { ...prev.settings, musicVolume: v } };
      saveProfile(updated);
      return updated;
    });
  }, []);
  const handleSfxVolume = useCallback((v) => {
    setProfile((prev) => {
      audioManager.setSfxVolume(v);
      const updated = { ...prev, settings: { ...prev.settings, sfxVolume: v } };
      saveProfile(updated);
      return updated;
    });
  }, []);
  const handleSetDiscordWebhook = useCallback((url) => {
    setProfile((prev) => {
      const updated = { ...prev, settings: { ...prev.settings, discordWebhook: url } };
      saveProfile(updated);
      return updated;
    });
  }, []);

  // expose a simple audio wrapper with current state for child components
  const audio = {
    musicOn: profile.settings.musicOn,
    sfxOn: profile.settings.sfxOn,
    toggleSound,
  };

  const storyDone = profile.storyProgress?.completed || [];
  const continueLabel = storyDone.length >= CHAPTERS.length ? "SURVIVAL" : storyDone.length === 0 ? "START STORY" : "CONTINUE STORY";
  const handleContinue = useCallback(() => {
    if (storyDone.length >= CHAPTERS.length) handlePlay();
    else setScreen("story");
  }, [storyDone, handlePlay, setScreen]);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#05060D] select-none">
      <AnimatePresence mode="wait">
        {screen === "menu" && (
          <motion.div key="menu" {...pageTransition} className="h-full w-full">
            <CommandCenter profile={profile} onPlay={handlePlay} onContinue={handleContinue} continueLabel={continueLabel} onNav={handleNav} audio={audio} user={user} isAuthenticated={isAuthenticated} onSignIn={handleSignIn} onLogout={handleLogout} />
          </motion.div>
        )}
        {screen === "difficulty" && (
          <motion.div key="difficulty" {...pageTransition} className="h-full w-full">
            <DifficultySelect
              onBack={goBack}
              onSelect={startRun}
              onTutorial={startTutorial}
              ghostPath={bestPath?.path}
              ghostOn={ghostOn}
              onToggleGhost={() => setGhostOn((g) => !g)}
              onOpenModifiers={handleOpenModifiers}
            />
          </motion.div>
        )}
        {screen === "modifiers" && (
          <motion.div key="modifiers" {...pageTransition} className="h-full w-full">
            <RunModifiers
              onBack={goBack}
              onLaunch={handleLaunchModifiers}
              ghostPath={bestPath?.path}
              ghostOn={ghostOn}
              onToggleGhost={() => setGhostOn((g) => !g)}
            />
          </motion.div>
        )}
        {(screen === "game" || screen === "tutorial") && (
          <motion.div key={screen === "tutorial" ? "tutorial" : "game"} {...pageTransition} className="h-full w-full">
            <GameCanvas
              key={gameKey}
              skinId={profile.equippedSkin}
              unlockedAbilities={profile.unlockedAbilities}
              audio={audioManager}
              difficulty={runDiffRef.current}
              startEnergy={getStartEnergy(profile)}
              tutorial={screen === "tutorial"}
              onExit={goBack}
              onRunComplete={handleRunComplete}
              onTutorialComplete={() => setScreen("difficulty")}
              onLeaderboard={() => setScreen("leaderboard")}
              soundOn={profile.settings.sfxOn}
              onToggleSound={toggleSound}
              ghostPath={ghostOn && screen === "game" && bestPath ? bestPath.path : null}
              isNewBest={lastRunIsNewBest}
              onMilestone={handleMilestone}
              onElite={handleElite}
              modifiers={runModsRef.current}
            />
          </motion.div>
        )}
        {screen === "howto" && (
          <motion.div key="howto" {...pageTransition} className="h-full w-full">
            <HowToPlay onBack={goBack} />
          </motion.div>
        )}
        {screen === "hangar" && (
          <motion.div key="hangar" {...pageTransition} className="h-full w-full">
            <Hangar profile={profile} onBack={goBack} onPurchase={handlePurchase} onPurchaseCredits={handlePurchaseCredits} onEquip={handleEquip} />
          </motion.div>
        )}
        {screen === "store" && (
          <motion.div key="store" {...pageTransition} className="h-full w-full">
            <Store profile={profile} onBack={goBack} onBuyCredits={handleBuyCredits} onBuyUpgrade={handleBuyUpgrade} onGoHangar={() => setScreen("hangar")} />
          </motion.div>
        )}
        {screen === "leaderboard" && (
          <motion.div key="leaderboard" {...pageTransition} className="h-full w-full">
            <Leaderboard profile={profile} onBack={goBack} />
          </motion.div>
        )}
        {screen === "profile" && (
          <motion.div key="profile" {...pageTransition} className="h-full w-full">
            <PlayerProfile profile={profile} onBack={goBack} onRename={handleRename} onClaim={handleClaim} onDeleteAccount={handleDeleteAccount} />
          </motion.div>
        )}
        {screen === "settings" && (
          <motion.div key="settings" {...pageTransition} className="h-full w-full">
            <Settings
              profile={profile}
              onBack={goBack}
              onToggleMusic={handleToggleMusic}
              onToggleSfx={handleToggleSfx}
              onMusicVolume={handleMusicVolume}
              onSfxVolume={handleSfxVolume}
              onSetDiscordWebhook={handleSetDiscordWebhook}
            />
          </motion.div>
        )}
        {screen === "stats" && (
          <motion.div key="stats" {...pageTransition} className="h-full w-full">
            <Stats profile={profile} onBack={goBack} />
          </motion.div>
        )}
        {screen === "story" && (
          <motion.div key="story" {...pageTransition} className="h-full w-full">
            <StoryMode profile={profile} onBack={goBack} onStartChapter={handleStartChapter} storyResult={storyResult} onResultSeen={handleResultSeen} onNav={handleNav} />
          </motion.div>
        )}
        {screen === "storyrun" && (
          <motion.div key="storyrun" {...pageTransition} className="h-full w-full">
            <GameCanvas
              key={gameKey}
              skinId={profile.equippedSkin}
              unlockedAbilities={profile.unlockedAbilities}
              audio={audioManager}
              difficulty={currentChapter?.difficulty || "normal"}
              startEnergy={getStartEnergy(profile)}
              onExit={() => setScreen("story")}
              onRunComplete={handleStoryRunComplete}
              soundOn={profile.settings.sfxOn}
              onToggleSound={toggleSound}
              onElite={handleElite}
            />
          </motion.div>
        )}
        {screen === "missions" && (
          <motion.div key="missions" {...pageTransition} className="h-full w-full">
            <Missions profile={profile} onBack={goBack} onClaim={handleClaimMission} />
          </motion.div>
        )}
        {screen === "sidequests" && (
          <motion.div key="sidequests" {...pageTransition} className="h-full w-full">
            <SideQuests profile={profile} onBack={goBack} onClaim={handleClaimSideQuest} />
          </motion.div>
        )}
        {screen === "missionlogs" && (
          <motion.div key="missionlogs" {...pageTransition} className="h-full w-full">
            <MissionLogs profile={profile} onBack={goBack} onClaimMission={handleClaimMission} onClaimSideQuest={handleClaimSideQuest} />
          </motion.div>
        )}
        {screen === "arcade" && (
          <motion.div key="arcade" {...pageTransition} className="h-full w-full">
            <Arcade profile={profile} onBack={goBack} onPlay={handlePlayArcade} />
          </motion.div>
        )}
        {screen === "arcadegame" && arcadeGameId === "laser_dodge" && (
          <motion.div key="arcadegame" {...pageTransition} className="h-full w-full">
            <LaserDodge skinId={profile.equippedSkin} onExit={() => setScreen("arcade")} onResult={handleArcadeResult} />
          </motion.div>
        )}
        {screen === "database" && (
          <motion.div key="database" {...pageTransition} className="h-full w-full">
            <DatabaseView profile={profile} onBack={goBack} />
          </motion.div>
        )}
        {screen === "skillchallenges" && (
          <motion.div key="skillchallenges" {...pageTransition} className="h-full w-full">
            <SkillChallenges profile={profile} onBack={goBack} onPlay={handlePlaySkillChallenge} />
          </motion.div>
        )}
        {screen === "skillrun" && skillChallenge && (
          <motion.div key="skillrun" {...pageTransition} className="h-full w-full">
            <GameCanvas
              key={gameKey}
              skinId={profile.equippedSkin}
              unlockedAbilities={profile.unlockedAbilities}
              audio={audioManager}
              difficulty="normal"
              startEnergy={getStartEnergy(profile)}
              constraints={skillChallenge.constraint}
              onExit={() => setScreen("skillchallenges")}
              onRunComplete={handleSkillRunComplete}
              soundOn={profile.settings.sfxOn}
              onToggleSound={toggleSound}
              onElite={handleElite}
            />
          </motion.div>
        )}
        {screen === "daily" && (
          <motion.div key="daily" {...pageTransition} className="h-full w-full">
            <DailyChallenge onBack={goBack} onStart={handlePlayDaily} onLeaderboard={() => setScreen("leaderboard")} />
          </motion.div>
        )}
        {screen === "assistants" && (
          <motion.div key="assistants" {...pageTransition} className="h-full w-full">
            <Assistants onBack={goBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AchievementToast toasts={toasts} />
      <OfflineIndicator />
    </div>
  );
}