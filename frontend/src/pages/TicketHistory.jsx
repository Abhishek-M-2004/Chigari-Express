import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = 'http://localhost:5000';

function TicketHistory() {
    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchTickets(userData._id);
    }, [navigate]);

    const fetchTickets = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/api/tickets/${userId}`);
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: { background: 'rgba(0, 255, 157, 0.2)', color: '#00ff9d', border: '1px solid #00ff9d' },
            used: { background: 'rgba(255, 255, 255, 0.1)', color: '#888', border: '1px solid #444' },
            expired: { background: 'rgba(255, 0, 60, 0.2)', color: '#ff003c', border: '1px solid #ff003c' }
        };
        return (
            <span style={{
                ...styles[status],
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: '600'
            }}>
                {status}
            </span>
        );
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="dashboard-layout">
            <ThemeToggle />
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
                    <button className="nav-btn" onClick={() => navigate('/booking')}>
                        <i className="fas fa-ticket-alt"></i> Book Ticket
                    </button>
                    <button className="nav-btn active">
                        <i className="fas fa-history"></i> Ticket History
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/live-map')}>
                        <i className="fas fa-map-marked-alt"></i> Buses Near Me
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    <i className="fas fa-power-off"></i> TERMINATE SESSION
                </button>
            </aside>

            <main className="main-dashboard">
                <div className="content-wrapper">
                    <div className="dash-header">
                        <div>
                            <h2>TICKET HISTORY</h2>
                            <p>View all your past and current bookings</p>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-gray)' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
                            <p style={{ marginTop: '15px' }}>Loading tickets...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-gray)' }}>
                            <i className="fas fa-ticket-alt" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                            <p style={{ marginTop: '15px' }}>No tickets found. Book your first ticket!</p>
                            <button
                                className="btn"
                                style={{ maxWidth: '300px', margin: '20px auto' }}
                                onClick={() => navigate('/booking')}
                            >
                                Book Now
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket._id}
                                    className="booking-panel"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr auto',
                                        alignItems: 'center',
                                        gap: '20px'
                                    }}
                                >
                                    <div>
                                        <span className="t-label">ROUTE</span>
                                        <span className="t-val" style={{ display: 'block' }}>
                                            {ticket.from} → {ticket.to}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="t-label">DATE</span>
                                        <span className="t-val" style={{ display: 'block' }}>
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="t-label">AMOUNT</span>
                                        <span className="t-val highlight" style={{ display: 'block' }}>
                                            ₹{ticket.amount}
                                        </span>
                                    </div>
                                    <div>
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default TicketHistory;
