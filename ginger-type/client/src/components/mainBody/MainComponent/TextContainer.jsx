import '../MainBody.css';

function TextContainer() {
    return (
        <div className="container">

            <div className="text-display-card">
                <p className="typing-text">
                    <span className="para">
                    It is a truth universally acknowledged, that a single man in
                    possession of good fortune, must be in want of a wife. I want
                    to become either rich or join army and become a man worthy of
                    </span>
                </p>

                <div className="live-status-container">
                    <div className="live-stats-bar">
                        Live Stats
                    </div>
                    <div className="live-stats-inside">
                        <div className="stat">
                            WPM: <span className="stat-val">75</span>
                            <br></br>
                            Accuracy: <span className="stat-val">96%</span>
                        </div>
                        <div className="live-count">
                            Time Left: <span className="stat-val">45s</span>
                        </div>
                    </div>
                </div>


                <div className="mini-chart">
                    {/* mini-chart component goes here */}
                </div>

                <div className='timer-bar'>
                    <progress className="test-progress" value="40" max="100"></progress>
                </div>
            </div>
            
        </div>
    );
}

export default TextContainer;