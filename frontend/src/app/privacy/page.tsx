"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-[#0A0E1A] text-white">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse-slower" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        {/* Last Updated */}
        <p className="text-white/60 text-sm mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        {/* Content */}
        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Introduction
            </h2>
            <p>
              CampusCare ("we," "us," "our," or "Company") is committed to
              protecting your privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              visit our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Information We Collect
            </h2>
            <p className="mb-4">
              We may collect information about you in a variety of ways. The
              information we may collect on our site includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Personal Data: Name, email address, phone number, and account
                credentials
              </li>
              <li>
                Geospatial Data: Location information when reporting
                infrastructure issues
              </li>
              <li>
                Usage Data: Pages visited, time spent, interactions with
                features
              </li>
              <li>
                Device Information: IP address, browser type, operating system
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. Use of Your Information
            </h2>
            <p className="mb-4">
              Having accurate information about you permits us to provide you
              with a smooth, efficient, and customized experience. Specifically,
              we may use information collected about you via the site to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Process and deliver infrastructure reports</li>
              <li>Generate AI-assisted insights for campus management</li>
              <li>Improve our services and user experience</li>
              <li>Send periodic communications regarding your account</li>
              <li>Monitor and analyze usage patterns and trends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Disclosure of Your Information
            </h2>
            <p>
              We may share your information only when required by law or to
              protect the rights, property, and safety of our platform. We do
              not sell, trade, or rent your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Security of Your Information
            </h2>
            <p>
              We use administrative, technical, and physical security measures
              to protect your personal information. However, no method of
              transmission over the Internet or method of electronic storage is
              100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Contact Us
            </h2>
            <p>
              If you have questions or comments about this Privacy Policy,
              please contact us at support@campuscare.edu
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">© 2025 CampusCare</p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link
              href="/documentation"
              className="hover:text-white transition-colors"
            >
              Documentation
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
