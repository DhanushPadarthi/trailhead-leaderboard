import React, { useEffect, useState } from 'react';
import api, { downloadExcel } from '../api'; // Assuming 'api' is the default export for axios instance, and downloadExcel is a named export

const Leaderboard = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]); // Added for filtering
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Added error state

    const fetchStudents = async () => { // Renamed from fetchData
        try {
            setLoading(true);
            setError(null);

            // Try to fetch from API first
            try {
                const response = await api.get('/students'); // Changed from getStudents()
                setStudents(response.data);
                setFilteredStudents(response.data);
            } catch (apiError) {
                console.warn('API unavailable, loading static data...', apiError);

                // Fallback to static data
                const staticResponse = await fetch('/static-data.json');
                if (staticResponse.ok) {
                    const staticData = await staticResponse.json();
                    setStudents(staticData);
                    setFilteredStudents(staticData);
                } else {
                    throw new Error('Failed to load static data'); // More specific error
                }
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load leaderboard data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();

        // Only auto-refresh in development (localhost), not on Vercel
        const isProduction = import.meta.env.PROD;
        if (!isProduction) {
            const interval = setInterval(fetchStudents, 10000);
            return () => clearInterval(interval);
        }
    }, []);

    const calculateLevel = (points) => {
        const XP_PER_LEVEL = 5000;
        const level = Math.floor(points / XP_PER_LEVEL) + 1;
        const currentXP = points % XP_PER_LEVEL;
        const progress = (currentXP / XP_PER_LEVEL) * 100;
        return { level, currentXP, xpToNext: XP_PER_LEVEL - currentXP, progress };
    };

    const getCompletionStatus = (badges) => {
        if (badges >= 10) return { label: 'Complete', class: 'status-complete' };
        return { label: 'In Progress', class: 'status-in-progress' };
    };

    const getRankClass = (rank) => {
        return '';
    };

    const getMedal = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    };

    const handleViewProfile = (profileUrl) => {
        if (profileUrl) {
            window.open(profileUrl, '_blank');
        } else {
            alert('Profile URL not available');
        }
    };

    const [filters, setFilters] = useState({
        name: '',
        status: 'All',
        xp: '',
        badges: '',
        certs: 'All',
        champion: 'All',
        innovator: 'All',
        legend: 'All'
    });

    const getAgentblazerLevel = (statusList) => {
        if (!statusList) return 0;
        if (statusList.some(s => s.includes('Legend 2026'))) return 3;
        if (statusList.some(s => s.includes('Innovator 2026'))) return 2;
        if (statusList.some(s => s.includes('Champion 2026'))) return 1;
        return 0;
    };

    const getFilteredAndSortedStudents = () => {
        let filtered = students.filter(student => {
            const nameMatch = (student.name || '').toLowerCase().includes(filters.name.toLowerCase()) ||
                (student.roll_number || '').toLowerCase().includes(filters.name.toLowerCase());

            const completionStatus = getCompletionStatus(student.badges);
            const statusMatch = filters.status === 'All' || completionStatus.label === filters.status;

            const xpMatch = !filters.xp || student.points >= parseInt(filters.xp);
            const badgesMatch = !filters.badges || student.badges >= parseInt(filters.badges);

            const hasCerts = student.certifications && student.certifications.length > 0;
            const certsMatch = filters.certs === 'All' || (filters.certs === 'Yes' ? hasCerts : !hasCerts);

            const hasChampion = student.agentblazer_status?.some(s => s.includes('Champion 2026'));
            const championMatch = filters.champion === 'All' || (filters.champion === 'Yes' ? hasChampion : !hasChampion);

            const hasInnovator = student.agentblazer_status?.some(s => s.includes('Innovator 2026'));
            const innovatorMatch = filters.innovator === 'All' || (filters.innovator === 'Yes' ? hasInnovator : !hasInnovator);

            const hasLegend = student.agentblazer_status?.some(s => s.includes('Legend 2026'));
            const legendMatch = filters.legend === 'All' || (filters.legend === 'Yes' ? hasLegend : !hasLegend);

            return nameMatch && statusMatch && xpMatch && badgesMatch && certsMatch && championMatch && innovatorMatch && legendMatch;
        });

        // Sort by Agentblazer Level (3 > 2 > 1 > 0) then by Points
        return filtered.sort((a, b) => {
            const levelA = getAgentblazerLevel(a.agentblazer_status);
            const levelB = getAgentblazerLevel(b.agentblazer_status);

            if (levelB !== levelA) {
                return levelB - levelA;
            }
            return b.points - a.points;
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const inputStyle = {
        width: '100%',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(0,0,0,0.2)',
        color: 'white',
        fontSize: '14px'
    };

    const filterCellStyle = {
        padding: '0 20px 16px 20px',
        textAlign: 'left',
        verticalAlign: 'top'
    };

    if (loading) {
        return (
            <div>
                <table className="leaderboard-table">
                    <thead>
                        <tr className="table-header">
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Status</th>
                            <th>XP</th>
                            <th>Badges</th>
                            <th>Certs</th>
                            <th>Champion 2026</th>
                            <th>Innovator 2026</th>
                            <th>Legend 2026</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="table-row">
                                {[...Array(10)].map((_, j) => (
                                    <td key={j}><div className="shimmer" style={{ height: '20px', borderRadius: '5px' }}></div></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Calculate stats
    const legendCount = students.filter(s => getAgentblazerLevel(s.agentblazer_status) === 3).length;
    const innovatorCount = students.filter(s => getAgentblazerLevel(s.agentblazer_status) === 2).length;
    const championCount = students.filter(s => getAgentblazerLevel(s.agentblazer_status) === 1).length;
    const certCount = students.filter(s => s.certifications && s.certifications.length > 0).length;

    const statsContainerStyle = {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        justifyContent: 'flex-start'
    };

    const statCardStyle = {
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '15px 25px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '150px'
    };

    const statLabelStyle = {
        color: '#94a3b8',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '5px'
    };

    const statValueStyle = {
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold'
    };

    return (
        <div>
            <div style={{ ...statsContainerStyle, justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={statCardStyle}>
                        <span style={statLabelStyle}>Certifications</span>
                        <span style={statValueStyle}>{certCount}</span>
                    </div>
                    <div style={statCardStyle}>
                        <span style={statLabelStyle}>Champion 2026</span>
                        <span style={statValueStyle}>{championCount}</span>
                    </div>
                    <div style={statCardStyle}>
                        <span style={statLabelStyle}>Innovator 2026</span>
                        <span style={statValueStyle}>{innovatorCount}</span>
                    </div>
                    <div style={statCardStyle}>
                        <span style={statLabelStyle}>Legend 2026</span>
                        <span style={statValueStyle}>{legendCount}</span>
                    </div>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={async () => {
                        try {
                            const response = await downloadExcel();
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', 'leaderboard.xlsx');
                            document.body.appendChild(link);
                            link.click();
                        } catch (e) {
                            console.error("Download failed", e);
                        }
                    }}
                >
                    Download Excel
                </button>
            </div>
            <table className="leaderboard-table">
                <thead>
                    <tr className="table-header">
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Status</th>
                        <th>XP</th>
                        <th>Badges</th>
                        <th>Certs</th>
                        <th>Champion 2026</th>
                        <th>Innovator 2026</th>
                        <th>Legend 2026</th>
                        <th>Action</th>
                    </tr>
                    {/* Filter Row */}
                    <tr style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                        <th style={filterCellStyle}></th>
                        <th style={filterCellStyle}>
                            <input
                                style={inputStyle}
                                placeholder="Search Name..."
                                value={filters.name}
                                onChange={(e) => handleFilterChange('name', e.target.value)}
                            />
                        </th>
                        <th style={filterCellStyle}>
                            <select
                                style={inputStyle}
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Complete">Complete</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </th>
                        <th style={filterCellStyle}>
                            <input
                                style={inputStyle}
                                type="number"
                                placeholder="Min XP"
                                value={filters.xp}
                                onChange={(e) => handleFilterChange('xp', e.target.value)}
                            />
                        </th>
                        <th style={filterCellStyle}>
                            <input
                                style={inputStyle}
                                type="number"
                                placeholder="Min Badges"
                                value={filters.badges}
                                onChange={(e) => handleFilterChange('badges', e.target.value)}
                            />
                        </th>
                        <th style={filterCellStyle}>
                            <select
                                style={inputStyle}
                                value={filters.certs}
                                onChange={(e) => handleFilterChange('certs', e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </th>
                        <th style={filterCellStyle}>
                            <select
                                style={inputStyle}
                                value={filters.champion}
                                onChange={(e) => handleFilterChange('champion', e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </th>
                        <th style={filterCellStyle}>
                            <select
                                style={inputStyle}
                                value={filters.innovator}
                                onChange={(e) => handleFilterChange('innovator', e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </th>
                        <th style={filterCellStyle}>
                            <select
                                style={inputStyle}
                                value={filters.legend}
                                onChange={(e) => handleFilterChange('legend', e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </th>
                        <th style={filterCellStyle}></th>
                    </tr>
                </thead>
                <tbody>
                    {getFilteredAndSortedStudents().map((student, index) => {
                        // Global rank based on current sorted list? Usually filters shouldn't re-rank relative to global unless it's a filtered view. 
                        // But user typically expects "Rank 1" of the filtered list.
                        const rank = index + 1;
                        // Use Agentblazer Level here
                        const level = getAgentblazerLevel(student.agentblazer_status);
                        const status = getCompletionStatus(student.badges);

                        return (
                            <tr key={student.roll_number} className={`table-row ${getRankClass(rank)}`}>
                                {/* Rank */}
                                <td>
                                    <div className="rank-cell">
                                        <div className="rank-badge">
                                            {getMedal(rank) || `#${rank}`}
                                        </div>
                                    </div>
                                </td>

                                {/* Player */}
                                <td>
                                    <div className="player-cell">
                                        <div className="player-avatar">
                                            {student.roll_number.slice(-2)}
                                        </div>
                                        <div className="player-info">
                                            <h4>{student.name || student.roll_number}</h4>
                                            <p>
                                                Level {level}
                                                {student.is_scraping && (
                                                    <span style={{ color: '#fbbf24', marginLeft: '10px', fontSize: '12px' }}>
                                                        <span className="spinner">↻</span> Syncing...
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td>
                                    <span className={`status-badge ${status.class}`}>
                                        ● {status.label}
                                    </span>
                                </td>

                                {/* XP */}
                                <td>
                                    <div className="xp-cell">
                                        <div className="xp-value">{student.points.toLocaleString()}</div>
                                    </div>
                                </td>

                                {/* Badges */}
                                <td>
                                    <div className="badges-cell">
                                        <span className="badge-icon">🏅</span>
                                        {student.badges}
                                    </div>
                                </td>

                                {/* Certifications */}
                                <td>
                                    <div className="certs-cell" style={{ justifyContent: 'center' }}>
                                        {student.certifications && student.certifications.length > 0 ?
                                            <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                            <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                        }
                                    </div>
                                </td>

                                {/* Agentblazer Status - Champion */}
                                <td>
                                    <div className="agentblazer-cell" style={{ justifyContent: 'center' }}>
                                        {student.agentblazer_status?.some(s => s.includes('Champion 2026')) ?
                                            <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                            <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                        }
                                    </div>
                                </td>

                                {/* Agentblazer Status - Innovator */}
                                <td>
                                    <div className="agentblazer-cell" style={{ justifyContent: 'center' }}>
                                        {student.agentblazer_status?.some(s => s.includes('Innovator 2026')) ?
                                            <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                            <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                        }
                                    </div>
                                </td>

                                {/* Agentblazer Status - Legend */}
                                <td>
                                    <div className="agentblazer-cell" style={{ justifyContent: 'center' }}>
                                        {student.agentblazer_status?.some(s => s.includes('Legend 2026')) ?
                                            <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                            <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                        }
                                    </div>
                                </td>

                                {/* Action */}
                                <td>
                                    <button
                                        className="btn-view"
                                        onClick={() => handleViewProfile(student.profile_url)}
                                    >
                                        View Profile
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {students.length === 0 && (
                <div className="loading">No players found</div>
            )}
        </div>
    );
};

export default Leaderboard;
