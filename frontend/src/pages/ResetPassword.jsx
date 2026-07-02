import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            setAlert({ show: true, message: 'Please fill in all fields', type: 'error' });
            return;
        }

        if (password.length < 6) {
            setAlert({ show: true, message: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        if (password !== confirmPassword) {
            setAlert({ show: true, message: 'Passwords do not match', type: 'error' });
            return;
        }

        setIsLoading(true);
        setAlert({ show: true, message: 'Resetting password...', type: 'processing' });

        try {
            const res = await fetch(`${API_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await res.json();

            if (res.ok) {
                setAlert({ show: true, message: 'Password reset successful! Redirecting...', type: 'success' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setAlert({ show: true, message: data.message || 'Failed to reset password', type: 'error' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'Network error', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <div className="visual-side">
                    <div className="grid-floor"></div>
                    <div className="hero-text">
                        <h1>CHIGARI</h1>
                        <h2>EXPRESS</h2>
                    </div>
                </div>
                <div className="control-side">
                    <div className="login-container" style={{ textAlign: 'center' }}>
                        <h2 style={{ color: 'var(--accent)' }}>Invalid Reset Link</h2>
                        <p style={{ color: 'var(--text-gray)', marginTop: '20px' }}>
                            This password reset link is invalid or has expired.
                        </p>
                        <Link to="/forgot-password" className="btn" style={{ display: 'inline-block', marginTop: '30px' }}>
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="visual-side">
                <div className="grid-floor"></div>
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>

                <div className="hero-text">
                    <h1>CHIGARI</h1>
                    <h2>EXPRESS</h2>
                </div>
            </div>

            <div className="control-side">
                <div className="login-container">
                    <div className="panel-header">
                        <h3>// NEW PASSWORD</h3>
                        <h1>SECURE</h1>
                    </div>

                    {alert.show && (
                        <div
                            className={`alert ${alert.type === 'success' ? 'alert-success' : ''}`}
                            style={alert.type === 'processing' ? { borderColor: 'white', color: 'white' } : {}}
                        >
                            <i className={`fas ${alert.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                            <div>{alert.message}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>
                                <span>New Password</span>
                                <span style={{ color: 'var(--accent)' }}>[MIN 6]</span>
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder=">> ENTER NEW PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>
                                <span>Confirm Password</span>
                                <span style={{ color: 'var(--accent)' }}>[MATCH]</span>
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder=">> CONFIRM PASSWORD"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Resetting...</>
                            ) : (
                                <>Reset Password <i className="fas fa-key" style={{ marginLeft: '10px' }}></i></>
                            )}
                        </button>
                    </form>
                </div>

                <div className="status-bar">
                    <span>SYS: ONLINE</span>
                    <span>LOC: HUBBALLI</span>
                    <span><span className="blink">●</span> CONNECTED</span>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
