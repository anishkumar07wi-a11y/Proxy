'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Map, 
  Compass, 
  Award, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  Lock,
  Search,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';
import Link from 'next/link';

export default function LandingPage() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isIframe, setIsIframe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkAdminStatus = async (email: string | undefined) => {
    if (!email) return;
    try {
      const response = await fetch(`/api/auth/status?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      }
    } catch (err) {
      console.error('Failed to verify admin status:', err);
    }
  };

  useEffect(() => {
    // Detect iframe context asynchronously to avoid synchronous setState inside render loop
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        setIsIframe(window.self !== window.top);
      }, 0);
    }

    const supabase = getSupabaseClient();
    
    // Fetch initial session
    supabase.auth.getSession().then((res: any) => {
      const currentSession = res.data?.session;
      setSession(currentSession);
      if (currentSession?.user) {
        checkAdminStatus(currentSession.user.email);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, currentSession: any) => {
      setSession(currentSession);
      if (currentSession?.user) {
        checkAdminStatus(currentSession.user.email);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMsg(null);
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err.message);
      setErrorMsg(err.message || 'Failed to initiate Google login');
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  const faqs = [
    {
      question: "What is Proxy?",
      answer: "Proxy is a premium, all-in-one engineering student platform designed to consolidate scattered study resources (notes, syllabus, previous year papers, learning paths) from WhatsApp groups, Telegram chats, and Google Drives into a single, structured workspace."
    },
    {
      question: "How do I access study resources for my college?",
      answer: "Once logged in with your Google account, you can select your College, Branch, Semester, and Subject. You'll immediately find modules, highly structured notes, and past exam papers available for instant in-browser PDF preview and download."
    },
    {
      question: "What are curated Learning Paths?",
      answer: "Learning Paths are career-oriented technical roadmaps hand-curated by Admins. They guide you step-by-step through core technologies like Programming (C, C++, Java, JS/TS), React, Next.js, Machine Learning, and Career preparation (LinkedIn, GitHub) with links to official docs, curated projects, and YouTube courses."
    },
    {
      question: "Can I showcase my projects and achievements on Proxy?",
      answer: "Yes! Students can submit their GitHub repository, LinkedIn profile, portfolio links, and write-ups of achievements to the Community Showcase. Once reviewed and approved by the Admin, your work will be visible to everyone on the platform."
    },
    {
      question: "Is Proxy completely free?",
      answer: "Yes, Proxy is built specifically for college students and is entirely free to use. All resources are uploaded by verified administrators to maintain high quality and correctness."
    }
  ];

  const colleges = [
    'SMVITM', 'MIT Manipal', 'MITE', 'RV College of Engineering',
    'Dayananda Sagar College of Engineering', 'Dr. Ambedkar Institute of Technology',
    'KS School of Engineering and Management', 'NIE Mysuru',
    'Rajarajeshwari College of Engineering', 'ACS College of Engineering'
  ];

  return (
    <div id="landing-root" className="min-h-screen bg-black text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden font-sans">
      
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/25 via-black to-black -z-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-700/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Proxy</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#colleges" className="hover:text-white transition-colors">Colleges</a>
            <a href="#paths" className="hover:text-white transition-colors">Learning Paths</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <a 
              href="https://chat.whatsapp.com/IQBtBYi2Vj1A0UwxXOBE09"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-2 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full px-4 py-1.5 transition-all duration-300"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Community</span>
            </a>

            {session ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="inline-flex items-center space-x-1.5 text-sm font-semibold bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-lg transition-all"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center space-x-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50"
              >
                {isLoggingIn ? 'Redirecting...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Frame / IFrame warning */}
      {isIframe && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-amber-950/20 border border-amber-500/20 text-amber-300 rounded-lg p-3 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Note on Sandbox Preview:</strong> Google Login redirect flows are restricted in embedded sandboxes. For the best authentication experience, click the <strong>&quot;Open in New Tab&quot;</strong> icon at the top right of the screen!
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Everything an Engineering Student Needs. One Platform.</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none"
        >
          Stop searching. <br className="hidden sm:inline" />
          Start <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 bg-clip-text text-transparent">excelling in engineering</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Consolidating lecture notes, syllabus matrices, question papers, and high-impact learning paths into a single premium SaaS experience. Built for students, curated by experts.
        </motion.p>

        {errorMsg && (
          <div className="max-w-md mx-auto mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {session ? (
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xl shadow-indigo-600/30 transition-all duration-300"
            >
              <span>Go to Your Workspace</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 bg-white hover:bg-slate-200 text-black font-semibold rounded-lg shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          <a
            href="https://chat.whatsapp.com/IQBtBYi2Vj1A0UwxXOBE09"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-slate-800 hover:border-slate-700 font-semibold rounded-lg transition-all duration-300"
          >
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>Join WhatsApp Community</span>
          </a>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">Consolidated Study Workspace</h2>
          <p className="mt-4 text-slate-400">Everything is organized logically. No more scanning endless group messages or looking for missing PDFs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Structured Notes</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Find notes categorized meticulously by College &rarr; Branch &rarr; Semester &rarr; Subject &rarr; Module.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Previous Papers</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Access curated archives of previous years&apos; question papers and syllabus blueprints for seamless exam preparation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Learning Paths</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Go beyond academics. Master skills like Next.js, Machine Learning, embedded design, and build strong professional portfolios.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Student Showcase</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Submit your open-source projects, achievements, and LinkedIn updates. Get evaluated and approved by Admin to inspire peers.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Colleges Section */}
      <section id="colleges" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-450">Expanding Network</span>
          <h2 className="text-3xl font-display font-bold text-white mt-2">Supported Engineering Colleges</h2>
          <p className="mt-2 text-slate-450 text-sm">Providing resources across prominent technological institutes.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {colleges.map((college, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-xl bg-slate-950/20 border border-slate-900/60 hover:bg-slate-900/40 hover:border-slate-850 flex items-center justify-center text-center transition-all group"
            >
              <div className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                {college}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Paths Section */}
      <section id="paths" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl font-display font-bold text-white">Curated Learning Roads</h2>
            <p className="mt-2 text-slate-400 max-w-2xl">Structured paths verified by industry engineers. Skip standard courses and go straight to docs and projects.</p>
          </div>
          <a 
            href="#landing-root" 
            onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}
            className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <span>Explore all paths</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-950/20 border border-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Beginner</span>
                <span className="text-xs text-slate-500 font-mono">15 Hours</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Modern Git & GitHub</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">Master version control, branches, PRs, and build a beautiful landing portfolio page to demonstrate competence.</p>
            </div>
            <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Roadmap, Official Docs, Projects</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-950/20 border border-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">Intermediate</span>
                <span className="text-xs text-slate-500 font-mono">4 Weeks</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Full-stack React & Next.js</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">Transition from vanilla JavaScript to server components, client interactivity, robust routing, and API integration.</p>
            </div>
            <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Next.js Docs, Git Repo, Videos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-950/20 border border-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">Advanced</span>
                <span className="text-xs text-slate-500 font-mono">8 Weeks</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI & Machine Learning</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">Understand core mathematical frameworks, regression models, neural layers, and construct real image-classification pipelines.</p>
            </div>
            <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Math Prep, Jupyter Projects</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 py-24 border-t border-white/5">
        <h2 className="text-3xl font-display font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="rounded-xl border border-slate-900 bg-slate-950/30 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between text-white font-medium hover:bg-slate-900/25 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-450 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="p-5 border-t border-slate-900 text-sm text-slate-400 leading-relaxed bg-black/10">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic CTA Footer Section */}
      <footer className="bg-slate-950/60 border-t border-slate-900 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-slate-900">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  P
                </div>
                <span className="text-lg font-bold text-white">Proxy</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Empowering engineering students with elegant, centralized study tools. Everything in one place, so you can study efficiently and launch high-impact careers.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Course Notes</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Previous Year Papers</a></li>
                <li><a href="#paths" className="hover:text-white transition-colors">Learning Path Blueprints</a></li>
                <li><a href="#landing-root" onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }} className="hover:text-white transition-colors">Student Submissions</a></li>
              </ul>
            </div>

            <div className="flex flex-col justify-between items-start">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Join the Movement</h4>
                <p className="text-xs text-slate-500 mb-4">Coordinate updates, schedule exam peer-prep, and share materials inside our group.</p>
              </div>
              
              <a 
                href="https://chat.whatsapp.com/IQBtBYi2Vj1A0UwxXOBE09"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm bg-emerald-500 text-black hover:bg-emerald-400 font-bold px-5 py-2.5 rounded-lg transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Join WhatsApp Community</span>
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600">
            <div>
              &copy; {new Date().getFullYear()} Proxy Platform. All rights reserved. Ex-Google / Ex-Vercel inspired interface craft.
            </div>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <span className="hover:text-slate-400 transition-colors pointer-events-none">Terms of Use</span>
              <span className="hover:text-slate-400 transition-colors pointer-events-none">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
