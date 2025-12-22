"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";

interface MagneticButtonProps {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}

export function MagneticButton({
  children,
  href,
  variant = "primary",
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } =
      e.currentTarget.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const isPrimary = variant === "primary";

  return (
    <motion.a
      href={href}
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 350, damping: 20, mass: 0.5 }}
      className={`
        group relative inline-flex items-center justify-center px-8 py-4 
        text-base font-semibold rounded-full overflow-hidden cursor-pointer
        transition-all duration-300
        ${
          isPrimary
            ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-size-200 hover:bg-pos-100"
            : "border-2 border-white/20 hover:border-white/40"
        }
      `}
    >
      {/* Animated Background */}
      {isPrimary && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-30"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
              backgroundSize: "200% 100%",
            }}
          />
        </>
      )}

      {/* Glow Effect */}
      <div
        className={`
          absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300
          ${isPrimary ? "bg-fuchsia-500/50" : "bg-white/20"}
        `}
      />

      <span className="relative z-10 flex items-center gap-2 text-white">
        {children}
      </span>

      {/* Bubble Animation */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        initial={false}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(6, 182, 212, 0)",
            "0 0 0 10px rgba(6, 182, 212, 0)",
          ],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </motion.a>
  );
}
