'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Briefcase, Code2, Cpu, GraduationCap, Menu, MessageSquare, Rocket, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase-client';

const whatsapp = 'https://chat.whatsapp.com/IQBtBYi2Vj1A0UwxXOBE09';

export default function LandingPage() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.email) checkAdmin(data.session.user.email);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user?.email) checkAdmin(next.user.email); else setIsAdmin(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function checkAdmin(email: string) {
    try {
      const res = await fetch(`/api/auth/status?email=${encodeURIComponent(email)}`);
      if (res.ok) setIsAdmin((await res.json()).isAdmin === true);
    } catch {}
  }

  async function login() {
    setBusy(true);
    const supabase = getSupabaseClient();
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
  }

  async function signOut() {
    await getSupabaseClient().auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }

  const destination = isAdmin ? '/admin' : '/dashboard';
  const categories = [
    ['School & PUC', '10th, SSLC, 11th, 12th, PCMB and board exam resources', BookOpen],
    ['Engineering', 'VTU, autonomous colleges, ECE, CSE and practical projects', Cpu],
    ['BBA / BCA / B.Com', 'Commerce, management and computer application resources', GraduationCap],
    ['Pharmacy / Nursing / Medical', 'B.Pharm, D.Pharm, Nursing and medical-field study resources', ShieldCheck],
  ] as const;
  const features = [
    ['Academic Hub', 'Notes, previous papers, important questions, model papers, labs and syllabus.', BookOpen],
    ['Skills & Projects', 'AI, coding, ECE, embedded, IoT, VLSI, GitHub and hands-on projects.', Code2],
    ['Community', 'Learn with seniors, peers, professionals and mentors instead of studying alone.', Users],
    ['Career & Opportunities', 'Resume, LinkedIn, hackathons, startup exposure and opportunities when available.', Briefcase],
  ] as const;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,.18),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,.12),transparent_28%)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display font-black">H</div>
            <div><div className="font-display text-lg font-bold">Hub4Buddies</div><div className="hidden text-[10px] tracking-widest text-slate-500 sm:block">LEARN • BUILD • CONNECT • GROW</div></div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <a href="#academics" className="hover:text-white">Academics</a><a href="#skills" className="hover:text-white">Skills</a><a href="#community" className="hover:text-white">Community</a><a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Join Community</a>
            {session ? <><Link href={destination} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Dashboard</Link><button onClick={signOut} className="text-sm text-slate-400">Sign out</button></> : <button onClick={login} disabled={busy} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">{busy ? 'Opening…' : 'Sign in'}</button>}
          </div>
          <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
        {mobileOpen && <div className="border-t border-white/10 bg-black p-4 sm:hidden"><div className="grid gap-3"><a href="#academics" onClick={() => setMobileOpen(false)}>Academics</a><a href="#skills" onClick={() => setMobileOpen(false)}>Skills</a><a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp Community</a>{session ? <Link href={destination}>Dashboard</Link> : <button onClick={login} className="text-left">Sign in with Google</button>}</div></div>}
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-xs text-indigo-200"><Sparkles className="h-4 w-4"/>Built for students, by students</motion.div>
        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="mx-auto max-w-5xl font-display text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">Everything students need to <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">learn, build and grow.</span></motion.h1>
        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.15}} className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">One student community for academic resources, real skills, projects, mentors, hackathons and career exploration — without hunting through dozens of groups and drives.</motion.p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={session ? undefined : login} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-semibold text-black">{session ? <Link href={destination} className="flex items-center gap-2">Open your workspace <ArrowRight className="h-5 w-5"/></Link> : <>Start exploring <ArrowRight className="h-5 w-5"/></>}</button><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-semibold"><MessageSquare className="h-5 w-5 text-emerald-400"/>Join WhatsApp</a></div>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 text-left sm:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><b className="block text-2xl">7+</b><span className="text-xs text-slate-500">education areas</span></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><b className="block text-2xl">10+</b><span className="text-xs text-slate-500">resource types</span></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><b className="block text-2xl">∞</b><span className="text-xs text-slate-500">projects to build</span></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><b className="block text-2xl">1</b><span className="text-xs text-slate-500">student community</span></div></div>
      </section>

      <section id="academics" className="border-y border-white/5 bg-white/[.02] py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mb-10 max-w-2xl"><p className="text-sm font-semibold text-indigo-300">ACADEMIC HUB</p><h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your course. Your resources. One place.</h2><p className="mt-3 text-slate-400">The structure is designed to grow from school to professional courses instead of being locked to engineering.</p></div><div className="grid gap-4 md:grid-cols-2">{categories.map(([title,desc,Icon]) => <div key={title} className="rounded-2xl border border-white/10 bg-black/40 p-6 transition hover:border-indigo-400/30"><Icon className="h-6 w-6 text-indigo-300"/><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p></div>)}</div></div></section>

      <section id="skills" className="mx-auto max-w-7xl px-4 py-20 sm:px-6"><div className="grid gap-6 md:grid-cols-2">{features.map(([title,desc,Icon]) => <div key={title} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.05] to-transparent p-7"><Icon className="h-7 w-7 text-violet-300"/><h3 className="mt-6 font-display text-xl font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-400">{desc}</p></div>)}</div></section>

      <section id="community" className="bg-gradient-to-b from-indigo-950/20 to-transparent py-20"><div className="mx-auto max-w-4xl px-4 text-center sm:px-6"><Rocket className="mx-auto h-9 w-9 text-indigo-300"/><h2 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Learn → Build → Show → Connect → Opportunity</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">Good communities do more than share PDFs. Build something, show your work, meet people, get feedback and discover opportunities when they genuinely exist.</p><a href={whatsapp} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black">Join Hub4Buddies <ArrowRight className="h-4 w-4"/></a></div></section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6"><h2 className="font-display text-3xl font-bold">Simple answers</h2><div className="mt-8 space-y-3">{[['Is Hub4Buddies only for engineering?','No. The platform is being built for school, PUC, engineering, BBA, BCA, B.Com, pharmacy, nursing, medical and other student groups.'],['Are internships guaranteed?','No. We will never promise an internship just for joining. Opportunities are shared when there is a real opening and suitable eligibility.'],['Who can use it?','Students can sign in with Google and explore the resources and community features that are available.'],['Who manages academic uploads?','Admin-approved resources are managed through the platform. Community submissions such as showcases can be reviewed before appearing publicly.']].map(([q,a]) => <details key={q} className="group rounded-2xl border border-white/10 bg-white/[.03] p-5"><summary className="cursor-pointer list-none font-semibold">{q}</summary><p className="mt-3 leading-6 text-slate-400">{a}</p></details>)}</div></section>

      <footer className="border-t border-white/10 py-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><span className="font-semibold text-slate-300">Hub4Buddies</span> · Learn • Build • Connect • Grow</div><div>Student community • Academic resources • Skills • Projects • Careers</div></div></footer>
    </main>
  );
}
