import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import "./Stats.css";

function Stats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [duration, setDuration] = useState(60);
  const [byDuration, setByDuration] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [bestTime, setBestTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [duration]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const promises = [
        api.get(`/leaderboard/${duration}`),
        api.get("/analytics/by-duration"),
        api.get("/analytics/mistakes"),
        api.get("/analytics/best-time"),
      ];
      if (user) promises.push(api.get("/leaderboard/rank"));

      const [lbRes, byDurRes, mistakesRes, bestTimeRes, rankRes] =
        await Promise.all(promises);
      setLeaderboard(lbRes.data);
      setByDuration(byDurRes.data);
      setMistakes(mistakesRes.data);
      setBestTime(bestTimeRes.data);
      if (rankRes) setUserRank(rankRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="stats-loading">Loading...</div>;

  return (
    <div className="stats-container">
      <h2>Stats & Leaderboard</h2>

      {/* Duration Filter */}
      <div className="duration-filter">
        {[15, 30, 60].map((d) => (
          <button
            key={d}
            className={`duration-btn ${duration === d ? "active" : ""}`}
            onClick={() => setDuration(d)}
          >
            {d}s
          </button>
        ))}
      </div>

      <div className="stats-grid">
        {/* Leaderboard */}
        <div className="stats-card">
          <h3>Leaderboard — {duration}s</h3>
          {userRank && (
            <p className="your-rank">
              Your Rank: <strong>#{userRank.rank}</strong> with{" "}
              {userRank.bestWPM} WPM
            </p>
          )}
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Best WPM</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((u, i) => (
                <tr
                  key={i}
                  className={user?.username === u.username ? "highlight" : ""}
                >
                  <td>{i + 1}</td>
                  <td>{u.username}</td>
                  <td>{u.bestWPM}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance by Duration */}
        <div className="stats-card">
          <h3>Performance by Duration</h3>
          {byDuration.map((d, i) => (
            <div key={i} className="duration-stat">
              <span>{d.duration}s</span>
              <div className="duration-bar-wrapper">
                <div
                  className="duration-bar"
                  style={{ width: `${Math.min(d.avgWPM, 200) / 2}%` }}
                />
              </div>
              <span>{d.avgWPM} WPM</span>
            </div>
          ))}
        </div>

        {/* Most Mistaken Characters */}
        <div className="stats-card">
          <h3>Most Mistaken Characters</h3>
          <div className="mistakes-grid">
            {mistakes.map((m, i) => (
              <div key={i} className="mistake-item">
                <span className="mistake-char">{m.char}</span>
                <span className="mistake-count">{m.count}x</span>
              </div>
            ))}
            {mistakes.length === 0 && (
              <p className="no-data">No mistake data yet</p>
            )}
          </div>
        </div>

        {/* Best Time of Day */}
        <div className="stats-card">
          <h3>Best Time of Day</h3>
          {bestTime.slice(0, 5).map((t, i) => (
            <div key={i} className="duration-stat">
              <span>{t.hour}:00</span>
              <div className="duration-bar-wrapper">
                <div
                  className="duration-bar"
                  style={{ width: `${Math.min(t.avgWPM, 200) / 2}%` }}
                />
              </div>
              <span>{t.avgWPM} WPM</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Stats;
