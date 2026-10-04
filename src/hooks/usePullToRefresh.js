import { useRef, useState, useEffect } from "react";

// Simple touch-drag pull-to-refresh for a scrollable container.
// Attach the returned `ref` to the overflow-y-auto element. When the user
// drags down from the top (scrollTop <= 0), `pull` tracks the drag distance;
// releasing past the threshold calls `onRefresh` and shows a spinner.
export function usePullToRefresh(onRefresh) {
  const ref = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const cbRef = useRef(onRefresh);
  useEffect(() => { cbRef.current = onRefresh; }, [onRefresh]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const THRESHOLD = 70;

    const onTouchStart = (e) => {
      if (el.scrollTop <= 0 && !refreshingRef.current) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const onTouchMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        const p = Math.min(THRESHOLD * 1.5, dy * 0.5);
        pullRef.current = p;
        setPull(p);
      }
    };
    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        try { await cbRef.current(); } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return { ref, pull, refreshing };
}