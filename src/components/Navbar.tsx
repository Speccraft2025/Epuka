'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const close = () => setMobileOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="nav-logo" onClick={close}>
            epu<span>ka</span>
          </Link>

          {/* Desktop links */}
          {user && (
            <ul className="nav-links">
              <li><Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} style={isActive('/dashboard') ? { color: 'var(--clr-green)' } : {}}>Dashboard</Link></li>
              <li><Link href="/tests" className={`nav-link ${isActive('/tests') ? 'active' : ''}`} style={isActive('/tests') ? { color: 'var(--clr-green)' } : {}}>Book a Test</Link></li>
              <li><Link href="/results" className={`nav-link ${isActive('/results') ? 'active' : ''}`} style={isActive('/results') ? { color: 'var(--clr-green)' } : {}}>My Results</Link></li>
            </ul>
          )}

          {/* Desktop actions */}
          <div className="nav-actions nav-actions-desktop">
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {user.photoURL && <img src={user.photoURL} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--clr-green)' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-dim)' }}>{user.displayName?.split(' ')[0]}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/tests" className="nav-link">How it works</Link>
                <Link href="/#bmi" className="btn btn-outline btn-sm">Check BMI</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`ham-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`ham-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`ham-line ${mobileOpen ? 'open' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              <div className="mobile-user">
                {user.photoURL && <img src={user.photoURL} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--clr-green)' }} />}
                <span>{user.displayName}</span>
              </div>
              <Link href="/dashboard" className="mobile-link" onClick={close}>📊 Dashboard</Link>
              <Link href="/tests" className="mobile-link" onClick={close}>🧪 Book a Test</Link>
              <Link href="/results" className="mobile-link" onClick={close}>📋 My Results</Link>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => { logout(); close(); }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/tests" className="mobile-link" onClick={close}>How it works</Link>
              <Link href="/#bmi" className="mobile-link" onClick={close}>Check BMI</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
