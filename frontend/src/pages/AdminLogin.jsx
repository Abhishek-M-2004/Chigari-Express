import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setAlert({ show: true, message: 'Please enter credentials', type: 'error' });
            return;
        }

        setIsLoading(true);
        setAlert({ show: true, message: 'Authenticating...', type: 'processing' });

        try {
            const res = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('admin', JSON.stringify(data.admin));
                setAlert({ show: true, message: 'Admin authenticated!', type: 'success' });
                setTimeout(() => navigate('/admin/dashboard'), 1000);
            } else {
                setAlert({ show: true, message: data.message || 'Invalid credentials', type: 'error' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'Network error', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="visual-side" style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0f 100%)' }}>
                <div className="grid-floor" style={{ opacity: 0.5 }}></div>
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>

                <div className="hero-text">
                    <h1 style={{ fontSize: '5rem' }}>ADMIN</h1>
                    <h2>PORTAL</h2>
                </div>
            </div>

            <div className="control-side">
                <div className="login-container">
                    <div className="panel-header">
                        <h3>// ADMIN ACCESS</h3>
                        <h1>AUTHORIZE</h1>
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

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>
                                <span>Admin ID</span>
                                <span style={{ color: 'var(--accent)' }}>[ROOT]</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder=">> ENTER USERNAME"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>
                                <span>Access Key</span>
                                <span style={{ color: 'var(--accent)' }}>[SECURE]</span>
                            </label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder=">> ENTER PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Authenticating...</>
                            ) : (
                                <>Access Dashboard <i className="fas fa-shield-alt" style={{ marginLeft: '10px' }}></i></>
                            )}
                        </button>
                    </form>
                </div>

                <div className="status-bar">
                    <span>MODE: ADMIN</span>
                    <span>LEVEL: ROOT</span>
                    <span><span className="blink" style={{ color: 'var(--accent)' }}>●</span> SECURE</span>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
