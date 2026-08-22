import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  Brain,
  Clock,
  FileSearch,
  Users,
  Building2,
  Briefcase,
  Check,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onTryDemo, onOpenAuth }) {
  const titleRef = useRef(null);
  const textRef = useRef(null);
  const cubeRef = useRef(null);

  useEffect(() => {
    // Animate title words with 3D rotation effect
    if (titleRef.current && titleRef.current.children) {
      gsap.fromTo(
        titleRef.current.children,
        { rotationX: -90, opacity: 0, y: 50, transformOrigin: "50% 50% -50px" },
        { rotationX: 0, opacity: 1, y: 0, stagger: 0.15, duration: 1.2, ease: "back.out(1.5)", delay: 0.2 }
      );
    }

    // Fade in description text and buttons below
    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: "power2.out" }
      );
    }

    // Continuous Rotating 3D Box decoration
    if (cubeRef.current) {
      gsap.to(cubeRef.current, {
        rotationX: 360,
        rotationY: 360,
        duration: 15,
        repeat: -1,
        ease: "none"
      });
    }
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative font-sans text-gray-900 scroll-smooth">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-200/50 blur-3xl mix-blend-multiply pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-200/40 blur-3xl mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-3xl mix-blend-multiply pointer-events-none"></div>

      {/* Prominent, Ultra-Clear Floating Navbar Container */}
      <header className="sticky top-0 z-50 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <nav className="bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg shadow-gray-200/60 rounded-2xl px-6 py-3.5 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onTryDemo}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-300">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-gray-900">SmartInvoice</span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Promise-to-Pay</span>
            </div>
          </div>

          {/* Nav Links with Smooth Scroll */}
          <div className="hidden md:flex items-center gap-8 font-semibold text-gray-700 text-sm">
            <button onClick={() => scrollToSection('features')} className="hover:text-indigo-600 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('solutions')} className="hover:text-indigo-600 transition-colors">
              Solutions
            </button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-indigo-600 transition-colors">
              Pricing
            </button>
          </div>

          {/* Nav Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onOpenAuth && onOpenAuth('sign-in')}
              className="text-gray-700 hover:text-indigo-600 font-bold transition-colors px-3.5 py-2 text-sm hidden sm:block"
            >
              Sign In
            </button>
            <button
              onClick={onTryDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all transform hover:-translate-y-0.5 text-sm whitespace-nowrap"
            >
              Try Demo
            </button>
            <button
              onClick={() => onOpenAuth && onOpenAuth('sign-up')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold shadow-md shadow-gray-300 transition-all transform hover:-translate-y-0.5 text-sm whitespace-nowrap hidden sm:block"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center relative p-6 z-10 w-full max-w-6xl mx-auto text-center pt-12 pb-20">
        
        {/* Track 03 Tagline Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Razorpay Track 03 • AI Closed-Loop Revenue Recovery
        </div>

        {/* 3D Decorative Box */}
        <div className="absolute top-[15%] right-[8%] w-24 h-24 hidden lg:block perspective-1000 z-0 opacity-60">
          <div ref={cubeRef} className="cube">
            <div className="cube-face cube-face-front"></div>
            <div className="cube-face cube-face-back"></div>
            <div className="cube-face cube-face-right"></div>
            <div className="cube-face cube-face-left"></div>
            <div className="cube-face cube-face-top"></div>
            <div className="cube-face cube-face-bottom"></div>
          </div>
        </div>

        <div className="relative z-10 w-full">
          <h1
            ref={titleRef}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6 flex flex-wrap justify-center gap-x-3 sm:gap-x-4 perspective-1000"
          >
            <span className="inline-block preserve-3d">Revolutionize</span>
            <span className="inline-block preserve-3d">Your</span>
            <span className="inline-block preserve-3d text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Invoicing
            </span>
          </h1>

          <div ref={textRef} className="flex flex-col items-center w-full">
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed font-medium">
              Streamline your billing process, track payment promises in real-time with Gemini LLM extraction, and collect unpaid invoices faster with autonomous escalation schedules.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => onOpenAuth && onOpenAuth('sign-up')}
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-gray-200/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group text-base"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onTryDemo}
                className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-8 py-4 rounded-xl font-bold shadow-sm transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-base"
              >
                <PlayCircle className="w-5 h-5 text-indigo-600" />
                Explore Demo Mode
              </button>
            </div>

            {/* Quick Highlights */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl w-full">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-gray-800">LLM Promise Date Extraction</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-gray-800">Razorpay Webhook Verification</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-gray-800">Audit-Log Traceability</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-gray-800">Human Escalation Queue</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: FEATURES */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Intelligent Automation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Features Built for Autonomous Revenue Recovery
          </h2>
          <p className="text-gray-600 text-base">
            Replace manual collection calls with AI intelligence, structured promise logs, and closed-loop payment verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gemini LLM Promise Extraction</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Automatically analyzes customer replies ("I will transfer ₹1.4L by Aug 25") to extract payment dates and confidence scores.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-indigo-600">
              Structured Dates & Confidence <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Automated Escalation Scheduler</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sends progressive WhatsApp & Email reminders at configurable cooldown intervals (Touch 1, 2, and 3).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-amber-600">
              Cooldown & Touch Limits <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Razorpay Webhook Verification</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Prevents unverified text claims ("already paid") from prematurely closing invoices until real payment events trigger.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-emerald-600">
              Closed-Loop Protection <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Audit-Trail & Human Queue</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every prompt, response, and status update is logged with exact timestamps. Invoices exceeding max touches route to humans.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-purple-600">
              Full Audit Traceability <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SOLUTIONS */}
      <section id="solutions" className="py-20 px-6 bg-white border-y border-gray-200/70 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Tailored Workflows
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Solutions Designed for Modern Teams
            </h2>
            <p className="text-gray-600 text-base">
              Whether you are managing 10 B2B clients or thousands of monthly invoices, SmartInvoice adapts to your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Solution 1 */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Briefcase className="w-32 h-32" />
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-3">For B2B Finance & AR Teams</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Eliminate spreadsheet chaos and manual telephone follow-ups. Set automated rules that respect customer relationships while keeping cash flow predictable.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Reduced DSO (Days Sales Outstanding)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Automatic promise date tracking
                </li>
              </ul>
            </div>

            {/* Solution 2 */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Building2 className="w-32 h-32" />
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 border border-purple-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-3">For High-Growth SaaS & Agencies</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Automate invoice reminders via WhatsApp and Email as your client base expands without expanding headcount.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Zero manual reminder effort
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Direct Razorpay payment links
                </li>
              </ul>
            </div>

            {/* Solution 3 */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Users className="w-32 h-32" />
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Enterprise Collections</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Strict compliance logging, role-based access control, and seamless human escalation routing for complex accounts.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Complete timestamped audit trail
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Human review queue triggers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PRICING */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Simple Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Transparent Plans for Every Growth Stage
          </h2>
          <p className="text-gray-600 text-base">
            Start free, explore with mock data, and scale your automated recovery as your revenue grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Starter Plan */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Free Starter</h3>
              <p className="text-xs text-gray-500 mb-6">Perfect for testing & small portfolios</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-gray-900">₹0</span>
                <span className="text-xs text-gray-500 ml-2">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-gray-700 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Up to 50 active invoices
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Gemini LLM promise extraction
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Email & WhatsApp nudges
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Audit log tracking
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenAuth && onOpenAuth('sign-up')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold text-xs transition"
            >
              Get Started Free
            </button>
          </div>

          {/* Growth Pro Plan (Highlighted) */}
          <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white rounded-3xl p-8 shadow-2xl border border-indigo-500/50 flex flex-col justify-between relative transform md:-translate-y-2">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Growth Pro</h3>
              <p className="text-xs text-indigo-200 mb-6">For growing businesses & active AR teams</p>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-white">₹2,499</span>
                <span className="text-xs text-indigo-300 ml-2">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-indigo-100 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Unlimited active invoices
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Razorpay webhook real-time sync
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Custom WhatsApp nudge templates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Advanced escalation rules
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Priority human queue routing
                </li>
              </ul>
            </div>
            <button
              onClick={onTryDemo}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              Try Pro Features in Demo
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Enterprise</h3>
              <p className="text-xs text-gray-500 mb-6">Custom integration & ERP support</p>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-extrabold text-gray-900">Custom</span>
              </div>
              <ul className="space-y-3 text-xs text-gray-700 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Dedicated account manager
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Tally / SAP / ERP connectors
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> Custom SLA & security audit
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> On-premise deployment option
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenAuth && onOpenAuth('sign-in')}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs transition"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION BANNER */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full relative z-10 mb-12">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-indigo-900/60 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Automate Your Payment Recovery?
            </h2>
            <p className="text-indigo-200/90 text-sm sm:text-base font-medium">
              Join modern finance teams recovering unpaid receivables 3x faster with AI promise tracking.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <button
                onClick={onTryDemo}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition"
              >
                Launch Demo Dashboard
              </button>
              <button
                onClick={() => onOpenAuth && onOpenAuth('sign-up')}
                className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-900 px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200/60 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-gray-800">SmartInvoice Promise-to-Pay Tracker</span>
          </div>
          <div>
            Razorpay Track 03 • AI Revenue Recovery & Closed-Loop Engine
          </div>
          <div>
            © {new Date().getFullYear()} SmartInvoice. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
