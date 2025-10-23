import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { auth } from '../firebase';
import { getCurrentUserProfile } from '../api/userApi';
import ThemeToggle from '../components/ThemeToggle';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Attempt to login with Firebase and get backend response
      const data = await loginUser(email, password);

      // Verify we have a valid response
      if (!data || !data.token) {
        throw new Error('Login failed: Invalid server response');
      }

      // Check if user is admin
      let isAdmin = false;

      // First check Firebase claims
      try {
        const user = auth.currentUser;
        if (user) {
          const idTokenResult = await user.getIdTokenResult(true);
          if (idTokenResult?.claims?.isAdmin) {
            isAdmin = true;
          }
        }
      } catch (firebaseError) {
        console.warn('Firebase admin check failed:', firebaseError);
      }

      // If not admin by Firebase claims, check backend profile
      if (!isAdmin) {
        try {
          const profile = await getCurrentUserProfile();
          if (profile?.isAdmin) {
            isAdmin = true;
          }
        } catch (profileError) {
          console.warn('Profile admin check failed:', profileError);
        }
      }

      // If still not admin, check token claims
      if (!isAdmin && data.token) {
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          isAdmin = Boolean(payload?.isAdmin);
        } catch (tokenError) {
          console.error('Token parsing failed:', tokenError);
        }
      }

      // Navigate based on role
      navigate(isAdmin ? '/admin/dashboard' : '/');
      
    } catch (error) {
      console.error('Login failed:', error);
      setError(error?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-900 overflow-x-hidden transition-colors duration-300">
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between whitespace-nowrap p-4 sm:px-10 sm:py-5 z-10">
        <div className="flex items-center gap-3 text-slate-800 dark:text-white">
          <svg className="h-6 w-6 text-[var(--primary-color)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path></svg>
          <h2 className="text-xl font-bold tracking-tight">EventReviewAI</h2>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Sign in to continue to EventReviewAI
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="email">Email address</label>
                <div className="mt-1">
                  <input 
                    autoComplete="email" 
                    className="form-input block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300"
                    id="email" 
                    name="email" 
                    required=""
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="password">Password</label>
                <div className="mt-1">
                  <input 
                    autoComplete="current-password" 
                    className="form-input block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300"
                    id="password" 
                    name="password" 
                    required=""
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link className="font-medium text-[var(--primary-color)] hover:text-opacity-80" to="/forgot-password">Forgot your password?</Link>
                </div>
              </div>
              <div>
                <button className="flex w-full justify-center rounded-md border border-transparent bg-[var(--primary-color)] py-2 px-4 text-sm font-semibold text-slate-900 dark:text-white shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 transition-all duration-300" type="submit">
                  Log In
                </button>
              </div>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            </form>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?
            <Link className="font-medium text-[var(--primary-color)] hover:text-opacity-80" to="/register">Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;