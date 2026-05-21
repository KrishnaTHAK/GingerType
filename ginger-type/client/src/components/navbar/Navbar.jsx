import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";
import LogoImg from "../../assets/logo_1.png";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
        <div className="navbar-logo">
            <Link to="/">
            <img src={LogoImg} alt="Website Logo" className="website-logo" />
            </Link>
            <span className="logo-text">GingerType</span>
        </div>
        <div className="left-buttons">
            <Link to="/" className="nav-item">
            Tests
            </Link>
            <Link to="/stats" className="nav-item">
            Stats
            </Link>
            <Link to="/profile" className="nav-item">
            Profile
            </Link>
            {user ? (
            <button onClick={handleLogout} className="nav-item">
                Logout
            </button>
            ) : (
            <Link to="/login" className="nav-item">
                Login
            </Link>
            )}
            <button className="theme-toggle">🌙</button>
        </div>
        </nav>
    );
}

export default Navbar;
