import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const AiAnalyticsDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReports = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/analytics/reports');
            setReports(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const generateNewReport = async () => {
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/analytics/generate');
            fetchReports(); // Refresh the list after generating
        } catch (error) {
            alert("Failed to generate AI report. Check backend logs.");
        }
        setLoading(false);
    };

    return (
        <div style={{ background: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #334155', color: '#f8fafc', marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#a855f7' }}>🧠 AI Threat Intelligence SOC</h2>
                <button 
                    onClick={generateNewReport} 
                    disabled={loading}
                    style={{ background: '#a855f7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Analyzing Network Data...' : 'Generate New AI Report'}
                </button>
            </div>

            {reports.length === 0 ? (
                <p style={{ color: '#64748b' }}>No reports generated yet. Click the button to analyze current logs.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reports.map((report, index) => (
                        <div key={report._id} style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', borderLeft: index === 0 ? '4px solid #a855f7' : '4px solid #475569' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
        <strong>Report Generated:</strong> {new Date(report.generatedAt).toLocaleString()} | <strong>Logs Analyzed:</strong> {report.analyzedLogCount}
    </div>
    <button 
        onClick={() => window.open(`http://localhost:5000/api/analytics/download/${report._id}`, '_blank')}
        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
    >
        ⬇️ Download PDF
    </button>
    </div>
                            
                            {/* This automatically formats the AI's markdown response! */}
                            <div style={{ lineHeight: '1.6', fontSize: '14px' }}>
                                <ReactMarkdown>{report.reportText}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AiAnalyticsDashboard;