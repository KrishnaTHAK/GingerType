import "../MainBody.css";
import React from "react";
import { useTypingEngine } from "../../../hooks/UseTypingEngine.js";

const Char = React.memo(function Char({ ch, status, index, charRefCallback }) {
    const className =
        "char" +
        (status === "active" ? " active-char" : "") +
        (status === "correct" ? " correct-char" : "") +
        (status === "incorrect" ? " incorrect-char" : "");
    return (
        <span ref={(el) => charRefCallback(index, el)} className={className}>
            {ch === " " ? "\u00A0" : ch}
        </span>
    );
});

export default function TextContainer({ text, durationSeconds = 60, restartSignal }) {
    const {
        words,
        snapshot,
        statuses,
        isPaused,
        showResultModal,
        setShowResultModal,
        resetEngine,
        containerRef,
        setCharNode
    } = useTypingEngine(text, durationSeconds, restartSignal);

    const progressValue = 40; 
    let globalIndex = 0;

    return (
        <div className="container">
            <div className="text-display-card">
                <p className="typing-text" ref={containerRef}>
                    <span className="para">
                        {words.length === 0
                            ? "Select a text type and difficulty to begin"
                            : words.map((word, wi) => {
                                const chars = word.split("");
                                return (
                                    <span key={wi} className="word">
                                        {chars.map((ch) => {
                                            const idx = globalIndex++;
                                            return (
                                                <Char
                                                    key={idx}
                                                    ch={ch}
                                                    index={idx}
                                                    status={statuses[idx]}
                                                    charRefCallback={setCharNode}
                                                />
                                            );
                                        })}
                                    </span>
                                );
                            })}
                    </span>
                </p>

                <div className="live-status-container">
                    <div className="live-stats-bar">Live Stats</div>
                    <div className="live-stats-inside">
                        <div className="stat">
                            WPM: <span className="stat-val">{snapshot.wpm}</span>
                            <br />
                            Accuracy: <span className="stat-val">{snapshot.accuracy}%</span>
                        </div>
                        <div className="live-count">
                            Time Left: <span className="stat-val">{snapshot.timeLeft}s</span>
                        </div>
                    </div>
                </div>

                <div className="mini-chart" />

                <div className="timer-bar">
                    <progress className="test-progress" value={progressValue} max="100" />
                </div>
            </div>

            {showResultModal && (
                <div className="modal-overlay">
                    <div className="result-modal">
                        <div className="modal-navbar">
                            <button className="modal-btn" onClick={() => setShowResultModal(false)}>
                                Close
                            </button>
                            <button className="modal-btn highlight" onClick={resetEngine}>
                                Re-test
                            </button>
                        </div>
                        <div className="modal-content">
                            <h2>Time's Up!</h2>
                            <div className="final-stats">
                                <div className="stat-box">
                                    <span className="stat-label">Speed</span>
                                    <span className="stat-value">{snapshot.wpm} WPM</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Accuracy</span>
                                    <span className="stat-value">{snapshot.accuracy}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}