import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/navbar/Navbar.jsx";
import MainBody from "./components/mainBody/MainBody.jsx";
import Footer from "./components/footer/Footer.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Stats from "./pages/Stats.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";


function App() {
  const [restartSignal, setRestartSignal] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleRestart = () => setRestartSignal((prev) => prev + 1);

  useEffect(() => {
    if (!isHelpOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsHelpOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isHelpOpen]);

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
        <Routes>
          <Route
            path="/"
            element={<MainBody restartSignal={restartSignal} />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />;
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </main>

      <Footer
        onRestart={handleRestart}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

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
