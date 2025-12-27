"use client";
import React, { useEffect, useState } from "react";

const LS_KEY = "campuscare_curtain_loader_seen";

export function CurtainLoader({ logo }: { logo?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(LS_KEY)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setShow(true);
      setTimeout(() => {
        setShow(false);
        window.localStorage.setItem(LS_KEY, "1");
      }, 100);
      return;
    }
    setShow(true);
    setTimeout(() => setAnimate(true), 350); // presence pause
    setTimeout(() => {
      setShow(false);
      window.localStorage.setItem(LS_KEY, "1");
    }, 1200);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        background: "#0A0E1A",
        transition: reduced ? "opacity 0.2s" : undefined,
        opacity: show ? 1 : 0,
      }}
    >
      {/* Top Curtain */}
      <div
        className={`fixed left-0 top-0 w-full h-1/2 bg-[#181a22] transition-transform duration-[700ms] ease-[cubic-bezier(0.77,0,0.175,1)] ${animate ? "-translate-y-full" : "translate-y-0"}`}
        style={{
          boxShadow: "0 8px 32px 0 rgba(10,12,20,0.18)",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      />
      {/* Bottom Curtain */}
      <div
        className={`fixed left-0 bottom-0 w-full h-1/2 bg-[#181a22] transition-transform duration-[700ms] ease-[cubic-bezier(0.77,0,0.175,1)] ${animate ? "translate-y-full" : "translate-y-0"}`}
        style={{
          boxShadow: "0 -8px 32px 0 rgba(10,12,20,0.18)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      />
      {/* Optional Logo/Mark */}
      {logo && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#23243a] shadow-lg opacity-80">
            {logo}
          </div>
        </div>
      )}
    </div>
  );
}
