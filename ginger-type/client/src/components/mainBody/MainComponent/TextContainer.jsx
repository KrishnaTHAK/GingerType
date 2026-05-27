import "../MainBody.css";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import { useTypingEngine } from "../../../hooks/UseTypingEngine.js";
import ShareResult from "../../ShareResult/ShareResult.jsx";

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

    export default function TextContainer({
        text,
        durationSeconds = 60,
        restartSignal,
        onResultSaved,
    }) {
    const { user } = useAuth();
    const {
        words,
        snapshot,
        statuses,
        showResultModal,
        setShowResultModal,
        resetEngine,
        containerRef,
        setCharNode,
    } = useTypingEngine(text, durationSeconds, restartSignal);

    // add state
    const [showShare, setShowShare] = useState(false)
        
    const progressValue =
      ((durationSeconds - snapshot.timeLeft) / durationSeconds) * 100;
    let globalIndex = 0;

    // Save result to backend when test ends
    useEffect(() => {
        if (!showResultModal || !user) return;

        const saveResult = async () => {
        try {
            // Calculate mistakes heatmap
            const mistakes = {};
            const typed = snapshot.typed || [];
            for (let i = 0; i < typed.length; i++) {
            const char = text[i];
            if (char && typed[i] !== char) {
                mistakes[typed[i]] = (mistakes[typed[i]] || 0) + 1;
            }
            }

            await api.post("/results", {
            wpm: snapshot.wpm,
            accuracy: snapshot.accuracy,
            duration: durationSeconds,
            mode: "classic",
            mistakes,
            });

            if (onResultSaved) {
                onResultSaved({
                    wpm: snapshot.wpm,
                    accuracy: snapshot.accuracy,
                    duration: durationSeconds,
                });
            }

            console.log("Result saved successfully");
        } catch (err) {
            console.error("Failed to save result:", err);
        }
        };

        saveResult();
    }, [showResultModal, user, snapshot, text, durationSeconds]);

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
                {/* // inside the result modal, add Share button */}
                <button className="modal-btn" onClick={() => setShowShare(true)}>
                    Share
                </button>
                <button
                    className="modal-btn"
                    onClick={() => setShowResultModal(false)}
                >
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
            {/* // add ShareResult modal after the result modal */}
        {showShare && (
            <ShareResult
                wpm={snapshot.wpm}
                accuracy={snapshot.accuracy}
                duration={durationSeconds}
                onClose={() => setShowShare(false)}
            />
        )}
        </div>  
    );
}
