import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!name || !email || !password) {
            setAlert({ show: true, message: 'Please fill in all fields', type: 'error' });
            return;
        }

        if (password.length < 6) {
            setAlert({ show: true, message: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        setAlert({ show: true, message: 'Processing...', type: 'processing' });

        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                setAlert({ show: true, message: 'Success! Redirecting...', type: 'success' });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const errorData = await response.json();
                setAlert({ show: true, message: errorData.message || 'Registration failed', type: 'error' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'Network error.', type: 'error' });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleRegister(e);
    };

    return (
        <div className="auth-container">
            <div className="visual-panel">
                <div className="speed-lines">
                    <div className="line l1"></div>
                    <div className="line l2"></div>
                    <div className="line l3"></div>
                </div>

                <div className="hero-content">
                    <div className="logo-mark"><i className="fas fa-bolt"></i></div>
                    <h1>Chigari<br /><span>Express</span></h1>
                    <p>High-velocity travel requires a high-security identity. Create yours now.</p>
                </div>
            </div>

            <div className="form-panel">
                <div className="card-wrapper">
                    <div className="form-card">
                        <div className="form-header">
                            <h2>New Account</h2>
                            <p>Enter your details to generate your passenger ID</p>
                        </div>

                        {alert.show && (
                            <div
                                className="alert"
                                style={{
                                    display: 'flex',
                                    color: alert.type === 'success' ? '#00ff9d' : alert.type === 'processing' ? 'white' : 'var(--accent)'
                                }}
                            >
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{alert.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleRegister} onKeyPress={handleKeyPress}>
                            <div className="input-group">
                                <label className="input-label" htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="form-input"
                                    placeholder="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="btn">
                                Create Account <i className="fas fa-arrow-right"></i>
                            </button>
                        </form>

                        <div className="form-footer">
                            Already have a Passenger ID? <Link to="/login">Login Here</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
