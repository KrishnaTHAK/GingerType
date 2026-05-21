import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import "./Auth.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
        await api.post("/auth/forgot-password", { email });
        setSuccess("Password reset email sent! Check your inbox.");
        } catch (err) {
        setError(err.response?.data?.message || "Something went wrong");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-container">
        <div className="auth-box">
            <h2>Forgot Password</h2>
            <p className="auth-subtitle">Enter your email to reset your password</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form onSubmit={handleSubmit}>
            <div className="auth-field">
                <label>Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
            </button>
            </form>

            <div className="auth-links">
            <Link to="/login">Back to Login</Link>
            </div>
        </div>
        </div>
    );
}

export default ForgotPassword;
