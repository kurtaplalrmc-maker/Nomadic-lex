/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar as CalendarIcon,
  BookOpen,
  HelpCircle,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Scale,
  Gavel,
  Scroll,
  BookMarked,
  ShieldCheck,
  Award,
  Play,
  X,
  FileText,
  Flame,
  Check,
  Menu,
  ChevronRight,
  LogOut,
  Sparkles,
  BookOpenCheck,
  RotateCcw,
  Compass,
  Layers,
  Lock,
  Cloud,
  Database
} from 'lucide-react';
import { NomadicLexIcon } from '../NomadicLexIcon.tsx';
import { 
  db, 
  handleFirestoreError, 
  OperationType, 
  saveUserCourseProgress, 
  logUserActivity, 
  saveUserBrief,
  CourseProgressData 
} from '../firebase.ts';
import { collection, onSnapshot } from 'firebase/firestore';

interface StudentDashboardProps {
  userName: string;
  userEmail: string;
  userUid?: string;
  onSignOut: () => void;
  onNotify: (msg: string) => void;
}

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  category: string;
  progress: number;
  nextTopic: string;
  completedLessons: number;
  totalLessons: number;
  actionText: 'Resume Study' | 'View Module';
  isPrimary?: boolean;
  instructor: string;
  estTime: string;
  iconType: 'family' | 'criminal' | 'constitutional' | 'statcon' | 'philosophy' | 'ethics';
}

export interface PhaseRoadmapItem {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  subjectCount: number;
  subjects: string[];
  status: 'active' | 'upcoming' | 'advanced';
  statusLabel: string;
  lessonsCount: number;
  iconType: 'foundations' | 'substantive' | 'procedural' | 'bar';
}

export interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  timestamp: string;
}

// 4 Progressive Curriculum Phases
const PHASES_DATA: PhaseRoadmapItem[] = [
  {
    id: 1,
    tag: 'Phase 01 · 1L First-Year Focus',
    title: 'Legal Foundations',
    subtitle: 'Core Legal Reasoning & Method',
    description: 'Bridge the divide between legal theory and law school classroom reality. Master statutory construction canons, fundamental criminal liability, judicial review, civil personality, and professional ethics.',
    subjectCount: 6,
    subjects: [
      'Persons and Family Relations',
      'Criminal Law I',
      'Constitutional Law I',
      'Statutory Construction',
      'Philosophy of Law',
      'Basic Legal and Judicial Ethics'
    ],
    status: 'active',
    statusLabel: 'Active · Unlocked',
    lessonsCount: 47,
    iconType: 'foundations'
  },
  {
    id: 2,
    tag: 'Phase 02 · 1L Term 2 & 2L Core',
    title: 'Core Substantive Law',
    subtitle: 'Private Rights, Obligations & Human Rights',
    description: 'In-depth substantive legal doctrines governing private duties, contractual remedies, property titling, special penal infractions, constitutional civil liberties, and statutory tort liabilities.',
    subjectCount: 6,
    subjects: [
      'Obligations and Contracts',
      'Criminal Law II (Specific Offenses)',
      'Property & Land Titles',
      'Constitutional Law II (Bill of Rights)',
      'Sales and Lease',
      'Torts and Damages'
    ],
    status: 'upcoming',
    statusLabel: 'Next in Sequence',
    lessonsCount: 52,
    iconType: 'substantive'
  },
  {
    id: 3,
    tag: 'Phase 03 · 2L & 3L Level',
    title: 'Advance & Jurisprudential Analysis',
    subtitle: 'Litigation, Commercial & Corporate Systems',
    description: 'High-stakes procedural systems, jurisdiction, evidentiary rules, commercial corporate instruments, social and labor welfare laws, and national internal revenue taxation doctrines.',
    subjectCount: 6,
    subjects: [
      'Civil Procedure',
      'Criminal Procedure',
      'Rules of Evidence',
      'Corporation & Securities Law',
      'Labor Law & Social Legislation',
      'Taxation Law I'
    ],
    status: 'advanced',
    statusLabel: 'Prerequisite: Phase 1 & 2',
    lessonsCount: 56,
    iconType: 'procedural'
  },
  {
    id: 4,
    tag: 'Phase 04 · Capstone & Bar Review',
    title: 'Comprehensive Bar Review & Cold-Call Drill Mastery',
    subtitle: 'Integrated Attack Outlines & Mock Simulations',
    description: 'Intensive bar examination preparation, algorithmic issue spotting, codal provisions speed sprints, high-pressure Socratic cold-call drills, and 100-point mock bar exam evaluations.',
    subjectCount: 4,
    subjects: [
      'Remedial & Commercial Integration',
      'Civil & Taxation Attack Outlines',
      'Penal & Ethics Capstone',
      '100-Point Mock Bar Simulations'
    ],
    status: 'advanced',
    statusLabel: 'Bar Candidate Pass',
    lessonsCount: 36,
    iconType: 'bar'
  }
];

