import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Auth.css";

function Register() {
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
        await api.post("/auth/register", form);
        setSuccess(
            "Registration successful! Please check your email to verify your account.",
        );
        setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
        setError(err.response?.data?.message || "Registration failed");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-container">
        <div className="auth-box">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join GingerType today</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form onSubmit={handleSubmit}>
            <div className="auth-field">
                <label>Username</label>
                <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                />
            </div>
            <div className="auth-field">
                <label>Email</label>
                <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                />
            </div>
            <div className="auth-field">
                <label>Password</label>
                <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Choose a password"
                required
                />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Registering..." : "Create Account"}
            </button>
            </form>

            <div className="auth-links">
            <Link to="/login">Already have an account? Login</Link>
            </div>

            <div className="auth-divider">or</div>

            <a href="http://localhost:8080/auth/google" className="google-btn">
            Continue with Google
            </a>
        </div>
        </div>
    );
}

export default Register;
