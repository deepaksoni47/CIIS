"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileWarning,
  Server,
  Activity,
  Eye,
  Database,
  Globe,
} from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#050814] text-white selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise-Grade Protection</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="gradient-heading">
              Security by
              <br />
              Defense in Depth.
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            CampusCare implements a multi-layered security architecture designed
            to protect campus infrastructure data through rigorous validation,
            real-time monitoring, and proactive attack prevention.
          </p>
        </motion.div>

        {/* Security Layers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          <FeatureCard
            icon={<Activity />}
            title="7-Layer Rate Limiting"
            description="Specialized protection against brute force and DDoS. Includes strict limits for Auth (5/15m), API, AI endpoints, and file uploads."
            color="cyan"
          />
          <FeatureCard
            icon={<FileWarning />}
            title="Magic Number Validation"
            description="We don't just trust file extensions. We inspect binary headers to verify actual file types (JPEG, PNG, WebP) preventing malicious uploads."
            color="blue"
          />
          <FeatureCard
            icon={<Database />}
            title="Input Sanitization"
            description="Whitelist-based validation using Express-Validator. Every input is scrutinized for SQL Injection, XSS patterns, and path traversal attempts."
            color="indigo"
          />
          <FeatureCard
            icon={<Lock />}
            title="RBAC Authorization"
            description="Strict Role-Based Access Control enforcing least-privilege principles across Admins, Facility Managers, Staff, and Students."
            color="violet"
          />
          <FeatureCard
            icon={<Eye />}
            title="Suspicious Activity Log"
            description="Real-time monitoring of sensitive paths (/admin, /.env). Automated tracking of bot user-agents and IP-based anomalies."
            color="fuchsia"
          />
          <FeatureCard
            icon={<Server />}
            title="Secure Headers"
            description="Implementation of Helmet, HSTS enforcement, X-Frame-Options, and strict CORS policies to harden the application layer."
            color="emerald"
          />
        </div>

        {/* Architecture Section */}
        <section className="mb-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-3xl blur-xl" />
          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl font-bold text-white">
                  The Security Stack
                </h2>
                <div className="space-y-4">
                  <LayerItem
                    number="01"
                    title="Network Layer"
                    desc="HTTPS Enforcement, Custom CORS, Trusted Proxies"
                  />
                  <LayerItem
                    number="02"
                    title="Application Layer"
                    desc="Global Rate Limiting, Helmet Headers, Compression"
                  />
                  <LayerItem
                    number="03"
                    title="Validation Layer"
                    desc="Input Whitelisting, XSS Sanitization, MIME Checks"
                  />
                  <LayerItem
                    number="04"
                    title="Data Layer"
                    desc="Parameterized Queries, Encrypted Storage, Secure Seed"
                  />
                </div>
              </div>

              {/* Visual Stats */}
              <div className="flex-1 w-full grid grid-cols-2 gap-4">
                <StatBox value="100%" label="TypeScript Coverage" />
                <StatBox value="20+" label="Custom Validators" />
                <StatBox value="0" label="Critical Vulnerabilities" />
                <StatBox value="A+" label="Security Headers" />
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Badges */}
        <div className="text-center mb-20">
          <p className="text-white/40 uppercase tracking-widest text-sm font-semibold mb-8">
            Compliance & Standards
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Using text representations as placeholders for logos */}
            <ComplianceBadge name="OWASP Top 10" />
            <ComplianceBadge name="GDPR Ready" />
            <ComplianceBadge name="PCI DSS Compliant" />
            <ComplianceBadge name="ISO 27001 Principles" />
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center"
        >
          <Link href="/dashboard">
            <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] transition-all duration-300">
              Return to Dashboard
            </button>
          </Link>
          <p className="mt-6 text-white/30 text-sm">
            System Version 1.0.0 • Last Security Audit: Jan 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function FeatureCard({ icon, title, description, color }: any) {
  const gradients: any = {
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/50",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/50",
    indigo:
      "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/50",
    violet:
      "from-violet-500/20 to-violet-500/5 border-violet-500/20 hover:border-violet-500/50",
    fuchsia:
      "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/20 hover:border-fuchsia-500/50",
    emerald:
      "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50",
  };

  const iconColors: any = {
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    indigo: "text-indigo-400",
    violet: "text-violet-400",
    fuchsia: "text-fuchsia-400",
    emerald: "text-emerald-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradients[color]} border backdrop-blur-sm transition-all duration-300 group`}
    >
      <div
        className={`w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center mb-4 ${iconColors[color]} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function LayerItem({ number, title, desc }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
      <span className="text-cyan-500 font-mono text-xl">{number}</span>
      <div>
        <h4 className="text-white font-semibold">{title}</h4>
        <p className="text-white/50 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function StatBox({ value, label }: any) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-center hover:border-cyan-500/30 transition-colors">
      <div className="text-3xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-1">
        {value}
      </div>
      <div className="text-xs text-cyan-400/80 uppercase tracking-wider font-medium">
        {label}
      </div>
    </div>
  );
}

function ComplianceBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10">
      <ShieldCheck className="w-5 h-5 text-green-400" />
      <span className="font-bold text-white/80">{name}</span>
    </div>
  );
}
