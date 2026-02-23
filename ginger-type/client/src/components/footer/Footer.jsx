import './Footer.css'

function Footer({ onRestart, onOpenHelp }) {
return (
    <div className="footer-container">
        <div className="left-links">
            <button onClick={onRestart} className="nav-items">Restart</button>
            <a href="#ShareResult" className="nav-items">Share Result</a>
        </div>
        
        <a href="https://forms.gle/Znz6PUnjtsjCw9eZA" target="_blank" className="nav-center-item" >Feedback</a>
        
        <div className="right-links">
                <button onClick={onOpenHelp} className="nav-items">Shortcuts</button>
                <a href="#Settings" className="nav-items">Settings</a>
            </div>
    </div>
    );
}

export default Footer;
