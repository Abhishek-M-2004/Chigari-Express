import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const API_URL = 'http://localhost:5000';

function Scanner() {
    const [scanType, setScanType] = useState('entry');
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    console.log('Location obtained:', position.coords);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    alert('Please enable location services for ticket validation');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            alert('Geolocation is not supported by this device');
        }

        // Initialize scanner
        const html5QrCode = new Html5Qrcode('reader');
        scannerRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const startScanner = () => {
            html5QrCode.start(
                { facingMode: 'environment' },
                config,
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                console.error('Scanner error:', err);
            });
        };

        const onScanSuccess = async (decodedText) => {
            html5QrCode.stop();

            try {
                const qrData = JSON.parse(decodedText);

                if (!currentLocation) {
                    alert('Getting your location... Please wait');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                const response = await fetch(`${API_URL}/api/validate-ticket`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticketId: qrData.ticketId,
                        currentLat: currentLocation?.lat,
                        currentLng: currentLocation?.lng,
                        scanType: scanType
                    })
                });

                const validationResult = await response.json();
                displayResult(validationResult);

                setTimeout(() => {
                    setResult(null);
                    startScanner();
                }, 3000);

            } catch (error) {
                console.error('Validation error:', error);
                displayResult({
                    valid: false,
                    message: 'Invalid QR code format'
                });

                setTimeout(() => {
                    setResult(null);
                    startScanner();
                }, 2000);
            }
        };

        const onScanFailure = (error) => {
            // Ignore scan failures (happens when no QR code is visible)
        };

        const displayResult = (res) => {
            setResult(res);
            setStatus(res.valid ? 'ACCESS GRANTED - OPEN GATE' : 'ACCESS DENIED');

            if (res.valid) {
                console.log('Opening barricade...');
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, [scanType, currentLocation]);

    return (
        <div className="scanner-container">
            <h1>Ticket Scanner</h1>

            <div className="scan-type-select">
                <label>Scan Type: </label>
                <select
                    className="tech-select"
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                    style={{ width: 'auto', display: 'inline-block', marginLeft: '10px' }}
                >
                    <option value="entry">Entry (Source)</option>
                    <option value="exit">Exit (Destination)</option>
                </select>
            </div>

            <div id="reader"></div>

            {result && (
                <div className={`scan-result ${result.valid ? 'valid' : 'invalid'}`}>
                    <h3>{result.valid ? '✅ Valid Ticket' : '❌ Invalid Ticket'}</h3>
                    <p><strong>Message:</strong> {result.message}</p>
                    {result.distance && <p><strong>Distance from stop:</strong> {result.distance}m</p>}
                    {result.scanType && <p><strong>Scan Type:</strong> {result.scanType}</p>}
                    {result.nextAction && <p><strong>Action:</strong> {result.nextAction}</p>}
                </div>
            )}

            {status && (
                <div className={`scan-result ${status.includes('GRANTED') ? 'valid' : 'invalid'}`} style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {status}
                </div>
            )}
        </div>
    );
}

export default Scanner;
