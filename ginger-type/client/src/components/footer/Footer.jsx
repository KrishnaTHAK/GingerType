import './Footer.css'

function Footer({ onRestart, onOpenHelp, onOpenSettings, onShareResult }) {
    return (
        <div className="footer-container">
            <div className="left-links">
                <button onClick={onRestart} className="nav-items">Restart</button>
                <button onClick={onShareResult} className="nav-items">Share Result</button>
            </div>
            <a href="https://forms.gle/Znz6PUnjtsjCw9eZA" target="_blank" className="nav-center-item">Feedback</a>
            <div className="right-links">
                <button onClick={onOpenHelp} className="nav-items">Shortcuts</button>
                <button onClick={onOpenSettings} className="nav-items">Settings</button>
            </div>
        </div>
    )
}

export default Footer;