import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { logoutUser } from '../api/auth';
import '../index.css';


const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSidebarLinkClass = (path) => {
    const isActive = location.pathname === path;
    const base = 'flex items-center gap-3 rounded-md px-3 py-2 transition-colors';
    const inactive = 'text-[var(--text-secondary)] hover:bg-primary-500/10 hover:text-primary-400';
    const active = 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20';
    return `${base} ${isActive ? active : inactive}`;
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] font-sans transition-colors duration-300">
      <aside className="flex w-64 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 transition-colors duration-300">
        <div className="flex items-center gap-3 text-slate-800 dark:text-white">
          <svg className="h-6 w-6 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path></svg>
          <h2 className="text-xl font-bold tracking-tight">EventReviewAI</h2>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          <Link className={getSidebarLinkClass('/admin/dashboard')} to="/admin/dashboard"> 
            <span className="material-symbols-outlined">explore</span>
            <span className="font-medium">Explore Events</span>
          </Link>
          <Link className={getSidebarLinkClass('/admin/my-events')} to="/admin/my-events">
            <span className="material-symbols-outlined">rate_review</span>
            <span className="font-medium">My Events</span>
          </Link>
          <Link className={getSidebarLinkClass('/admin/analytics')} to="/admin/analytics">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-medium">Analytics</span>
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md bg-[var(--bg-primary)] p-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Mode</span>
              <div className="flex items-center gap-1 rounded-md bg-[var(--bg-secondary)] p-1">
                  <ThemeToggle /> 
              </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--text-secondary)] transition-colors hover:bg-primary-500/10 hover:text-primary-400">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboardPage;