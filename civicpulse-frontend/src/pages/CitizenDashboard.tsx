// Location: src/pages/CitizenDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import ComplaintForm from '../components/Complaints/ComplaintForm';
import ComplaintList from '../components/Complaints/ComplaintList';
import { getUserComplaints } from '../api/complaint'; 
import NotificationBell from '../components/Common/NotificationBell';

// ✅ 1. ADD IMPORT
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CitizenDashboard: React.FC = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FORM' | 'HISTORY'>('DASHBOARD');
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);

  // --- FETCH STATS ---
  useEffect(() => {
    const fetchStats = async () => {
        if (!user?.id) return;
        try {
            const data = await getUserComplaints(parseInt(user.id));
            
            const total = data.length;
            const resolved = data.filter((c: any) => c.status === 'RESOLVED').length;
            const pending = total - resolved;
            
            // Calculate Rating
            const ratedComplaints = data.filter((c: any) => c.citizen_rating && c.citizen_rating > 0);
            const totalStars = ratedComplaints.reduce((acc: number, curr: any) => acc + curr.citizen_rating, 0);
            const avgRating = ratedComplaints.length ? (totalStars / ratedComplaints.length).toFixed(1) : "0.0";

            setStats({ total, pending, resolved, avgRating: parseFloat(avgRating as string) });
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
  }, [user]);

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'C';

  // ✅ 2. NEW ANIMATED CHART COMPONENT
  const DonutChart = () => {
    const { pending, resolved } = stats;
    const total = pending + resolved;

    const data = [
        { name: 'Resolved', value: resolved, color: '#22c55e' },
        { name: 'Pending', value: pending, color: 'orange' },
    ].filter(item => item.value > 0);

    if (total === 0) return (
        <div style={{height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', flexDirection:'column'}}>
            <span style={{fontSize:'30px'}}>📉</span>
            <span style={{fontSize:'12px', marginTop:'5px'}}>No Data</span>
        </div>
    );

    return (
        <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} itemStyle={{fontSize:'12px', fontWeight:600}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
  };

  // --- STYLES ---
  const styles = {
    container: { display: 'flex', height: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", backgroundColor: '#f0f9ff' },
    sidebar: { width: '280px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' as const, padding: '30px 20px', boxShadow: '4px 0 20px rgba(0, 191, 255, 0.08)', zIndex: 10, borderRight: '1px solid #e0f2fe' },
    brand: { fontSize: '22px', fontWeight: 800, color: '#0288d1', marginBottom: '35px', paddingLeft: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    profileCard: { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', marginBottom: '30px', border: '1px solid #e2e8f0', textAlign: 'center' as const },
    avatar: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e0f7fa', color: '#00bcd4', fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', border: '2px solid #b2ebf2' },
    userName: { fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 5px 0' },
    userEmail: { fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 500 },
    wardBadge: { display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0288d1', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' },
    navGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px', flex: 1 },
    navItem: (isActive: boolean) => ({ padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease', backgroundColor: isActive ? '#00bfff' : 'transparent', color: isActive ? 'white' : '#64748b', boxShadow: isActive ? '0 4px 12px rgba(0, 191, 255, 0.3)' : 'none' }),
    logoutBtn: { padding: '12px', marginTop: 'auto', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
    main: { flex: 1, padding: '40px', overflowY: 'auto' as const, backgroundColor: '#f0f9ff' },
    pageHeader: { maxWidth: '1000px', margin: '0 auto 30px auto' },
    pageTitle: { fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' },
    pageSubtitle: { fontSize: '14px', color: '#64748b' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' },
    statLabel: { fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
    statValue: (color: string) => ({ fontSize: '32px', fontWeight: 800, color: color, lineHeight: 1 }),
    chartsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' },
    chartCard: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
    chartTitle: { fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '20px', alignSelf: 'flex-start' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.brand}> <span style={{fontSize:'24px'}}>🏛️</span> CivicPulse  <NotificationBell /></div>
        <div style={styles.profileCard}>
          <div style={styles.avatar}>{getInitials(user?.name || '')}</div>
          <div style={styles.userName}>{user?.name || 'Citizen'}</div>
          <div style={styles.userEmail}>{user?.email || 'No Email'}</div> 
          <div style={styles.wardBadge}>📍 Ward {user?.wardNumber || 'N/A'}</div>
        </div>
        <div style={styles.navGroup}>
          <div style={styles.navItem(activeTab === 'DASHBOARD')} onClick={() => setActiveTab('DASHBOARD')}><span>📊</span> Dashboard</div>
          <div style={styles.navItem(activeTab === 'FORM')} onClick={() => setActiveTab('FORM')}><span>📝</span> Lodge Complaint</div>
          <div style={styles.navItem(activeTab === 'HISTORY')} onClick={() => setActiveTab('HISTORY')}><span>📂</span> My History</div>
        </div>
        <button style={styles.logoutBtn} onClick={() => { signout(); navigate("/"); }}>Sign Out</button>
      </div>

      <div style={styles.main}>
        {activeTab === 'DASHBOARD' && (
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>Dashboard Overview</h1>
            <p style={styles.pageSubtitle}>Welcome back! Here is a summary of your civic engagement.</p>
            
            {loading ? <p>Loading stats...</p> : (
                <>
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}><div style={styles.statLabel}>Total Complaints</div><div style={styles.statValue('#0f172a')}>{stats.total}</div></div>
                        <div style={styles.statCard}><div style={styles.statLabel}>Active / Pending</div><div style={styles.statValue('#ef4444')}>{stats.pending}</div></div>
                        <div style={styles.statCard}><div style={styles.statLabel}>Resolved</div><div style={styles.statValue('#22c55e')}>{stats.resolved}</div></div>
                        <div style={styles.statCard}><div style={styles.statLabel}>Satisfaction</div><div style={styles.statValue('#eab308')}>{stats.avgRating} <span style={{fontSize:'16px'}}>★</span></div></div>
                    </div>

                    <div style={styles.chartsContainer}>
                        <div style={styles.chartCard}>
                            <div style={styles.chartTitle}>Complaint Status</div>
                            {/* ✅ 3. USE NEW CHART COMPONENT */}
                            <DonutChart />
                        </div>

                        <div style={styles.chartCard}>
                            <div style={styles.chartTitle}>Avg. Satisfaction Rate</div>
                            <div style={{fontSize:'48px', fontWeight:800, color:'#eab308', marginBottom:'10px'}}>{stats.avgRating}</div>
                            <div style={{color:'#cbd5e1', fontSize:'24px', letterSpacing:'5px'}}>
                                {[1,2,3,4,5].map(star => (
                                    <span key={star} style={{color: star <= Math.round(stats.avgRating) ? '#eab308' : '#e2e8f0'}}>★</span>
                                ))}
                            </div>
                            <p style={{fontSize:'12px', color:'#64748b', marginTop:'15px'}}>Based on your feedback</p>
                        </div>
                    </div>
                </>
            )}
          </div>
        )}

        {activeTab === 'FORM' && (
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>New Grievance</h1>
            <p style={styles.pageSubtitle}>Fill out the form below to report a civic issue.</p>
            <ComplaintForm onSuccess={() => setActiveTab('HISTORY')} /> 
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>Complaint History</h1>
            <p style={styles.pageSubtitle}>Track the status and resolution of your reports.</p>
            <ComplaintList />
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;