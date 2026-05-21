import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import "./Profile.css";

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [avatarUploading, setAvatarUploading] = useState(false);

    useEffect(() => {
        if (!user) {
        navigate("/login");
        return;
        }
        fetchAll();
    }, [user]);

    const fetchAll = async () => {
        try {
        const [profileRes, statsRes, trendRes, consistencyRes] =
            await Promise.all([
            api.get("/auth/profile"),
            api.get("/stats"),
            api.get("/analytics/trend"),
            api.get("/analytics/consistency"),
            ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
        setAnalytics({
            trend: trendRes.data,
            consistency: consistencyRes.data,
        });
        } catch (err) {
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("avatar", file);
        setAvatarUploading(true);
        try {
        const res = await api.post("/auth/avatar", formData);
        setProfile((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
        } catch (err) {
        console.error(err);
        } finally {
        setAvatarUploading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) return <div className="profile-loading">Loading...</div>;

    return (
        <div className="profile-container">
        {/* LEFT: User Info */}
        <div className="profile-left">
            <div className="avatar-wrapper">
            <img
                src={profile?.avatarUrl || "/default-avatar.png"}
                alt="avatar"
                className="profile-avatar"
            />
            <label className="avatar-upload-btn">
                {avatarUploading ? "Uploading..." : "Change Avatar"}
                <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                hidden
                />
            </label>
            </div>
            <h2>{profile?.username}</h2>
            <p className="profile-email">{profile?.email}</p>
            <button onClick={handleLogout} className="logout-btn">
            Logout
            </button>
        </div>

        {/* RIGHT: Stats & Analytics */}
        <div className="profile-right">
            {/* Stats Cards */}
            <div className="stats-grid">
            <div className="stat-card">
                <span className="stat-value">{stats?.bestWPM}</span>
                <span className="stat-label">Best WPM</span>
            </div>
            <div className="stat-card">
                <span className="stat-value">{stats?.avgWPM}</span>
                <span className="stat-label">Avg WPM</span>
            </div>
            <div className="stat-card">
                <span className="stat-value">{stats?.avgAccuracy}%</span>
                <span className="stat-label">Avg Accuracy</span>
            </div>
            <div className="stat-card">
                <span className="stat-value">{stats?.totalTests}</span>
                <span className="stat-label">Total Tests</span>
            </div>
            </div>

            {/* Consistency Score */}
            <div className="consistency-card">
            <h3>Consistency Score</h3>
            <div className="consistency-score">
                {analytics?.consistency?.consistency ?? "--"}
                <span>/100</span>
            </div>
            <p>
                Avg WPM: {analytics?.consistency?.avgWPM} | Std Dev:{" "}
                {analytics?.consistency?.stdDev}
            </p>
            </div>

            {/* WPM Trend */}
            <div className="trend-card">
            <h3>WPM Trend (Last {analytics?.trend?.length} tests)</h3>
            <div className="trend-bars">
                {analytics?.trend?.map((r, i) => (
                <div key={i} className="trend-bar-wrapper">
                    <div
                    className="trend-bar"
                    style={{ height: `${Math.min(r.wpm, 150)}px` }}
                    title={`${r.wpm} WPM`}
                    />
                    <span className="trend-label">{r.wpm}</span>
                </div>
                ))}
            </div>
            </div>
        </div>
        </div>
    );
}

export default Profile;
