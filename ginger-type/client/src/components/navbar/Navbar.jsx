import './Navbar.css'
import LogoImg from '../../assets/logo_1.png'

function Navbar() {
    return (
        <nav className='navbar'>
            <div className="navbar-logo">
                <img src={LogoImg} alt="Website Logo" className='website-logo' />
                <span className="logo-text">GingerType</span>
            </div>
            <div className="left-buttons">
                <a href="#tests" className="nav-item">Tests</a>
                <a href="#stats" className="nav-item">Stats</a>
                <a href="#profile" className="nav-item">Profile</a>
                <button className="theme-toggle">
                    🌙
                </button>
            </div>
        </nav>
    );
}

export default Navbar;