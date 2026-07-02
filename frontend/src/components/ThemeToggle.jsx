import { useState, useEffect } from 'react';

function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsDark(false);
            document.body.classList.add('light-theme');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {isDark ? '☀️' : '🌙'}
        </button>
    );
}

export default ThemeToggle;
