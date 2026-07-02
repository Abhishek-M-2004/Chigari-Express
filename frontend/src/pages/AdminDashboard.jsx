import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otp, setOtp] = useState('');
    const [gateStatus, setGateStatus] = useState({ status: 'CLOSED', message: '', ticket: null });
    const [verifying, setVerifying] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [verifyMode, setVerifyMode] = useState('otp'); // 'otp' or 'qr'
    const scannerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const admin = localStorage.getItem('admin');
        if (!admin) {
            navigate('/admin');
            return;
        }
        fetchStats();

        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => {
            clearInterval(interval);
            stopScanner();
        };
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/stats`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 4) {
            setGateStatus({ status: 'CLOSED', message: 'Enter a valid 4-digit OTP', ticket: null });
            return;
        }

        setVerifying(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
            });

            const data = await res.json();
            handleGateResponse(data);
            if (data.valid) setOtp('');
        } catch (error) {
            setGateStatus({ status: 'CLOSED', message: 'Network error', ticket: null });
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyQR = async (ticketId) => {
        setVerifying(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/verify-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId })
            });

            const data = await res.json();
            handleGateResponse(data);
        } catch (error) {
            setGateStatus({ status: 'CLOSED', message: 'Network error', ticket: null });
        } finally {
            setVerifying(false);
        }
    };

    const handleGateResponse = (data) => {
        setGateStatus({
            status: data.gateStatus,
            message: data.message,
            ticket: data.ticket || null
        });

        if (data.valid) {
            setTimeout(() => {
                setGateStatus({ status: 'CLOSED', message: 'Gate closed automatically', ticket: null });
            }, 5000);
            fetchStats();
        }
    };

    const startScanner = async () => {
        try {
            // Dynamically import to avoid SSR issues
            const { Html5Qrcode } = await import('html5-qrcode');

            setGateStatus({ status: 'CLOSED', message: 'Starting camera...', ticket: null });

            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "user" }, // Use front camera for laptop
                { fps: 10, qrbox: { width: 200, height: 200 } },
                (decodedText) => {
                    html5QrCode.stop().then(() => {
                        setScannerActive(false);
                        scannerRef.current = null;
                        try {
                            const qrData = JSON.parse(decodedText);
                            if (qrData.ticketId) {
                                handleVerifyQR(qrData.ticketId);
                            } else {
                                setGateStatus({ status: 'CLOSED', message: 'Invalid QR code format', ticket: null });
                            }
                        } catch {
                            setGateStatus({ status: 'CLOSED', message: 'Could not parse QR code', ticket: null });
                        }
                    }).catch(() => { });
                },
                () => { } // Ignore scan errors
            );

            setScannerActive(true);
            setGateStatus({ status: 'CLOSED', message: 'Scanner ready - show QR code', ticket: null });
        } catch (err) {
            console.error("Scanner error:", err);
            let errorMsg = 'Camera error';
            const errStr = err.toString();
            if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
                errorMsg = 'Camera permission denied. Click lock icon in address bar → Allow camera';
            } else if (errStr.includes('NotFoundError')) {
                errorMsg = 'No camera found on this device';
            } else if (errStr.includes('NotReadableError') || errStr.includes('in use')) {
                errorMsg = 'Camera in use by another app';
            } else {
                errorMsg = err.message || 'Failed to start camera';
            }
            setGateStatus({ status: 'CLOSED', message: errorMsg, ticket: null });
            setScannerActive(false);
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current = null;
                setScannerActive(false);
            }).catch(() => {
                scannerRef.current = null;
                setScannerActive(false);
            });
        }
    };

    const handleLogout = () => {
        stopScanner();
        localStorage.removeItem('admin');
        navigate('/admin');
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-deep)',
                color: 'var(--text-gray)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem' }}></i>
                    <p style={{ marginTop: '20px' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <aside className="sidebar" style={{ background: '#0a0505' }}>
                <div className="brand-area">
                    <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #ff003c, #cc0030)' }}>
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <div className="brand-text">
                        <h1>Admin<br />Panel</h1>
                        <p>CHIGARI EXPRESS</p>
                    </div>
                </div>

                <nav className="nav-menu">
                    <button className="nav-btn active">
                        <i className="fas fa-chart-bar"></i> Dashboard
                    </button>
                    <button className="nav-btn" onClick={() => document.getElementById('gate-section').scrollIntoView({ behavior: 'smooth' })}>
                        <i className="fas fa-door-open"></i> Gate Control
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> LOGOUT
                </button>
            </aside>

            <main className="main-dashboard">
                <div className="content-wrapper" style={{ maxWidth: '1200px' }}>
                    <div className="dash-header">
                        <div>
                            <h2>ADMIN DASHBOARD</h2>
                            <p>System overview and gate control</p>
                        </div>
                        <button
                            onClick={fetchStats}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                color: 'var(--text-gray)',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                borderRadius: '4px'
                            }}
                        >
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '40px'
                    }}>
                        <div className="booking-panel" style={{ textAlign: 'center', borderLeft: '3px solid #00ff9d' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#00ff9d' }}>{stats?.totalUsers || 0}</div>
                            <div style={{ color: 'var(--text-gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Users</div>
                        </div>
                        <div className="booking-panel" style={{ textAlign: 'center', borderLeft: '3px solid #3498db' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3498db' }}>{stats?.totalTickets || 0}</div>
                            <div style={{ color: 'var(--text-gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Bookings</div>
                        </div>
                        <div className="booking-panel" style={{ textAlign: 'center', borderLeft: '3px solid var(--accent)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>₹{stats?.totalRevenue || 0}</div>
                            <div style={{ color: 'var(--text-gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Revenue</div>
                        </div>
                        <div className="booking-panel" style={{ textAlign: 'center', borderLeft: '3px solid #f39c12' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f39c12' }}>{stats?.activeTickets || 0}</div>
                            <div style={{ color: 'var(--text-gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Tickets</div>
                        </div>
                    </div>

                    {/* Gate Control Section */}
                    <div id="gate-section" className="booking-panel" style={{ marginBottom: '40px' }}>
                        <h3 style={{
                            fontFamily: 'Rajdhani',
                            fontSize: '1.5rem',
                            marginBottom: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="fas fa-door-open"></i> BUS GATE CONTROL
                        </h3>

                        {/* Mode Toggle */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                            <button
                                onClick={() => { setVerifyMode('otp'); stopScanner(); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: verifyMode === 'otp' ? 'var(--accent)' : 'transparent',
                                    border: '1px solid var(--accent)',
                                    color: verifyMode === 'otp' ? 'white' : 'var(--accent)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                <i className="fas fa-keyboard"></i> Enter OTP
                            </button>
                            <button
                                onClick={() => setVerifyMode('qr')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: verifyMode === 'qr' ? 'var(--accent)' : 'transparent',
                                    border: '1px solid var(--accent)',
                                    color: verifyMode === 'qr' ? 'white' : 'var(--accent)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                <i className="fas fa-qrcode"></i> Scan QR Code
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            {/* OTP / QR Input */}
                            <div>
                                {verifyMode === 'otp' ? (
                                    <>
                                        <label className="form-label">Enter Passenger OTP</label>
                                        <input
                                            type="text"
                                            className="tech-select"
                                            placeholder="4-digit OTP"
                                            maxLength={4}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            style={{
                                                fontSize: '2rem',
                                                textAlign: 'center',
                                                letterSpacing: '10px',
                                                fontFamily: 'Courier New',
                                                width: '100%'
                                            }}
                                        />
                                        <button
                                            className="action-btn"
                                            onClick={handleVerifyOTP}
                                            disabled={verifying || otp.length !== 4}
                                            style={{ marginTop: '15px' }}
                                        >
                                            {verifying ? (
                                                <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                                            ) : (
                                                <>Verify & Open Gate <i className="fas fa-unlock"></i></>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <label className="form-label">Scan Ticket QR Code</label>
                                        <div
                                            id="qr-reader"
                                            style={{
                                                width: '100%',
                                                maxWidth: '300px',
                                                background: '#111',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                minHeight: '220px'
                                            }}
                                        />
                                        <button
                                            className="action-btn"
                                            onClick={scannerActive ? stopScanner : startScanner}
                                            disabled={verifying}
                                            style={{ marginTop: '15px' }}
                                        >
                                            {scannerActive ? (
                                                <><i className="fas fa-stop"></i> Stop Scanner</>
                                            ) : (
                                                <><i className="fas fa-camera"></i> Start Scanner</>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Gate Status */}
                            <div style={{
                                background: gateStatus.status === 'OPEN'
                                    ? 'linear-gradient(135deg, rgba(0, 255, 157, 0.2), rgba(0, 200, 100, 0.1))'
                                    : 'rgba(255, 0, 60, 0.1)',
                                border: `2px solid ${gateStatus.status === 'OPEN' ? '#00ff9d' : 'var(--accent)'}`,
                                borderRadius: '8px',
                                padding: '30px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '15px',
                                    color: gateStatus.status === 'OPEN' ? '#00ff9d' : 'var(--accent)'
                                }}>
                                    <i className={`fas ${gateStatus.status === 'OPEN' ? 'fa-door-open' : 'fa-door-closed'}`}></i>
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    fontFamily: 'Rajdhani',
                                    color: gateStatus.status === 'OPEN' ? '#00ff9d' : 'var(--accent)'
                                }}>
                                    GATE {gateStatus.status}
                                </div>
                                {gateStatus.message && (
                                    <p style={{ color: 'var(--text-gray)', marginTop: '10px', fontSize: '0.9rem' }}>
                                        {gateStatus.message}
                                    </p>
                                )}
                                {gateStatus.ticket && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '10px',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        textAlign: 'left'
                                    }}>
                                        <div><strong>Passenger:</strong> {gateStatus.ticket.passenger}</div>
                                        <div><strong>Route:</strong> {gateStatus.ticket.from} → {gateStatus.ticket.to}</div>
                                        <div><strong>Fare:</strong> ₹{gateStatus.ticket.amount}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Usage Reports */}
                    <div className="booking-panel" style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontFamily: 'Rajdhani', fontSize: '1.5rem', marginBottom: '25px' }}>
                            <i className="fas fa-chart-line"></i> Daily Bookings (Last 7 Days)
                        </h3>
                        {stats?.dailyBookings?.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '200px' }}>
                                {stats.dailyBookings.map((day, index) => {
                                    const maxCount = Math.max(...stats.dailyBookings.map(d => d.count));
                                    const height = maxCount > 0 ? (day.count / maxCount) * 150 : 20;
                                    return (
                                        <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{
                                                height: `${Math.max(height, 20)}px`,
                                                background: 'linear-gradient(to top, var(--accent), #ff4466)',
                                                borderRadius: '4px 4px 0 0',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'center',
                                                paddingTop: '5px'
                                            }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{day.count}</span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--text-gray)',
                                                marginTop: '8px'
                                            }}>
                                                {new Date(day._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>
                                No booking data available
                            </p>
                        )}
                    </div>

                    {/* Recent Tickets */}
                    <div className="booking-panel">
                        <h3 style={{ fontFamily: 'Rajdhani', fontSize: '1.5rem', marginBottom: '25px' }}>
                            <i className="fas fa-history"></i> Recent Bookings
                        </h3>
                        {stats?.recentTickets?.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Passenger</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Route</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentTickets.map((ticket) => (
                                            <tr key={ticket._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div>{ticket.userId?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                                                        {ticket.userId?.email || ''}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px' }}>{ticket.from} → {ticket.to}</td>
                                                <td style={{ padding: '12px', color: 'var(--accent)', fontWeight: '600' }}>₹{ticket.amount}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: ticket.status === 'active' ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                                        color: ticket.status === 'active' ? '#00ff9d' : '#888'
                                                    }}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>
                                No recent bookings
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
