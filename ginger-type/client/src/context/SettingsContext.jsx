import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'medium')
    const [sound, setSound] = useState(localStorage.getItem('sound') === 'true')

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        document.documentElement.setAttribute('data-fontsize', fontSize)
        localStorage.setItem('fontSize', fontSize)
    }, [fontSize])

    useEffect(() => {
        localStorage.setItem('sound', sound)
    }, [sound])

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

    return (
        <SettingsContext.Provider value={{ theme, toggleTheme, fontSize, setFontSize, sound, setSound }}>
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => useContext(SettingsContext)