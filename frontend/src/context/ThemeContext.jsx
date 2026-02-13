
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Check local storage on load
        const storedTheme = localStorage.getItem('movieguru_theme');
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    useEffect(() => {
        // Apply theme class to html element
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Save to localStorage
        localStorage.setItem('movieguru_theme', theme);
    }, [theme]);

    function toggleTheme() {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    }

    const value = {
        theme,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
