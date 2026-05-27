import { useSettings } from '../../context/SettingsContext'
import './SettingsModal.css'

function SettingsModal({ onClose }) {
    const { theme, toggleTheme, fontSize, setFontSize, sound, setSound } = useSettings()

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-box" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-icon" onClick={onClose}>&times;</button>
                </div>

                <div className="settings-list">

                    {/* Theme */}
                    <div className="settings-row">
                        <div className="settings-label">
                            <span>Theme</span>
                            <small>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</small>
                        </div>
                        <button className="toggle-btn" onClick={toggleTheme}>
                            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                        </button>
                    </div>

                    {/* Font Size */}
                    <div className="settings-row">
                        <div className="settings-label">
                            <span>Font Size</span>
                            <small>Typing text size</small>
                        </div>
                        <div className="option-group">
                            {['small', 'medium', 'large'].map(size => (
                                <button
                                    key={size}
                                    className={`option-btn ${fontSize === size ? 'active' : ''}`}
                                    onClick={() => setFontSize(size)}
                                >
                                    {size.charAt(0).toUpperCase() + size.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sound */}
                    <div className="settings-row">
                        <div className="settings-label">
                            <span>Sound Effects</span>
                            <small>Keypress sounds</small>
                        </div>
                        <button
                            className={`toggle-btn ${sound ? 'active' : ''}`}
                            onClick={() => setSound(prev => !prev)}
                        >
                            {sound ? '🔊 On' : '🔇 Off'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default SettingsModal