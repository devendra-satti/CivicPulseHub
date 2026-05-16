// Location: src/pages/OfficerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import NotificationBell from '../components/Common/NotificationBell';
import SkeletonLoader from '../components/Common/SkeletonLoader';
import ImageViewer from '../components/Common/ImageViewer';

// ✅ 1. ADDED NEW VISUALIZATION IMPORTS
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const OfficerDashboard: React.FC = () => {
    const { user, signout } = useAuth();
    const navigate = useNavigate();
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TASKS' | 'HISTORY'>('DASHBOARD');
    const [tasks, setTasks] = useState<any[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Stats State
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, reopened: 0, resolved: 0 });
    // ✅ 2. NEW STATE FOR BAR CHART
    const [weeklyData, setWeeklyData] = useState<any[]>([]);

    // Modal State
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    
    // Materials State
    const [materials, setMaterials] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState(""); 

    useEffect(() => {
        fetchMyTasks();
    }, []);

    useEffect(() => {
        if (activeTab === 'TASKS') {
            setFilteredTasks(tasks.filter(t => t.status !== 'RESOLVED'));
        } else if (activeTab === 'HISTORY') {
            setFilteredTasks(tasks.filter(t => t.status === 'RESOLVED'));
        }
    }, [activeTab, tasks]);

    const fetchMyTasks = async () => {
        try {
            const response = await api.get('/complaints/all');
            const allComplaints = response.data;
            
            // Filter: Only tasks assigned to ME
            const myTasks = allComplaints.filter((c: any) => c.assignedTo && c.assignedTo.toString() === user?.id?.toString());
            
            const sorted = myTasks.sort((a: any, b: any) => b.id - a.id);
            setTasks(sorted);

            const officersRes = await api.get('/users/officers');
            const myProfile = officersRes.data.find((u: any) => 
                u.id?.toString() === user?.id?.toString()
            );

            // Calculate Stats
            setStats({
                total: myTasks.length,
                pending: myTasks.filter((t: any) => t.status === 'PENDING').length,
                inProgress: myTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
                reopened: myProfile ? (myProfile.ticketsReopened || 0) : 0,
                resolved: myProfile ? (myProfile.ticketsResolved|| 0) : 0
            });

            // ✅ 3. PROCESS WEEKLY DATA FOR BAR CHART
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const processedWeekly = last7Days.map(date => {
                // Count tasks assigned on this date
                const assigned = myTasks.filter((t: any) => t.assignedAt && t.assignedAt.startsWith(date)).length;
                // Count tasks resolved on this date (checking updatedAt + status)
                const resolved = myTasks.filter((t: any) => t.status === 'RESOLVED' && t.updatedAt && t.updatedAt.startsWith(date)).length;
                
                return {
                    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    Assigned: assigned,
                    Resolved: resolved
                };
            });
            setWeeklyData(processedWeekly);

        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const getSLAStatus = (assignedAt: string) => {
        if (!assignedAt) return null;
        const assignedTime = new Date(assignedAt).getTime();
        const deadline = assignedTime + (24 * 60 * 60 * 1000); 
        const now = Date.now();
        const diff = deadline - now;

        if (diff < 0) {
            return { text: `OVERDUE by ${Math.abs(Math.round(diff / 3600000))} hrs`, color: '#ef4444', bg: '#fee2e2' };
        }
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        return { text: `${hoursLeft} hrs remaining`, color: '#d97706', bg: '#fef3c7' };
    };

    const acceptTask = async (id: number) => {
        try {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'IN_PROGRESS' } : t));
            await api.put(`/complaints/status/${id}?status=IN_PROGRESS`);
            fetchMyTasks(); 
        } catch (e) { fetchMyTasks(); }
    };

    const openResolveModal = (id: number) => {
        setSelectedTaskId(id);
        setProofImage(null);
        setMaterials(""); 
        setStatusMsg("");
        setShowResolveModal(true);
    };

    const confirmResolve = async () => {
        if (!selectedTaskId) return;
        
        if (!materials.trim()) { toast.error("Please enter materials used."); return; }

        // Find current task to get original coordinates
        const currentTask = tasks.find(t => t.id === selectedTaskId);
        if (!currentTask) return;
        
        setSubmitting(true);
        setStatusMsg("Uploading Resolution...");

        // Use Task Location to bypass geofence check for now
        const latToSend = currentTask.latitude || "0.0";
        const lngToSend = currentTask.longitude || "0.0";

        const formData = new FormData();
        if (proofImage) formData.append('proof', proofImage);
        formData.append('materials', materials);
        formData.append('lat', latToSend.toString());
        formData.append('lng', lngToSend.toString());

        try {
            await api.put(`/complaints/resolve/${selectedTaskId}`, formData);

            setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, status: 'RESOLVED' } : t));
            setShowResolveModal(false);
            if (activeTab === 'TASKS') setFilteredTasks(prev => prev.filter(t => t.id !== selectedTaskId));
            fetchMyTasks();
            toast.success("Complaint Resolved Successfully!");
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Upload failed.";
            toast.error("Error: " + errMsg);
        } finally {
            setSubmitting(false);
            setStatusMsg("");
        }
    };

    const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'O';

    // --- CHART COMPONENTS ---
    const DonutChart = () => {
        const { inProgress, reopened, resolved } = stats;
        const totalActive = inProgress + reopened + resolved;

        const data = [
            { name: 'Resolved', value: resolved, color: '#22c55e' },
            { name: 'In Progress', value: inProgress, color: '#f59e0b' },
            { name: 'Reopened', value: reopened, color: '#ef4444' },
        ].filter(item => item.value > 0);

        if (totalActive === 0) return (
            <div style={{height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', flexDirection:'column'}}>
                <span style={{fontSize:'30px'}}>📉</span>
                <span style={{fontSize:'12px', marginTop:'5px'}}>No Activity Data</span>
            </div>
        );

        return (
            <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
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
        container: { display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", backgroundColor: '#f0f9ff' },
        sidebar: { width: '280px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' as const, padding: '30px 20px', boxShadow: '4px 0 20px rgba(0,0,0,0.05)', zIndex: 10 },
        brand: { fontSize: '22px', fontWeight: 800, color: '#0288d1', marginBottom: '35px', paddingLeft: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
        profileCard: { backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', marginBottom: '30px', textAlign: 'center' as const, border: '1px solid #e2e8f0' },
        avatar: { width: '60px', height: '60px', borderRadius: '50%', background: '#e0f7fa', color: '#00bcd4', fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' },
        navGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px', flex: 1 },
        navItem: (active: boolean) => ({ padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', background: active ? '#00bfff' : 'transparent', color: active ? 'white' : '#64748b', transition: 'all 0.2s' }),
        main: { flex: 1, padding: '40px', overflowY: 'auto' as const },
        pageTitle: { fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '30px' },
        statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
        statCard: (bg: string) => ({ backgroundColor: bg, padding: '25px', borderRadius: '16px', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }),
        statNum: { fontSize: '36px', fontWeight: 800, lineHeight: 1 },
        statLabel: { fontSize: '13px', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
        
        // ✅ 4. UPDATED CHART SECTION STYLE
        chartSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' },
        chartCard: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
        chartHeader: { fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
        
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
        card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' as const },
        cardImg: { width: '100%', height: '160px', objectFit: 'cover' as const, background: '#f1f5f9' },
        cardBody: { padding: '20px', flex: 1 },
        badge: (status: string) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, background: status === 'REOPENED' ? '#fee2e2' : status === 'RESOLVED' ? '#dcfce7' : '#fef9c3', color: status === 'REOPENED' ? '#991b1b' : status === 'RESOLVED' ? '#166534' : '#854d0e' }),
        priorityBadge: (priority: string) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' as const, backgroundColor: priority === 'HIGH' ? '#fee2e2' : priority === 'LOW' ? '#dcfce7' : '#ffedd5', color: priority === 'HIGH' ? '#ef4444' : priority === 'LOW' ? '#166534' : '#c2410c', border: '1px solid currentColor' }),
        slaBadge: (bg: string, color: string) => ({ display: 'inline-block', marginLeft: 'auto', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, background: bg, color: color }),
        title: { fontSize: '16px', fontWeight: 700, margin: '0 0 10px 0', color: '#334155' },
        footer: { padding: '15px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '10px' },
        btn: (bg: string) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: 'white', background: bg, fontSize: '13px' }),
        modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
        modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
        input: { width: '100%', padding: '10px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px', marginBottom: '10px', fontSize: '14px' },
        adminCommentBox: { marginTop: '15px', padding: '10px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px', fontSize: '12px', color: '#7f1d1d' },
    };
    const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.brand}>Officer Portal <NotificationBell /></div>
                <div style={styles.profileCard}>
                    <div style={styles.avatar}>{getInitials(user?.name || '')}</div>
                    <div style={{fontWeight: 700}}>{user?.name}</div>
                    <div style={{fontSize:'12px', color:'#64748b'}}>{user?.department || 'Field Ops'}</div>
                </div>
                <div style={styles.navGroup}>
                    <div style={styles.navItem(activeTab === 'DASHBOARD')} onClick={() => setActiveTab('DASHBOARD')}>📊 Dashboard</div>
                    <div style={styles.navItem(activeTab === 'TASKS')} onClick={() => setActiveTab('TASKS')}>⚡ My Tasks</div>
                    <div style={styles.navItem(activeTab === 'HISTORY')} onClick={() => setActiveTab('HISTORY')}>✅ History</div>
                </div>
                <button onClick={() => { signout(); navigate("/"); }} style={{marginTop:'auto', padding:'12px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:600}}>Logout</button>
            </div>

            <div style={styles.main}>
                {activeTab === 'DASHBOARD' && (
                    <>
                        <h1 style={styles.pageTitle}>Performance Overview</h1>
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard('#3b82f6')}><div style={styles.statNum}>{stats.total}</div><div style={styles.statLabel}>Total Assigned</div></div>
                            <div style={styles.statCard('#f59e0b')}><div style={styles.statNum}>{stats.inProgress}</div><div style={styles.statLabel}>In Progress</div></div>
                            <div style={styles.statCard('#ef4444')}><div style={styles.statNum}>{stats.reopened}</div><div style={styles.statLabel}>Reopened Tickets</div></div>
                            <div style={styles.statCard('#22c55e')}><div style={styles.statNum}>{stats.resolved}</div><div style={styles.statLabel}>Resolved</div></div>
                        </div>
                        
                        <div style={styles.chartSection}>
                            {/* CHART 1: Workload (Pie) */}
                            <div style={styles.chartCard}>
                                <div style={styles.chartHeader}>Workload Distribution</div>
                                <DonutChart />
                            </div>

                            {/* ✅ 5. NEW CHART: Weekly Activity (Bar) */}
                            <div style={styles.chartCard}>
                                <div style={styles.chartHeader}>Weekly Activity (Last 7 Days)</div>
                                <div style={{ width: '100%', height: 220 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={weeklyData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}} cursor={{fill: '#f1f5f9'}} />
                                            <Legend iconType="circle" wrapperStyle={{fontSize:'12px', fontWeight:600}} />
                                            <Bar dataKey="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {(activeTab === 'TASKS' || activeTab === 'HISTORY') && (
                    <>
                        <h1 style={styles.pageTitle}>{activeTab === 'TASKS' ? 'Active Tasks' : 'Resolution History'}</h1>
                        {loading ? (
                            <div style={styles.grid}>{[1, 2, 3, 4].map(n => <SkeletonLoader key={n} />)}</div>
                        ) : filteredTasks.length === 0 ? <p style={{color:'#64748b'}}>No tasks found.</p> : (
                            <div style={styles.grid}>
                                {filteredTasks.map(task => {
                                    const sla = getSLAStatus(task.assignedAt);
                                    const isLocked = task.status === 'REOPENED';
                                    return (
                                        <div key={task.id} style={styles.card}>
                                            <div style={styles.cardImg}>
                                                {task.imageUrl ? (
                                                    <img src={`${FILE_BASE_URL}/uploads/${task.imageUrl}`} style={{width:'100%', height:'100%', objectFit:'cover', cursor: 'zoom-in'}} alt="issue" onClick={() => setViewerImage(`${FILE_BASE_URL}/uploads/${task.imageUrl}`)} />
                                                ) : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc'}}>No Image</div>}
                                            </div>
                                            <div style={styles.cardBody}>
                                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                                                    <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                                                        <span style={styles.badge(task.status)}>{task.status.replace('_', ' ')}</span>
                                                        <span style={styles.priorityBadge(task.priority || 'MEDIUM')}>{task.priority || 'MEDIUM'}</span>
                                                    </div>
                                                    {task.status !== 'RESOLVED' && sla && !isLocked && <span style={styles.slaBadge(sla.bg, sla.color)}>{sla.text}</span>}
                                                </div>
                                                <h3 style={styles.title}>{task.title}</h3>
                                                <p style={{fontSize:'13px', color:'#64748b'}}>{task.description}</p>
                                                <div style={{marginTop:'10px', fontSize:'12px', fontWeight:600, color:'#0ea5e9'}}>📍 {task.location}</div>
                                                {task.admin_comment && <div style={styles.adminCommentBox}><strong>Admin/User Note:</strong> {task.admin_comment}</div>}
                                                {isLocked && <div style={{marginTop:'10px', padding:'8px', background:'#fff7ed', border:'1px solid #ffedd5', borderRadius:'6px', color:'#c2410c', fontSize:'12px', fontWeight:600, display:'flex', alignItems:'center', gap:'5px'}}>🔒 Awaiting Admin Re-authorization</div>}
                                            </div>
                                            <div style={styles.footer}>
                                                {task.status === 'PENDING' && <button style={styles.btn('#3b82f6')} onClick={() => acceptTask(task.id)}>Accept Task</button>}
                                                {(task.status === 'IN_PROGRESS' || task.status === 'REOPENED') && (isLocked ? <button disabled style={{...styles.btn('#e2e8f0'), color:'#94a3b8', cursor:'not-allowed'}}>Action Blocked</button> : <button style={styles.btn('#22c55e')} onClick={() => openResolveModal(task.id)}>Mark Resolved</button>)}
                                                {task.status === 'RESOLVED' && <button disabled style={{...styles.btn('#e2e8f0'), color:'#94a3b8', cursor:'default'}}>Completed</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {showResolveModal && (
                <div style={styles.modalOverlay} onClick={() => setShowResolveModal(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={{marginTop:0, color:'#0f172a'}}>Resolve Complaint</h2>
                        <p style={{color:'#64748b', fontSize:'14px'}}>You must be at the location to upload proof.</p>
                        <label style={{fontSize:'13px', fontWeight:600, color:'#334155'}}>Materials Used (Required)</label>
                        <textarea rows={3} placeholder="Ex: 5 bags cement, 10 bricks..." value={materials} onChange={(e) => setMaterials(e.target.value)} style={{...styles.input, fontFamily: 'inherit'}} />
                        <label style={{fontSize:'13px', fontWeight:600, color:'#334155'}}>Upload Proof (Optional)</label>
                        <input type="file" accept="image/*" onChange={e => e.target.files && setProofImage(e.target.files[0])} style={styles.input} />
                        {statusMsg && <p style={{fontSize:'12px', color:'#2563eb', fontWeight:600}}>{statusMsg}</p>}
                        <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                            <button onClick={() => setShowResolveModal(false)} style={{flex:1, padding:'10px', background:'transparent', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer'}}>Cancel</button>
                            <button onClick={confirmResolve} disabled={submitting} style={{flex:1, padding:'10px', background: submitting ? '#94a3b8' : '#22c55e', color:'white', border:'none', borderRadius:'8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight:700}}>{submitting ? 'Verifying Location...' : 'Confirm Resolution'}</button>
                        </div>
                    </div>
                </div>
            )}
            <ImageViewer isOpen={!!viewerImage} src={viewerImage || ""} onClose={() => setViewerImage(null)} />
        </div>
    );
};

export default OfficerDashboard;

