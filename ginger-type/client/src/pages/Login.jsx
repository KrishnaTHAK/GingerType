import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import "./Auth.css";

function Login() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
        const res = await api.post("/auth/login", form);
        login(res.data.token, res.data.user);
        navigate("/");
        } catch (err) {
        setError(err.response?.data?.message || "Login failed");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="auth-container">
        <div className="auth-box">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Login to GingerType</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
            <div className="auth-field">
                <label>Username</label>
                <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
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
                placeholder="Enter your password"
                required
                />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
            </button>
            </form>

            <div className="auth-links">
            <Link to="/register">Don't have an account? Register</Link>
            <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <div className="auth-divider">or</div>

            <a href="http://localhost:8080/auth/google" className="google-btn">
            Continue with Google
            </a>
        </div>
        </div>
    );
}

export default Login;
