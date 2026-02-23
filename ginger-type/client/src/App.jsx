import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/navbar/Navbar.jsx";
import MainBody from "./components/mainBody/MainBody.jsx";
import Footer from "./components/footer/Footer.jsx";

function App() {
  // 1. State for restarting the typing engine
  const [restartSignal, setRestartSignal] = useState(0);

  // 2. State for the Help Modal visibility
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Triggers a re-render in the typing engine via useEffect
  const handleRestart = () => {
    setRestartSignal((prev) => prev + 1);
  };

  // 3. Close the Help modal automatically when "Escape" is pressed
  useEffect(() => {
    if (!isHelpOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsHelpOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isHelpOpen]);

  // Data for the Help Modal
  const shortcuts = [
    { keys: ["Shift", "Enter"], action: "Reload Test" },
    { keys: ["Escape"], action: "Pause / Resume" },
    { keys: ["Ctrl", "Shift", "P"], action: "Cycle Category" },
    { keys: ["Shift", "D"], action: "Cycle Difficulty" },
  ];

  return (
    <div className="app-wrapper">
      <Navbar />

      <main className="content-area">
        {/* Pass the restart signal down to trigger reset logic in TextContainer */}
        <MainBody restartSignal={restartSignal} />
      </main>

      {/* Pass the restart function and modal toggle function down to the buttons */}
      <Footer
        onRestart={handleRestart}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 4. Inline Help Modal */}
      {isHelpOpen && (
        <div className="help-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h2>Keyboard Shortcuts</h2>
              <button
                className="close-icon"
                onClick={() => setIsHelpOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="help-list">
              {shortcuts.map((s, i) => (
                <div key={i} className="shortcut-row">
                  <span className="shortcut-action">{s.action}</span>
                  <div className="keys">
                    {s.keys.map((k, ki) => (
                      <kbd key={ki} className="key-cap">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
