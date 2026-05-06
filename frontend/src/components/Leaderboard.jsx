
import React, { useEffect, useState, useMemo } from 'react';
import api, { downloadExcel } from '../api';
import TutorialModal from './TutorialModal';
import maintenanceData from '../data/maintenance.json';

// ─── Tab Configuration ───────────────────────────────────────────────
const TABS = [
    {
        id: 'agentforce',
        label: '🤖 Agentforce AI',
        certKey: 'Salesforce Certified Agentforce Specialist',
        hasModules: true, // Champion / Innovator / Legend
        color: '#8b5cf6',
    },
    {
        id: 'admin',
        label: '🛡️ Salesforce Administrator',
        certKey: 'Salesforce Certified Administrator',
        hasModules: false,
        color: '#3b82f6',
    },
    {
        id: 'developer',
        label: '💻 Platform Developer',
        certKey: 'Platform Developer I',
        hasModules: false,
        color: '#10b981',
    },
    {
        id: 'datacloud',
        label: '📊 Data Cloud + Tableau',
        certKeys: ['Data Cloud Consultant', 'Tableau Analyst'],
        hasModules: false,
        color: '#f59e0b',
    },
];

const Leaderboard = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [maintenance, setMaintenance] = useState(maintenanceData);
    const [activeTab, setActiveTab] = useState('agentforce');
    const [filters, setFilters] = useState({
        name: '',
        xp: '',
        badges: '',
        cert: 'All',
        champion: 'All',
        innovator: 'All',
        legend: 'All',
    });

    // Sort students by points (desc), then badges (desc)
    const sortStudents = (data) => {
        return [...data].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.badges - a.badges;
        });
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check maintenance mode first
            try {
                const maintenanceRes = await api.get('/admin/maintenance');
                if (maintenanceRes.data.enabled) {
                    setMaintenance(maintenanceRes.data);
                    setLoading(false);
                    return;
                }
            } catch (mErr) {
                console.warn("Could not check maintenance status", mErr);
            }

            // Try API first, fallback to static
            try {
                const response = await api.get('/students');
                const sortedData = sortStudents(response.data);
                setStudents(sortedData);
                setFilteredStudents(sortedData);
            } catch (apiError) {
                console.warn('API unavailable, loading static data...', apiError);
                const staticResponse = await fetch('/static-data.json');
                if (staticResponse.ok) {
                    const staticData = await staticResponse.json();
                    const sortedData = sortStudents(staticData);
                    setStudents(sortedData);
                    setFilteredStudents(sortedData);
                } else {
                    throw new Error('Failed to load static data');
                }
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load leaderboard data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, []);

    // Note: Filter reset logic is handled directly in the tab onClick handler

    // ─── Maintenance Screen moved below hooks ───────────────────────
    // ─── Helpers ─────────────────────────────────────────────────────
    const getAgentblazerLevel = (statusList) => {
        if (!statusList) return 0;
        if (statusList.some(s => s.includes('Legend 2026'))) return 3;
        if (statusList.some(s => s.includes('Innovator 2026'))) return 2;
        if (statusList.some(s => s.includes('Champion 2026'))) return 1;
        return 0;
    };

    const getMedal = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    };

    const handleViewProfile = (profileUrl) => {
        if (profileUrl) window.open(profileUrl, '_blank');
        else alert('Profile URL not available');
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Check if student has a specific certification (partial match)
    const hasCert = (student, certName) => {
        if (!student.certifications || !Array.isArray(student.certifications)) return false;
        return student.certifications.some(c => c.toLowerCase().includes(certName.toLowerCase()));
    };

    // Check for tab-specific certification
    const hasTabCert = (student, tab) => {
        if (tab.certKeys) {
            // Multiple possible certs (Data Cloud + Tableau)
            return tab.certKeys.some(key => hasCert(student, key));
        }
        return hasCert(student, tab.certKey);
    };

    // ─── Get current tab config ─────────────────────────────────────
    const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

    // ─── Filtered & Sorted Students ─────────────────────────────────
    const getFilteredAndSortedStudents = () => {
        let filtered = students.filter(student => {
            // Name/Roll filter
            const nameMatch = (student.name || '').toLowerCase().includes(filters.name.toLowerCase()) ||
                (student.roll_number || '').toLowerCase().includes(filters.name.toLowerCase());

            // XP / Badges
            const xpMatch = !filters.xp || student.points >= parseInt(filters.xp);
            const badgesMatch = !filters.badges || student.badges >= parseInt(filters.badges);

            // Tab-specific cert filter
            const studentHasCert = hasTabCert(student, currentTab);
            const certMatch = filters.cert === 'All' || (filters.cert === 'Yes' ? studentHasCert : !studentHasCert);

            // Module filters (Agentforce tab only)
            if (currentTab.hasModules) {
                const hasChampion = student.agentblazer_status?.some(s => s.includes('Champion 2026'));
                const championMatch = filters.champion === 'All' || (filters.champion === 'Yes' ? hasChampion : !hasChampion);

                const hasInnovator = student.agentblazer_status?.some(s => s.includes('Innovator 2026'));
                const innovatorMatch = filters.innovator === 'All' || (filters.innovator === 'Yes' ? hasInnovator : !hasInnovator);

                const hasLegend = student.agentblazer_status?.some(s => s.includes('Legend 2026'));
                const legendMatch = filters.legend === 'All' || (filters.legend === 'Yes' ? hasLegend : !hasLegend);

                return nameMatch && xpMatch && badgesMatch && certMatch && championMatch && innovatorMatch && legendMatch;
            }

            return nameMatch && xpMatch && badgesMatch && certMatch;
        });

        // Sort: for Agentforce tab, sort by level then points; otherwise by points
        if (currentTab.hasModules) {
            return filtered.sort((a, b) => {
                const levelA = getAgentblazerLevel(a.agentblazer_status);
                const levelB = getAgentblazerLevel(b.agentblazer_status);
                if (levelB !== levelA) return levelB - levelA;
                return b.points - a.points;
            });
        }

        return filtered.sort((a, b) => b.points - a.points || b.badges - a.badges);
    };

    // ─── Stats for current tab ──────────────────────────────────────
    const getTabStats = () => {
        if (currentTab.hasModules) {
            return {
                certCount: students.filter(s => hasTabCert(s, currentTab)).length,
                championCount: students.filter(s => getAgentblazerLevel(s.agentblazer_status) >= 1).length,
                innovatorCount: students.filter(s => getAgentblazerLevel(s.agentblazer_status) >= 2).length,
                legendCount: students.filter(s => getAgentblazerLevel(s.agentblazer_status) === 3).length,
            };
        }
        return {
            certCount: students.filter(s => hasTabCert(s, currentTab)).length,
            totalStudents: students.length,
        };
    };

    // stats computed via useMemo below

    // ─── Styles ──────────────────────────────────────────────────────
    const inputStyle = {
        width: '100%', padding: '8px', borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)',
        color: 'white', fontSize: '14px',
    };

    const filterCellStyle = {
        padding: '0 20px 16px 20px', textAlign: 'left', verticalAlign: 'top',
    };

    const statCardStyle = {
        background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)',
        padding: '15px 25px', borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px',
    };

    const statLabelStyle = {
        color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase',
        letterSpacing: '1px', marginBottom: '5px',
    };

    const statValueStyle = { color: 'white', fontSize: '24px', fontWeight: 'bold' };

    // ─── Loading State moved below hooks ────────────────────────────

    const sortedStudents = useMemo(() => getFilteredAndSortedStudents(), [students, filters, activeTab]);
    const stats = useMemo(() => getTabStats(), [students, activeTab]);
    const tabCertCounts = useMemo(() => {
        const counts = {};
        TABS.forEach(tab => { counts[tab.id] = students.filter(s => hasTabCert(s, tab)).length; });
        return counts;
    }, [students]);

    // ─── RENDER ─────────────────────────────────────────────────────

    // ─── Maintenance Screen ─────────────────────────────────────────
    if (maintenance.enabled) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚧</div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '15px' }}>Under Maintenance</h1>
                <p style={{ fontSize: '1.2rem', color: '#e2e8f0', maxWidth: '600px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                    {maintenance.message && maintenance.message.trim().length > 0
                        ? maintenance.message
                        : "We are currently updating the leaderboard. Please check back later."}
                </p>
                <div style={{ marginTop: '40px', padding: '15px 30px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Thank you for your patience! 🚀
                </div>
            </div>
        );
    }

    // ─── Loading State ──────────────────────────────────────────────
    if (loading) {
        return (
            <div>
                <table className="leaderboard-table">
                    <thead>
                        <tr className="table-header">
                            <th>Rank</th><th>Player</th><th>XP</th><th>Badges</th>
                            <th>Certs</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="table-row">
                                {[...Array(6)].map((_, j) => (
                                    <td key={j}><div className="shimmer" style={{ height: '20px', borderRadius: '5px' }}></div></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div>
            <TutorialModal />

            {/* Daily Update Notice */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px',
                padding: '12px 20px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '10px',
            }}>
                <span style={{ fontSize: '20px' }}>🕘</span>
                <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '500' }}>
                    Scores are automatically updated every day at 9:00 PM
                </span>
            </div>

            {/* ─── TAB NAVIGATION ──────────────────────────────────────── */}
            <div className="course-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`course-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => {
                            if (activeTab === tab.id) return;
                            setActiveTab(tab.id);
                            setFilters({
                                name: '', xp: '', badges: '', cert: 'All',
                                champion: 'All', innovator: 'All', legend: 'All',
                            });
                        }}
                        style={{
                            '--tab-color': tab.color,
                            '--tab-color-20': tab.color + '33',
                            '--tab-color-40': tab.color + '66',
                        }}
                    >
                        <span className="course-tab-label">{tab.label}</span>
                        <span className="course-tab-count">
                            {tabCertCounts[tab.id] || 0} certified
                        </span>
                    </button>
                ))}
            </div>

            {/* ─── STATS BAR ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={statCardStyle}>
                        <span style={statLabelStyle}>Total Students</span>
                        <span style={statValueStyle}>{students.length}</span>
                    </div>
                    <div style={{ ...statCardStyle, borderColor: currentTab.color + '44' }}>
                        <span style={statLabelStyle}>{currentTab.hasModules ? 'Agentforce Cert' : 'Certified'}</span>
                        <span style={{ ...statValueStyle, color: currentTab.color }}>{stats.certCount}</span>
                    </div>
                    {currentTab.hasModules && (
                        <>
                            <div style={statCardStyle}>
                                <span style={statLabelStyle}>Champion 2026</span>
                                <span style={statValueStyle}>{stats.championCount}</span>
                            </div>
                            <div style={statCardStyle}>
                                <span style={statLabelStyle}>Innovator 2026</span>
                                <span style={statValueStyle}>{stats.innovatorCount}</span>
                            </div>
                            <div style={statCardStyle}>
                                <span style={statLabelStyle}>Legend 2026</span>
                                <span style={statValueStyle}>{stats.legendCount}</span>
                            </div>
                        </>
                    )}
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={async () => {
                        try {
                            const response = await downloadExcel(filters);
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `leaderboard-${activeTab}.xlsx`);
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

            {/* ─── TABLE ───────────────────────────────────────────────── */}
            <table className="leaderboard-table">
                <thead>
                    <tr className="table-header">
                        <th>Rank</th>
                        <th>Player</th>
                        <th>XP</th>
                        <th>Badges</th>
                        {currentTab.hasModules ? (
                            <>
                                <th>Agentforce Cert</th>
                                <th>Champion 2026</th>
                                <th>Innovator 2026</th>
                                <th>Legend 2026</th>
                            </>
                        ) : (
                            <th>{currentTab.id === 'datacloud' ? 'Data Cloud / Tableau Cert' : currentTab.label.replace(/^[^\s]+\s/, '') + ' Cert'}</th>
                        )}
                        <th>Action</th>
                    </tr>

                    {/* Filter Row */}
                    <tr className="filter-row" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                        <th style={filterCellStyle}></th>
                        <th style={filterCellStyle}>
                            <input style={inputStyle} placeholder="Search Name..." value={filters.name}
                                onChange={(e) => handleFilterChange('name', e.target.value)} />
                        </th>
                        <th style={filterCellStyle}>
                            <input style={inputStyle} type="number" placeholder="Min XP" value={filters.xp}
                                onChange={(e) => handleFilterChange('xp', e.target.value)} />
                        </th>
                        <th style={filterCellStyle}>
                            <input style={inputStyle} type="number" placeholder="Min Badges" value={filters.badges}
                                onChange={(e) => handleFilterChange('badges', e.target.value)} />
                        </th>
                        {/* Cert filter */}
                        <th style={filterCellStyle}>
                            <select style={inputStyle} value={filters.cert} onChange={(e) => handleFilterChange('cert', e.target.value)}>
                                <option value="All">All</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </th>
                        {currentTab.hasModules && (
                            <>
                                <th style={filterCellStyle}>
                                    <select style={inputStyle} value={filters.champion} onChange={(e) => handleFilterChange('champion', e.target.value)}>
                                        <option value="All">All</option><option value="Yes">Yes</option><option value="No">No</option>
                                    </select>
                                </th>
                                <th style={filterCellStyle}>
                                    <select style={inputStyle} value={filters.innovator} onChange={(e) => handleFilterChange('innovator', e.target.value)}>
                                        <option value="All">All</option><option value="Yes">Yes</option><option value="No">No</option>
                                    </select>
                                </th>
                                <th style={filterCellStyle}>
                                    <select style={inputStyle} value={filters.legend} onChange={(e) => handleFilterChange('legend', e.target.value)}>
                                        <option value="All">All</option><option value="Yes">Yes</option><option value="No">No</option>
                                    </select>
                                </th>
                            </>
                        )}
                        <th style={filterCellStyle}></th>
                    </tr>
                </thead>

                <tbody>
                    {sortedStudents.map((student, index) => {
                        const rank = index + 1;
                        const level = currentTab.hasModules ? getAgentblazerLevel(student.agentblazer_status) : Math.floor((student.points || 0) / 5000) + 1;
                        const studentHasTabCert = hasTabCert(student, currentTab);

                        return (
                            <tr key={student.roll_number} className="table-row">
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

                                {/* Tab-specific certification columns */}
                                {currentTab.hasModules ? (
                                    <>
                                        {/* Agentforce Cert */}
                                        <td>
                                            <div className="certs-cell" style={{ justifyContent: 'center' }}>
                                                {studentHasTabCert ?
                                                    <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                                    <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                                }
                                            </div>
                                        </td>
                                        {/* Champion */}
                                        <td>
                                            <div className="agentblazer-cell" style={{ justifyContent: 'center' }}>
                                                {student.agentblazer_status?.some(s => s.includes('Champion 2026')) ?
                                                    <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                                    <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                                }
                                            </div>
                                        </td>
                                        {/* Innovator */}
                                        <td>
                                            <div className="agentblazer-cell" style={{ justifyContent: 'center' }}>
                                                {student.agentblazer_status?.some(s => s.includes('Innovator 2026')) ?
                                                    <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                                    <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                                }
                                            </div>
                                        </td>
                                        {/* Legend */}
                                        <td>
                                            <div className="agentblazer-cell" style={{ justifyContent: 'center' }}>
                                                {student.agentblazer_status?.some(s => s.includes('Legend 2026')) ?
                                                    <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                                    <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                                }
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    /* Simple cert column for non-Agentforce tabs */
                                    <td>
                                        <div className="certs-cell" style={{ justifyContent: 'center' }}>
                                            {studentHasTabCert ?
                                                <span className="tick-icon" style={{ color: '#10b981', fontSize: '18px' }}>✓</span> :
                                                <span className="empty-circle" style={{ color: '#475569', fontSize: '18px' }}>○</span>
                                            }
                                        </div>
                                    </td>
                                )}

                                {/* Action */}
                                <td>
                                    <button className="btn-view" onClick={() => handleViewProfile(student.profile_url)}>
                                        View Profile
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {sortedStudents.length === 0 && (
                <div className="loading">No players found</div>
            )}
        </div>
    );
};

export default Leaderboard;
