import React, { useState, useEffect } from 'react';
import { uploadFile, scrapeAll, downloadExcel } from '../api';
import api from '../api';

const AdminPanel = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [students, setStudents] = useState([]);
    const [syncingStudent, setSyncingStudent] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students');
            setStudents(response.data);
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatus({ type: 'error', message: 'Please select a file first.' });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadFile(formData);
            setStatus({ type: 'success', message: res.data.message });
            setFile(null);
            document.getElementById('file-upload').value = "";
            fetchStudents(); // Refresh list
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.detail || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleGlobalSync = async () => {
        if (!window.confirm("Force sync all players? This may take a few minutes.")) return;
        setSyncing(true);
        try {
            const res = await scrapeAll();
            setStatus({ type: 'success', message: res.data.message });
        } catch (e) {
            setStatus({ type: 'error', message: "Sync failed to start." });
        } finally {
            setTimeout(() => setSyncing(false), 3000);
        }
    };

    const handleSyncStudent = async (rollNumber) => {
        setSyncingStudent(rollNumber);
        try {
            await api.post(`/scrape/${rollNumber}`);
            setStatus({ type: 'success', message: `Syncing ${rollNumber}...` });
            setTimeout(() => fetchStudents(), 2000); // Refresh after 2 seconds
        } catch (err) {
            setStatus({ type: 'error', message: `Failed to sync ${rollNumber}` });
        } finally {
            setTimeout(() => setSyncingStudent(null), 1000);
        }
    };

    const handleExport = async () => {
        try {
            await downloadExcel();
        } catch (err) {
            setStatus({ type: 'error', message: 'Export failed' });
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>Admin Panel</h2>
                <p style={{ color: '#94a3b8' }}>Manage player data and system synchronization</p>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '30px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>📤 Import Players</h3>

                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            style={{ display: 'block', marginBottom: '10px', color: '#e2e8f0' }}
                        />
                        {file && <div style={{ color: '#10b981', fontSize: '14px' }}>✓ {file.name}</div>}
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="btn btn-admin"
                        style={{ opacity: uploading || !file ? 0.5 : 1 }}
                    >
                        {uploading ? "Uploading..." : "Upload Roster"}
                    </button>
                </form>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '30px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>🔄 Sync Actions</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleGlobalSync}
                        disabled={syncing}
                        className="btn btn-secondary"
                        style={{ opacity: syncing ? 0.5 : 1 }}
                    >
                        {syncing ? "Syncing All..." : "Sync All Students"}
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn btn-admin"
                    >
                        📥 Export Full Data
                    </button>
                </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>👥 Individual Student Sync</h3>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Roll Number</th>
                                <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Name</th>
                                <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Points</th>
                                <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Status</th>
                                <th style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.roll_number} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <td style={{ padding: '10px', color: '#e2e8f0' }}>{student.roll_number}</td>
                                    <td style={{ padding: '10px', color: '#e2e8f0' }}>{student.name || 'N/A'}</td>
                                    <td style={{ padding: '10px', color: '#10b981' }}>{student.points || 0}</td>
                                    <td style={{ padding: '10px', fontSize: '12px' }}>
                                        {student.scrape_error ? (
                                            <span style={{ color: '#ef4444' }}>{student.scrape_error}</span>
                                        ) : (
                                            <span style={{ color: '#10b981' }}>✓ Valid</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleSyncStudent(student.roll_number)}
                                            disabled={syncingStudent === student.roll_number}
                                            style={{
                                                padding: '5px 15px',
                                                background: syncingStudent === student.roll_number ? '#475569' : '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: syncingStudent === student.roll_number ? 'not-allowed' : 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            {syncingStudent === student.roll_number ? '⏳' : '🔄 Sync'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {status && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    borderRadius: '8px',
                    background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: status.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
