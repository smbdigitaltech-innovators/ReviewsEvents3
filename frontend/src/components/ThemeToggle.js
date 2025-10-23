import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark'));

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button 
      className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors duration-300"
      onClick={toggleTheme}
      id="theme-toggle"
    >
      <span className="material-symbols-outlined block dark:hidden">dark_mode</span>
      <span className="material-symbols-outlined hidden dark:block">light_mode</span>
    </button>
  );
};

export default ThemeToggle;