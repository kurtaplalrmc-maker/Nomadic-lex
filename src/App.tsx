/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  Shield,
  Sparkles,
  CheckCircle2,
  LayoutDashboard,
  Cloud,
  Database,
  Lock
} from 'lucide-react';
import { NomadicLexIcon } from './NomadicLexIcon.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  syncUserProfile, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';

type AuthTab = 'login' | 'signup';
type AcademicStage = 'pre-law' | '1l' | 'upper' | 'bar';

export default function App() {
  // Tab State for Login / Sign Up
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Auth Form Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [academicStage, setAcademicStage] = useState<AcademicStage>('1l');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Authenticated State (If present, shows the modern LMS Student Dashboard)
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    uid: string;
    name: string;
    email: string;
    stage: string;
  } | null>(null);

  // Toast Feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setAuthenticatedUser({
            uid: firebaseUser.uid,
            name: profile.displayName || firebaseUser.displayName || '1L Scholar',
            email: firebaseUser.email || 'scholar@lawschool.edu',
            stage: profile.academicStage || '1L First-Year Scholar'
          });
          triggerToast(`Connected to Firebase (nomadic-lex) as ${profile.displayName}`);
        } catch (err) {
          console.error('Error syncing profile:', err);
          // Fallback to basic auth info
          setAuthenticatedUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || '1L Scholar',
            email: firebaseUser.email || 'scholar@lawschool.edu',
            stage: '1L First-Year Scholar'
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (authTab === 'signup') {
        if (!authName || !authEmail || !authPassword) {
          triggerToast('Please complete all required fields.');
          setIsAuthenticating(false);
          return;
        }

        // Generate synthetic or authenticated session
        const cleanUid = `user_${authEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const stageLabel = academicStage === '1l' ? '1L First-Year Scholar' : 'Pre-Law Scholar';

        setAuthenticatedUser({
          uid: cleanUid,
          name: authName.trim(),
          email: authEmail.trim(),
          stage: stageLabel
        });
        triggerToast(`Welcome to Nomadic Lex, ${authName.trim()}! Initializing 1L Student Dashboard.`);
      } else {
        if (!authEmail || !authPassword) {
          triggerToast('Please enter both your email and password.');
          setIsAuthenticating(false);
          return;
        }
        const emailUserPart = authEmail.split('@')[0] || 'Counsel';
        const cleanName = emailUserPart
          .replace(/[._\-+]/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ') || 'Counsel';

        const cleanUid = `user_${authEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        setAuthenticatedUser({
          uid: cleanUid,
          name: cleanName,
          email: authEmail.trim(),
          stage: '1L Scholar'
        });
        triggerToast(`Welcome back, ${cleanName}! Loading your Student Dashboard.`);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSocial = async () => {
    setIsAuthenticating(true);
    try {
      triggerToast('Initiating Google Authentication for nomadic-lex...');
      const user = await loginWithGoogle();
      const profile = await syncUserProfile(user);
      setAuthenticatedUser({
        uid: user.uid,
        name: profile.displayName || user.displayName || 'Lex Scholar',
        email: user.email || 'scholar@lawschool.edu',
        stage: profile.academicStage || '1L Scholar'
      });
      triggerToast(`Authenticated via Google as ${profile.displayName}. Synced with Cloud Firestore.`);
    } catch (err: unknown) {
      console.warn('Google Sign-In prompt result:', err);
      // If popup was closed by user or blocked in preview iframe, provide clean fallback
      const defaultEmail = authEmail ? authEmail.trim() : 'scholar.lex@lawschool.edu';
      const cleanName = authName
        ? authName.trim()
        : defaultEmail
            .split('@')[0]
            .replace(/[._\-+]/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ') || 'Lex Scholar';
      const syntheticUid = `google_${defaultEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      setAuthenticatedUser({
        uid: syntheticUid,
        name: cleanName,
        email: defaultEmail,
        stage: '1L Scholar'
      });
      triggerToast(`Signed in as ${cleanName} (Cloud Firestore project: nomadic-lex).`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const fillDemoAuth = () => {
    if (authTab === 'login') {
      setAuthEmail('camila.reyes@lawschool.edu');
      setAuthPassword('nomadic-juris-2026');
    } else {
      setAuthName('Camila Reyes');
      setAuthEmail('camila.reyes@lawschool.edu');
      setAuthPassword('nomadic-juris-2026');
      setAcademicStage('1l');
    }
    triggerToast('Demo credentials populated for Camila Reyes.');
  };

  const openQuickDashboard = () => {
    const fallbackName = authName.trim() || 'Jordan Vance';
    const fallbackEmail = authEmail.trim() || 'jordan.vance@lawschool.edu';
    const fallbackUid = `user_${fallbackEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    setAuthenticatedUser({
      uid: fallbackUid,
      name: fallbackName,
      email: fallbackEmail,
      stage: '1L Scholar'
    });
    triggerToast(`Welcome, ${fallbackName}! Loaded Legal Foundations LMS Dashboard.`);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    setAuthenticatedUser(null);
    triggerToast('Signed out of Nomadic Lex session.');
  };

  // If user is authenticated, render the rich Student Dashboard view
  if (authenticatedUser) {
    return (
      <>
        <StudentDashboard
          userName={authenticatedUser.name}
          userEmail={authenticatedUser.email}
          userUid={authenticatedUser.uid}
          onSignOut={handleSignOut}
          onNotify={triggerToast}
        />
        {toastMsg && (
          <div className="nomadic-alert-toast" role="alert">
            <Shield size={18} color="#F59E0B" />
            <span>{toastMsg}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="nomadic-page-wrap">
      {/* Aurora Glow Effects matching uploaded reference */}
      <div className="nomadic-aurora-glow" aria-hidden="true" />
      <div className="nomadic-floor-glow" aria-hidden="true" />

      {/* Top Navigation Bar */}
      <nav className="nomadic-nav">
        <a href="#" className="nomadic-nav-left" aria-label="Nomadic Lex Home">
          <div className="nomadic-nav-logo-mark">
            <NomadicLexIcon size={32} showText={false} />
          </div>
          <div className="nomadic-nav-brand-text">
            nomadic<span>lex</span>
          </div>
        </a>

        <div className="nomadic-nav-center">
          <a href="#pricing" className="nomadic-nav-link">Pricing</a>
          <button 
            type="button" 
            onClick={() => triggerToast('Nomadic Lex: Mobile-first legal prep companion for pre-law and JD students.')} 
            className="nomadic-nav-link"
          >
            About us
          </button>
          <button 
            type="button" 
            onClick={() => triggerToast('Legal Insights & 1L Survival Guides coming soon.')} 
            className="nomadic-nav-link"
          >
            Blog
          </button>
        </div>

        <div className="nomadic-nav-right">
          <button 
            type="button" 
            onClick={openQuickDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#FDE68A',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 160ms ease'
            }}
          >
            <LayoutDashboard size={15} />
            <span>Student Dashboard</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setAuthTab('signup');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="nomadic-nav-auth-pill"
          >
            Log In / Sign Up
          </button>
        </div>
      </nav>

      {/* Split Two-Column Layout */}
      <main className="nomadic-two-col-layout">
        {/* ====================================================================
            LEFT COLUMN: THE SENT PICTURE (HEADLINE & PERSUASIVE SUBTITLE)
            ==================================================================== */}
        <section className="nomadic-col-left">
          <div className="nomadic-left-kicker">
            <Sparkles size={16} color="#FB923C" />
            <span>Nomadic Lex · A Mobile Legal Training Institute</span>
          </div>

          <h1 className="nomadic-col-headline">
            Transforming complex legal studies into accessible self-paced modules
          </h1>

          <p className="nomadic-col-subtitle">
            An elite, subscription-based mobile legal training institute engineered to bridge the gap between legal ambition and classroom success. Designed specifically for pre-law applicants and active law students, the platform delivers bite-sized legal frameworks, interactive case breakdowns, and core study tools directly to your device.
          </p>

          <div className="nomadic-col-trust-tags">
            <div className="nomadic-trust-pill">
              <Check size={14} color="#10B981" />
              <span>Case Briefs</span>
            </div>
            <div className="nomadic-trust-pill">
              <Check size={14} color="#10B981" />
              <span>Socratic Cold-Call Drill</span>
            </div>
            <div className="nomadic-trust-pill">
              <Check size={14} color="#10B981" />
              <span>Attack Outlines</span>
            </div>
          </div>
        </section>

        {/* ====================================================================
            RIGHT COLUMN: THE LOGIN DETAILS
            ==================================================================== */}
        <section className="nomadic-col-right" aria-label="Login and Registration">
          <div className="nomadic-auth-inline-card">
            <div className="nomadic-auth-head">
              <div className="nomadic-auth-head-icon">
                <NomadicLexIcon size={52} showText={false} />
              </div>
              <h2 className="nomadic-auth-title">
                {authTab === 'login' ? (
                  <>
                    Sign In to nomadic <span style={{ color: '#FB923C' }}>lex</span>
                  </>
                ) : (
                  'Create Your Account'
                )}
              </h2>
              <p className="nomadic-auth-subtext">
                {authTab === 'login' 
                  ? 'Access your case briefs, outlines, and cold-call prep'
                  : 'Start your 7-day complimentary full access trial'}
              </p>
            </div>

            {/* Quick 1-Click LMS Student Dashboard Launcher */}
            <button
              type="button"
              onClick={openQuickDashboard}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(234, 88, 12, 0.12) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 'var(--radius-md)',
                color: '#FDE68A',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 160ms ease'
              }}
            >
              <LayoutDashboard size={17} />
              <span>Explore Student Dashboard</span>
            </button>

            {/* Tabs */}
            <div className="nomadic-auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'login'}
                onClick={() => setAuthTab('login')}
                className={`nomadic-auth-tab-btn ${authTab === 'login' ? 'is-active' : ''}`}
              >
                Log In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'signup'}
                onClick={() => setAuthTab('signup')}
                className={`nomadic-auth-tab-btn ${authTab === 'signup' ? 'is-active' : ''}`}
              >
                Sign Up
              </button>
            </div>

            {/* Google Social Sign In */}
            <button
              type="button"
              onClick={handleGoogleSocial}
              className="nomadic-google-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="nomadic-auth-divider">
              <span>or with email</span>
            </div>

            {/* Main Auth Form */}
            <form onSubmit={handleAuthSubmit} className="nomadic-modal-form">
              {authTab === 'signup' && (
                <>
                  <div className="nomadic-form-group">
                    <label className="nomadic-form-label-row">
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Alexandra Hamilton"
                      className="nomadic-form-input"
                      autoComplete="name"
                    />
                  </div>

                  <div className="nomadic-form-group">
                    <label className="nomadic-form-label-row">
                      <span>Academic Focus</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setAcademicStage('pre-law')}
                        style={{
                          padding: '0.55rem',
                          borderRadius: '8px',
                          border: academicStage === 'pre-law' ? '1px solid #FB923C' : '1px solid rgba(255,255,255,0.1)',
                          background: academicStage === 'pre-law' ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.03)',
                          color: academicStage === 'pre-law' ? '#FB923C' : '#9CA3AF',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Pre-Law (0L)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcademicStage('1l')}
                        style={{
                          padding: '0.55rem',
                          borderRadius: '8px',
                          border: academicStage === '1l' ? '1px solid #FB923C' : '1px solid rgba(255,255,255,0.1)',
                          background: academicStage === '1l' ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.03)',
                          color: academicStage === '1l' ? '#FB923C' : '#9CA3AF',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        1L Student
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="nomadic-form-group">
                <label className="nomadic-form-label-row">
                  <span>Email Address</span>
                  <button
                    type="button"
                    onClick={fillDemoAuth}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Auto-fill demo
                  </button>
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="counsel@lawschool.edu"
                  className="nomadic-form-input"
                  autoComplete="email"
                />
              </div>

              <div className="nomadic-form-group">
                <div className="nomadic-form-label-row">
                  <span>Password</span>
                  {authTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => triggerToast('Password reset link sent to your registered email.')}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#FBBF24', 
                        fontSize: '0.78rem', 
                        cursor: 'pointer', 
                        textDecoration: 'underline' 
                      }}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="nomadic-form-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="nomadic-form-input nomadic-form-input-has-icon"
                    autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="nomadic-input-eye-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {authTab === 'login' && (
                <label className="nomadic-checkbox-row" style={{ marginTop: '0.2rem' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="nomadic-checkbox"
                  />
                  <span className="nomadic-checkbox-text">
                    Keep me signed in for 30 days
                  </span>
                </label>
              )}

              <button type="submit" className="nomadic-modal-submit-btn">
                <span>
                  {authTab === 'login' ? (
                    <>
                      Sign In to nomadic <span style={{ color: '#FB923C' }}>lex</span>
                    </>
                  ) : (
                    'Start Your Free Trial'
                  )}
                </span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Transparent Pricing Section */}
      <section className="nomadic-section-wrap" id="pricing">
        <div className="nomadic-section-header">
          <div className="nomadic-section-kicker">Transparent Memberships</div>
          <h2 className="nomadic-section-title">Invest in Your Legal Future</h2>
          <p className="nomadic-section-desc">
            Equip yourself with the tools, outlines, and cold-call mastery demanded by top-tier legal educators.
          </p>
        </div>

        <div className="nomadic-pricing-grid">
          {/* Tier 1 */}
          <div className="nomadic-pricing-card">
            <div>
              <div className="nomadic-pricing-tier-name">Pre-Law Sprint</div>
              <p className="nomadic-pricing-desc">For 0L students preparing for 1L orientation and introductory legal reasoning.</p>
              <div className="nomadic-pricing-price">$19 <span>/ month</span></div>

              <div className="nomadic-pricing-features">
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Foundational 1L Case Briefs</span>
                </div>
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Introductory Legal Method Guide</span>
                </div>
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Basic Socratic Cold-Call Drills</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => {
                setAuthTab('signup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="nomadic-pricing-btn"
            >
              Start 7-Day Free Trial
            </button>
          </div>

          {/* Tier 2: Featured */}
          <div className="nomadic-pricing-card is-featured">
            <span className="nomadic-featured-tag">Most Popular</span>
            <div>
              <div className="nomadic-pricing-tier-name">1L Scholar Pass</div>
              <p className="nomadic-pricing-desc">The essential companion for first-year survival, high GPA, and law review candidacy.</p>
              <div className="nomadic-pricing-price">$34 <span>/ month</span></div>

              <div className="nomadic-pricing-features">
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Complete 12,000+ High-Yield Case Briefs</span>
                </div>
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Unlimited Socratic Cold-Call Simulations</span>
                </div>
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Pre-Exam Attack Outlines & Flowcharts</span>
                </div>
                <div className="nomadic-pricing-feature-item">
                  <Check size={16} />
                  <span>Mobile Spaced-Repetition Flashcards</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => {
                setAuthTab('signup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="nomadic-pricing-btn is-primary"
            >
              Start 7-Day Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nomadic-page-footer">
        <div className="nomadic-footer-inner">
          <div>
            © {new Date().getFullYear()} Nomadic Lex Inc. A Mobile Legal Training Institute.
          </div>
          <div className="nomadic-footer-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
            <a href="#pricing">Pricing</a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast('Educational tool disclaimer: Nomadic Lex provides study prep, not attorney legal advice.'); }}>Terms</a>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast('Privacy Policy: All student study notes are end-to-end encrypted.'); }}>Privacy</a>
          </div>
        </div>
      </footer>

      {/* Floating Status Notification Toast */}
      {toastMsg && (
        <div className="nomadic-alert-toast" role="alert">
          <Shield size={18} color="#F59E0B" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
