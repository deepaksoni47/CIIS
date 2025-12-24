// Lightweight, modern smooth scroll (Lenis-style) for React/Next.js
// - Only vertical
// - No hijack, no bounce, no parallax
// - Disables on touch/mobile and prefers-reduced-motion
// - Cleans up on unmount

function isTouchDevice() {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useSmoothScroll() {
  // Only run on client
  if (typeof window === "undefined") return;

  // Disable on touch/mobile or reduced motion
  if (isTouchDevice() || prefersReducedMotion()) return;

  let isScrolling = false;
  let targetScroll = 0;
  let currentScroll = 0;
  let rafId: number;

  const ease = 0.13; // ~1.1-1.3s to settle
  const root = document.scrollingElement || document.documentElement;

  function onWheel(e: WheelEvent) {
    // Only vertical
    if (e.deltaY === 0) return;
    targetScroll += e.deltaY;
    targetScroll = Math.max(
      0,
      Math.min(targetScroll, root.scrollHeight - window.innerHeight)
    );
    if (!isScrolling) animateScroll();
    e.preventDefault();
  }

  function animateScroll() {
    isScrolling = true;
    currentScroll += (targetScroll - currentScroll) * ease;
    if (Math.abs(targetScroll - currentScroll) < 0.5) {
      currentScroll = targetScroll;
    }
    window.scrollTo(0, currentScroll);
    if (Math.abs(targetScroll - currentScroll) > 0.5) {
      rafId = requestAnimationFrame(animateScroll);
    } else {
      isScrolling = false;
    }
  }

  function onAnchorClick(e: Event) {
    const anchor = e.target as HTMLAnchorElement;
    if (anchor.tagName !== "A" || !anchor.hash) return;
    const target = document.getElementById(anchor.hash.slice(1));
    if (target) {
      e.preventDefault();
      const navOffset = 0; // Adjust if you have a fixed nav
      const rect = target.getBoundingClientRect();
      targetScroll = rect.top + window.scrollY - navOffset;
      animateScroll();
    }
  }

  function cleanup() {
    window.removeEventListener("wheel", onWheel, { passive: false } as any);
    document.removeEventListener("click", onAnchorClick, true);
    cancelAnimationFrame(rafId);
  }

  window.addEventListener("wheel", onWheel, { passive: false } as any);
  document.addEventListener("click", onAnchorClick, true);
  return cleanup;
}
