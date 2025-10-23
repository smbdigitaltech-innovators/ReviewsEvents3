import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import ThemeToggle from '../components/ThemeToggle';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('user');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await registerUser(name, email, password, userType === 'admin');
      setSuccess('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register. Please try again.');
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
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Create an account</h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Sign up to start reviewing events
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-800 p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="name">Name</label>
                <div className="mt-1">
                  <input 
                    autoComplete="name" 
                    className="form-input block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300"
                    id="name" 
                    name="name" 
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="email">Email address</label>
                <div className="mt-1">
                  <input 
                    autoComplete="email" 
                    className="form-input block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300"
                    id="email" 
                    name="email" 
                    required
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
                    autoComplete="new-password" 
                    className="form-input block w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)] sm:text-sm text-slate-800 dark:text-slate-200 transition-colors duration-300"
                    id="password" 
                    name="password" 
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              {/* New: Role Selection */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Register as:</label>
                <div className="mt-2 space-x-4 flex justify-center">
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                      name="userType" 
                      value="user" 
                      checked={userType === 'user'}
                      onChange={() => setUserType('user')}
                    />
                    <span className="ml-2 text-slate-800 dark:text-slate-200">Normal User</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      className="form-radio text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                      name="userType" 
                      value="admin" 
                      checked={userType === 'admin'}
                      onChange={() => setUserType('admin')}
                    />
                    <span className="ml-2 text-slate-800 dark:text-slate-200">Admin</span>
                  </label>
                </div>
              </div>
              {/* End New: Role Selection */}
              <div>
                <button className="flex w-full justify-center rounded-md border border-transparent bg-[var(--primary-color)] py-2 px-4 text-sm font-semibold text-slate-900 dark:text-white shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 transition-all duration-300" type="submit">
                  Sign Up
                </button>
              </div>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
              {success && <p className="text-green-500 text-center text-sm">{success}</p>}
            </form>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?
            <Link className="font-medium text-[var(--primary-color)] hover:text-opacity-80" to="/login">Log In</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;