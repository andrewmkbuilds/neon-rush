import React, { useEffect, useRef, useState, useCallback } from "react";
import { GameEngine } from "@/game/engine";
import { base44 } from "@/api/base44Client";
import GameHUD from "./GameHUD";
import TouchControls from "./TouchControls";
import PauseMenu from "./PauseMenu";
import GameOver from "./GameOver";
import TutorialOverlay from "./TutorialOverlay";

export default function GameCanvas({
  skinId,
  unlockedAbilities,
  audio,
  onExit,
  onRunComplete,
  onLeaderboard,
  soundOn,
  onToggleSound,
  isNewBest,
  onMilestone,
  difficulty,
  tutorial,
  onTutorialComplete,
  ghostPath,
  constraints,
  startEnergy,
  modifiers,
  onElite,
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [hud, setHud] = useState(null);
  const [gState, setGState] = useState("ready");
  const [summary, setSummary] = useState(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas, {
      skinId,
      unlockedAbilities,
      audio,
      difficulty,
      tutorial,
      ghostPath,
      constraints,
      startEnergy,
      modifiers,
      onTutorialComplete: () => onTutorialComplete && onTutorialComplete(),
      onHud: setHud,
      onState: setGState,
      onGameOver: (s) => {
        setSummary(s);
        if (!completedRef.current) {
          completedRef.current = true;
          onRunComplete(s);
        }
      },
      onEvent: (type, data) => {
        if (type === "milestone" && onMilestone) onMilestone(data);
        if (type === "elite" && onElite) onElite(data);
      },
    });
    engineRef.current = engine;

    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvas);

    engine.start();
    base44.analytics.track({ eventName: "game_started" });
    return () => {
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePause = useCallback(() => engineRef.current && engineRef.current.pause(), []);
  const handleResume = useCallback(() => engineRef.current && engineRef.current.resume(), []);
  const handleRestart = useCallback(() => {
    completedRef.current = false;
    setSummary(null);
    engineRef.current && engineRef.current.restart();
  }, []);
  const handleExit = useCallback(() => onExit(), [onExit]);
  const act = (fn) => () => engineRef.current && fn(engineRef.current);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#05060D] select-none touch-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ touchAction: "none" }}
      />

      {hud && gState !== "gameover" && !tutorial && (
        <GameHUD hud={hud} onPause={handlePause} soundOn={soundOn} onToggleSound={onToggleSound} />
      )}

      {hud && tutorial && (gState === "playing" || gState === "ready") && (
        <TutorialOverlay hud={hud} onSkip={handleExit} />
      )}

      {hud && (gState === "playing" || gState === "ready") && (
        <TouchControls
          hud={hud}
          onDash={act((e) => e.activateDash())}
          onShield={act((e) => e.activateShield())}
          onSlow={act((e) => e.activateSlow())}
        />
      )}

      {gState === "paused" && (
        <PauseMenu onResume={handleResume} onRestart={handleRestart} onMenu={handleExit} />
      )}

      {gState === "gameover" && summary && (
        <GameOver
          summary={summary}
          onRestart={handleRestart}
          onMenu={handleExit}
          onLeaderboard={onLeaderboard}
          isNewBest={isNewBest}
        />
      )}
    </div>
  );
}