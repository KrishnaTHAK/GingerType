import './Footer.css'

function Footer() {
    return (
        <div className="footer-container">
            <div className="left-links">
                <a href="#Restart" className="nav-items" >Restart</a>
                <a href="#Share Result" className="nav-items" >Share Result</a>
            </div>
            <div className="center-link">
                <a href="#Feedback" className='nav-center-item'>Feedback</a>
            </div>
            <div className="right-links">
                <a href="#Help" className="nav-items" >? Help</a>
                <a href="#Settings" className="nav-items" >Settings</a>
            </div>
        </div>
    )
}

export default Footer;