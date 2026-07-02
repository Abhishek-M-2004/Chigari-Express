import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = 'http://localhost:5000';

const STOPS = {
    "Navanagar": 0, "Keshwapur": 2, "CBT": 4, "Unkal": 6,
    "Vidyanagar": 8, "Gokul Road": 10, "Airport Road": 12
};

function Booking() {
    const [user, setUser] = useState(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [fare, setFare] = useState(null);
    const [distance, setDistance] = useState(null);
    const [ticket, setTicket] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [emailNotification, setEmailNotification] = useState({ show: false, email: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    useEffect(() => {
        if (from && to && from !== to) {
            const dist = Math.abs(STOPS[to] - STOPS[from]);
            const calculatedFare = Math.max(dist * 5, 10);
            setDistance(dist);
            setFare(calculatedFare);
        } else {
            setDistance(null);
            setFare(null);
        }
    }, [from, to]);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
    };

    const handleBookTicket = async () => {
        if (!from || !to || from === to) return;

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/create-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, from, to })
            });

            const data = await res.json();

            if (res.ok) {
                setTicket(data.ticket);
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 2000);
                setEmailNotification({ show: true, email: user.email });
                showAlert('Ticket booked successfully!', 'success');
                setTimeout(() => setEmailNotification({ show: false, email: '' }), 8000);
            } else {
                showAlert(`Error: ${data.message || 'Failed'}`, 'error');
            }
        } catch (error) {
            showAlert('Connection error. Check backend.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        const password = prompt('Enter your password to confirm account deletion:');
        if (!password) return;

        const confirmDelete = window.confirm('Are you sure? This will delete all your tickets and cannot be undone.');
        if (!confirmDelete) return;

        try {
            const res = await fetch(`${API_URL}/api/delete-account/${user._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Account deleted successfully');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                alert(data.message || 'Failed to delete account');
            }
        } catch (error) {
            alert('Connection error');
        }
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    const isValidRoute = from && to && from !== to;

    const getButtonText = () => {
        if (isLoading) return <><i className="fas fa-spinner fa-spin"></i> PROCESSING...</>;
        if (from === to && from) return 'INVALID ROUTE';
        if (!from || !to) return 'AWAITING COORDINATES';
        return 'INITIATE BOOKING PROTOCOL';
    };

    if (!user) return null;

    return (
        <div className="dashboard-layout">
            <ThemeToggle />

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="success-modal-overlay">
                    <div className="success-modal">
                        <div className="success-checkmark">
                            <div className="check-icon">
                                <span className="icon-line line-tip"></span>
                                <span className="icon-line line-long"></span>
                                <div className="icon-circle"></div>
                                <div className="icon-fix"></div>
                            </div>
                        </div>
                        <h2>Booking Successful!</h2>
                        <p>Your ticket has been confirmed</p>
                        <p className="success-otp">OTP sent to your email</p>
                    </div>
                </div>
            )}

            <aside className="sidebar">
                <div className="brand-area">
                    <div className="brand-icon"><i className="fas fa-bolt"></i></div>
                    <div className="brand-text">
                        <h1>Chigari<br />Express</h1>
                        <p>SYSTEM V.2.0</p>
                    </div>
                </div>

                <div className="user-mini">
                    <div className="avatar-mini">{getInitials(user.name)}</div>
                    <div className="user-details-mini">
                        <h4>{user.name || 'User'}</h4>
                        <p>{user.email || 'No email'}</p>
                    </div>
                </div>

                <nav className="nav-menu">
                    <button className="nav-btn active">
                        <i className="fas fa-ticket-alt"></i> Online Booking
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/ticket-history')}>
                        <i className="fas fa-history"></i> Ticket History
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/live-map')}>
                        <i className="fas fa-map-marked-alt"></i> Buses Near Me
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    <i className="fas fa-power-off"></i> TERMINATE SESSION
                </button>

                <button className="logout-btn" onClick={handleDeleteAccount} style={{ marginTop: '10px', borderColor: '#ff4444', color: '#ff4444' }}>
                    <i className="fas fa-trash"></i> DELETE ACCOUNT
                </button>
            </aside>

            <main className="main-dashboard">
                <div className="content-wrapper">
                    <div className="dash-header">
                        <div>
                            <h2>CHIGARI EXPRESS</h2>
                            <p>Select route coordinates and confirm passenger details.</p>
                        </div>
                        <div style={{ color: 'var(--accent)', fontFamily: 'Rajdhani', fontWeight: '700' }}>
                            STATUS: ONLINE
                        </div>
                    </div>

                    <div style={{ height: '30px' }}></div>

                    {alert.show && (
                        <div className={`alert-box alert-${alert.type}`}>
                            <i className={`fas fa-${alert.type === 'success' ? 'check-circle' : 'exclamation-triangle'}`}></i>
                            <span>{alert.message}</span>
                        </div>
                    )}

                    {emailNotification.show && (
                        <div className="alert-box alert-success">
                            <i className="fas fa-envelope-open-text"></i>
                            <span>Confirmation sent to {emailNotification.email}</span>
                        </div>
                    )}

                    <div className="booking-panel">
                        <div className="route-selector-grid">
                            <div>
                                <label className="form-label">Departure Station [FROM]</label>
                                <select
                                    className="tech-select"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                >
                                    <option value="">-- SELECT SOURCE --</option>
                                    {Object.keys(STOPS).map(stop => (
                                        <option key={stop} value={stop}>{stop}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Arrival Station [TO]</label>
                                <select
                                    className="tech-select"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                >
                                    <option value="">-- SELECT DEST --</option>
                                    {Object.keys(STOPS)
                                        .filter(stop => stop !== from)
                                        .map(stop => (
                                            <option key={stop} value={stop}>{stop}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="route-visual">
                            <div className="route-line-bg"></div>

                            <div className={`bus-icon-container ${isValidRoute ? 'bus-active' : ''}`}>
                                <i className="fas fa-bus"></i>
                            </div>

                            <div className="station-node" style={{ textAlign: 'left' }}>
                                <div className="dot" style={{ marginLeft: '0' }}></div>
                                <div className="node-label">START</div>
                                <div className="node-name">{from || 'SELECT'}</div>
                            </div>

                            <div className="station-node" style={{ textAlign: 'right' }}>
                                <div className="dot" style={{ background: 'white', marginLeft: 'auto' }}></div>
                                <div className="node-label">END</div>
                                <div className="node-name">{to || 'SELECT'}</div>
                            </div>
                        </div>

                        {isValidRoute && (
                            <div className="fare-grid">
                                <div className="fare-box">
                                    <small>DISTANCE</small>
                                    <strong>{distance} km</strong>
                                </div>
                                <div className="fare-box">
                                    <small>RATE</small>
                                    <strong>₹5/km</strong>
                                </div>
                                <div className="fare-box">
                                    <small>TOTAL</small>
                                    <strong>₹{fare}</strong>
                                </div>
                            </div>
                        )}

                        <button
                            className="action-btn"
                            onClick={handleBookTicket}
                            disabled={!isValidRoute || isLoading}
                        >
                            {getButtonText()}
                        </button>
                    </div>

                    {ticket && (
                        <div className="ticket-panel">
                            <div className="ticket-top"></div>
                            <div className="ticket-body">
                                <div className="ticket-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                        <h3 style={{ margin: 0, fontFamily: 'Rajdhani', textTransform: 'uppercase' }}>E-Ticket Confirmation</h3>
                                        <span style={{ fontFamily: 'Courier New', color: 'var(--accent)' }}>
                                            ID: {(ticket.ticketId || '').substring(0, 8)}
                                        </span>
                                    </div>

                                    <div className="ticket-row">
                                        <div>
                                            <span className="t-label">PASSENGER</span>
                                            <span className="t-val">{user.name}</span>
                                        </div>
                                        <div>
                                            <span className="t-label">DATE</span>
                                            <span className="t-val">{new Date(ticket.createdAt || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="ticket-row">
                                        <div>
                                            <span className="t-label">FROM</span>
                                            <span className="t-val">{ticket.from}</span>
                                        </div>
                                        <div>
                                            <span className="t-label">TO</span>
                                            <span className="t-val">{ticket.to}</span>
                                        </div>
                                    </div>
                                    <div className="ticket-row">
                                        <div>
                                            <span className="t-label">VALID UNTIL</span>
                                            <span className="t-val">{new Date(ticket.validTill).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div>
                                            <span className="t-label">AMOUNT PAID</span>
                                            <span className="t-val highlight">₹{ticket.amount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ticket-qr-zone">
                                    <div className="qr-code">
                                        {ticket.qrCodeDataURL && (
                                            <img id="qr-image" src={ticket.qrCodeDataURL} alt="QR Code" />
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-gray)', marginTop: '10px', textAlign: 'center' }}>
                                        SCAN AT TERMINAL
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Booking;
