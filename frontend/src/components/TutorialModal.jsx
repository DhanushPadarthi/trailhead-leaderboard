import React, { useState, useEffect } from 'react';

const TutorialModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has seen the tutorial
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('hasSeenTutorial', 'true');
        setIsOpen(false);
    };

    const handleReopen = () => {
        setIsOpen(true);
    };

    if (!isOpen) {
        // Show tutorial button in top right
        return (
            <button
                onClick={handleReopen}
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span>ℹ️</span>
                <span>Tutorial</span>
            </button>
        );
    }

    return (
        <>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 9998,
                    backdropFilter: 'blur(4px)'
                }}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: '20px',
                    padding: '40px',
                    maxWidth: '700px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    zIndex: 9999,
                    border: '2px solid rgba(102, 126, 234, 0.3)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '10px'
                    }}>
                        🎓 Welcome to Trailhead Leaderboard!
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Here's everything you need to know
                    </p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ color: '#ef4444', fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                            🚨 If Your Profile Shows "Private" or "Invalid"
                        </h3>
                        <p style={{ color: '#e2e8f0', lineHeight: '1.6', marginBottom: '10px' }}>
                            If your profile status shows <strong>"Private"</strong> or <strong>"Invalid URL"</strong>, and your <strong>Points and Badges are both 0</strong>:
                        </p>
                        <ol style={{ color: '#e2e8f0', lineHeight: '1.8', paddingLeft: '20px' }}>
                            <li>Make sure your Trailhead profile is set to <strong>Public</strong></li>
                            <li>Update your correct Trailhead URL in the Google Form</li>
                            <li>The form link is shared in your WhatsApp group</li>
                            <li>After updating, wait for the next sync (or contact admin)</li>
                        </ol>
                    </div>

                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #10b981',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ color: '#10b981', fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                            ✅ Understanding Agentblazer Status
                        </h3>
                        <p style={{ color: '#e2e8f0', lineHeight: '1.6', marginBottom: '10px' }}>
                            The three status badges show your progress:
                        </p>
                        <ul style={{ color: '#e2e8f0', lineHeight: '1.8', paddingLeft: '20px' }}>
                            <li><strong>Champion 2026</strong> ✓ = You completed the Champion module</li>
                            <li><strong>Innovator 2026</strong> ✓ = You completed the Innovator module</li>
                            <li><strong>Legend 2026</strong> ✓ = You completed the Legend module</li>
                        </ul>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>
                            Example: If you see ✓ on Champion and Innovator, but not Legend, you've completed 2 out of 3 modules!
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid #3b82f6',
                        borderRadius: '12px',
                        padding: '20px'
                    }}>
                        <h3 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                            📊 How the Leaderboard Works
                        </h3>
                        <ul style={{ color: '#e2e8f0', lineHeight: '1.8', paddingLeft: '20px' }}>
                            <li>Rankings are based on <strong>Points</strong> (higher is better)</li>
                            <li>If points are equal, <strong>Badges</strong> are used as a tiebreaker</li>
                            <li>Data syncs periodically from Salesforce Trailhead</li>
                            <li>Keep your profile public to ensure accurate tracking</li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    style={{
                        width: '100%',
                        padding: '15px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                >
                    Got it! Let's Go 🚀
                </button>

                <p style={{
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '12px',
                    marginTop: '15px'
                }}>
                    You can reopen this tutorial anytime by clicking the "Tutorial" button in the top right corner
                </p>
            </div>
        </>
    );
};

export default TutorialModal;
