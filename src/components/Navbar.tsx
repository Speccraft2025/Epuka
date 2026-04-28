'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="nav-logo">
          epu<span>ka</span>
        </Link>

        {user ? (
          <>
            <ul className="nav-links">
              <li>
                <Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  style={isActive('/dashboard') ? { color: 'var(--clr-green)' } : {}}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/tests" className={`nav-link ${isActive('/tests') ? 'active' : ''}`}
                  style={isActive('/tests') ? { color: 'var(--clr-green)' } : {}}>
                  Book a Test
                </Link>
              </li>
              <li>
                <Link href="/results" className={`nav-link ${isActive('/results') ? 'active' : ''}`}
                  style={isActive('/results') ? { color: 'var(--clr-green)' } : {}}>
                  My Results
                </Link>
              </li>
            </ul>
            <div className="nav-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--clr-green)' }}
                  />
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-dim)' }}>
                  {user.displayName?.split(' ')[0]}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
            </div>
          </>
        ) : (
          <div className="nav-actions">
            <Link href="/tests" className="nav-link">How it works</Link>
            <Link href="/#bmi" className="btn btn-outline btn-sm">Check BMI</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
