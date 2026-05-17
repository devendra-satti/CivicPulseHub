// Location: src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';
import { getAllComplaints, getCategories,getUserComplaints } from '../api/complaint'; 
import { api } from '../api/client';
import NotificationBell from '../components/Common/NotificationBell';
import ImageViewer from '../components/Common/ImageViewer';

// --- VISUALIZATION IMPORTS ---
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';

// --- API Calls ---
const getOfficers = async () => { const response = await api.get('/users/officers'); return response.data; };
const getPendingOfficers = async () => { const response = await api.get('/admin/pending-officers'); return response.data; };
const getCitizens = async () => { const response = await api.get('/users/citizens'); return response.data; };
const approveOfficer = async (id: number) => { await api.put(`/admin/approve/${id}`); };
const rejectComplaint = async (id: number, comment: string) => { await api.put(`/complaints/reject/${id}?comment=${encodeURIComponent(comment)}`); };
const updateAdminComment = async (id: number, comment: string) => { await api.put(`/complaints/comment/${id}?comment=${encodeURIComponent(comment)}`); };

const getComplaintHistory = async (id: number) => {
    const response = await api.get(`/complaints/${id}/history`);
    return response.data;
};

// --- CUSTOM COMPONENT: Searchable Dropdown ---
const SearchableDropdown = ({ options, selectedId, onSelect, placeholder, zIndex = 1000 }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const selectedItem = options.find((opt: any) => opt.id.toString() === selectedId.toString());
    const filteredOptions = options.filter((opt: any) => (opt.name && opt.name.toLowerCase().includes(search.toLowerCase())) || (opt.department && opt.department.toLowerCase().includes(search.toLowerCase())) || (opt.name === "All Officers") || (opt.name === "Unassigned Only"));

    return (
        <div style={{ position: 'relative', minWidth: '200px' }}>
            <div onClick={() => setIsOpen(!isOpen)} style={{ padding: '8px 12px', border: '1px solid #b3e5fc', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38px', boxSizing: 'border-box', color: selectedItem ? '#0288d1' : '#81d4fa', fontSize: '13px', transition: 'all 0.2s', boxShadow: isOpen ? '0 0 0 2px rgba(2, 136, 209, 0.1)' : 'none' }}>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{selectedItem ? (selectedItem.department ? `${selectedItem.name}` : selectedItem.name) : placeholder}</span>
                <span style={{ fontSize: '10px', color: '#00bfff' }}>▼</span>
            </div>
            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: zIndex }} />
                    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: zIndex + 1, background: 'white', border: '1px solid #e1f5fe', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 191, 255, 0.15)', maxHeight: '200px', overflowY: 'auto' }}>
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus style={{ width: '100%', padding: '8px', border: 'none', borderBottom: '1px solid #f0f9ff', background: '#f0f9ff', outline: 'none', fontSize: '12px', color: '#0277bd' }} />
                        {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
                            <div key={opt.id} onClick={() => { onSelect(opt.id.toString()); setIsOpen(false); setSearch(""); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f9ff', background: opt.id.toString() === selectedId.toString() ? '#e1f5fe' : 'white', fontSize: '13px', color: '#0288d1' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e0f7fa'} onMouseLeave={(e) => e.currentTarget.style.background = opt.id.toString() === selectedId.toString() ? '#e1f5fe' : 'white'}>
                                <strong>{opt.name}</strong> {opt.department && <span style={{ color: '#4fc3f7', fontSize: '11px', marginLeft: '5px' }}>• {opt.department}</span>}
                            </div>
                        )) : <div style={{ padding: '10px', color: '#81d4fa', fontSize: '12px', textAlign: 'center' }}>No matches</div>}
                    </div>
                </>
            )}
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { signout } = useAuth();
    const navigate = useNavigate();
    
    // --- STATE ---
    // Added 'ANALYTICS' to activeTab
    const [activeTab, setActiveTab] = useState<'COMPLAINTS' | 'USERS' | 'ANALYTICS'>('COMPLAINTS');
    const [complaintSubTab, setComplaintSubTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'REJECTED'>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });
    const [userTypeTab, setUserTypeTab] = useState<'OFFICERS' | 'CITIZENS'>('OFFICERS');
    const [officerMode, setOfficerMode] = useState<'LIST' | 'APPROVALS'>('LIST'); 
    const [userSearch, setUserSearch] = useState("");

    // --- MODAL STATES ---
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [userStatsModalOpen, setUserStatsModalOpen] = useState(false);

    const [currentComplaintId, setCurrentComplaintId] = useState<number | null>(null);
    const [currentStatus, setCurrentStatus] = useState(""); 
    const [adminComment, setAdminComment] = useState("");
    
    // Data Containers
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [selectedUserStats, setSelectedUserStats] = useState<any>(null);

    // Main Data
    const [complaints, setComplaints] = useState<any[]>([]);
    const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
    const [categoryMap, setCategoryMap] = useState<{[key: number]: string}>({});
    const [officers, setOfficers] = useState<any[]>([]);
    const [pendingOfficers, setPendingOfficers] = useState<any[]>([]);
    const [citizens, setCitizens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [selectedOfficerId, setSelectedOfficerId] = useState<string>("");
    
    // Filters
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [officerFilter, setOfficerFilter] = useState('ALL'); 
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    // --- CHART DATA STATE ---
    const [categoryChartData, setCategoryChartData] = useState<any[]>([]);
    const [trendChartData, setTrendChartData] = useState<any[]>([]);
    const [priorityChartData, setPriorityChartData] = useState<any[]>([]);
   
    const [slaChartData, setSlaChartData] = useState<any[]>([]); // <--- ADD THIS
    const [wardChartData, setWardChartData] = useState<any[]>([]); // <--- ADD THIS

    useEffect(() => { fetchAllData(); }, []);

    // Filter Logic
    useEffect(() => {
        let result = [...complaints];
        if (complaintSubTab !== 'ALL') result = result.filter(c => c.status === complaintSubTab);
        if (priorityFilter !== 'ALL') result = result.filter(c => c.priority === priorityFilter);
        if (categoryFilter !== 'ALL') result = result.filter(c => c.categoryId.toString() === categoryFilter);
        if (officerFilter !== 'ALL') {
            if (officerFilter === 'UNASSIGNED') result = result.filter(c => !c.assignedTo);
            else result = result.filter(c => c.assignedTo && c.assignedTo.toString() === officerFilter);
        }
        if (sortConfig) {
            result.sort((a: any, b: any) => {
                if (sortConfig.key === 'priority') {
                    const order: {[key: string]: number} = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                    const valA = order[a.priority || 'MEDIUM'] || 0; const valB = order[b.priority || 'MEDIUM'] || 0;
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                } else if (sortConfig.key === 'id') { return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id; }
                else if (sortConfig.key === 'status') { return sortConfig.direction === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status); }
                else if (sortConfig.key === 'updatedAt') { return sortConfig.direction === 'asc' ? (new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime()) : (new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()); }
                return 0;
            });
        }
        setFilteredComplaints(result);
        setSelectedIds(new Set()); 
    }, [complaintSubTab, priorityFilter, categoryFilter, officerFilter, complaints, sortConfig]);

    const fetchAllData = async () => {
        try {
            const [complaintsData, categoriesData, officersData, pendingData, citizensData] = await Promise.all([
                getAllComplaints(), getCategories(), getOfficers(), getPendingOfficers(), getCitizens().catch(() => []) 
            ]);
            
            // Map Categories
            const catMap: {[key: number]: string} = {};
            const catCounts: {[key: string]: number} = {};
            categoriesData.forEach((c: any) => {
                catMap[c.id] = c.name;
                catCounts[c.name] = 0; // Initialize
            });
            setCategoryMap(catMap);
            setComplaints(complaintsData); 
            setOfficers(officersData);
            setPendingOfficers(pendingData);
            setCitizens(citizensData);

            // --- PROCESS CHART DATA ---
            // 1. Category Distribution
            complaintsData.forEach((c: any) => {
                const name = catMap[c.categoryId] || 'Other';
                if (catCounts[name] !== undefined) catCounts[name]++;
                else catCounts[name] = 1;
            });
            const catChart = Object.keys(catCounts).map(key => ({ name: key, count: catCounts[key] }));
            setCategoryChartData(catChart);

            // 2. Trend Data (Last 7 Days)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();
            
            const trendData = last7Days.map(dateStr => {
                // 1. Format the calendar tracking date to 'YYYY-MM-DD'
                const targetDate = new Date(dateStr).toISOString().split('T')[0];

                const count = complaintsData.filter((c: any) => {
                    if (!c.createdAt) return false;
                    // 2. Safely parse and convert the backend timestamp to 'YYYY-MM-DD'
                    const complaintDate = new Date(c.createdAt).toISOString().split('T')[0];
                    return complaintDate === targetDate;
                }).length;

                const resolved = complaintsData.filter((c: any) => {
                    if (!c.createdAt) return false;
                    const complaintDate = new Date(c.createdAt).toISOString().split('T')[0];
                    return complaintDate === targetDate && c.status === 'RESOLVED';
                }).length;

                return { 
                    date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }), 
                    total: count, 
                    resolved: resolved 
                };
            });

            setTrendChartData(trendData);

            // 3. Priority Data
            const pData = [
                { name: 'High', value: complaintsData.filter((c:any) => c.priority === 'HIGH').length, color: '#ef4444' },
                { name: 'Medium', value: complaintsData.filter((c:any) => c.priority === 'MEDIUM').length, color: '#f59e0b' },
                { name: 'Low', value: complaintsData.filter((c:any) => (!c.priority || c.priority === 'LOW')).length, color: '#22c55e' },
            ];
            setPriorityChartData(pData.filter(d => d.value > 0));

            
            // ✅ 4. SLA Compliance Data (NEW LOGIC)
            let metSla = 0;
            let breachedSla = 0;
            let onTrack = 0;
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;

            complaintsData.forEach((c: any) => {
                if (!c.assignedAt) return; // Skip unassigned

                const assignedTime = new Date(c.assignedAt).getTime();
                const now = Date.now();
                
                if (c.status === 'RESOLVED') {
                    // Use updatedAt as the resolution time
                    const resolvedTime = new Date(c.updatedAt || c.createdAt).getTime();
                    if ((resolvedTime - assignedTime) <= ONE_DAY_MS) {
                        metSla++;
                    } else {
                        breachedSla++;
                    }
                } else if (c.status !== 'REJECTED') {
                    // Active complaints (Pending/In_Progress/Reopened)
                    if ((now - assignedTime) > ONE_DAY_MS) {
                        breachedSla++; // Currently overdue
                    } else {
                        onTrack++;
                    }
                }
            });

            setSlaChartData([
                { name: 'Met SLA (<24h)', value: metSla, color: '#22c55e' }, // Green
                { name: 'Breached (>24h)', value: breachedSla, color: '#ef4444' }, // Red
                { name: 'On Track', value: onTrack, color: '#f59e0b' } // Yellow
            ].filter(d => d.value > 0));

            // ✅ 5. Ward/Zone Wise Data (NEW LOGIC)
            const wardCounts: { [key: string]: number } = {};
            
            complaintsData.forEach((c: any) => {
                // Assuming c.user contains the citizen details including wardNumber
                // If wardNumber is usually just a number like "4", we prefix it with "Ward "
                const ward = c.user?.wardNumber ? `Ward ${c.user.wardNumber}` : 'Unknown';
                
                if (wardCounts[ward]) {
                    wardCounts[ward]++;
                } else {
                    wardCounts[ward] = 1;
                }
            });

            // Convert to array and sort by count (highest first)
            const wData = Object.keys(wardCounts)
                .map(key => ({ name: key, count: wardCounts[key] }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Limit to top 10 wards if there are many

            setWardChartData(wData);

        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    // Modal Triggers & Helpers (Keep existing logic)
    const handleIdClick = async (id: number) => {
        try {
            const history = await getComplaintHistory(id);
            setHistoryData(history);
            setHistoryModalOpen(true);
        } catch (e) { toast.error("Could not fetch history"); }
    };

    const handleUserClick = (user: any, type: 'OFFICER' | 'CITIZEN') => {
        let statsObj: any = { ...user, type };
        if (type === 'OFFICER') {
            const myTasks = complaints.filter(c => c.assignedTo && parseInt(c.assignedTo) === user.id);
            const resolved = user.ticketsResolved || 0;
            const reopened = user.ticketsReopened || 0;
            let accuracy = 0;
            if(resolved > 0) accuracy = Math.round(((resolved - reopened)/resolved)*100);
            if(accuracy < 0) accuracy = 0;
            statsObj = { ...statsObj, currentLoad: myTasks.filter(t => t.status === 'IN_PROGRESS').length, accuracy, resolved, reopened };
        } else {
            const freshCitizen = citizens.find(c => c.id === user.id);
            statsObj = { ...statsObj, ...freshCitizen };
        }
        setSelectedUserStats(statsObj);
        setUserStatsModalOpen(true);
    };

    const getSLA = (assignedAt: string) => {
        if (!assignedAt) return null;
        const diff = new Date(assignedAt).getTime() + (24 * 60 * 60 * 1000) - Date.now();
        if (diff < 0) return { text: `OVERDUE (${Math.abs(Math.round(diff/3600000))}h)`, color: '#ef4444' };
        return { text: `${Math.round(diff/3600000)}h left`, color: '#22c55e' };
    };
    const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-";
    
    // Sort logic
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };
    const getSortIndicator = (key: string) => (!sortConfig || sortConfig.key !== key) ? <span style={{color: '#e2e8f0', marginLeft: '5px'}}>↕</span> : <span style={{color: '#00bfff', marginLeft: '5px'}}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;

    // Actions
    const handleCheckbox = (id: number) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { const assignableItems = filteredComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED'); if (e.target.checked) setSelectedIds(new Set(assignableItems.map(c => c.id))); else setSelectedIds(new Set()); };
    const handlePriorityChange = async (id: number, newPriority: string) => { try { const updated = complaints.map(c => c.id === id ? { ...c, priority: newPriority } : c); setComplaints(updated); await api.put(`/complaints/priority/${id}?priority=${newPriority}`); } catch (error) { fetchAllData(); } };
    const handleBulkAssign = async () => { if (!selectedOfficerId || selectedIds.size === 0) { toast.error("Please select complaints and an officer.");  } try { await api.put('/complaints/assign-bulk', { complaintIds: Array.from(selectedIds), officerId: parseInt(selectedOfficerId) }); toast.success("Tasks Assigned Successfully!"); setSelectedIds(new Set()); fetchAllData(); } catch (error) { toast.error("Failed to assign tasks."); } };
    const handleApprove = async (id: number) => { if(window.confirm("Approve this officer account?")) { await approveOfficer(id); fetchAllData(); } };

    // Modal Actions
    const openActionModal = (c: any) => { setCurrentComplaintId(c.id); setAdminComment(c.admin_comment || ""); setCurrentStatus(c.status); setActionModalOpen(true); };
    const handleRejectComplaint = async () => {
        if (!currentComplaintId || !adminComment.trim()) { toast.error("Please provide a rejection reason."); return; }
        if (!window.confirm("Reject complaint?")) return;
        try { await rejectComplaint(currentComplaintId, adminComment); toast.success("Complaint Rejected"); setActionModalOpen(false); fetchAllData(); } catch (e) { toast.error("Failed to reject complaint");}
    };
    const saveCommentOnly = async () => {
        if (!currentComplaintId) return;
        try { await updateAdminComment(currentComplaintId, adminComment); toast.success("Note Saved!"); setActionModalOpen(false); fetchAllData(); } catch (e) { toast.error("Failed to save note"); }
    };

    const filterOfficerOptions = [ { id: 'ALL', name: 'All Officers' }, { id: 'UNASSIGNED', name: 'Unassigned Only' }, ...officers ];

    // --- STYLES ---
    const styles = {
        container: { height: '100vh', overflowY: 'auto' as const, padding: '30px', backgroundColor: '#e0f7fa', fontFamily: "'Segoe UI', sans-serif" },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px 30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0, 191, 255, 0.1)' },
        title: { margin: 0, color: '#00bfff', fontSize: '24px', fontWeight: 800 },
        logoutBtn: { padding: '8px 20px', background: '#ff5252', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' },
        nav: { display: 'flex', gap: '15px', marginBottom: '20px' },
        navItem: (active: boolean) => ({ cursor: 'pointer', padding: '10px 25px', borderRadius: '50px', fontWeight: 700 as const, fontSize: '14px', backgroundColor: active ? '#00bfff' : 'white', color: active ? 'white' : '#0277bd', boxShadow: active ? '0 8px 15px rgba(0, 191, 255, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)', border: active ? 'none' : '1px solid #b3e5fc', transition: 'all 0.3s ease' }),
        subTabContainer: { display: 'flex', gap: '8px', marginBottom: '20px', padding: '6px', background: '#fff', borderRadius: '12px', width: 'fit-content', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
        subTab: (active: boolean, color = '#00bfff') => ({ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: active ? (color === '#ef4444' ? '#fee2e2' : '#e0f7fa') : 'transparent', color: active ? color : '#64748b', transition: 'all 0.2s', userSelect: 'none' as const }),
        toolbar: { display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' as const, alignItems: 'center' },
        selectInput: { padding: '0 15px', borderRadius: '8px', border: '1px solid #b3e5fc', height: '38px', backgroundColor: 'white', fontSize: '13px', color: '#0277bd', outline: 'none', cursor: 'pointer' },
        searchInput: { padding: '0 15px', borderRadius: '8px', border: '1px solid #b3e5fc', height: '38px', backgroundColor: 'white', fontSize: '13px', color: '#0277bd', outline: 'none', minWidth: '250px' },
        progressContainer: { width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' },
        progressBar: (pct: number) => ({ width: `${pct}%`, height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' }),
        bulkBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '5px 10px', borderRadius: '8px', marginLeft: 'auto', border: '1px solid #81d4fa' },
        bulkBtn: { padding: '0 15px', height: '30px', backgroundColor: '#00bfff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' },
        tableContainer: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 15px 30px rgba(0, 191, 255, 0.08)', overflowX: 'auto' as const, marginBottom: '50px', border: '1px solid #e1f5fe' },
        table: { width: '100%', borderCollapse: 'collapse' as const, minWidth: '1100px' },
        thead: { backgroundColor: '#f0f9ff', borderBottom: '2px solid #b3e5fc' },
        th: (sortable = false) => ({ padding: '15px', textAlign: 'left' as const, color: '#0288d1', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: '0.5px', cursor: sortable ? 'pointer' : 'default', userSelect: 'none' as const }),
        tr: (isSelected: boolean) => ({ backgroundColor: isSelected ? '#e1f5fe' : 'white', transition: 'background-color 0.2s ease', borderBottom: '1px solid #f1f5f9' }),
        td: { padding: '12px 15px', color: '#455a64', fontSize: '13px', verticalAlign: 'middle' as const },
        statusBadge: (status: string) => {
            let bg = '#94a3b8'; let color = 'white';
            if (status === 'RESOLVED') { bg = '#22c55e'; } else if (status === 'IN_PROGRESS') { bg = '#facc15'; color = '#713f12'; } else if (status === 'REOPENED') { bg = '#ef4444'; } else if (status === 'REJECTED') { bg = '#1e293b'; } else if (status === 'PENDING') { bg = '#64748b'; }
            return { display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' as const, backgroundColor: bg, color: color, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
        },
        thumb: { width: '40px', height: '40px', objectFit: 'cover' as const, borderRadius: '6px', border: '1px solid #e1f5fe', cursor:'zoom-in' },
        commentBtn: { background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '14px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
        modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
        modalContent: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' as const },
        
        timelineItem: { display: 'flex', gap: '15px', marginBottom: '20px', position: 'relative' as const },
        timelineLine: { position: 'absolute' as const, left: '14px', top: '25px', bottom: '-25px', width: '2px', backgroundColor: '#e2e8f0' },
        timelineIcon: (type: string) => {
            let bg = '#cbd5e1';
            if(type === 'RESOLVED') bg = '#22c55e'; else if(type === 'CREATED') bg = '#3b82f6'; else if(type === 'ASSIGNED') bg = '#f59e0b'; else if(type === 'REOPENED' || type === 'REJECTED') bg = '#ef4444';
            return { width: '30px', height: '30px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', zIndex: 2 };
        },
        // Chart Styles
        chartCard: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
        chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' },
        chartTitle: { fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }
    };
    const [enrichedCitizens, setEnrichedCitizens] = useState<any[]>([]);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

    useEffect(() => {
    const loadAllCitizenMetrics = async () => {
        try {
        setIsLoadingMetrics(true);
        
        // Map over every citizen and fetch their complaints records in parallel
        const enrichedDataPromises = citizens.map(async (citizen: any) => {
            try {
            const data = await getUserComplaints(parseInt(citizen.id));
            
            const total = data.length;
            const resolved = data.filter((comp: any) => comp.status === 'RESOLVED').length;
            
            // Calculate Rating metrics accurately
            const ratedComplaints = data.filter((comp: any) => comp.citizen_rating && comp.citizen_rating > 0);
            const totalStars = ratedComplaints.reduce((acc: number, curr: any) => acc + curr.citizen_rating, 0);
            const avgRating = ratedComplaints.length ? (totalStars / ratedComplaints.length).toFixed(1) : 'N/A';

            return {
                ...citizen,
                totalComplaints: total,
                resolvedCount: resolved,
                satisfaction: avgRating
            };
            } catch (err) {
            console.error(`Error loading metrics for citizen ${citizen.id}:`, err);
            return { ...citizen, totalComplaints: 0, resolvedCount: 0, satisfaction: 'N/A' };
            }
        });

        const results = await Promise.all(enrichedDataPromises);
        setEnrichedCitizens(results);
        } catch (error) {
        console.error("Error processing citizen metrics pipeline:", error);
        } finally {
        setIsLoadingMetrics(false);
        }
    };

    if (citizens && citizens.length > 0) {
        loadAllCitizenMetrics();
    }
    }, [citizens]);
    const isActionable = currentStatus !== 'RESOLVED' && currentStatus !== 'REJECTED';
    const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>CivicPulse Admin   <NotificationBell /></h2>
                <button onClick={() => { signout(); navigate("/"); }} style={styles.logoutBtn}>Logout</button>
            </div>

            <div style={styles.nav}>
                <div style={styles.navItem(activeTab === 'COMPLAINTS')} onClick={() => setActiveTab('COMPLAINTS')}>Manage Complaints</div>
                <div style={styles.navItem(activeTab === 'USERS')} onClick={() => setActiveTab('USERS')}>
                    Manage Users
                    {pendingOfficers.length > 0 && <span style={{background:'#ff5252', color:'white', borderRadius:'10px', padding:'1px 6px', fontSize:'10px', marginLeft:'8px'}}>{pendingOfficers.length}</span>}
                </div>
                {/* NEW TAB */}
                <div style={styles.navItem(activeTab === 'ANALYTICS')} onClick={() => setActiveTab('ANALYTICS')}>Analytics 📊</div>
            </div>

            {loading ? <div style={{textAlign: 'center', padding: '50px', color: '#0288d1'}}>Loading...</div> : (
                <>
                    {/* ======================= ANALYTICS VIEW (NEW) ======================= */}
                    {activeTab === 'ANALYTICS' && (
                        <div style={{animation: 'fadeIn 0.5s ease'}}>
                            <div style={styles.chartGrid}>
                                {/* 1. Category Distribution */}
                                <div style={styles.chartCard}>
                                    <div style={styles.chartTitle}>Complaints by Category</div>
                                    <div style={{width:'100%', height: 300}}>
                                        <ResponsiveContainer>
                                            <BarChart data={categoryChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}} />
                                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 2. Trend Analysis */}
                                <div style={styles.chartCard}>
                                    <div style={styles.chartTitle}>7-Day Filing Trend</div>
                                    <div style={{width:'100%', height: 300}}>
                                        <ResponsiveContainer>
                                            <AreaChart data={trendChartData}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{borderRadius:'8px', border:'none'}} />
                                                <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Complaints Filed" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 3. Priority Breakdown */}
                                <div style={styles.chartCard}>
                                    <div style={styles.chartTitle}>Priority Distribution</div>
                                    <div style={{width:'100%', height: 300}}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={priorityChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {priorityChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/*Added on 17/01  */}
                                {/* ✅ 4. SLA Compliance (NEW CHART) */}
                                <div style={styles.chartCard}>
                                    <div style={styles.chartTitle}>SLA Compliance (24h Limit)</div>
                                    <div style={{width:'100%', height: 300}}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie 
                                                    data={slaChartData} 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    outerRadius={100} 
                                                    dataKey="value"
                                                    label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                                                >
                                                    {slaChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip itemStyle={{fontSize:'12px', fontWeight:600}} />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* ✅ 5. Ward-wise Hotspots (NEW CHART) */}
                                <div style={styles.chartCard}>
                                    <div style={styles.chartTitle}>Complaints by Zone/Ward</div>
                                    <div style={{width:'100%', height: 300}}>
                                        <ResponsiveContainer>
                                            <BarChart data={wardChartData} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" fontSize={12} hide />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    fontSize={11} 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    width={60} 
                                                />
                                                <Tooltip 
                                                    cursor={{fill: '#f1f5f9'}} 
                                                    contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}} 
                                                />
                                                {/* Uses a different color to distinguish from other bar charts */}
                                                <Bar 
                                                    dataKey="count" 
                                                    fill="#8b5cf6" 
                                                    radius={[0, 4, 4, 0]} 
                                                    barSize={20} 
                                                    label={{ position: 'right', fill: '#64748b', fontSize: 11 }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================= COMPLAINTS VIEW ======================= */}
                    {activeTab === 'COMPLAINTS' && (
                        <>
                            <div style={styles.subTabContainer}>
                                <div style={styles.subTab(complaintSubTab === 'ALL')} onClick={() => setComplaintSubTab('ALL')}>All</div>
                                <div style={styles.subTab(complaintSubTab === 'PENDING')} onClick={() => setComplaintSubTab('PENDING')}>Pending</div>
                                <div style={styles.subTab(complaintSubTab === 'IN_PROGRESS')} onClick={() => setComplaintSubTab('IN_PROGRESS')}>In Progress</div>
                                <div style={styles.subTab(complaintSubTab === 'RESOLVED')} onClick={() => setComplaintSubTab('RESOLVED')}>Resolved</div>
                                <div style={styles.subTab(complaintSubTab === 'REOPENED', '#ef4444')} onClick={() => setComplaintSubTab('REOPENED')}>Reopened</div>
                                <div style={styles.subTab(complaintSubTab === 'REJECTED', '#64748b')} onClick={() => setComplaintSubTab('REJECTED')}>Rejected</div>
                            </div>

                           <div style={styles.toolbar}>
                                <select style={styles.selectInput} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                                    <option value="ALL">All Priorities</option> <option value="HIGH">High</option> <option value="MEDIUM">Medium</option> <option value="LOW">Low</option>
                                </select>
                                <select style={styles.selectInput} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                    <option value="ALL">All Categories</option> {Object.entries(categoryMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                </select>
                                <SearchableDropdown options={filterOfficerOptions} selectedId={officerFilter} onSelect={setOfficerFilter} placeholder="Filter by Officer..." zIndex={2000} />
                                {selectedIds.size > 0 && (
                                    <div style={styles.bulkBar}>
                                        <span style={{fontWeight:700, color:'#00bfff', fontSize: '13px'}}>{selectedIds.size} Selected</span>
                                        <SearchableDropdown options={officers} selectedId={selectedOfficerId} onSelect={setSelectedOfficerId} placeholder="Assign to..." zIndex={2000} />
                                        <button onClick={handleBulkAssign} style={styles.bulkBtn}>Assign</button>
                                    </div>
                                )}
                           </div>

                           <div style={styles.tableContainer}>
                                <table style={styles.table}>
                                    <thead style={styles.thead}>
                                        <tr>
                                            <th style={styles.th()}>
                                                {(complaintSubTab !== 'RESOLVED' && complaintSubTab !== 'REJECTED') && (
                                                    <input 
                                                        type="checkbox" 
                                                        onChange={handleSelectAll} 
                                                        checked={
                                                            selectedIds.size > 0 && 
                                                            selectedIds.size === filteredComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length
                                                        } 
                                                    />
                                                )}
                                            </th>
                                            <th style={styles.th(true)} onClick={() => handleSort('id')}>ID {getSortIndicator('id')}</th>
                                            <th style={styles.th(true)} onClick={() => handleSort('priority')}>Priority {getSortIndicator('priority')}</th>
                                            <th style={styles.th()}>Evidence</th>
                                            <th style={styles.th()}>Issue</th>
                                            <th style={styles.th()}>Citizen</th>
                                            <th style={styles.th(true)} onClick={() => handleSort('status')}>Status {getSortIndicator('status')}</th>
                                            <th style={styles.th(true)} onClick={() => handleSort('updatedAt')}>Updated {getSortIndicator('updatedAt')}</th>
                                            <th style={styles.th()}>Location</th>
                                            <th style={styles.th()}>Assigned To</th>
                                            <th style={styles.th()}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredComplaints.map((c) => {
                                            const assignedOfficer = officers.find(o => o.id === parseInt(c.assignedTo));
                                            const isResolved = c.status === 'RESOLVED';
                                            const isRejected = c.status === 'REJECTED';
                                            const sla = (c.status === 'IN_PROGRESS' || c.status === 'REOPENED') ? getSLA(c.assignedAt) : null;

                                            return (
                                                <tr key={c.id} style={styles.tr(selectedIds.has(c.id))} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedIds.has(c.id) ? '#e1f5fe' : 'white'}>
                                                    <td style={styles.td}>
                                                        {!isResolved && !isRejected && <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => handleCheckbox(c.id)} />}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span onClick={() => handleIdClick(c.id)} style={{cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline', fontWeight: 'bold'}} title="View History">
                                                            #{c.id}
                                                        </span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        {!isResolved ? (
                                                            <select value={c.priority || 'MEDIUM'} onChange={(e) => handlePriorityChange(c.id, e.target.value)} style={{border:'none', background:'transparent', fontWeight:'bold', color: c.priority === 'HIGH' ? '#ef4444' : (c.priority === 'MEDIUM' ? '#f59e0b' : '#22c55e'), cursor:'pointer'}}>
                                                                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                                                            </select>
                                                        ) : <span style={{fontWeight:'bold', color:'#94a3b8'}}>{c.priority}</span>}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={{display: 'flex', gap: '8px'}}>
                                                            <div title="Citizen's Complaint Image">
                                                                {c.imageUrl ? (
                                                                    <img 
                                                                        src={`${FILE_BASE_URL}/uploads/${c.imageUrl}`} 
                                                                        alt="issue" 
                                                                        style={styles.thumb}
                                                                        onClick={() => setViewerImage(`${FILE_BASE_URL}/uploads/${c.imageUrl}`)}
                                                                    />
                                                                ) : <div style={{...styles.thumb, display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9', fontSize:'9px', color:'#ccc'}}>N/A</div>}
                                                            </div>
                                                            {c.resolution_proof_url && (
                                                                <div title="Officer's Resolution Proof">
                                                                    <img 
                                                                        src={`${FILE_BASE_URL}/uploads/${c.resolution_proof_url}`} 
                                                                        alt="proof" 
                                                                        style={{...styles.thumb, borderColor: '#22c55e', borderWidth: '2px'}} 
                                                                        onClick={() => setViewerImage(`${FILE_BASE_URL}/uploads/${c.resolution_proof_url}`)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}><div style={{fontWeight: 700, color: '#0277bd'}}>{c.title}</div><div style={{fontSize: '11px', color: '#546e7a'}}>{categoryMap[c.categoryId]}</div></td>
                                                    <td style={styles.td}>{c.user ? <div><div style={{fontWeight:600}}>{c.user.name}</div><div onClick={() => handleUserClick(c.user, 'CITIZEN')} style={{fontSize:'11px', color:'#00bfff', cursor:'pointer', textDecoration:'underline'}}>{c.user.email}</div></div> : <span style={{color:'#ccc'}}>Unknown</span>}</td>
                                                    <td style={styles.td}>
                                                        <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                                            <span style={styles.statusBadge(c.status)}>{c.status.replace('_', ' ')}</span>
                                                            {sla && <span style={{fontSize:'10px', fontWeight:700, color: sla.color}}>{sla.text}</span>}
                                                            {/* RATING & FEEDBACK */}
                                                            {c.status === 'RESOLVED' && (c.citizen_rating > 0 || c.rating > 0) && (
                                                                <div style={{marginTop:'6px', paddingTop:'6px', borderTop:'1px dashed #cbd5e1'}}>
                                                                    <div style={{color:'#f59e0b', fontSize:'13px', letterSpacing:'1px', lineHeight:'1'}}>
                                                                        {"★".repeat(c.citizen_rating || c.rating)}
                                                                        <span style={{color:'#e2e8f0'}}>{"★".repeat(5 - (c.citizen_rating || c.rating))}</span>
                                                                    </div>
                                                                    {(c.citizen_feedback || c.feedback) && (
                                                                        <div title={c.citizen_feedback || c.feedback} style={{fontSize:'10px', color:'#475569', fontStyle:'italic', marginTop:'3px', maxWidth:'100px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                                                            "{c.citizen_feedback || c.feedback}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}><div style={{fontSize:'11px', fontWeight:600}}>{formatDate(c.updatedAt || c.createdAt)}</div></td>
                                                    <td style={styles.td}>
                                                        {c.latitude && c.longitude ? (
                                                            <a href={`https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid #ffcdd2', backgroundColor: '#ffebee', borderRadius: '20px', color: '#c62828', fontSize: '11px', fontWeight: 700, width: 'fit-content', transition: 'all 0.2s'}} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffcdd2'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffebee'; }} title={`View Location: ${c.latitude}, ${c.longitude}`}>📍 Map</a>
                                                        ) : <span style={{color: '#94a3b8', fontSize: '11px', fontStyle: 'italic'}}>No GPS</span>}
                                                    </td>
                                                    <td style={styles.td}>{c.assignedTo ? <div onClick={() => assignedOfficer && handleUserClick(assignedOfficer, 'OFFICER')} style={{fontSize:'12px', fontWeight:600, color:'#0277bd', cursor: assignedOfficer ? 'pointer' : 'default'}}>{assignedOfficer ? assignedOfficer.name : `ID: ${c.assignedTo}`}</div> : <span style={{color:'#94a3b8', fontStyle:'italic'}}>Unassigned</span>}</td>
                                                    <td style={styles.td}><button onClick={() => openActionModal(c)} style={{...styles.commentBtn, backgroundColor: c.admin_comment ? '#e0f7fa' : 'white', borderColor: c.admin_comment ? '#00bcd4' : '#e2e8f0'}} title="Action / Comment">{c.admin_comment ? '📝' : '⚙️'}</button></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                           </div>
                        </>
                    )}

                    {/* ======================= MANAGE USERS VIEW ======================= */}
                    {activeTab === 'USERS' && (
                        <>
                            <div style={styles.subTabContainer}>
                                <div style={styles.subTab(userTypeTab === 'OFFICERS')} onClick={() => setUserTypeTab('OFFICERS')}>Officers</div>
                                <div style={styles.subTab(userTypeTab === 'CITIZENS')} onClick={() => setUserTypeTab('CITIZENS')}>Citizens</div>
                            </div>
                            
                            {userTypeTab === 'OFFICERS' && (
                                <>
                                    <div style={{display:'flex', gap: '10px', marginBottom: '15px'}}>
                                        <div style={styles.subTab(officerMode === 'LIST')} onClick={() => setOfficerMode('LIST')}>Active Officers ({officers.length})</div>
                                        <div style={styles.subTab(officerMode === 'APPROVALS', pendingOfficers.length > 0 ? '#ef4444' : '#00bfff')} onClick={() => setOfficerMode('APPROVALS')}>Approvals {pendingOfficers.length > 0 && `(${pendingOfficers.length})`}</div>
                                    </div>
                                    {officerMode === 'LIST' && (
                                        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '30px' }}>
                                            <input type="text" placeholder="Search Officers..." style={styles.searchInput} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                                            <table style={styles.table}>
                                                <thead style={styles.thead}>
                                                    <tr>
                                                        <th style={styles.th()}>Name</th>
                                                        <th style={styles.th()}>Department</th>
                                                        <th style={{...styles.th(), textAlign:'center'}}>Resolved</th>
                                                        <th style={{...styles.th(), textAlign:'center'}}>Avg Rating</th>
                                                        <th style={{...styles.th(), width:'120px'}}>Accuracy</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {officers.filter(o => o.name.toLowerCase().includes(userSearch.toLowerCase())).map(o => {
                                                        const resolvedCount = o.ticketsResolved || 0; 
                                                        const reopenedCount = o.ticketsReopened || 0;
                                                        
                                                        // 1. Calculate Accuracy
                                                        let accuracy = 0; 
                                                        if (resolvedCount > 0) { accuracy = Math.round(((resolvedCount - reopenedCount) / resolvedCount) * 100); } 
                                                        if (accuracy < 0) accuracy = 0;
                                                        let accuracyColor = '#22c55e'; if(accuracy < 80) accuracyColor = '#f59e0b'; if(accuracy < 50) accuracyColor = '#ef4444';

                                                        // 2. Calculate Average Rating
                                                        const officerComplaints = complaints.filter(c => c.assignedTo && c.assignedTo.toString() === o.id.toString());
                                                        const ratedComplaints = officerComplaints.filter(c => (c.citizen_rating || c.rating) > 0);
                                                        const totalStars = ratedComplaints.reduce((acc, curr) => acc + (curr.citizen_rating || curr.rating), 0);
                                                        const avgRating = ratedComplaints.length ? (totalStars / ratedComplaints.length).toFixed(1) : "N/A";
                                                        const ratingColor = avgRating === "N/A" ? '#cbd5e1' : (parseFloat(avgRating) >= 4 ? '#eab308' : parseFloat(avgRating) >= 2.5 ? '#f59e0b' : '#ef4444');

                                                        return (
                                                            <tr key={o.id} style={{borderBottom: '1px solid #f0f9ff'}}>
                                                                <td style={styles.td}><strong>{o.name}</strong><div onClick={() => handleUserClick(o, 'OFFICER')} style={{fontSize:'11px', color:'#0288d1', cursor:'pointer', textDecoration:'underline'}}>{o.email}</div></td>
                                                                <td style={styles.td}><span style={{background:'#e0f7fa', padding:'4px 10px', borderRadius:'10px', color:'#006064', fontSize:'11px', fontWeight:600}}>{o.department}</span></td>
                                                                <td style={{...styles.td, textAlign:'center', fontWeight:700}}>{resolvedCount}</td>
                                                                <td style={{...styles.td, textAlign:'center'}}>
                                                                    <span style={{color: ratingColor, fontWeight: 800, fontSize:'13px'}}>{avgRating} {avgRating !== "N/A" && '★'}</span>
                                                                    {avgRating !== "N/A" && <div style={{fontSize:'10px', color:'#94a3b8'}}>({ratedComplaints.length} reviews)</div>}
                                                                </td>
                                                                <td style={styles.td}>
                                                                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                                                        <div style={styles.progressContainer}><div style={{...styles.progressBar(accuracy), backgroundColor: accuracyColor}}></div></div>
                                                                        <span style={{fontSize:'11px', fontWeight:700, color: accuracyColor}}>{accuracy}%</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {officerMode === 'APPROVALS' && (
                                        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '30px' }}>
                                            {pendingOfficers.length === 0 ? <p style={{color: '#90a4ae', fontStyle: 'italic'}}>No pending requests.</p> : (
                                                <table style={styles.table}>
                                                    <thead style={styles.thead}><tr><th style={styles.th()}>Name</th><th style={styles.th()}>Email</th><th style={styles.th()}>Dept</th><th style={styles.th()}>Action</th></tr></thead>
                                                    <tbody>
                                                        {pendingOfficers.map((user) => (
                                                            <tr key={user.id} style={{borderBottom: '1px solid #f0f9ff'}}>
                                                                <td style={styles.td}><strong>{user.name}</strong></td>
                                                                <td style={{...styles.td, color: '#0288d1'}}>{user.email}</td>
                                                                <td style={styles.td}>{user.department || 'N/A'}</td>
                                                                <td style={styles.td}><button onClick={() => handleApprove(user.id)} style={{padding: '6px 15px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 700}}>Approve</button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                            {userTypeTab === 'CITIZENS' && (
                                <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '30px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search Citizens..." 
                                        style={styles.searchInput} 
                                        value={userSearch} 
                                        onChange={e => setUserSearch(e.target.value)} 
                                    />
                                    <table style={styles.table}>
                                        <thead style={styles.thead}>
                                            <tr>
                                                <th style={styles.th()}>Name</th>
                                                <th style={styles.th()}>Email</th>
                                                <th style={{...styles.th(), textAlign:'center'}}>Complaints Filed</th>
                                                <th style={{...styles.th(), textAlign:'center'}}>Resolved</th>
                                                <th style={{...styles.th(), textAlign:'center'}}>Avg Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* 🚀 [FROM SNIPPET 2]: This clean conditional block completely replaces your old loop */}
                                            {isLoadingMetrics ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: '500' }}>
                                                        ⏳ Fetching citizen analytics from backend...
                                                    </td>
                                                </tr>
                                            ) : (
                                                enrichedCitizens
                                                    .filter(c => c.name.toLowerCase().includes(userSearch.toLowerCase()))
                                                    .map(c => (
                                                        <tr key={c.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                                                            <td style={styles.td}><strong>{c.name}</strong></td>
                                                            <td style={{...styles.td, color: '#0099ff'}}>{c.email}</td>
                                                            
                                                            <td style={{...styles.td, textAlign:'center'}}>
                                                                <span style={{background:'#f1f5f9', padding:'4px 8px', borderRadius:'6px', fontWeight:700, color: '#1e293b'}}>
                                                                    {c.totalComplaints}
                                                                </span>
                                                            </td>
                                                            
                                                            <td style={{...styles.td, textAlign:'center'}}>
                                                                <span style={{color:'#22c55e', fontWeight:700}}>
                                                                    {c.resolvedCount}
                                                                </span>
                                                            </td>
                                                            
                                                            <td style={{...styles.td, textAlign:'center'}}>
                                                                {c.satisfaction !== 'N/A' ? (
                                                                    <span style={{color:'#f39c12', fontWeight:700}}>{c.satisfaction} ★</span>
                                                                ) : (
                                                                    <span style={{color:'#94a3b8'}}>-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}                       </>
                    )}
                </>
            )}

            {/* --- MODALS --- */}
            {actionModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setActionModalOpen(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop:0, color:'#0277bd'}}>Admin Action</h3>
                        <p style={{fontSize:'13px', color:'#64748b'}}>Provide a reason to reject this complaint, or add an internal note.</p>
                        <textarea rows={4} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #b3e5fc', marginBottom:'15px', outline:'none', fontFamily: 'inherit'}} placeholder="Enter comment or rejection reason..." value={adminComment} onChange={e => setAdminComment(e.target.value)} />
                        <div style={{display:'flex', justifyContent:'space-between', gap:'10px'}}>
                            {isActionable ? <button onClick={handleRejectComplaint} style={{padding:'8px 15px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>🚫 Reject</button> : <div></div>}
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={() => setActionModalOpen(false)} style={{padding:'8px 15px', background:'transparent', border:'1px solid #ccc', borderRadius:'6px', cursor:'pointer'}}>Cancel</button>
                                <button onClick={saveCommentOnly} style={{padding:'8px 15px', background:'#00bfff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Save Note</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {userStatsModalOpen && selectedUserStats && (
                <div style={styles.modalOverlay} onClick={() => setUserStatsModalOpen(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={{textAlign:'center', marginBottom:'20px'}}>
                            <div style={{width:'60px', height:'60px', borderRadius:'50%', background:'#e0f7fa', color:'#00bcd4', fontSize:'24px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px auto'}}>
                                {selectedUserStats.name ? selectedUserStats.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <h2 style={{margin:0, color:'#0f172a'}}>{selectedUserStats.name}</h2>
                            <div style={{fontSize:'14px', color:'#64748b'}}>{selectedUserStats.email}</div>
                            <div style={{marginTop:'5px', fontSize:'12px', fontWeight:600, color:'#3b82f6'}}>{selectedUserStats.type}</div>
                        </div>
                        
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', background:'#f8fafc', padding:'15px', borderRadius:'12px'}}>
                            {selectedUserStats.type === 'OFFICER' ? (
                                <>
                                    <div style={{textAlign:'center'}}><div style={{fontSize:'24px', fontWeight:800, color:'#22c55e'}}>{selectedUserStats.accuracy}%</div><div style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>ACCURACY</div></div>
                                    <div style={{textAlign:'center'}}><div style={{fontSize:'24px', fontWeight:800, color:'#3b82f6'}}>{selectedUserStats.currentLoad}</div><div style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>ACTIVE TASKS</div></div>
                                    <div style={{textAlign:'center'}}><div style={{fontSize:'18px', fontWeight:800, color:'#0f172a'}}>{selectedUserStats.resolved}</div><div style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>RESOLVED</div></div>
                                    <div style={{textAlign:'center'}}><div style={{fontSize:'18px', fontWeight:800, color:'#ef4444'}}>{selectedUserStats.reopened}</div><div style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>REOPENED</div></div>
                                </>
                            ) : (
                                <>
                                    <div style={{textAlign:'center'}}><div style={{fontSize:'24px', fontWeight:800, color:'#3b82f6'}}>{selectedUserStats.totalComplaints}</div><div style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>TOTAL FILED</div></div>
                                    <div style={{textAlign:'center'}}><div style={{fontSize:'24px', fontWeight:800, color:'#22c55e'}}>{selectedUserStats.resolvedCount}</div><div style={{fontSize:'11px', color:'#64748b', fontWeight:600}}>RESOLVED</div></div>
                                </>
                            )}
                        </div>
                        <button onClick={() => setUserStatsModalOpen(false)} style={{marginTop:'20px', width:'100%', padding:'12px', background:'#00bfff', color:'white', border:'none', borderRadius:'8px', fontWeight:700, cursor:'pointer'}}>Close Profile</button>
                    </div>
                </div>
            )}

            {historyModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setHistoryModalOpen(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop:0, color:'#0277bd', borderBottom:'1px solid #f1f5f9', paddingBottom:'10px'}}>Complaint History</h3>
                        {historyData.length === 0 ? <p style={{color:'#64748b', fontStyle:'italic'}}>No history recorded yet.</p> : (
                            <div style={{marginTop:'20px'}}>
                                {historyData.map((h: any, index: number) => (
                                    <div key={index} style={styles.timelineItem}>
                                        <div style={styles.timelineLine}></div>
                                        <div style={styles.timelineIcon(h.actionType)}>
                                            {h.actionType === 'CREATED' ? '📝' : h.actionType === 'RESOLVED' ? '✅' : h.actionType === 'REJECTED' ? '🚫' : h.actionType === 'REOPENED' ? '🔄' : '👤'}
                                        </div>
                                        <div style={{marginLeft:'40px'}}>
                                            <div style={{fontSize:'13px', fontWeight:700, color:'#334155'}}>
                                                {h.actionType} <span style={{fontSize:'11px', color:'#94a3b8', fontWeight:400}}>- {formatDate(h.timestamp)}</span>
                                            </div>
                                            <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>{h.details}</div>
                                            {h.actionBy && <div style={{fontSize:'11px', color:'#3b82f6', marginTop:'2px'}}>by {h.actionBy.name} ({h.actionBy.role})</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setHistoryModalOpen(false)} style={{marginTop:'20px', width:'100%', padding:'10px', background:'transparent', border:'1px solid #ccc', borderRadius:'8px', cursor:'pointer'}}>Close Timeline</button>
                    </div>
                </div>
            )}
            
            <ImageViewer isOpen={!!viewerImage} src={viewerImage || ""} onClose={() => setViewerImage(null)} />
        </div>
    );
};

export default AdminDashboard;

