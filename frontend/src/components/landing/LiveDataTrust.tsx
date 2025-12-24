"use client";
import { useRef } from "react";

export function LiveDataTrust() {
  const ref = useRef(null);
  return (
    <section ref={ref} className="relative py-20 px-6 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-[#f5f6fa]">
            Built on{" "}
            <span className="text-[#bcb8ff]">
              Verified Spatial Intelligence
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-[#aeb6c2]">
            The system operates on precise spatial boundaries, hierarchies, and
            real-world layouts. Accuracy, validation, and structure are
            foundational—never optional.
          </p>
        </div>
        {/* System Spatial Layers */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: "Campus boundary layer",
              desc: "Defines the outer perimeter for all spatial logic.",
            },
            {
              label: "Building footprint layer",
              desc: "Maps every structure as a discrete, validated entity.",
            },
            {
              label: "Floor and room-level resolution",
              desc: "Supports granular location mapping and navigation.",
            },
            {
              label: "Issue-to-location binding",
              desc: "Every report is anchored to a real, validated place.",
            },
          ].map((layer) => (
            <div
              key={layer.label}
              className="p-7 rounded-2xl"
              style={{
                background:
                  "linear-gradient(120deg, #20222a 80%, #23243a 100%)",
                boxShadow:
                  "inset 0 2px 10px 0 rgba(20,22,30,0.13), 0 0.5px 0 0 #23242a inset",
                border: "1.5px solid #23243a",
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest text-[#b2b7c2]/60 mb-2"
                style={{ opacity: 0.6, letterSpacing: "0.13em" }}
              >
                {layer.label}
              </div>
              <div
                className="text-[15px] text-[#b2b7c2] leading-relaxed"
                style={{ opacity: 0.88 }}
              >
                {layer.desc}
              </div>
            </div>
          ))}
        </div>
        {/* System Guarantees */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            "Boundary-locked issue reporting",
            "Location-aware validation",
            "Hierarchical spatial mapping",
            "Multi-campus ready architecture",
          ].map((guarantee) => (
            <div
              key={guarantee}
              className="p-5 rounded-xl"
              style={{
                background:
                  "linear-gradient(120deg, #20222a 80%, #23243a 100%)",
                boxShadow: "inset 0 1.5px 8px 0 rgba(20,22,30,0.10)",
                border: "1.5px solid #23243a",
              }}
            >
              <div
                className="text-xs text-[#b2b7c2]/70 tracking-wide"
                style={{ opacity: 0.7 }}
              >
                {guarantee}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
{
  /* System Guarantees */
}
<div className="grid md:grid-cols-4 gap-6">
  {[
    "Boundary-locked issue reporting",
    "Location-aware validation",
    "Hierarchical spatial mapping",
    "Multi-campus ready architecture",
  ].map((guarantee) => (
    <div
      key={guarantee}
      className="p-5 rounded-xl"
      style={{
        background: "linear-gradient(120deg, #20222a 80%, #23243a 100%)",
        boxShadow: "inset 0 1.5px 8px 0 rgba(20,22,30,0.10)",
        border: "1.5px solid #23243a",
      }}
    >
      <div
        className="text-xs text-[#b2b7c2]/70 tracking-wide"
        style={{ opacity: 0.7 }}
      >
        {guarantee}
      </div>
    </div>
  ))}
</div>;
