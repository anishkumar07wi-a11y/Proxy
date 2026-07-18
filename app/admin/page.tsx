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
  Lock,
  Search,
  MessageSquare,
  AlertCircle,
  Folder,
  FileText,
  Plus,
  LogOut,
  Clock,
  Trash2,
  Upload,
  Check,
  X,
  BarChart3,
  Settings,
  Users,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';
import Link from 'next/link';

// Helper function defined outside of React component to avoid react-hooks/purity rules on Date.now()
function generateSanitizedFileName(originalName: string): string {
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `${timestamp}_${safeName}`;
}

type AdminTabType = 'analytics' | 'academic' | 'resources' | 'paths' | 'showcases';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTabType>('analytics');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Stats Counters
  const [stats, setStats] = useState({
    colleges: 0,
    branches: 0,
    subjects: 0,
    notes: 0,
    papers: 0,
    pendingShowcases: 0,
    users: 0
  });

  // Database Selectors & Lists
  const [colleges, setColleges] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Active subject selections
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedSemester, setSelectedSemester] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  // Active resource list
  const [notesList, setNotesList] = useState<any[]>([]);
  const [papersList, setPapersList] = useState<any[]>([]);
  const [pathsList, setPathsList] = useState<any[]>([]);
  const [showcasesList, setShowcasesList] = useState<any[]>([]);

  // Forms states
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newBranch, setNewBranch] = useState({ name: '', code: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });

  // Resource Upload Forms (Direct Supabase Storage integration!)
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    moduleNumber: 1
  });
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [paperForm, setPaperForm] = useState({
    title: '',
    year: new Date().getFullYear()
  });
  const [paperFile, setPaperFile] = useState<File | null>(null);

  // Learning Path Form
  const [pathForm, setPathForm] = useState({
    topic: '',
    description: '',
    difficulty: 'Beginner',
    estimatedTime: '',
    projectIdeas: '',
    officialDoc: '',
    githubLink: '',
    youtubeLink: ''
  });

  // Messaging & UI states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [dragOverBucket, setDragOverBucket] = useState<'notes' | 'papers' | null>(null);

  async function loadCoreAdminData() {
    try {
      const supabase = getSupabaseClient();
      
      // Load Colleges
      const { data: cols } = await supabase.from('colleges').select('*').order('name');
      if (cols) setColleges(cols);

      // Load Learning Paths
      const { data: paths } = await supabase.from('learning_paths').select('*').order('created_at', { ascending: false });
      if (paths) setPathsList(paths);

      // Load Showcase Applications
      const { data: showcases } = await supabase
        .from('community_showcase')
        .select('*, profiles(full_name, email, college, branch)')
        .order('created_at', { ascending: false });
      if (showcases) setShowcasesList(showcases);

      // Fetch analytics stats counters
      const [
        { count: countCols },
        { count: countBranches },
        { count: countSubjects },
        { count: countNotes },
        { count: countPapers },
        { count: countShowcases },
        { count: countUsers }
      ] = await Promise.all([
        supabase.from('colleges').select('*', { count: 'exact', head: true }),
        supabase.from('branches').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('Notes').select('*', { count: 'exact', head: true }),
        supabase.from('previous-papers').select('*', { count: 'exact', head: true }),
        supabase.from('community_showcase').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        colleges: countCols || 0,
        branches: countBranches || 0,
        subjects: countSubjects || 0,
        notes: countNotes || 0,
        papers: countPapers || 0,
        pendingShowcases: countShowcases || 0,
        users: countUsers || 0
      });

    } catch (err) {
      console.error('Data seeding or load issue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function checkAdminPrivileges(currUser: any) {
    try {
      if (!currUser || !currUser.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check via our secure server-side endpoint which matches against the ADMIN_EMAIL env variable
      const response = await fetch(`/api/auth/status?email=${encodeURIComponent(currUser.email)}`);
      if (response.ok) {
        const statusData = await response.json();
        if (statusData.isAdmin) {
          setIsAdmin(true);
          await loadCoreAdminData();
          return;
        }
      }

      // Local fallback in case API is temporarily unavailable
      const isLocalAdmin = currUser.email.trim().toLowerCase() === 'anishkumar.07wi@gmail.com';
      if (isLocalAdmin) {
        setIsAdmin(true);
        await loadCoreAdminData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Privilege verification failed, attempting email-match fallback:', err);
      const isLocalAdmin = currUser?.email?.trim().toLowerCase() === 'anishkumar.07wi@gmail.com';
      if (isLocalAdmin) {
        setIsAdmin(true);
        loadCoreAdminData();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Check if current user is admin
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      if (session?.user) {
        setUser(session.user);
        checkAdminPrivileges(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        checkAdminPrivileges(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // ---------------------------------------------
  // Academic setups
  // ---------------------------------------------
  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    try {
      setIsActionPending(true);
      setErrorMsg(null);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('colleges')
        .insert({ name: newCollegeName.trim() })
        .select()
        .single();

      if (error) throw error;
      setColleges([...colleges, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCollegeName('');
      setSuccessMsg('College node added successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add college.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege || !newBranch.name.trim() || !newBranch.code.trim()) return;
    try {
      setIsActionPending(true);
      setErrorMsg(null);
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('branches')
        .insert({
          college_id: selectedCollege.id,
          name: newBranch.name.trim(),
          code: newBranch.code.trim().toUpperCase()
        })
        .select()
        .single();

      if (error) throw error;
      setBranches([...branches, data].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Auto seed semesters 1-8 for this branch for standard college compliance
      const semesterInserts = [1, 2, 3, 4, 5, 6, 7, 8].map(num => ({
        branch_id: data.id,
        number: num
      }));
      await supabase.from('semesters').insert(semesterInserts);

      setNewBranch({ name: '', code: '' });
      setSuccessMsg('Branch added and 8 corresponding semesters successfully initialized!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add branch.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSemester || !newSubject.name.trim() || !newSubject.code.trim()) return;
    try {
      setIsActionPending(true);
      setErrorMsg(null);
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('subjects')
        .insert({
          semester_id: selectedSemester.id,
          name: newSubject.name.trim(),
          code: newSubject.code.trim().toUpperCase()
        })
        .select()
        .single();

      if (error) throw error;
      setSubjects([...subjects, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubject({ name: '', code: '' });
      setSuccessMsg('Subject node added correctly.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add subject.');
    } finally {
      setIsActionPending(false);
    }
  };

  // ---------------------------------------------
  // Cascade loads
  // ---------------------------------------------
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
    loadSubjectResources(subject.id);
  };

  const loadSubjectResources = async (subjectId: string) => {
    const supabase = getSupabaseClient();
    
    const { data: notes } = await supabase
      .from('Notes')
      .select('*')
      .eq('subject_id', subjectId)
      .order('module_number');
    if (notes) setNotesList(notes);

    const { data: papers } = await supabase
      .from('previous-papers')
      .select('*')
      .eq('subject_id', subjectId)
      .order('year', { ascending: false });
    if (papers) setPapersList(papers);
  };

  // ---------------------------------------------
  // Real File upload and storage logic
  // ---------------------------------------------
  const handleNoteUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !noteFile || !noteForm.title) return;
    try {
      setIsActionPending(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const supabase = getSupabaseClient();

      // 1. Upload PDF to Storage bucket 'notes'
      const sanitizedName = generateSanitizedFileName(noteFile.name);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Notes')
        .upload(sanitizedName, noteFile);

      if (uploadError) throw uploadError;

      // 2. Write note details to DB
      const { error: dbError } = await supabase
        .from('Notes')

        .insert({
          subject_id: selectedSubject.id,
          title: noteForm.title,
          description: noteForm.description,
          module_number: noteForm.moduleNumber,
          file_path: uploadData.path
        });

      if (dbError) throw dbError;

      setNoteForm({ title: '', description: '', moduleNumber: 1 });
      setNoteFile(null);
      setSuccessMsg('Note PDF uploaded successfully and bound to module!');
      loadSubjectResources(selectedSubject.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload note PDF.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handlePaperUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !paperFile || !paperForm.title) return;
    try {
      setIsActionPending(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const supabase = getSupabaseClient();

      // 1. Upload paper PDF to Storage bucket 'papers'
      const sanitizedName = generateSanitizedFileName(paperFile.name);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('previous-papers')
        .upload(sanitizedName, paperFile);

      if (uploadError) throw uploadError;

      // 2. Write details to DB
      const { error: dbError } = await supabase
        .from('previous-papers')
        .insert({
          subject_id: selectedSubject.id,
          title: paperForm.title,
          year: Number(paperForm.year),
          file_path: uploadData.path
        });

      if (dbError) throw dbError;

      setPaperForm({ title: '', year: new Date().getFullYear() });
      setPaperFile(null);
      setSuccessMsg('Previous paper uploaded successfully!');
      loadSubjectResources(selectedSubject.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload paper.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Drag and Drop files support
  const handleDragOver = (e: React.DragEvent, bucket: 'notes' | 'papers') => {
    e.preventDefault();
    setDragOverBucket(bucket);
  };

  const handleDrop = (e: React.DragEvent, bucket: 'notes' | 'papers') => {
    e.preventDefault();
    setDragOverBucket(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        if (bucket === 'notes') setNoteFile(file);
        else setPaperFile(file);
      } else {
        setErrorMsg('Only secure PDF documents are supported for upload.');
      }
    }
  };

  // ---------------------------------------------
  // Delete Resources logic
  // ---------------------------------------------
  const handleDeleteNote = async (note: any) => {
    if (!confirm(`Are you sure you want to delete note: ${note.title}?`)) return;
    try {
      setIsActionPending(true);
      const supabase = getSupabaseClient();
      
      // Remove physical file from Storage
      await supabase.storage.from('Notes').remove([note.file_path]);
      
      // Remove DB row
      const { error } = await supabase.from('Notes').delete().eq('id', note.id);
      if (error) throw error;

      setSuccessMsg('Note removed successfully.');
      if (selectedSubject) loadSubjectResources(selectedSubject.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete note.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeletePaper = async (paper: any) => {
    if (!confirm(`Are you sure you want to delete paper: ${paper.title}?`)) return;
    try {
      setIsActionPending(true);
      const supabase = getSupabaseClient();
      
      // Remove from Storage
      await supabase.storage.from('previous-papers').remove([paper.file_path]);

      // Remove row
      const { error } = await supabase.from('previous-papers').delete().eq('id', paper.id);
      if (error) throw error;

      setSuccessMsg('Paper removed successfully.');
      if (selectedSubject) loadSubjectResources(selectedSubject.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete paper.');
    } finally {
      setIsActionPending(false);
    }
  };

  // ---------------------------------------------
  // Learning Paths curate
  // ---------------------------------------------
  const handleAddPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathForm.topic || !pathForm.description) return;
    try {
      setIsActionPending(true);
      setErrorMsg(null);
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('learning_paths')
        .insert({
          topic: pathForm.topic,
          description: pathForm.description,
          difficulty: pathForm.difficulty,
          estimated_time: pathForm.estimatedTime,
          project_ideas: pathForm.projectIdeas,
          official_doc: pathForm.officialDoc,
          github_link: pathForm.githubLink,
          youtube_link: pathForm.youtubeLink
        })
        .select()
        .single();

      if (error) throw error;
      setPathsList([data, ...pathsList]);
      setPathForm({
        topic: '',
        description: '',
        difficulty: 'Beginner',
        estimatedTime: '',
        projectIdeas: '',
        officialDoc: '',
        githubLink: '',
        youtubeLink: ''
      });
      setSuccessMsg('Learning path compiled and published to students dashboard!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to curate learning path.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeletePath = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learning path?')) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('learning_paths').delete().eq('id', id);
      if (error) throw error;
      setPathsList(pathsList.filter(p => p.id !== id));
      setSuccessMsg('Learning path deleted.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete learning path.');
    }
  };

  // ---------------------------------------------
  // Showcases manage
  // ---------------------------------------------
  const handleApproveShowcase = async (sc: any) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('community_showcase')
        .update({ status: 'approved' })
        .eq('id', sc.id);

      if (error) throw error;
      
      setSuccessMsg(`Showcase: "${sc.title}" has been successfully approved and is live!`);
      // Update local state
      setShowcasesList(showcasesList.map(item => item.id === sc.id ? { ...item, status: 'approved' } : item));
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval update failed.');
    }
  };

  const handleDeleteShowcase = async (id: string) => {
    if (!confirm('Are you sure you want to remove this showcase item?')) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('community_showcase').delete().eq('id', id);
      if (error) throw error;
      setShowcasesList(showcasesList.filter(item => item.id !== id));
      setSuccessMsg('Showcase item deleted correctly.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete showcase.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono tracking-widest text-slate-500">AUTHORIZING SECURE CREDENTIALS...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950/80 border border-red-500/20 p-8 rounded-3xl text-center backdrop-blur-xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Access Restrained</h2>
          <p className="text-slate-450 text-sm mb-6">This administrative workspace is reserved solely for verified platform curators. If you believe this is an error, check your user profile.</p>
          <Link href="/dashboard" className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-all">
            <span>Go back to Student Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans flex overflow-hidden">
      
      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md flex flex-col h-screen sticky top-0 flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            P
          </Link>
          <span className="text-xl font-bold tracking-tight text-white font-display">Proxy</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">ADMIN</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">Overview</div>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'analytics' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Platform Stats</span>
          </button>

          <div className="pt-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 px-2">Data Matrix</div>

          <button 
            onClick={() => setActiveTab('academic')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'academic' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Academic Nodes</span>
          </button>

          <button 
            onClick={() => setActiveTab('resources')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'resources' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Resource Manager</span>
          </button>

          <button 
            onClick={() => setActiveTab('paths')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'paths' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <Map className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Roadmaps Curator</span>
          </button>

          <button 
            onClick={() => setActiveTab('showcases')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'showcases' 
                ? 'bg-white/5 text-white border border-white/10' 
                : 'text-slate-450 hover:text-white hover:bg-white/2 transition-colors'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Project Showcases</span>
          </button>
        </nav>

        {/* Admin actions / return link */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <Link 
            href="/dashboard"
            className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-xl font-medium text-xs text-center block transition-all"
          >
            Student Dashboard
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium text-xs text-center transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel View */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold tracking-tight text-white">Proxy Centralized Control Panel</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 font-bold font-mono px-3 py-1 rounded-full">
              SECURE ADMIN PROTOCOL ACTIVE
            </span>
          </div>
        </header>

        {/* Message banners */}
        {(errorMsg || successMsg) && (
          <div className="mx-8 mt-6">
            {errorMsg && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-white/5 rounded"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center justify-between">
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-white/5 rounded"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        )}

        {/* Tab body content */}
        <div className="flex-1 p-8">
          
          <AnimatePresence mode="wait">
            
            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Platform Performance Metrics</h2>
                  <p className="text-sm text-slate-400 font-mono">LIVE DATABASE TELEMETRY</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Colleges Counter */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Colleges Integrated</span>
                    <p className="text-4xl font-extrabold text-white mt-2 font-display">{stats.colleges}</p>
                  </div>

                  {/* Branch Counter */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Syllabus Branches</span>
                    <p className="text-4xl font-extrabold text-white mt-2 font-display">{stats.branches}</p>
                  </div>

                  {/* Notes counter */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Module Notes Active</span>
                    <p className="text-4xl font-extrabold text-indigo-400 mt-2 font-display">{stats.notes}</p>
                  </div>

                  {/* Papers counter */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                    <span className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Past PYQs Cataloged</span>
                    <p className="text-4xl font-extrabold text-purple-400 mt-2 font-display">{stats.papers}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Users Overview card */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4">
                    <h4 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Student Base Telemetry</span>
                    </h4>
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                      <div>
                        <p className="text-3xl font-extrabold text-white font-display">{stats.users}</p>
                        <p className="text-xs text-slate-450 font-mono mt-0.5">REGISTERED STUDENT PROFILES</p>
                      </div>
                      <span className="text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded">
                        ● DATABASE ONLINE
                      </span>
                    </div>
                  </div>

                  {/* Showcases Overview card */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4">
                    <h4 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>Pending Showcase Approvals</span>
                    </h4>
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                      <div>
                        <p className="text-3xl font-extrabold text-white font-display">{stats.pendingShowcases}</p>
                        <p className="text-xs text-slate-450 font-mono mt-0.5">SUBMISSIONS REQUIRING REVIEW</p>
                      </div>
                      {stats.pendingShowcases > 0 ? (
                        <button 
                          onClick={() => setActiveTab('showcases')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-all"
                        >
                          Review Now &rarr;
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1.5 rounded">
                          ✓ CLEAR
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: ACADEMIC SETUP */}
            {activeTab === 'academic' && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Build Academic Hierarchy Nodes</h2>
                  <p className="text-sm text-slate-400">Map out the tree path: Colleges &rarr; Branches &rarr; Semesters &rarr; Subjects.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Add College Block */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl h-fit space-y-4">
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Add College Node</span>
                    </h3>
                    <form onSubmit={handleAddCollege} className="space-y-3">
                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">College Name</label>
                        <input 
                          type="text" 
                          required
                          value={newCollegeName}
                          onChange={(e) => setNewCollegeName(e.target.value)}
                          placeholder="e.g. MIT Manipal"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isActionPending}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all"
                      >
                        Create College Node
                      </button>
                    </form>
                  </div>

                  {/* Add Branch Block */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl h-fit space-y-4">
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Add Branch / Department</span>
                    </h3>
                    <form onSubmit={handleAddBranch} className="space-y-3">
                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Target College</label>
                        <select 
                          required
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Branch Name</label>
                        <input 
                          type="text" 
                          required
                          value={newBranch.name}
                          onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                          placeholder="e.g. Computer Science Engineering"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Branch Code</label>
                        <input 
                          type="text" 
                          required
                          value={newBranch.code}
                          onChange={(e) => setNewBranch({...newBranch, code: e.target.value})}
                          placeholder="e.g. CSE"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isActionPending || !selectedCollege}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-40"
                      >
                        Create Branch Node
                      </button>
                    </form>
                  </div>

                  {/* Add Subject Block */}
                  <div className="p-6 bg-white/2 border border-white/5 rounded-2xl h-fit space-y-4">
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Add Subject Node</span>
                    </h3>
                    <form onSubmit={handleAddSubject} className="space-y-3">
                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Select Branch</label>
                        <select 
                          required
                          disabled={!selectedCollege}
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          onChange={(e) => {
                            const br = branches.find(b => b.id === e.target.value);
                            if (br) handleBranchSelect(br);
                          }}
                          value={selectedBranch?.id || ''}
                        >
                          <option value="">Select Branch</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Select Semester</label>
                        <select 
                          required
                          disabled={!selectedBranch}
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Subject Name</label>
                        <input 
                          type="text" 
                          required
                          value={newSubject.name}
                          onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                          placeholder="e.g. Database Management Systems"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-450 uppercase tracking-widest font-mono">Subject Syllabus Code</label>
                        <input 
                          type="text" 
                          required
                          value={newSubject.code}
                          onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                          placeholder="e.g. CS5001"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isActionPending || !selectedSemester}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-40"
                      >
                        Create Subject Node
                      </button>
                    </form>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: RESOURCE MANAGER */}
            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Upload Academic Materials & PYQs</h2>
                  <p className="text-sm text-slate-400">Direct integration with Supabase Storage. Supports secure in-browser PDF uploads.</p>
                </div>

                {/* Cascade Subject Lock-on Selector */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white/2 border border-white/5 rounded-2xl">
                  {/* Select College */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">College</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      onChange={(e) => {
                        const col = colleges.find(c => c.id === e.target.value);
                        if (col) handleCollegeSelect(col);
                      }}
                      value={selectedCollege?.id || ''}
                    >
                      <option value="">Choose College</option>
                      {colleges.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Branch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Branch</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedCollege}
                      onChange={(e) => {
                        const br = branches.find(b => b.id === e.target.value);
                        if (br) handleBranchSelect(br);
                      }}
                      value={selectedBranch?.id || ''}
                    >
                      <option value="">Choose Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Semester */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Semester</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedBranch}
                      onChange={(e) => {
                        const sem = semesters.find(s => s.id === e.target.value);
                        if (sem) handleSemesterSelect(sem);
                      }}
                      value={selectedSemester?.id || ''}
                    >
                      <option value="">Choose Semester</option>
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>Semester {s.number}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Subject</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      disabled={!selectedSemester}
                      onChange={(e) => {
                        const subj = subjects.find(sb => sb.id === e.target.value);
                        if (subj) handleSubjectSelect(subj);
                      }}
                      value={selectedSubject?.id || ''}
                    >
                      <option value="">Choose Subject</option>
                      {subjects.map((sb) => (
                        <option key={sb.id} value={sb.id}>{sb.name} ({sb.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedSubject ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Note Upload section - Drag and Drop compliant */}
                    <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4">
                      <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                        <Upload className="w-4 h-4 text-indigo-400" />
                        <span>Publish Study Note PDF</span>
                      </h3>
                      
                      <form onSubmit={handleNoteUpload} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Module Number *</label>
                            <select 
                              value={noteForm.moduleNumber}
                              onChange={(e) => setNoteForm({...noteForm, moduleNumber: Number(e.target.value)})}
                              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                            >
                              {[1, 2, 3, 4, 5, 6].map(m => (
                                <option key={m} value={m}>Module {m}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Document Title *</label>
                            <input 
                              type="text" 
                              required
                              value={noteForm.title}
                              onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                              placeholder="e.g. Graph Traversals and BFS"
                              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Brief Description</label>
                          <textarea 
                            rows={2}
                            value={noteForm.description}
                            onChange={(e) => setNoteForm({...noteForm, description: e.target.value})}
                            placeholder="Module covers graph representations, matrix logic and edge cases..."
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>

                        {/* Drag and Drop Container */}
                        <div 
                          onDragOver={(e) => handleDragOver(e, 'notes')}
                          onDragLeave={() => setDragOverBucket(null)}
                          onDrop={(e) => handleDrop(e, 'notes')}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                            dragOverBucket === 'notes' 
                              ? 'border-indigo-500 bg-indigo-500/5' 
                              : noteFile 
                                ? 'border-green-500/40 bg-green-500/2' 
                                : 'border-white/10 hover:border-indigo-500/30'
                          }`}
                        >
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          {noteFile ? (
                            <div>
                              <p className="text-xs font-semibold text-green-400">File Selected Successfully</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-mono">{noteFile.name} ({(noteFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-slate-300">Drag & drop your Note PDF here, or click to choose file</p>
                              <input 
                                type="file" 
                                accept="application/pdf"
                                required
                                onChange={(e) => e.target.files?.[0] && setNoteFile(e.target.files[0])}
                                className="hidden" 
                                id="note-file-picker" 
                              />
                              <label htmlFor="note-file-picker" className="mt-3 inline-block px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] rounded-lg cursor-pointer">
                                Choose PDF
                              </label>
                            </div>
                          )}
                        </div>

                        <button 
                          type="submit"
                          disabled={isActionPending || !noteFile}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                        >
                          {isActionPending ? 'Uploading secure file...' : 'Publish Module Note'}
                        </button>
                      </form>
                    </div>

                    {/* Paper Upload section */}
                    <div className="p-6 bg-white/2 border border-white/5 rounded-2xl space-y-4">
                      <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>Publish Previous Paper PYQ</span>
                      </h3>
                      
                      <form onSubmit={handlePaperUpload} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Exam Year *</label>
                            <input 
                              type="number" 
                              required
                              value={paperForm.year}
                              onChange={(e) => setPaperForm({...paperForm, year: Number(e.target.value)})}
                              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Paper Name / Title *</label>
                            <input 
                              type="text" 
                              required
                              value={paperForm.title}
                              onChange={(e) => setPaperForm({...paperForm, title: e.target.value})}
                              placeholder="e.g. End-Semester Dec 2024"
                              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Drag and Drop Container for Papers */}
                        <div 
                          onDragOver={(e) => handleDragOver(e, 'papers')}
                          onDragLeave={() => setDragOverBucket(null)}
                          onDrop={(e) => handleDrop(e, 'papers')}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                            dragOverBucket === 'papers' 
                              ? 'border-purple-500 bg-purple-500/5' 
                              : paperFile 
                                ? 'border-green-500/40 bg-green-500/2' 
                                : 'border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          {paperFile ? (
                            <div>
                              <p className="text-xs font-semibold text-green-400">File Selected Successfully</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-mono">{paperFile.name} ({(paperFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-slate-300">Drag & drop your Paper PDF here, or click to choose file</p>
                              <input 
                                type="file" 
                                accept="application/pdf"
                                required
                                onChange={(e) => e.target.files?.[0] && setPaperFile(e.target.files[0])}
                                className="hidden" 
                                id="paper-file-picker" 
                              />
                              <label htmlFor="paper-file-picker" className="mt-3 inline-block px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] rounded-lg cursor-pointer">
                                Choose PDF
                              </label>
                            </div>
                          )}
                        </div>

                        <button 
                          type="submit"
                          disabled={isActionPending || !paperFile}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                        >
                          {isActionPending ? 'Uploading secure file...' : 'Publish Previous Paper'}
                        </button>
                      </form>
                    </div>

                    {/* Active list display */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      
                      {/* Note manager */}
                      <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-4">Uploaded Notes</h4>
                        {notesList.length === 0 ? (
                          <p className="text-xs text-slate-500">No note PDFs cataloged for this subject.</p>
                        ) : (
                          <div className="space-y-3">
                            {notesList.map(n => (
                              <div key={n.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">Module {n.module_number}: {n.title}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteNote(n)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                  title="Remove resource"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Paper manager */}
                      <div className="p-6 bg-white/2 border border-white/5 rounded-2xl">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-4">Uploaded PYQs</h4>
                        {papersList.length === 0 ? (
                          <p className="text-xs text-slate-500">No question papers uploaded for this subject.</p>
                        ) : (
                          <div className="space-y-3">
                            {papersList.map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">{p.year} Exam — {p.title}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeletePaper(p)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                  title="Remove PYQ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="p-12 text-center bg-white/2 border border-white/5 rounded-2xl">
                    <AlertCircle className="w-10 h-10 text-slate-650 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white">Select Academic Subject Code</h4>
                    <p className="text-xs text-slate-500 mt-1">Specify target filters first to unlock real-time resource publications.</p>
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
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Publish Custom Career Roadmaps</h2>
                  <p className="text-sm text-slate-400">Add technical learning paths that direct students directly to docs, project capstones, and videos.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Create Path Form */}
                  <div className="lg:col-span-1 bg-white/2 border border-white/5 p-6 rounded-2xl h-fit space-y-4">
                    <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Curate New Roadmap</span>
                    </h3>

                    <form onSubmit={handleAddPath} className="space-y-3">
                      <div>
                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Topic Title *</label>
                        <input 
                          type="text" 
                          required
                          value={pathForm.topic}
                          onChange={(e) => setPathForm({...pathForm, topic: e.target.value})}
                          placeholder="e.g. Next.js App Router"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Description *</label>
                        <textarea 
                          required
                          rows={3}
                          value={pathForm.description}
                          onChange={(e) => setPathForm({...pathForm, description: e.target.value})}
                          placeholder="What will students learn? Core steps..."
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Difficulty *</label>
                          <select 
                            value={pathForm.difficulty}
                            onChange={(e) => setPathForm({...pathForm, difficulty: e.target.value})}
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Estimated Time</label>
                          <input 
                            type="text"
                            value={pathForm.estimatedTime}
                            onChange={(e) => setPathForm({...pathForm, estimatedTime: e.target.value})}
                            placeholder="e.g. 15 Hours, 4 Weeks"
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Suggested Capstones / Projects</label>
                        <textarea 
                          rows={2}
                          value={pathForm.projectIdeas}
                          onChange={(e) => setPathForm({...pathForm, projectIdeas: e.target.value})}
                          placeholder="Project 1: Personal Dev blog using Tailwind and CMS..."
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Official Documentation Link</label>
                        <input 
                          type="url"
                          value={pathForm.officialDoc}
                          onChange={(e) => setPathForm({...pathForm, officialDoc: e.target.value})}
                          placeholder="https://nextjs.org/docs"
                          className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">Reference GitHub Link</label>
                          <input 
                            type="url"
                            value={pathForm.githubLink}
                            onChange={(e) => setPathForm({...pathForm, githubLink: e.target.value})}
                            placeholder="https://github.com/nextjs/..."
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider font-mono">YouTube Course Playlist</label>
                          <input 
                            type="url"
                            value={pathForm.youtubeLink}
                            onChange={(e) => setPathForm({...pathForm, youtubeLink: e.target.value})}
                            placeholder="https://youtube.com/playlist?..."
                            className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isActionPending}
                        className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all"
                      >
                        Publish Career Roadmap
                      </button>
                    </form>
                  </div>

                  {/* List Active Paths */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white font-display">Published Career Roadmaps</h3>
                    
                    {pathsList.length === 0 ? (
                      <p className="text-xs text-slate-500 bg-white/2 p-12 rounded-2xl border border-white/5 text-center">No custom roadmaps compiled yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pathsList.map(path => (
                          <div key={path.id} className="p-5 bg-white/2 border border-white/5 rounded-xl flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono uppercase">{path.difficulty}</span>
                                <button 
                                  onClick={() => handleDeletePath(path.id)}
                                  className="text-slate-550 hover:text-red-400 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="text-base font-bold text-white mb-1 font-display">{path.topic}</h4>
                              <p className="text-xs text-slate-450 leading-relaxed mb-4">{path.description}</p>
                            </div>
                            <span className="text-3xs text-slate-500 font-mono">PUBLISHED ON: {new Date(path.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: COMMUNITY SHOWCASES MANAGER */}
            {activeTab === 'showcases' && (
              <motion.div
                key="showcases"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold font-display text-white mb-2">Student Showcase Approvals</h2>
                  <p className="text-sm text-slate-400">Review student open-source apps, portfolios and academic contributions before they go live.</p>
                </div>

                {showcasesList.length === 0 ? (
                  <div className="p-16 text-center bg-white/2 border border-white/5 rounded-3xl">
                    <Award className="w-12 h-12 text-slate-650 mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-white">No Showcases Submitted</h4>
                    <p className="text-xs text-slate-500 mt-1">Students haven&apos;t filed any submissions for showcase review yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {showcasesList.map(sc => (
                      <div 
                        key={sc.id} 
                        className={`p-6 rounded-2xl bg-white/2 border flex flex-col justify-between transition-all ${
                          sc.status === 'pending' ? 'border-purple-500/35 bg-purple-950/5' : 'border-white/5'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                                sc.status === 'pending' 
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                  : 'bg-green-500/10 text-green-400 border border-green-500/20'
                              }`}>
                                {sc.status}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteShowcase(sc.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-1 font-display">{sc.title}</h3>
                          <div className="text-xs text-slate-450 space-y-1 mb-4">
                            <p>Author: <span className="text-slate-300 font-semibold">{sc.profiles?.full_name || 'Engineering Student'}</span></p>
                            <p>Email: <span className="text-slate-300 font-mono">{sc.profiles?.email}</span></p>
                            <p>College: <span className="text-slate-300 font-mono text-2xs uppercase">{sc.profiles?.college || 'Not set'}</span></p>
                          </div>

                          <p className="text-xs text-slate-400 mb-6 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{sc.description}</p>
                          
                          {sc.achievements && (
                            <div className="mb-6 space-y-1">
                              <p className="text-[10px] font-mono text-white font-bold uppercase tracking-wider">Achievements</p>
                              <p className="text-xs text-indigo-300 font-mono bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-500/20">{sc.achievements}</p>
                            </div>
                          )}
                        </div>

                        {sc.status === 'pending' && (
                          <button 
                            onClick={() => handleApproveShowcase(sc)}
                            className="w-full mt-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve and Publish Submission</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

    </div>
  );
}
