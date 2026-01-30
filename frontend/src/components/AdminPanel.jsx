import React, { useState } from 'react';
import { uploadFile, scrapeAll } from '../api';

const AdminPanel = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null);
    const [syncing, setSyncing] = useState(false);

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

    return (
        <div style={{maxWidth: '800px', margin: '0 auto'}}>
            <div style={{marginBottom: '30px'}}>
                <h2 style={{fontSize: '24px', fontWeight: '700', marginBottom: '10px'}}>Admin Panel</h2>
                <p style={{color: '#94a3b8'}}>Manage player data and system synchronization</p>
            </div>

            <div style={{background: 'rgba(30, 41, 59, 0.8)', padding: '30px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '20px'}}>📤 Import Players</h3>

                <form onSubmit={handleUpload}>
                    <div style={{marginBottom: '20px'}}>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            style={{display: 'block', marginBottom: '10px', color: '#e2e8f0'}}
                        />
                        {file && <div style={{color: '#10b981', fontSize: '14px'}}>✓ {file.name}</div>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={uploading || !file}
                        className="btn btn-admin"
                        style={{opacity: uploading || !file ? 0.5 : 1}}
                    >
                        {uploading ? "Uploading..." : "Upload Roster"}
                    </button>
                </form>
            </div>

            <div style={{background: 'rgba(30, 41, 59, 0.8)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '10px'}}>🔄 Force Sync All</h3>
                <p style={{color: '#94a3b8', fontSize: '14px', marginBottom: '20px'}}>
                    Fetch latest data from Trailhead for all registered players.
                </p>
                <button 
                    onClick={handleGlobalSync} 
                    disabled={syncing}
                    className="btn btn-secondary"
                    style={{opacity: syncing ? 0.5 : 1}}
                >
                    {syncing ? "Syncing..." : "Sync Now"}
                </button>
            </div>

            {status && (
                <div style={{
                    padding: '15px', 
                    marginTop: '20px', 
                    borderRadius: '8px',
                    background: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: status.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
