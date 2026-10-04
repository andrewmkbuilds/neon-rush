import { useState, useCallback } from "react";

export function useScreenShake(duration = 400) {
  const [active, setActive] = useState(false);
  const shake = useCallback(() => {
    setActive(false);
    requestAnimationFrame(() => {
      setActive(true);
      setTimeout(() => setActive(false), duration);
    });
  }, [duration]);
  return {
    style: active ? { animation: `nr-shake ${duration}ms ease-in-out` } : {},
    shake,
  };
}