import React, { useEffect, useState } from 'react';
// Assuming you use axios to fetch from your backend
import axios from 'axios'; 

const AlertDashboard = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Fetch the logs from your new backend route
        const fetchAlerts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/alerts');
                setAlerts(response.data);
            } catch (error) {
                console.error("Error fetching alerts", error);
            }
        };
        fetchAlerts();
    }, []);

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-red-500">🚨 Live Threat Intelligence</h2>
            
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                        <th className="p-3">Time</th>
                        <th className="p-3">Attacker IP</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">ISP / Network</th>
                        <th className="p-3">Device (User-Agent)</th>
                    </tr>
                </thead>
                <tbody>
                    {alerts.map((log) => (
                        <tr key={log._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                            <td className="p-3 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-3 font-mono text-red-400">{log.ipAddress}</td>
                            <td className="p-3">
                                {/* Display City and Country with a fallback */}
                                📍 {log.location?.city || "Unknown"}, {log.location?.country || "Unknown"}
                            </td>
                            <td className="p-3 text-gray-300">
                                {log.location?.isp || "Unknown"}
                            </td>
                            <td className="p-3 text-xs font-mono text-gray-500 truncate max-w-xs">
                                {log.userAgent}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AlertDashboard;