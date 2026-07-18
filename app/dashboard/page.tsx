'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Map, 
  Award, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  Lock,
  Search,
  MessageSquare,
  AlertCircle,
  Folder,
  FileText,
  Plus,
  LogOut,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  User,
  Github,
  Linkedin,
  Globe,
  Upload,
  Check
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';
import Link from 'next/link';

type TabType = 'dashboard' | 'resources' | 'papers' | 'paths' | 'showcase';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Database selections
  const [colleges, setColleges] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);

  // Selection states
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  // Form submit state
  const [showcaseForm, setShowcaseForm] = useState({
    title: '',
    description: '',
    github_link: '',
    linkedin_link: '',
    portfolio_link: '',
    achievements: ''
  });
  const [submittingShowcase, setSubmittingShowcase] = useState(false);
  const [showcaseMessage, setShowcaseMessage] = useState<string | null>(null);

  // Profile update form (for colleges/branches first time setup)
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({
    college: '',
    branch: '',
    semester: 1
  });

  // Global search & general stats
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Fetch or Synchronize student profile
  async function fetchOrCreateProfile(currUser: any) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create profile if missing
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: currUser.id,
            full_name: currUser.user_metadata?.full_name || currUser.user_metadata?.name || 'Engineering Student',
            email: currUser.email,
            avatar_url: currUser.user_metadata?.avatar_url || currUser.user_metadata?.picture || '',
            semester: 1
          })
          .select()
          .single();

        if (newProfile) {
          setProfile(newProfile);
          if (!newProfile.college || !newProfile.branch) {
            setShowProfileSetup(true);
          }
        }
      } else if (data) {
        setProfile(data);
        if (!data.college || !data.branch) {
          setShowProfileSetup(true);
        }
      }
    } catch (err) {
      console.error('Profile synchronization error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadColleges() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('colleges').select('*').order('name');
    if (data) setColleges(data);
  }

  async function loadLearningPaths() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('learning_paths').select('*').order('created_at', { ascending: false });
    if (data) setLearningPaths(data);
  }

  async function loadShowcases() {
    const supabase = getSupabaseClient();
    // Only approved showcases
    const { data } = await supabase
      .from('community_showcase')
      .select('*, profiles(full_name, avatar_url, college, branch)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (data) setShowcases(data);
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Check session
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      if (session?.user) {
        setUser(session.user);
        fetchOrCreateProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        fetchOrCreateProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Load static data asynchronously to avoid synchronous setState inside the effect thread
    Promise.resolve().then(() => {
      loadColleges();
      loadLearningPaths();
      loadShowcases();
    });

    return () => subscription.unsubscribe();
  }, []);


  // Cascade events
  const handleCollegeSelect = async (college: any) => {
    setSelectedCollege(college);
    setSelectedBranch(null);
    setSelectedSemester(null);
    setSelectedSubject(null);
    setBranches([]);
    setSemesters([]);
    setSubjects([]);

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('branches')
      .select('*')
      .eq('college_id', college.id)
      .order('name');
    if (data) setBranches(data);
  };

  const handleBranchSelect = async (branch: any) => {
    setSelectedBranch(branch);
    setSelectedSemester(null);
    setSelectedSubject(null);
    setSemesters([]);
    setSubjects([]);

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('semesters')
      .select('*')
      .eq('branch_id', branch.id)
      .order('number');
    if (data) setSemesters(data);
  };

  const handleSemesterSelect = async (semester: any) => {
    setSelectedSemester(semester);
    setSelectedSubject(null);
    setSubjects([]);

    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('semester_id', semester.id)
      .order('name');
    if (data) setSubjects(data);
  };

  const handleSubjectSelect = async (subject: any) => {
    setSelectedSubject(subject);
    const supabase = getSupabaseClient();
    
    // Load notes
    const { data: notesData } = await supabase
      .from('Notes')
      .select('*')
      .eq('subject_id', subject.id)
      .order('module_number');
    if (notesData) setNotes(notesData);

    // Load papers
    const { data: papersData } = await supabase
      .from('previous-papers')
      .select('*')
      .eq('subject_id', subject.id)
      .order('year', { ascending: false });
    if (papersData) setPapers(papersData);
  };

  // Complete first-time profile settings
  const handleSaveSetup = async () => {
    if (!setupForm.college || !setupForm.branch) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          college: setupForm.college,
          branch: setupForm.branch,
          semester: Number(setupForm.semester)
        })
        .eq('id', user.id);

      if (!error) {
        setProfile({
          ...profile,
          college: setupForm.college,
          branch: setupForm.branch,
          semester: Number(setupForm.semester)
        });
        setShowProfileSetup(false);
      }
    } catch (err) {
      console.error('Failed to update profile details:', err);
    }
  };

  // Submit showcase handler
  const handleShowcaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showcaseForm.title || !showcaseForm.description) return;
    try {
      setSubmittingShowcase(true);
      setShowcaseMessage(null);
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('community_showcase')
        .insert({
          student_id: user.id,
          title: showcaseForm.title,
          description: showcaseForm.description,
          github_link: showcaseForm.github_link,
          linkedin_link: showcaseForm.linkedin_link,
          portfolio_link: showcaseForm.portfolio_link,
          achievements: showcaseForm.achievements,
          status: 'pending'
        });

      if (error) throw error;

      setShowcaseMessage('Success! Your project showcase was submitted and is pending Admin approval.');
      setShowcaseForm({
        title: '',
        description: '',
        github_link: '',
        linkedin_link: '',
        portfolio_link: '',
        achievements: ''
      });
    } catch (err: any) {
      console.error('Showcase submission failed:', err);
      setShowcaseMessage(err.message || 'Submission failed. Please check inputs.');
    } finally {
      setSubmittingShowcase(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Filter paths/notes globally based on Search
  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(globalSearchQuery.toLowerCase()));
  const filteredPapers = papers.filter(p => p.title.toLowerCase().includes(globalSearchQuery.toLowerCase()));
  const filteredPaths = learningPaths.filter(lp => lp.topic.toLowerCase().includes(globalSearchQuery.toLowerCase()));

  // Download logic using Supabase Storage public URL
  const handleDownloadFile = async (bucket: string, filePath: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

 const handlePreviewFile = async (bucket: string, filePath: string) => {
  try {
    const supabase = getSupabaseClient();

    console.log("Bucket:", bucket);
    console.log("Path:", filePath);

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log("URL:", data.publicUrl);

    setPreviewPdfUrl(data.publicUrl);
  } catch (err) {
    console.error(err);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono tracking-widest text-slate-500">SYNCHRONIZING SECURE TUNNEL...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950/80 border border-white/5 p-8 rounded-3xl text-center backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-450 text-sm mb-6">You must be logged in to access the engineering dashboard.</p>
          <Link href="/" className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-all">
            <span>Return to Landing Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans flex overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md flex flex-col h-screen sticky top-0 flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            P
          </Link>
          <span className="text-xl font-bold tracking-tight text-white font-display">Proxy</span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 ml-auto">STUDENT</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">Academic</div>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'dashboard' ? 'bg-indigo-400' : 'bg-transparent'}`}></div>
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'resources' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'resources' ? 'bg-indigo-400' : 'bg-transparent'}`}></div>
            <span className="text-sm font-medium">Study Notes</span>
          </button>

          <button 
            onClick={() => setActiveTab('papers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'papers' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'papers' ? 'bg-indigo-400' : 'bg-transparent'}`}></div>
            <span className="text-sm font-medium">Previous Papers</span>
          </button>

          <div className="pt-8 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">Growth</div>
          
          <button 
            onClick={() => setActiveTab('paths')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'paths' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'paths' ? 'bg-purple-400' : 'bg-transparent'}`}></div>
            <span className="text-sm font-medium">Learning Paths</span>
          </button>

          <button 
            onClick={() => setActiveTab('showcase')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'showcase' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'showcase' ? 'bg-green-400' : 'bg-transparent'}`}></div>
            <span className="text-sm font-medium">Community Showcase</span>
          </button>
        </nav>

        {/* WhatsApp Sidebar Promo Banner - Artistic Flair layout style */}
        <div className="p-4 border-t border-white/5">
          <a 
            href="https://chat.whatsapp.com/IQBtBYi2Vj1A0UwxXOBE09" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all duration-300"
          >
            <div>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp Club</span>
              </p>
              <p className="text-[10px] text-emerald-400/70">Join 450+ engineers</p>
            </div>
            <div className="text-emerald-400 group-hover:translate-x-1 transition-transform font-bold">&rarr;</div>
          </a>
        </div>

        {/* Logged User Info footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full border border-indigo-500/30 overflow-hidden bg-slate-800 flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                  {profile?.full_name?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Engineering Student'}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-tight truncate">{profile?.college || 'No college set'}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Global Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
          <div className="relative flex-1 max-w-xl group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Global Search notes, papers, or roadmaps..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{profile?.full_name || 'Alex Rivera'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                {profile?.college || 'MIT Manipal'} • {profile?.branch || 'CSE'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-indigo-500/30 p-0.5 bg-gradient-to-b from-indigo-500 to-purple-500">
              <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white bg-slate-850">
                    {profile?.full_name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab Views */}
        <div className="flex-1 p-8">
          
          <AnimatePresence mode="wait">
            
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Welcome Banner - Artistic Flair gradient layout */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-black border border-indigo-500/20 p-8 flex flex-col md:flex-row md:items-center justify-between">
                  <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-purple-500/10 blur-[120px] pointer-events-none rounded-full" />
                  
                  <div className="relative z-10 space-y-3">
                    <span className="text-2xs font-bold uppercase tracking-widest font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      Welcome Back
                    </span>
                    <h1 className="text-4xl font-display font-bold text-white tracking-tight">
                      Ready to build, {profile?.full_name?.split(' ')[0] || 'Engineer'}?
                    </h1>
                    <p className="text-indigo-200/60 max-w-lg text-sm leading-relaxed">
                      Access premium, centralized engineering resources across your syllabus. Study with curated roadmap pathways and showcase your open-source projects.
                    </p>
                    <div className="flex items-center gap-4 pt-3">
                      <button 
                        onClick={() => setActiveTab('resources')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-600/20 transition-all duration-300"
                      >
                        Browse Study Notes
                      </button>
                      <button 
                        onClick={() => setActiveTab('paths')}
                        className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/10 transition-all duration-300"
                      >
                        Explore Roadmaps
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 relative z-10 w-full md:w-80 bg-black/40 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono mb-4">Syllabus Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                          <span>College Assigned</span>
                          <span className="text-white truncate max-w-[150px]">{profile?.college || 'Not set'}</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                          <span>Branch & Sem</span>
                          <span className="text-white">{profile?.branch || 'Not set'} — Semester {profile?.semester || 1}</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[60%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Dashboard Stats & Previews row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Notes preview - Artistic Flair hover styles */}
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-bold text-indigo-400 tracking-wider">PDF STUDY NOTES</span>
                        <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h4 className="text-lg font-bold font-display text-white mb-2">Centralized Lecture Notes</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Say goodbye to random PDFs on chat groups. Access notes meticulously structured module-by-module.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('resources')}
                      className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-indigo-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Access Notes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Papers preview */}
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/30 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-bold text-purple-400 tracking-wider">PREVIOUS YEAR PAPERS</span>
                        <GraduationCap className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <h4 className="text-lg font-bold font-display text-white mb-2">Exam Blueprints & PYQs</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Practice with real previous year papers sorted cleanly by semester subject codes to clear exams with ease.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('papers')}
                      className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Browse Papers</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Showcase preview */}
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-green-500/30 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-bold text-green-400 tracking-wider">COMMUNITY WORK</span>
                        <Award className="w-4 h-4 text-slate-500 group-hover:text-green-400 transition-colors" />
                      </div>
                      <h4 className="text-lg font-bold font-display text-white mb-2">Student Project Showcase</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Submit and showcase your repositories, tech accomplishments, and portfolio to inspire or collaborate with peers.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('showcase')}
                      className="mt-6 w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-green-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View Community Showcases</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Info block for unconfigured profile warning */}
                {(!profile?.college || !profile?.branch) && (
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">Complete Profile setup</p>
                        <p className="text-xs text-slate-400">Add your college, branch, and current semester details to unlocked structured syllabus matching.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowProfileSetup(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-all"
                    >
                      Configure Now
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: STUDY RESOURCES */}
            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Study Resources Hub</h2>
                  <p className="text-sm text-slate-400">Centralized academic study notes, modules and course outcomes.</p>
                </div>

                {/* Cascading selectors section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white/2 border border-white/5 rounded-2xl">
                  {/* Select College */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">College</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        onChange={(e) => {
                          const col = colleges.find(c => c.id === e.target.value);
                          if (col) handleCollegeSelect(col);
                        }}
                        value={selectedCollege?.id || ''}
                      >
                        <option value="">Select College</option>
                        {colleges.map((col) => (
                          <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select Branch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Branch</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedCollege}
                      onChange={(e) => {
                        const br = branches.find(b => b.id === e.target.value);
                        if (br) handleBranchSelect(br);
                      }}
                      value={selectedBranch?.id || ''}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Semester */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Semester</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedBranch}
                      onChange={(e) => {
                        const sem = semesters.find(s => s.id === e.target.value);
                        if (sem) handleSemesterSelect(sem);
                      }}
                      value={selectedSemester?.id || ''}
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>Semester {s.number}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Subject</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedSemester}
                      onChange={(e) => {
                        const subj = subjects.find(sb => sb.id === e.target.value);
                        if (subj) handleSubjectSelect(subj);
                      }}
                      value={selectedSubject?.id || ''}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sb) => (
                        <option key={sb.id} value={sb.id}>{sb.name} ({sb.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Display list of modules and notes */}
                {selectedSubject ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold font-display text-white">Modules & Notes for {selectedSubject.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">Syllabus Code: {selectedSubject.code}</span>
                    </div>

                    {filteredNotes.length === 0 ? (
                      <div className="p-12 text-center bg-white/2 border border-white/5 rounded-2xl">
                        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-white">No Notes Found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Your Admin hasn&apos;t uploaded study modules for this subject yet. Please check back later!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNotes.map((note) => (
                          <div 
                            key={note.id} 
                            className="p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-bold text-indigo-400">
                                  MODULE {note.module_number}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white mb-1">{note.title}</h4>
                              <p className="text-xs text-slate-400 leading-relaxed mb-6">{note.description || 'Lecture module with specific class concepts and code illustrations.'}</p>
                            </div>

                            <div className="flex gap-2.5 mt-auto">
                              <button 
                                onClick={() => handlePreviewFile('Notes', note.file_path)}
                                className="flex-1 py-2 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 font-semibold text-xs rounded-lg transition-all"
                              >
                                Preview Notes
                              </button>
                              <button 
                                onClick={() => handleDownloadFile('Notes', note.file_path)}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                                title="Download Direct"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white/2 border border-white/5 rounded-2xl">
                    <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white">Select Academic Path Above</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Choose your College, Branch, Semester, and Subject to access structured lecture notes.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: PREVIOUS PAPERS */}
            {activeTab === 'papers' && (
              <motion.div
                key="papers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Previous Year Papers</h2>
                  <p className="text-sm text-slate-400">Clear end-semester exams using high-impact past exam patterns.</p>
                </div>

                {/* Cascade Selector for Papers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white/2 border border-white/5 rounded-2xl">
                  {/* Select College */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">College</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      onChange={(e) => {
                        const col = colleges.find(c => c.id === e.target.value);
                        if (col) handleCollegeSelect(col);
                      }}
                      value={selectedCollege?.id || ''}
                    >
                      <option value="">Select College</option>
                      {colleges.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Branch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Branch</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedCollege}
                      onChange={(e) => {
                        const br = branches.find(b => b.id === e.target.value);
                        if (br) handleBranchSelect(br);
                      }}
                      value={selectedBranch?.id || ''}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Semester */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Semester</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedBranch}
                      onChange={(e) => {
                        const sem = semesters.find(s => s.id === e.target.value);
                        if (sem) handleSemesterSelect(sem);
                      }}
                      value={selectedSemester?.id || ''}
                    >
                      <option value="">Select Semester</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>Semester {s.number}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">Subject</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedSemester}
                      onChange={(e) => {
                        const subj = subjects.find(sb => sb.id === e.target.value);
                        if (subj) handleSubjectSelect(subj);
                      }}
                      value={selectedSubject?.id || ''}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sb) => (
                        <option key={sb.id} value={sb.id}>{sb.name} ({sb.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Display papers list */}
                {selectedSubject ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold font-display text-white">PYQs for {selectedSubject.name}</h3>

                    {filteredPapers.length === 0 ? (
                      <div className="p-12 text-center bg-white/2 border border-white/5 rounded-2xl">
                        <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-white">No Papers Found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Your Admin hasn&apos;t uploaded question papers for this subject yet. Please check back later!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPapers.map((paper) => (
                          <div 
                            key={paper.id} 
                            className="p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-bold text-purple-400 font-mono">
                                  YEAR {paper.year}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white mb-2">{paper.title}</h4>
                              <p className="text-xs text-slate-400 mb-6 font-mono">Type: End-Semester Exam Paper</p>
                            </div>

                            <div className="flex gap-2.5 mt-auto">
                              <button 
                                onClick={() => handlePreviewFile('previous-papers', paper.file_path)}
                                className="flex-1 py-2 bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/20 text-purple-300 font-semibold text-xs rounded-lg transition-all"
                              >
                                Preview Paper
                              </button>
                              <button 
                                onClick={() => handleDownloadFile('previous-papers', paper.file_path)}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white/2 border border-white/5 rounded-2xl">
                    <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white">Select Academic Path Above</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Choose your College, Branch, Semester, and Subject to access previous year question papers.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: LEARNING PATHS */}
            {activeTab === 'paths' && (
              <motion.div
                key="paths"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Curated Learning Paths</h2>
                  <p className="text-sm text-slate-400">Step-by-step roadmaps from foundations to advanced full-stack engineering, verified by ex-Googlers.</p>
                </div>

                {filteredPaths.length === 0 ? (
                  <div className="p-16 text-center bg-white/2 border border-white/5 rounded-3xl">
                    <Map className="w-12 h-12 text-slate-650 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-white mb-1">No Custom Roads Curated</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">No custom learning pathways have been published by the Admin. However, master paths are coming soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPaths.map((path) => (
                      <div 
                        key={path.id} 
                        className="p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                              {path.difficulty}
                            </span>
                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{path.estimated_time}</span>
                            </span>
                          </div>
                          <h3 className="text-xl font-bold font-display text-white mb-2">{path.topic}</h3>
                          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{path.description}</p>
                          
                          {/* Project Idea section if present */}
                          {path.project_ideas && (
                            <div className="bg-black/20 border border-white/5 p-4 rounded-xl mb-6">
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Suggested Capstones</span>
                              </h5>
                              <p className="text-xs text-slate-450 leading-relaxed whitespace-pre-line">{path.project_ideas}</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/5">
                          {path.official_doc ? (
                            <a 
                              href={path.official_doc} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-lg text-center flex items-center justify-center gap-1"
                            >
                              <span>Official Docs</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <div className="py-2 bg-white/2 text-slate-600 text-xs rounded-lg text-center cursor-not-allowed">No Docs</div>
                          )}

                          {path.github_link ? (
                            <a 
                              href={path.github_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-lg text-center flex items-center justify-center gap-1"
                            >
                              <span>GitHub Code</span>
                              <Github className="w-3 h-3" />
                            </a>
                          ) : (
                            <div className="py-2 bg-white/2 text-slate-600 text-xs rounded-lg text-center cursor-not-allowed">No Repo</div>
                          )}

                          {path.youtube_link ? (
                            <a 
                              href={path.youtube_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="py-2 bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 font-bold text-xs rounded-lg text-center flex items-center justify-center gap-1"
                            >
                              <span>Watch Course</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <div className="py-2 bg-white/2 text-slate-600 text-xs rounded-lg text-center cursor-not-allowed">No Video</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: COMMUNITY SHOWCASE */}
            {activeTab === 'showcase' && (
              <motion.div
                key="showcase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-white mb-2">Community Showcase</h2>
                    <p className="text-sm text-slate-400">Discover and get inspired by peer projects, GitHub portfolios, and tech achievements.</p>
                  </div>
                  <span className="text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-3.5 py-1.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Peer-reviewed submissions only</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Submit showcase form */}
                  <div className="lg:col-span-1 bg-white/2 border border-white/5 p-6 rounded-2xl h-fit">
                    <h3 className="text-lg font-bold font-display text-white mb-2 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Showcase Your Project</span>
                    </h3>
                    <p className="text-xs text-slate-450 mb-6">Build your legacy. Submit your work. Admins review and publish accepted capstones.</p>

                    {showcaseMessage && (
                      <div className="mb-4 p-3 bg-indigo-950/20 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl">
                        {showcaseMessage}
                      </div>
                    )}

                    <form onSubmit={handleShowcaseSubmit} className="space-y-4">
                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider font-mono">Project Title *</label>
                        <input 
                          type="text" 
                          required
                          value={showcaseForm.title}
                          onChange={(e) => setShowcaseForm({...showcaseForm, title: e.target.value})}
                          placeholder="e.g. Blockchain Voting App"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider font-mono">Description *</label>
                        <textarea 
                          required
                          rows={3}
                          value={showcaseForm.description}
                          onChange={(e) => setShowcaseForm({...showcaseForm, description: e.target.value})}
                          placeholder="What makes this project special? Explain core technologies used..."
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider font-mono">GitHub Repository Link</label>
                        <input 
                          type="url"
                          value={showcaseForm.github_link}
                          onChange={(e) => setShowcaseForm({...showcaseForm, github_link: e.target.value})}
                          placeholder="https://github.com/username/repo"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider font-mono">LinkedIn Profile</label>
                          <input 
                            type="url"
                            value={showcaseForm.linkedin_link}
                            onChange={(e) => setShowcaseForm({...showcaseForm, linkedin_link: e.target.value})}
                            placeholder="https://linkedin.com/in/username"
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider font-mono">Portfolio Website</label>
                          <input 
                            type="url"
                            value={showcaseForm.portfolio_link}
                            onChange={(e) => setShowcaseForm({...showcaseForm, portfolio_link: e.target.value})}
                            placeholder="https://myportfolio.dev"
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-wider font-mono">Key Achievements (comma separated)</label>
                        <input 
                          type="text"
                          value={showcaseForm.achievements}
                          onChange={(e) => setShowcaseForm({...showcaseForm, achievements: e.target.value})}
                          placeholder="e.g. 1st Place Hackathon, 200+ Stars on GitHub"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={submittingShowcase}
                        className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                      >
                        {submittingShowcase ? 'Submitting secure details...' : 'Submit Showcase App'}
                      </button>
                    </form>
                  </div>

                  {/* List approved showcases */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold font-display text-white">Live Student Showcase</h3>

                    {showcases.length === 0 ? (
                      <div className="p-16 text-center bg-white/2 border border-white/5 rounded-3xl">
                        <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-white">Showcase is Empty</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Be the first to submit your outstanding engineering project! Fill out the form on the left to submit.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {showcases.map((sc) => (
                          <div 
                            key={sc.id} 
                            className="p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-green-500/30 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className="px-2.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold">
                                  APPROVED
                                </span>
                                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                              </div>

                              <h4 className="text-base font-bold text-white mb-1 font-display">{sc.title}</h4>
                              <p className="text-2xs text-slate-500 mb-4 font-mono">By {sc.profiles?.full_name || 'Anonymous student'}</p>
                              
                              <p className="text-xs text-slate-400 mb-6 leading-relaxed line-clamp-3">{sc.description}</p>
                              
                              {sc.achievements && (
                                <div className="space-y-1 mb-6">
                                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Achievements</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sc.achievements.split(',').map((ach: string, idx: number) => (
                                      <span key={idx} className="text-3xs px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono">
                                        {ach.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                              {sc.github_link ? (
                                <a 
                                  href={sc.github_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-350 text-2xs text-center font-bold flex items-center justify-center gap-1"
                                >
                                  <Github className="w-3 h-3" />
                                  <span>GitHub</span>
                                </a>
                              ) : (
                                <div className="py-1.5 bg-white/2 text-slate-650 text-2xs text-center rounded-lg cursor-not-allowed">No Code</div>
                              )}

                              {sc.linkedin_link ? (
                                <a 
                                  href={sc.linkedin_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-350 text-2xs text-center font-bold flex items-center justify-center gap-1"
                                >
                                  <Linkedin className="w-3 h-3" />
                                  <span>LinkedIn</span>
                                </a>
                              ) : (
                                <div className="py-1.5 bg-white/2 text-slate-650 text-2xs text-center rounded-lg cursor-not-allowed">No Profile</div>
                              )}

                              {sc.portfolio_link ? (
                                <a 
                                  href={sc.portfolio_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-350 text-2xs text-center font-bold flex items-center justify-center gap-1"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span>Portfolio</span>
                                </a>
                              ) : (
                                <div className="py-1.5 bg-white/2 text-slate-650 text-2xs text-center rounded-lg cursor-not-allowed">No Site</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Global Footer Meta */}
        <footer className="px-8 py-3 bg-black/40 border-t border-white/5 flex justify-between items-center mt-auto flex-shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Version 1.0.4 - Production</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Supabase Connected</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-600">© {new Date().getFullYear()} Proxy Engineering. All rights reserved.</div>
        </footer>
      </main>

      {/* PDF Secure Preview Drawer Modal */}
      <AnimatePresence>
        {previewPdfUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-5xl h-[85vh] bg-slate-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">Proxy PDF Secured Viewer</span>
                </div>
                <button 
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  Close Secure Panel
                </button>
              </div>
              <div className="flex-1 bg-[#101010] relative">
                <iframe 
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewPdfUrl)}&embedded=true`} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup College Profile Dialog */}
      <AnimatePresence>
        {showProfileSetup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-indigo-500/20 p-8 rounded-3xl text-center"
            >
              <GraduationCap className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold text-white mb-1">Set Up Your Profile</h3>
              <p className="text-xs text-slate-450 mb-6">Select your college and branch details to get curated syllabus study resources instantly.</p>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Select College *</label>
                  <select 
                    required
                    value={setupForm.college}
                    onChange={(e) => setSetupForm({...setupForm, college: e.target.value})}
                    className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose College</option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Select Branch / Department *</label>
                  <select 
                    required
                    value={setupForm.branch}
                    onChange={(e) => setSetupForm({...setupForm, branch: e.target.value})}
                    className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose Branch</option>
                    <option value="Computer Science Engineering">Computer Science (CSE)</option>
                    <option value="Information Science Engineering">Information Science (ISE)</option>
                    <option value="Electronics & Communication">Electronics (ECE)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
                    <option value="Civil Engineering">Civil Engineering (CV)</option>
                    <option value="Electrical & Electronics">Electrical Engineering (EEE)</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Current Semester *</label>
                  <select 
                    required
                    value={setupForm.semester}
                    onChange={(e) => setSetupForm({...setupForm, semester: Number(e.target.value)})}
                    className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleSaveSetup}
                  disabled={!setupForm.college || !setupForm.branch}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Academic Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
