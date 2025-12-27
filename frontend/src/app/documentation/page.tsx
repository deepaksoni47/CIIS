"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Book, Code, HelpCircle } from "lucide-react";

export default function DocumentationPage() {
  const sections = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Getting Started",
      description:
        "Learn the basics of using CampusCare and setting up your account",
      href: "#getting-started",
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "API Documentation",
      description:
        "Comprehensive API reference for developers integrating with CampusCare",
      href: "#api",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Database Architecture",
      description: "Understand the data model and database structure",
      href: "#database",
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      title: "FAQs",
      description: "Find answers to commonly asked questions",
      href: "#faqs",
    },
  ];

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
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Documentation
        </h1>
        <p className="text-white/60 mb-12">
          Everything you need to know about CampusCare
        </p>

        {/* Documentation Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {sections.map((section, index) => (
            <a
              key={index}
              href={section.href}
              className="group p-6 rounded-lg border border-white/10 hover:border-violet-500/50 transition-all hover:bg-violet-500/5"
            >
              <div className="flex items-start gap-4">
                <div className="text-violet-400 group-hover:text-fuchsia-400 transition-colors">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-violet-400 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-white/60 text-sm">{section.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Documentation Content */}
        <div className="space-y-12">
          <section id="getting-started">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Getting Started
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                Welcome to CampusCare! Our platform provides a data-driven,
                geospatial, and AI-assisted solution for campus infrastructure
                management.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Creating Your Account
              </h3>
              <p>
                To get started, visit the login page and create a new account
                with your campus credentials. You'll need to verify your email
                before accessing the platform.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Reporting Issues
              </h3>
              <p>
                Use the issue reporting feature to document infrastructure
                problems. Include location details, photos, and a detailed
                description to help our team prioritize repairs.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Viewing Analytics
              </h3>
              <p>
                Access the dashboard to view real-time infrastructure metrics,
                AI-generated insights, and historical trends for your campus.
              </p>
            </div>
          </section>

          <section id="api">
            <h2 className="text-2xl font-semibold text-white mb-4">
              API Documentation
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                CampusCare provides a comprehensive REST API for developers
                looking to integrate our platform with other systems.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Base URL
              </h3>
              <p className="font-mono bg-white/5 p-4 rounded border border-white/10">
                https://api.campuscare.edu/v1
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Authentication
              </h3>
              <p>
                All API requests require authentication using JWT tokens.
                Include your token in the Authorization header as: Bearer{" "}
                {"{token}"}
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Endpoints
              </h3>
              <p>
                For a complete list of available endpoints and request/response
                examples, please refer to our full API specification document.
              </p>
            </div>
          </section>

          <section id="database">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Database Architecture
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                CampusCare uses a robust database architecture designed to
                handle geospatial data, real-time updates, and complex analytics
                queries.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6">
                Core Tables
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Issues: Stores reported infrastructure problems</li>
                <li>Buildings: Campus location and building data</li>
                <li>Users: User accounts and permissions</li>
                <li>Analytics: Historical data and trends</li>
              </ul>
              <h3 className="text-lg font-semibold text-white mt-6">
                Spatial Indexing
              </h3>
              <p>
                All geographic data is indexed using PostGIS for efficient
                spatial queries and proximity searches.
              </p>
            </div>
          </section>

          <section id="faqs">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How often is the data updated?
                </h3>
                <p className="text-white/80">
                  Infrastructure data is updated in real-time as issues are
                  reported and resolved. Analytics and trends are computed
                  daily.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I export reports?
                </h3>
                <p className="text-white/80">
                  Yes, all reports can be exported in PDF, CSV, or Excel formats
                  directly from the dashboard.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How is data privacy handled?
                </h3>
                <p className="text-white/80">
                  All data is encrypted in transit and at rest. Personal
                  information is never shared with third parties except as
                  required by law.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What browsers are supported?
                </h3>
                <p className="text-white/80">
                  CampusCare works on all modern browsers including Chrome,
                  Firefox, Safari, and Edge on both desktop and mobile devices.
                </p>
              </div>
            </div>
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
