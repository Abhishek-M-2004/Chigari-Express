import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = 'http://localhost:5000';

function LiveMap() {
    const [status, setStatus] = useState('📍 Locating you...');
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const busLayerRef = useRef(null);
    const userLocationRef = useRef({ lat: null, lng: null });

    useEffect(() => {
        // Initialize map
        if (!mapRef.current) {
            const map = L.map('map').setView([15.3647, 75.1240], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            busLayerRef.current = L.layerGroup().addTo(map);
            mapRef.current = map;
        }

        // Custom bus icon
        const busIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
            iconSize: [30, 30]
        });

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    userLocationRef.current = { lat: userLat, lng: userLng };

                    setStatus('✅ Location Found. Showing nearest buses.');
                    mapRef.current.setView([userLat, userLng], 14);

                    if (userMarkerRef.current) {
                        userMarkerRef.current.setLatLng([userLat, userLng]);
                    } else {
                        userMarkerRef.current = L.marker([userLat, userLng])
                            .addTo(mapRef.current)
                            .bindPopup('You are here')
                            .openPopup();
                    }
                },
                (error) => {
                    setStatus('❌ Location Access Denied.');
                    console.error('Error getting location:', error);
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }

        // Socket connection for bus updates
        const socket = io(API_URL);

        socket.on('busUpdate', (buses) => {
            const { lat: userLat, lng: userLng } = userLocationRef.current;
            if (userLat === null || userLng === null) return;

            // Calculate distance to user
            buses.forEach(bus => {
                bus.distance = Math.sqrt(
                    Math.pow(bus.lat - userLat, 2) +
                    Math.pow(bus.lng - userLng, 2)
                );
            });

            // Sort by distance and pick top 3
            buses.sort((a, b) => a.distance - b.distance);
            const nearestBuses = buses.slice(0, 3);

            // Draw buses
            busLayerRef.current.clearLayers();
            nearestBuses.forEach(bus => {
                L.marker([bus.lat, bus.lng], { icon: busIcon })
                    .bindPopup(`<b>${bus.id}</b><br>Distance: ${(bus.distance * 111).toFixed(2)} km`)
                    .addTo(busLayerRef.current);
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="map-container">
            <div className="map-status">{status}</div>
            <div id="map"></div>
        </div>
    );
}

export default LiveMap;