// Phase 1 Canonical 6 Core Subjects
const INITIAL_PHASE1_COURSES: CourseItem[] = [
  {
    id: 'course-1',
    code: 'CIV-101',
    title: 'Persons and Family Relations',
    category: 'Civil Law',
    progress: 0,
    nextTopic: 'Marriage Requisites Art. 2-3',
    completedLessons: 0,
    totalLessons: 8,
    actionText: 'Resume Study',
    isPrimary: true,
    instructor: 'Justice M. Alcantara',
    estTime: 'Module 1 Ready',
    iconType: 'family'
  },
  {
    id: 'course-2',
    code: 'CRIM-101',
    title: 'Criminal Law I',
    category: 'Penal Law',
    progress: 0,
    nextTopic: 'Justifying Circumstances Art. 11',
    completedLessons: 0,
    totalLessons: 7,
    actionText: 'View Module',
    instructor: 'Dean R. Valderama',
    estTime: 'Module 1 Ready',
    iconType: 'criminal'
  },
  {
    id: 'course-3',
    code: 'CONST-101',
    title: 'Constitutional Law I',
    category: 'Public Law',
    progress: 0,
    nextTopic: 'Judicial Review Power',
    completedLessons: 0,
    totalLessons: 9,
    actionText: 'View Module',
    instructor: 'Prof. S. Del Rosario',
    estTime: 'Module 1 Ready',
    iconType: 'constitutional'
  },
  {
    id: 'course-4',
    code: 'STAT-101',
    title: 'Statutory Construction',
    category: 'Legal Method',
    progress: 0,
    nextTopic: 'Intrinsic Aids',
    completedLessons: 0,
    totalLessons: 8,
    actionText: 'View Module',
    instructor: 'Atty. C. Montenegro',
    estTime: 'Module 1 Ready',
    iconType: 'statcon'
  },
  {
    id: 'course-5',
    code: 'PHIL-101',
    title: 'Philosophy of Law',
    category: 'Jurisprudence',
    progress: 0,
    nextTopic: 'Natural Law Theories',
    completedLessons: 0,
    totalLessons: 7,
    actionText: 'View Module',
    instructor: 'Dr. G. Hernandez',
    estTime: 'Module 1 Ready',
    iconType: 'philosophy'
  },
  {
    id: 'course-6',
    code: 'ETH-101',
    title: 'Basic Legal and Judicial Ethics',
    category: 'Professional Ethics',
    progress: 0,
    nextTopic: "CPRA: The Lawyer's Oath",
    completedLessons: 0,
    totalLessons: 8,
    actionText: 'View Module',
    instructor: 'Hon. Justice E. Carpio',
    estTime: 'Module 1 Ready',
    iconType: 'ethics'
  }
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userName,
  userEmail,
  userUid,
  onSignOut,
  onNotify
}) => {
  // Navigation & View State
  const [activeNav, setActiveNav] = useState<'dashboard' | 'courses' | 'calendar' | 'library' | 'quizzes' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Phase Selection State (null = Curriculum Roadmap Overview, 1 = Phase 1 Modules Grid)
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  // Dynamic user progress state initialized to ZERO
  const [courses, setCourses] = useState<CourseItem[]>(INITIAL_PHASE1_COURSES);
  const [studyStreak, setStudyStreak] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);

  // Modals for Quick Access Tools
  const [showCodalModal, setShowCodalModal] = useState(false);
  const [showBriefToolModal, setShowBriefToolModal] = useState(false);
  const [briefCaseName, setBriefCaseName] = useState('Chi Ming Tsoi v. Court of Appeals (G.R. No. 119190)');
  const [briefFacts, setBriefFacts] = useState('Parties married on May 22, 1993. For three years, no sexual intercourse took place despite repeated overtures. Wife filed for annulment under Art. 36.');
  const [briefIssue, setBriefIssue] = useState('Whether refusal to consummate the marriage constitutes psychological incapacity under Art. 36 of the Family Code.');
  const [briefRuling, setBriefRuling] = useState('HELD: YES. Senseless and prolonged refusal by one spouse to have sexual intercourse with the other is equivalent to psychological incapacity to comply with essential marital obligations.');

  // Subscribe to real-time Cloud Firestore updates
  useEffect(() => {
    if (!userUid) return;

    // Listen to user's courses subcollection
    const coursesCol = collection(db, 'users', userUid, 'courses');
    const unsubCourses = onSnapshot(coursesCol, (snapshot) => {
      if (!snapshot.empty) {
        const progressMap: Record<string, CourseProgressData> = {};
        snapshot.forEach((docSnap) => {
          progressMap[docSnap.id] = docSnap.data() as CourseProgressData;
        });
        setCourses((prevCourses) =>
          prevCourses.map((c) => {
            const saved = progressMap[c.code] || progressMap[c.id];
            if (saved) {
              return {
                ...c,
                progress: saved.progress,
                completedLessons: saved.completedLessons,
                totalLessons: saved.totalLessons,
                nextTopic: saved.nextTopic || c.nextTopic,
                actionText: saved.completedLessons > 0 ? 'Resume Study' : 'View Module'
              };
            }
            return c;
          })
        );
      }
    }, (error) => {
      console.warn('Firestore courses listener:', error);
    });

    // Listen to user's activities subcollection
    const activitiesCol = collection(db, 'users', userUid, 'activities');
    const unsubActivities = onSnapshot(activitiesCol, (snapshot) => {
      if (!snapshot.empty) {
        const acts: ActivityItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          acts.push({
            id: docSnap.id,
            title: d.title,
            meta: d.meta || '',
            timestamp: d.timestamp
          });
        });
        setRecentActivities(acts.reverse());
      }
    }, (error) => {
      console.warn('Firestore activities listener:', error);
    });

    return () => {
      unsubCourses();
      unsubActivities();
    };
  }, [userUid]);

  // Calculate Overall Phase 1 Progress dynamically (19 total modules)
  const TOTAL_PHASE_MODULES = 19;
  const completedLessonsTotal = courses.reduce((acc, curr) => acc + curr.completedLessons, 0);
  const overallPhasePercentage = Math.round((completedLessonsTotal / TOTAL_PHASE_MODULES) * 100);

  // Filtered courses for Phase 1 based on search query
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nextTopic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render course category icon
  const renderCourseIcon = (type: CourseItem['iconType']) => {
    switch (type) {
      case 'family':
        return <Scale size={20} className="text-amber-400" />;
      case 'criminal':
        return <Gavel size={20} className="text-orange-400" />;
      case 'constitutional':
        return <ShieldCheck size={20} className="text-amber-300" />;
      case 'statcon':
        return <Scroll size={20} className="text-amber-400" />;
      case 'philosophy':
        return <BookMarked size={20} className="text-orange-300" />;
      case 'ethics':
        return <Award size={20} className="text-amber-400" />;
    }
  };

  // Render phase roadmap icon
  const renderPhaseIcon = (type: PhaseRoadmapItem['iconType']) => {
    switch (type) {
      case 'foundations':
        return <Scale size={22} className="text-amber-400" />;
      case 'substantive':
        return <Scroll size={22} className="text-orange-400" />;
      case 'procedural':
        return <Gavel size={22} className="text-amber-300" />;
      case 'bar':
        return <Award size={22} className="text-yellow-400" />;
    }
  };

  // Handle clicking a Phase card in Roadmap
  const handlePhaseClick = (phase: PhaseRoadmapItem) => {
    if (phase.id === 1) {
      setSelectedPhase(1);
      onNotify('Opened Phase 1: Legal Foundations module grid.');
    } else {
      onNotify(`${phase.title} will unlock as you progress through Phase 1 Foundations.`);
    }
  };

  // Handle clicking a Course card in Phase 1 (interactively increment lesson progress and persist to Firestore)
  const handleCourseClick = async (course: CourseItem) => {
    const nextLesson = Math.min(course.totalLessons, course.completedLessons + 1);
    const newProgress = Math.round((nextLesson / course.totalLessons) * 100);

    // Update local state immediately for responsive feedback
    setCourses((prev) =>
      prev.map((c) =>
        c.id === course.id
          ? {
              ...c,
              completedLessons: nextLesson,
              progress: newProgress,
              actionText: nextLesson > 0 ? 'Resume Study' : 'View Module'
            }
          : c
      )
    );

    // Persist to Cloud Firestore
    if (userUid) {
      try {
        await saveUserCourseProgress(userUid, {
          userId: userUid,
          courseId: course.code,
          progress: newProgress,
          completedLessons: nextLesson,
          totalLessons: course.totalLessons,
          nextTopic: course.nextTopic,
          updatedAt: new Date().toISOString()
        });

        await logUserActivity(userUid, {
          title: `Studied: ${course.title}`,
          meta: `Completed Lesson ${nextLesson}/${course.totalLessons} (${newProgress}%)`,
          timestamp: 'Just now'
        });

        onNotify(`Saved to Cloud Firestore: ${course.title} (${nextLesson}/${course.totalLessons} lessons).`);
      } catch (err) {
        console.error('Failed to sync progress to Firestore:', err);
      }
    } else {
      onNotify(`Completed lesson in ${course.title} (${nextLesson}/${course.totalLessons}).`);
    }
  };

  // Reset progress helper
  const handleResetProgress = async () => {
    setCourses(INITIAL_PHASE1_COURSES);
    setStudyStreak(0);
    setRecentActivities([]);

    if (userUid) {
      try {
        for (const c of INITIAL_PHASE1_COURSES) {
          await saveUserCourseProgress(userUid, {
            userId: userUid,
            courseId: c.code,
            progress: 0,
            completedLessons: 0,
            totalLessons: c.totalLessons,
            nextTopic: c.nextTopic,
            updatedAt: new Date().toISOString()
          });
        }
        await logUserActivity(userUid, {
          title: 'Reset Module Metrics',
          meta: 'All Phase 1 subjects cleared to 0%',
          timestamp: 'Just now'
        });
      } catch (err) {
        console.error('Failed to reset in Firestore:', err);
      }
    }
    onNotify('All student module metrics reset to 0% in Cloud Firestore.');
  };

  const handleSaveBriefToFirestore = async () => {
    if (userUid) {
      try {
        const briefId = `brief_${Date.now()}`;
        await saveUserBrief(userUid, briefId, {
          caseTitle: briefCaseName,
          facts: briefFacts,
          issue: briefIssue,
          ruling: briefRuling
        });
        await logUserActivity(userUid, {
          title: `FIRAC Brief: ${briefCaseName.split('(')[0].trim()}`,
          meta: 'Persisted to Cloud Firestore briefs collection',
          timestamp: 'Just now'
        });
        onNotify(`Case Brief for ${briefCaseName} saved to Cloud Firestore (nomadic-lex).`);
      } catch (err) {
        console.error('Error saving brief to Firestore:', err);
      }
    } else {
      onNotify('FIRAC brief saved to student notebook.');
    }
    setShowBriefToolModal(false);
  };

  // User initials for topbar avatar
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'NL';

  const userFirstName = userName.split(' ')[0] || userName;

  return (
    <div className="nomadic-dashboard-root">
      {/* Aurora Ambient Background Glows */}
      <div className="nomadic-dash-aurora-top" aria-hidden="true" />
      <div className="nomadic-dash-aurora-bottom" aria-hidden="true" />

      {/* 3-COLUMN MAIN DASHBOARD LAYOUT */}
      <div className="nomadic-dash-layout">
        {/* ==================================================================
            1. NAVIGATION SIDEBAR (LEFT COLUMN)
            ================================================================== */}
        <aside className={`nomadic-dash-sidebar ${mobileMenuOpen ? 'is-mobile-open' : ''}`}>
          {/* Logo at Top */}
          <div className="nomadic-sidebar-brand">
            <div className="nomadic-sidebar-emblem">
              <NomadicLexIcon size={34} showText={false} />
            </div>
            <div className="nomadic-sidebar-brand-name">
              nomadic<span>lex</span>
            </div>
            <button
              type="button"
              className="nomadic-sidebar-mobile-close md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Tier Standing Indicator */}
          <div className="nomadic-sidebar-tier-card">
            <div className="nomadic-tier-badge-row">
              <span className="nomadic-tier-dot" />
              <span className="nomadic-tier-title">1L Scholar Pass</span>
            </div>
            <p className="nomadic-tier-meta">Juris Doctor Candidate</p>
          </div>

          {/* Navigation Menu Items */}
          <nav className="nomadic-sidebar-nav" aria-label="Dashboard Navigation">
            <button
              type="button"
              onClick={() => {
                setActiveNav('dashboard');
                setSelectedPhase(null);
                setMobileMenuOpen(false);
              }}
              className={`nomadic-nav-item ${activeNav === 'dashboard' ? 'is-active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
              {activeNav === 'dashboard' && <span className="nomadic-active-indicator" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('courses');
                setSelectedPhase(null);
                setMobileMenuOpen(false);
                onNotify('Curriculum Roadmap: 4 structured phases of legal training.');
              }}
              className={`nomadic-nav-item ${activeNav === 'courses' ? 'is-active' : ''}`}
            >
              <GraduationCap size={18} />
              <span>My Courses</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('calendar');
                setMobileMenuOpen(false);
                onNotify('Socratic recitations and examination schedule loaded.');
              }}
              className={`nomadic-nav-item ${activeNav === 'calendar' ? 'is-active' : ''}`}
            >
              <CalendarIcon size={18} />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('library');
                setMobileMenuOpen(false);
                onNotify('Accessing High-Yield Case Library (12,000+ briefs).');
              }}
              className={`nomadic-nav-item ${activeNav === 'library' ? 'is-active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Case Library</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('quizzes');
                setMobileMenuOpen(false);
                onNotify('Cold-call simulators & bar question bank active.');
              }}
              className={`nomadic-nav-item ${activeNav === 'quizzes' ? 'is-active' : ''}`}
            >
              <HelpCircle size={18} />
              <span>Quizzes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('settings');
                setMobileMenuOpen(false);
                onNotify('Settings & security preferences.');
              }}
              className={`nomadic-nav-item ${activeNav === 'settings' ? 'is-active' : ''}`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Study Streak Widget at Sidebar Bottom - 0 Days for new accounts */}
          <div className="nomadic-sidebar-streak-box">
            <div className="nomadic-streak-head">
              <Flame size={18} className="text-orange-400" />
              <span>Study Streak</span>
            </div>
            <div className="nomadic-streak-counter">
              <strong>{studyStreak} {studyStreak === 1 ? 'Day' : 'Days'}</strong>
              <span>· {studyStreak === 0 ? 'Start your first drill' : 'Active 1L Streak'}</span>
            </div>
            <div className="nomadic-streak-progress-bg">
              <div 
                className="nomadic-streak-progress-fill" 
                style={{ width: studyStreak > 0 ? `${Math.min(100, studyStreak * 25)}%` : '0%' }} 
              />
            </div>
          </div>

          {/* Logout / Exit to Landing */}
          <div className="nomadic-sidebar-footer">
            <button
              type="button"
              onClick={onSignOut}
              className="nomadic-sidebar-logout-btn"
            >
              <LogOut size={16} />
              <span>Sign Out Session</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile navigation */}
        {mobileMenuOpen && (
          <div
            className="nomadic-dash-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ==================================================================
            2. MAIN CONTENT AREA (CENTER COLUMN)
            ================================================================== */}
        <main className="nomadic-dash-main">
          {/* Top Header Bar */}
          <header className="nomadic-dash-topbar">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              className="nomadic-dash-menu-toggle md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>

            {/* Global Search Bar */}
            <div className="nomadic-dash-search-wrap">
              <Search size={16} className="nomadic-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search briefs, topics, or statutes..."
                className="nomadic-dash-search-input"
              />
              <span className="nomadic-search-shortcut">⌘K</span>
            </div>

            {/* Right Topbar Controls */}
            <div className="nomadic-dash-topbar-actions">
              {/* Firestore sync status badge */}
              <div 
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                title="Connected to Cloud Firestore database: nomadic-lex"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Database size={12} className="text-emerald-400" />
                <span>Firestore Synced</span>
              </div>

              {/* Reset progress quick helper */}
              <button
                type="button"
                onClick={handleResetProgress}
                className="nomadic-topbar-icon-btn hidden sm:flex"
                title="Reset all progress to 0%"
                aria-label="Reset progress to 0%"
              >
                <RotateCcw size={16} />
              </button>

              {/* Notifications Button */}
              <div className="nomadic-relative-anchor">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="nomadic-topbar-icon-btn"
                  aria-label="View notifications"
                >
                  <Bell size={18} />
                  <span className="nomadic-bell-unread-dot" />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="nomadic-topbar-dropdown nomadic-notifications-menu">
                    <div className="nomadic-dropdown-head">
                      <span>Notifications</span>
                      <span className="nomadic-dropdown-sub">1 New</span>
                    </div>
                    <div className="nomadic-notifications-list">
                      <div className="nomadic-notif-row is-unread">
                        <div className="nomadic-notif-bullet" />
                        <div>
                          <p className="nomadic-notif-title">Curriculum Roadmap Ready</p>
                          <p className="nomadic-notif-text">Phase 1: Legal Foundations is unlocked and ready for study.</p>
                          <span className="nomadic-notif-time">Just now</span>
                        </div>
                      </div>
                      <div className="nomadic-notif-row">
                        <div className="nomadic-notif-bullet" style={{ background: '#6B7280' }} />
                        <div>
                          <p className="nomadic-notif-title">Con-Law Review Milestone</p>
                          <p className="nomadic-notif-text">Upcoming quiz on Judicial Review scheduled for Oct 28.</p>
                          <span className="nomadic-notif-time">Term 1 Schedule</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="nomadic-relative-anchor">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="nomadic-user-profile-btn"
                  aria-label="User Profile Menu"
                >
                  <div className="nomadic-user-avatar">
                    {userInitials}
                  </div>
                  <div className="nomadic-user-info-text hidden sm:flex">
                    <span className="nomadic-user-name">{userName}</span>
                    <span className="nomadic-user-school">1L Scholar</span>
                  </div>
                  <ChevronDown size={14} className="text-neutral-400" />
                </button>

                {showProfileMenu && (
                  <div className="nomadic-topbar-dropdown nomadic-profile-dropdown">
                    <div className="nomadic-profile-head">
                      <p className="nomadic-profile-name">{userName}</p>
                      <p className="nomadic-profile-email">{userEmail}</p>
                    </div>
                    <div className="nomadic-profile-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowBriefToolModal(true);
                        }}
                        className="nomadic-profile-link"
                      >
                        <FileText size={15} />
                        <span>My Case Brief Notebook</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowCodalModal(true);
                        }}
                        className="nomadic-profile-link"
                      >
                        <BookOpen size={15} />
                        <span>Philippine Codal Library</span>
                      </button>
                      <div className="nomadic-profile-divider" />
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="nomadic-profile-link is-danger"
                      >
                        <LogOut size={15} />
                        <span>Sign Out / Return to Home</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Scrollable Center Body Content */}
          <div className="nomadic-dash-scroll-body">
            {/* Welcome Banner */}
            <section className="nomadic-dash-welcome-banner">
              <div className="nomadic-welcome-left">
                <div className="nomadic-welcome-kicker">
                  <Flame size={14} className="text-orange-400" />
                  <span>Foundations Semester · Week 1</span>
                </div>
                <h1 className="nomadic-welcome-title">
                  Welcome back, {userFirstName}!
                </h1>
                <p className="nomadic-welcome-subtitle">
                  Your Foundations journey is underway. Select a curriculum phase below or resume your active 1L course modules.
                </p>

                {/* Overall Phase 1 Progress bar */}
                <div className="nomadic-phase-progress-box">
                  <div className="nomadic-phase-label-row">
                    <span className="nomadic-phase-name">Overall Phase 1 Progress</span>
                    <span className="nomadic-phase-percentage">
                      {overallPhasePercentage}% complete <span className="nomadic-phase-sub">({completedLessonsTotal}/{TOTAL_PHASE_MODULES} Modules)</span>
                    </span>
                  </div>
                  <div className="nomadic-progress-track">
                    <div
                      className="nomadic-progress-fill is-master"
                      style={{ width: `${overallPhasePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="nomadic-welcome-action-col">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhase(1);
                    onNotify('Loaded Phase 1: Legal Foundations module grid.');
                  }}
                  className="nomadic-resume-btn-master"
                >
                  <Play size={16} fill="#060709" />
                  <span>Resume Study</span>
                </button>
                <span className="nomadic-resume-subnote">
                  {selectedPhase === 1 ? 'Current: Phase 1 Foundations' : 'Jump to: Phase 1 Foundations (6 Modules)'}
                </span>
              </div>
            </section>

            {/* ================================================================
                VIEW 1: CURRICULUM ROADMAP (DEFAULT PHASE SELECTION OVERVIEW)
                ================================================================ */}
            {selectedPhase === null ? (
              <>
                {/* Section Header for Curriculum Roadmap */}
                <div className="nomadic-section-bar">
                  <div>
                    <h2 className="nomadic-section-heading">Curriculum Roadmap</h2>
                    <p className="nomadic-section-sub">
                      Explore the four progressive phases of legal training from 1L foundational reasoning to high-stakes bar exam mastery.
                    </p>
                  </div>
                  <div className="nomadic-section-stats-tag hidden sm:flex">
                    <span>4 Structured Phases</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400 font-semibold">Phase 1 Active</span>
                  </div>
                </div>

                {/* 2x2 Grid of Phase Selection Cards */}
                <div className="nomadic-roadmap-grid">
                  {PHASES_DATA.map((phase) => (
                    <div
                      key={phase.id}
                      onClick={() => handlePhaseClick(phase)}
                      className={`nomadic-phase-card ${phase.status === 'active' ? 'is-active-phase' : ''}`}
                    >
                      {/* Top Row: Phase Tag Badge & Status */}
                      <div className="nomadic-phase-head">
                        <div className="nomadic-phase-badge-wrap">
                          <span className="nomadic-phase-num-badge">Phase {phase.id}</span>
                          <span className={`nomadic-phase-status-pill ${phase.status === 'active' ? 'is-active' : 'is-upcoming'}`}>
                            {phase.status === 'active' && <span className="nomadic-tier-dot" />}
                            {phase.statusLabel}
                          </span>
                        </div>
                        <div className="nomadic-phase-icon-box">
                          {renderPhaseIcon(phase.iconType)}
                        </div>
                      </div>

                      {/* Main Title & Description */}
                      <div className="nomadic-phase-title-group">
                        <h3 className="nomadic-phase-main-title">{phase.title}</h3>
                        <p className="nomadic-phase-description">{phase.description}</p>
                      </div>

                      {/* Subjects Preview Pill Cluster */}
                      <div className="nomadic-phase-subjects-section">
                        <span className="nomadic-phase-subjects-label">Included Subjects ({phase.subjectCount}):</span>
                        <div className="nomadic-phase-subjects-pills">
                          {phase.subjects.map((subj, idx) => (
                            <span key={idx} className="nomadic-subject-tag">
                              {subj}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer: Metadata & CTA Button */}
                      <div className="nomadic-phase-footer">
                        <div className="nomadic-phase-meta-stats">
                          <span className="nomadic-phase-subject-count">{phase.subjectCount} Core Subjects</span>
                          <span className="nomadic-phase-progress-summary">
                            {phase.id === 1 ? `${overallPhasePercentage}% Complete (${completedLessonsTotal}/19)` : '0% Complete'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhaseClick(phase);
                          }}
                          className={`nomadic-phase-cta-btn ${phase.status === 'active' ? 'is-active-btn' : 'is-secondary-btn'}`}
                        >
                          <span>{phase.id === 1 ? 'Explore Phase 1 Modules' : 'View Phase Overview'}</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* ================================================================
                  VIEW 2: PHASE 1 MODULE GRID (TRANSITIONED VIEW)
                  Per user request: STOP after rendering Phase 1 module grid.
                  ================================================================ */
              <>
                {/* Breadcrumb & Navigation Bar */}
                <div className="nomadic-breadcrumb-bar">
                  <button
                    type="button"
                    onClick={() => setSelectedPhase(null)}
                    className="nomadic-back-btn"
                  >
                    <ChevronLeft size={16} />
                    <span>Back to Phase Overview</span>
                  </button>

                  <div className="nomadic-breadcrumb-path">
                    <span>Curriculum Roadmap</span>
                    <span aria-hidden="true">/</span>
                    <span className="is-active">Phase 1: Legal Foundations</span>
                  </div>
                </div>

                {/* Section Header for Phase 1 */}
                <div className="nomadic-section-bar">
                  <div>
                    <h2 className="nomadic-section-heading">Phase 1: Legal Foundations</h2>
                    <p className="nomadic-section-sub">
                      Foundational 1L modules structured according to bar exam subject weight and codal provisions.
                    </p>
                  </div>
                  <div className="nomadic-section-stats-tag hidden sm:flex">
                    <span>6 Core Subjects</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-400 font-semibold">Phase 1 Active</span>
                  </div>
                </div>

                {/* Course Cards Grid: 6 Core Subjects (3 Columns x 2 Rows) */}
                <div className="nomadic-course-cards-grid">
                  {filteredCourses.map((course) => (
                    <article
                      key={course.id}
                      onClick={() => handleCourseClick(course)}
                      className={`nomadic-course-card cursor-pointer ${course.progress > 0 ? 'is-in-progress' : ''}`}
                    >
                      {/* Card Top: Code, Subject & Icon */}
                      <div className="nomadic-card-head">
                        <div className="nomadic-card-icon-box">
                          {renderCourseIcon(course.iconType)}
                        </div>
                        <div className="nomadic-card-title-group">
                          <span className="nomadic-card-code">{course.code} · {course.category}</span>
                          <h3 className="nomadic-card-title">{course.title}</h3>
                        </div>
                      </div>

                      {/* Progress Bar & Numerical Ratio (0% initially) */}
                      <div className="nomadic-card-progress-section">
                        <div className="nomadic-card-progress-meta">
                          <span className="nomadic-progress-label">Lessons Completed</span>
                          <span className="nomadic-progress-num">
                            {course.completedLessons}/{course.totalLessons} ({course.progress}%)
                          </span>
                        </div>
                        <div className="nomadic-card-track">
                          <div
                            className="nomadic-card-fill"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Next Lesson Topic Information */}
                      <div className="nomadic-card-next-box">
                        <span className="nomadic-next-label">Next Focus:</span>
                        <p className="nomadic-next-topic" title={course.nextTopic}>
                          {course.nextTopic}
                        </p>
                      </div>

                      {/* Instructor & Metadata details */}
                      <div className="nomadic-card-details">
                        <span>{course.instructor}</span>
                        <span aria-hidden="true">·</span>
                        <span>{course.estTime}</span>
                      </div>

                      {/* Card Action Button */}
                      <div className="nomadic-card-footer">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCourseClick(course);
                          }}
                          className={`nomadic-card-action-btn w-full ${course.actionText === 'Resume Study' ? 'is-cta-primary' : ''}`}
                        >
                          <span>{course.actionText}</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        {/* ==================================================================
            3. SIDEBAR WIDGETS (RIGHT COLUMN)
            ================================================================== */}
        <aside className="nomadic-dash-widgets">
          {/* Upcoming Deadlines Widget */}
          <div className="nomadic-widget-card">
            <div className="nomadic-widget-head">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <h3 className="nomadic-widget-title">Upcoming Deadlines</h3>
              </div>
              <span className="nomadic-widget-badge">Term 1</span>
            </div>

            <div className="nomadic-widget-list">
              {/* Item 1 */}
              <div className="nomadic-deadline-item">
                <div className="nomadic-deadline-date-box">
                  <span className="nomadic-date-month">OCT</span>
                  <span className="nomadic-date-day">28</span>
                </div>
                <div className="nomadic-deadline-body">
                  <h4 className="nomadic-deadline-name">Con-Law Quiz</h4>
                  <p className="nomadic-deadline-sub">Judicial Review & Expanded Jurisdiction</p>
                  <span className="nomadic-deadline-due">Due in 2 days</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNotify('Con-Law Quiz prep simulator will open in upcoming step.')}
                  className="nomadic-widget-quick-btn"
                  title="Prepare for quiz"
                >
                  <Play size={13} />
                </button>
              </div>

              {/* Item 2 */}
              <div className="nomadic-deadline-item">
                <div className="nomadic-deadline-date-box">
                  <span className="nomadic-date-month">NOV</span>
                  <span className="nomadic-date-day">02</span>
                </div>
                <div className="nomadic-deadline-body">
                  <h4 className="nomadic-deadline-name">Crim-Law Brief Submission</h4>
                  <p className="nomadic-deadline-sub">Case synthesis on People v. Olarbe</p>
                  <span className="nomadic-deadline-due">Due in 7 days</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNotify('Crim-Law Brief draft ready.')}
                  className="nomadic-widget-quick-btn"
                  title="Open brief draft"
                >
                  <Play size={13} />
                </button>
              </div>

              {/* Item 3 */}
              <div className="nomadic-deadline-item">
                <div className="nomadic-deadline-date-box">
                  <span className="nomadic-date-month">NOV</span>
                  <span className="nomadic-date-day">10</span>
                </div>
                <div className="nomadic-deadline-body">
                  <h4 className="nomadic-deadline-name">Midterm Simulation Exam</h4>
                  <p className="nomadic-deadline-sub">Full 100-pt Socratic issue spotter</p>
                  <span className="nomadic-deadline-due">Due in 15 days</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNotify('Midterm schedule details registered.')}
                  className="nomadic-widget-quick-btn"
                  title="View exam coverage"
                >
                  <Play size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="nomadic-widget-card">
            <div className="nomadic-widget-head">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h3 className="nomadic-widget-title">Recent Activity</h3>
              </div>
              {recentActivities.length > 0 && (
                <span className="nomadic-widget-badge">{recentActivities.length} Done</span>
              )}
            </div>

            <div className="nomadic-activity-list">
              {recentActivities.length === 0 ? (
                <div className="nomadic-activity-empty-state">
                  <div className="nomadic-empty-icon-wrap">
                    <BookOpenCheck size={20} className="text-amber-400/60" />
                  </div>
                  <p className="nomadic-empty-title">No activity recorded yet</p>
                  <p className="nomadic-empty-sub">
                    Start a study drill or brief a case module in Phase 1 to begin tracking your legal progress.
                  </p>
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="nomadic-activity-item">
                    <div className="nomadic-activity-icon-check">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                    <div className="nomadic-activity-details">
                      <p className="nomadic-activity-title">{act.title}</p>
                      <p className="nomadic-activity-meta">{act.meta}</p>
                      <span className="nomadic-activity-timestamp">{act.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Access Links Widget */}
          <div className="nomadic-widget-card">
            <div className="nomadic-widget-head">
              <div className="flex items-center gap-2">
                <BookMarked size={16} className="text-amber-400" />
                <h3 className="nomadic-widget-title">Quick Access Tools</h3>
              </div>
            </div>

            <div className="nomadic-quick-links-grid">
              <button
                type="button"
                onClick={() => setShowCodalModal(true)}
                className="nomadic-quick-access-btn"
              >
                <div className="nomadic-quick-icon">
                  <Scroll size={17} />
                </div>
                <div className="nomadic-quick-text">
                  <span className="nomadic-quick-title">Codal Provisions</span>
                  <span className="nomadic-quick-desc">Search Family Code, RPC, Consti</span>
                </div>
                <ExternalLink size={14} className="nomadic-quick-arrow" />
              </button>

              <button
                type="button"
                onClick={() => setShowBriefToolModal(true)}
                className="nomadic-quick-access-btn"
              >
                <div className="nomadic-quick-icon">
                  <FileText size={17} />
                </div>
                <div className="nomadic-quick-text">
                  <span className="nomadic-quick-title">Case Brief Tool</span>
                  <span className="nomadic-quick-desc">Instant FIRAC Outline Generator</span>
                </div>
                <ExternalLink size={14} className="nomadic-quick-arrow" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================================================================
          QUICK ACCESS: CODAL PROVISIONS MODAL
          ================================================================== */}
      {showCodalModal && (
        <div className="nomadic-modal-backdrop" onClick={() => setShowCodalModal(false)}>
          <div className="nomadic-tool-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="nomadic-drawer-header">
              <div className="flex items-center gap-2">
                <Scroll size={20} className="text-amber-400" />
                <h2 className="nomadic-drawer-title">Philippine Codal Reference</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCodalModal(false)}
                className="nomadic-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="nomadic-codal-body">
              <div className="nomadic-codal-quick-nav">
                <span className="nomadic-active-tag">Family Code</span>
                <span>Revised Penal Code</span>
                <span>1987 Constitution</span>
                <span>Rules of Court</span>
              </div>

              <div className="nomadic-codal-text-container">
                <h4 className="text-amber-300 font-semibold mb-2">The Family Code of the Philippines (E.O. 209)</h4>
                <p className="text-sm text-neutral-300 mb-3">
                  <strong>Art. 1.</strong> Marriage is a special contract of permanent union between a man and a woman entered into in accordance with law for the establishment of conjugal and family life. It is the foundation of the family and an inviolable social institution whose nature, consequences, and incidents are governed by law and not subject to stipulation.
                </p>
                <p className="text-sm text-neutral-300 mb-3">
                  <strong>Art. 2.</strong> No marriage shall be valid, unless these essential requisites are present:
                  <br />(1) Legal capacity of the contracting parties who must be a male and a female; and
                  <br />(2) Consent freely given in the presence of the solemnizing officer.
                </p>
                <p className="text-sm text-neutral-300">
                  <strong>Art. 3.</strong> The formal requisites of marriage are:
                  <br />(1) Authority of the solemnizing officer;
                  <br />(2) A valid marriage license except in the cases provided for in Chapter 2 of this Title; and
                  <br />(3) A marriage ceremony which takes place with the appearance of the contracting parties before the solemnizing officer.
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onNotify('Codal provision copied to clipboard.');
                    setShowCodalModal(false);
                  }}
                  className="nomadic-cta-primary-btn"
                >
                  <Check size={16} />
                  <span>Copy to Study Notebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          QUICK ACCESS: CASE BRIEF TOOL (FIRAC) MODAL
          ================================================================== */}
      {showBriefToolModal && (
        <div className="nomadic-modal-backdrop" onClick={() => setShowBriefToolModal(false)}>
          <div className="nomadic-tool-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="nomadic-drawer-header">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-amber-400" />
                <h2 className="nomadic-drawer-title">FIRAC Case Brief Generator</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBriefToolModal(false)}
                className="nomadic-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="nomadic-brief-tool-body">
              <label className="nomadic-form-group">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Case Title & Citation</span>
                <input
                  type="text"
                  value={briefCaseName}
                  onChange={(e) => setBriefCaseName(e.target.value)}
                  className="nomadic-form-input"
                  placeholder="e.g. People v. Olarbe (G.R. No. 227421)"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="nomadic-firac-block">
                  <span className="nomadic-firac-tag">F · Facts</span>
                  <textarea
                    rows={4}
                    value={briefFacts}
                    onChange={(e) => setBriefFacts(e.target.value)}
                    className="w-full mt-1.5 p-2 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 resize-none focus:outline-none focus:border-amber-400/50"
                    placeholder="Enter facts of the case..."
                  />
                </div>
                <div className="nomadic-firac-block">
                  <span className="nomadic-firac-tag">I · Issue</span>
                  <textarea
                    rows={4}
                    value={briefIssue}
                    onChange={(e) => setBriefIssue(e.target.value)}
                    className="w-full mt-1.5 p-2 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 resize-none focus:outline-none focus:border-amber-400/50"
                    placeholder="Enter legal issue..."
                  />
                </div>
              </div>

              <div className="nomadic-firac-block mt-3">
                <span className="nomadic-firac-tag">R & H · Ruling & Holding</span>
                <textarea
                  rows={3}
                  value={briefRuling}
                  onChange={(e) => setBriefRuling(e.target.value)}
                  className="w-full mt-1.5 p-2 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 resize-none focus:outline-none focus:border-amber-400/50"
                  placeholder="Enter Supreme Court ruling..."
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-amber-300/80">
                  <Database size={13} />
                  <span>Syncs to Firestore (users/{userUid ? userUid.slice(0, 10) + '...' : 'current'}/briefs)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBriefToFirestore}
                  className="nomadic-cta-primary-btn"
                >
                  <Check size={16} />
                  <span>Save Brief to Cloud Firestore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
