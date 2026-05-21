import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Auth.css";

function ResetPassword() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
        await api.post(`/auth/reset-password/${token}`, { password });
        setSuccess("Password reset successfully!");
        setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
        setError(err.response?.data?.message || "Reset failed");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-container">
        <div className="auth-box">
            <h2>Reset Password</h2>
            <p className="auth-subtitle">Enter your new password</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form onSubmit={handleSubmit}>
            <div className="auth-field">
                <label>New Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
            </button>
            </form>
        </div>
        </div>
    );
}

export default ResetPassword;
