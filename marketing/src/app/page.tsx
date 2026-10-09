import React from 'react';
import {
  Shield,
  Eye,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Building2,
  FileText,
  HeartHandshake,
  Lock,
  Sparkles,
  PhoneCall,
  Scale,
} from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
              R
            </div>
            <div>
              <span className="font-black text-lg text-gray-900 tracking-tight">
                लोकआवाज <span className="text-orange-600 font-bold">RAISE</span>
              </span>
              <span className="ml-2 text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded">
                CIVIC TECH
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#mission" className="hover:text-orange-600 transition">
              Mission
            </a>
            <a href="#how-it-works" className="hover:text-orange-600 transition">
              How It Works
            </a>
            <a href="#principles" className="hover:text-orange-600 transition">
              Principles
            </a>
            <a href="#pilot" className="hover:text-orange-600 transition">
              Pilot Area
            </a>
            <a href="#transparency" className="hover:text-orange-600 transition">
              Trust & Legal
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
            >
              <span>Open Web App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/50 via-white to-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-950 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border border-orange-200">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="tracking-wide">RAISE &bull; Report • Amplify • Inform • Solve • Escalate</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.15] mb-6">
            Every Citizen’s Voice. <br />
            <span className="text-orange-600">Every Authority’s Duty.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            <strong className="text-gray-900 font-bold">RAISE</strong> connects citizens directly to governance: 
            <span className="text-orange-700 font-semibold"> Report</span> issues with evidence, 
            <span className="text-orange-700 font-semibold"> Amplify</span> collective backing, 
            <span className="text-orange-700 font-semibold"> Inform</span> responsible offices, 
            <span className="text-orange-700 font-semibold"> Solve</span> civic problems, and 
            <span className="text-orange-700 font-semibold"> Escalate</span> when ignored.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Raise an Issue in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#principles"
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition flex items-center justify-center"
            >
              Read Our Charter
            </a>
          </div>

          {/* Highlights Counter Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto text-left">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-2xl font-black text-orange-600">100%</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">Non-Profit & Neutral</div>
              <div className="text-[11px] text-gray-500">Zero political party funds</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-2xl font-black text-gray-900">&lt;60s</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">Issue Registration</div>
              <div className="text-[11px] text-gray-500">Voice note, geo & photos</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-2xl font-black text-gray-900">1-Person</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">One Raise Policy</div>
              <div className="text-[11px] text-gray-500">Resistant to brigading</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">PCMC</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">Pilot Zone</div>
              <div className="text-[11px] text-gray-500">Pimpri-Chinchwad & Pune</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              The RAISE Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              How RAISE Works
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              A 5-stage transparent accountability cycle from initial grievance to official resolution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* R */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-base mb-3">
                R
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">
                Report
              </h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Take a photo, record an audio voice note in Marathi/Hindi, or geotag GPS in under 60 seconds.
              </p>
            </div>

            {/* A */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-base mb-3">
                A
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">
                Amplify
              </h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Neighbors support the issue (1-person-1-raise). Locality-weighted rankings prove genuine urgency.
              </p>
            </div>

            {/* I */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-base mb-3">
                I
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">
                Inform
              </h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                The platform alerts the designated ward office or department profile and notifies the local community.
              </p>
            </div>

            {/* S */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-base mb-3">
                S
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">
                Solve
              </h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Offices acknowledge and post progress. Citizens confirm resolution or dispute incomplete work.
              </p>
            </div>

            {/* E */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-base mb-3">
                E
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1.5">
                Escalate
              </h3>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                If ignored past the response clock, 1-tap tools generate pre-filled CPGRAMS complaints and RTI drafts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section id="principles" className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Core Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              Our Non-Negotiable Charter
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Designed to preserve public trust, prevent political capture, and safeguard citizens.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
              <Scale className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-sm text-gray-900 mb-1">Strict Neutrality</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                No party, no ideology. The platform carries citizen voices without taking political sides.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
              <Building2 className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-sm text-gray-900 mb-1">Offices, Not Individuals</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Issues target designated departments or public offices, avoiding personal attacks or defamation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
              <Lock className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-sm text-gray-900 mb-1">Safe for Citizens</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pseudonymous profiles, optional anonymous posting, and automatic EXIF/GPS scrubbing from media.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
              <Eye className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-sm text-gray-900 mb-1">Evidence Over Noise</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Issues require dates, locations, and verification. Community corroboration prevents false claims.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
              <Users className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-sm text-gray-900 mb-1">Regional Language First</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Usable by first-time smartphone users in Marathi, Hindi, and English with native audio notes.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
              <FileText className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-bold text-sm text-gray-900 mb-1">Radical Transparency</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We publish all moderation decisions, funding sources, and platform operational metrics openly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Area Spotlight */}
      <section id="pilot" className="py-16 sm:py-20 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-xs font-bold px-3 py-1 rounded-full mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span>Phase 0 & 1 Hyperlocal Pilot</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black mb-4">
            Pimpri-Chinchwad & Pune Region
          </h2>
          <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Starting with Nigdi, Akurdi, Chinchwad, and Bhosari. Tracking real civic
            grievances across PCMC Ward offices, Mahavitaran, and Pune Zilla Parishad.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
              <div className="text-xs text-orange-200">Municipal Corp</div>
              <div className="font-bold text-sm mt-0.5">PCMC Wards A-H</div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
              <div className="text-xs text-orange-200">Utilities</div>
              <div className="font-bold text-sm mt-0.5">MSEDCL Electricity</div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
              <div className="text-xs text-orange-200">Health & Waste</div>
              <div className="font-bold text-sm mt-0.5">Sanitation Dept</div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
              <div className="text-xs text-orange-200">Water Supply</div>
              <div className="font-bold text-sm mt-0.5">PCMC Jal Vibhag</div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal & Trust Transparency */}
      <section id="transparency" className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Governance, Legal & DPDP Compliance
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
              Our entity is designed under Section 8 of the Companies Act (Non-Profit).
              We comply strictly with the IT Rules 2021 (Intermediary Guidelines) and the Digital
              Personal Data Protection (DPDP) Act.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold block text-gray-900 mb-1">
                  1. Data Minimization
                </span>
                We only store phone OTP verification and approximate locality. We never collect Aadhaar or personal IDs.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold block text-gray-900 mb-1">
                  2. Intermediary Protection
                </span>
                Compliant with Section 79 of IT Act. Clear grievance mechanism with swift 24-36h moderation review.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold block text-gray-900 mb-1">
                  3. Defamation Risk Mitigation
                </span>
                Issues are strictly targeted at designated public offices, never at individual government officers.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold block text-gray-900 mb-1">
                  4. Red-Line Funding Policy
                </span>
                We reject all funds from political parties, candidates, or entities seeking editorial influence.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-950 text-gray-400 py-12 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center text-sm">
              R
            </div>
            <span className="font-bold text-white text-sm">
              लोकआवाज (RAISE) &bull; Citizen Voice Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a href="MASTER_PLAN.md" className="hover:text-white transition">
              Master Plan (v1.0)
            </a>
            <a href="#transparency" className="hover:text-white transition">
              Privacy Policy & DPDP
            </a>
            <a href="#transparency" className="hover:text-white transition">
              Grievance Officer
            </a>
            <a href="http://localhost:3000" className="hover:text-white transition text-orange-400">
              Open Citizen App
            </a>
          </div>

          <div>&copy; 2026 RAISE Platform. Non-profit public interest initiative.</div>
        </div>
      </footer>
    </div>
  );
}
