import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = 'http://localhost:5000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setAlert({ show: true, message: 'ACCESS DENIED: INPUTS REQUIRED', type: 'error' });
      return;
    }

    setAlert({ show: true, message: 'PROCESSING...', type: 'processing' });

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const user = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(user));
        setAlert({ show: true, message: 'AUTHENTICATION VERIFIED', type: 'success' });
        setTimeout(() => navigate('/booking'), 1500);
      } else {
        setAlert({ show: true, message: (user.message || 'INVALID CREDENTIALS').toUpperCase(), type: 'error' });
      }
    } catch (error) {
      setAlert({ show: true, message: 'CONNECTION FAILURE', type: 'error' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin(e);
  };

  return (
    <div className="auth-container">
      <ThemeToggle />
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
            <h3>// SYSTEM ACCESS</h3>
            <h1>IDENTIFY</h1>
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

          <form onSubmit={handleLogin} onKeyPress={handleKeyPress}>
            <div className="input-group">
              <label>
                <span>User ID</span>
                <span style={{ color: 'var(--accent)' }}>[REQ]</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder=">> ENTER EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>
                <span>Passcode</span>
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

            <button type="submit" className="btn">
              Initialise <i className="fas fa-chevron-right" style={{ marginLeft: '10px' }}></i>
            </button>
          </form>

          <p className="form-link">
            NO CREDENTIALS? <Link to="/register">REQUEST ACCESS</Link>
          </p>
          <p className="form-link" style={{ marginTop: '10px' }}>
            <Link to="/forgot-password">FORGOT PASSWORD?</Link>
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

export default Login;
