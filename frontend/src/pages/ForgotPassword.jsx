import { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setAlert({ show: true, message: 'Please enter your email', type: 'error' });
            return;
        }

        setIsLoading(true);
        setAlert({ show: true, message: 'Sending reset link...', type: 'processing' });

        try {
            const res = await fetch(`${API_URL}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                setAlert({ show: true, message: 'Password reset link sent to your email!', type: 'success' });
            } else {
                setAlert({ show: true, message: data.message || 'Failed to send reset email', type: 'error' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'Network error', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

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
                        <h3>// PASSWORD RECOVERY</h3>
                        <h1>RESET</h1>
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
                                <span>Email Address</span>
                                <span style={{ color: 'var(--accent)' }}>[REQ]</span>
                            </label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder=">> ENTER YOUR EMAIL"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn" disabled={isLoading}>
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                            ) : (
                                <>Send Reset Link <i className="fas fa-paper-plane" style={{ marginLeft: '10px' }}></i></>
                            )}
                        </button>
                    </form>

                    <p className="form-link">
                        Remember your password? <Link to="/login">Login Here</Link>
                    </p>
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

export default ForgotPassword;
