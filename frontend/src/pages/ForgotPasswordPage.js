import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPasswordPage = () => {
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
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Forgot Your Password?</h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Enter your email to reset your password.
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
            <form className="space-y-6">
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
                  />
                </div>
              </div>
              <div>
                <button className="flex w-full justify-center rounded-md border border-transparent bg-[var(--primary-color)] py-2 px-4 text-sm font-semibold text-slate-900 dark:text-white shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 transition-all duration-300" type="submit">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Remember your password?
            <Link className="font-medium text-[var(--primary-color)] hover:text-opacity-80" to="/login">Log In</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;