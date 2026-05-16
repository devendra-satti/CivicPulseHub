// Location: src/components/Complaints/ComplaintList.tsx
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast'; // <--- Add this line
import { getUserComplaints } from '../../api/complaint';
import { api } from '../../api/client'; 
// 1. Add Import
import ImageViewer from '../Common/ImageViewer';
import SkeletonLoader from '../Common/SkeletonLoader'; // Add this at the top
const ComplaintList: React.FC = () => {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    // 2. Add State inside ComplaintList component
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    // Rating Form State
    const [ratingId, setRatingId] = useState<number | null>(null);
    const [stars, setStars] = useState(5);
    const [feedbackText, setFeedbackText] = useState("");
    
    // --- NEW: Missing state for the hover animation ---
    const [hoveredStar, setHoveredStar] = useState<number>(0);

    useEffect(() => { fetchComplaints(); }, []);

    const fetchComplaints = async () => {
        const authStr = localStorage.getItem('auth');
        const authData = authStr ? JSON.parse(authStr) : null;
        if (authData?.id || authData?.user?.id) {
            try {
                const uid = typeof authData.id === 'string' ? parseInt(authData.id) : 
                           (authData.user?.id ? (typeof authData.user.id === 'string' ? parseInt(authData.user.id) : authData.user.id) : null);
                
                if (uid) {
                    const data = await getUserComplaints(uid);
                    setComplaints(data.sort((a: any, b: any) => b.id - a.id));
                }
            } catch (error) { console.error(error); }
        }
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Just now";
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleReopen = async (id: number) => {
        if (!window.confirm("Send this back to the officer?")) return;
        try {
            await api.put(`/complaints/reopen/${id}`);
            toast.success("Complaint Reopened!"); // <--- Changed from alert()
            fetchComplaints();
        } catch (error) { toast.error("Error reopening complaint");} // <--- Changed from alert() }
    };

    const submitFeedback = async (id: number) => {
        try {
            await api.put(`/complaints/feedback/${id}?rating=${stars}&feedback=${encodeURIComponent(feedbackText)}`);
            toast.success("Thanks for your rating!"); // <--- Changed from alert()
            
            setComplaints(prev => prev.map(c => c.id === id ? { ...c, citizen_rating: stars, citizen_feedback: feedbackText } : c));
            setRatingId(null);
        } catch (error) { toast.error("Error submitting feedback"); }// <--- Changed from alert() 
    };

    const filteredComplaints = complaints.filter(c => {
        if (statusFilter === 'ALL') return true;
        return c.status === statusFilter;
    });

    const styles = {
        container: { maxWidth: '900px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
        toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' },
        filterSelect: { padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', fontSize: '14px', fontWeight: 600, cursor: 'pointer', outline: 'none' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
        card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, border: '1px solid #f1f5f9' },
        
        // --- UPDATED STYLES ---
        actionArea: {
            marginTop: '15px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
        },
        ratingCard: {
            textAlign: 'center' as const,
            animation: 'fadeIn 0.4s ease-out',
        },
        starContainer: {
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '15px',
        },
        textarea: {
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
            fontFamily: 'inherit',
            marginBottom: '15px',
            resize: 'vertical' as const,
            outline: 'none',
            transition: 'border-color 0.2s',
            minHeight: '80px',
            boxSizing: 'border-box' as const,
        },
        btnGroup: {
            display: 'flex',
            gap: '10px',
            justifyContent: 'center'
        },
        btn: (variant: 'primary' | 'secondary' | 'danger') => {
            const base = {
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'transform 0.1s',
            };
            if (variant === 'primary') return { ...base, backgroundColor: '#10b981', color: 'white', boxShadow: '0 2px 5px rgba(16, 185, 129, 0.3)' };
            if (variant === 'danger') return { ...base, backgroundColor: 'white', color: '#ef4444', border: '1px solid #fecaca' };
            // Secondary/Cancel
            return { ...base, backgroundColor: 'white', color: '#64748b', border: '1px solid #cbd5e1' };
        },
        questionText: { fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '15px' },
        
        // Image Section
        imgContainer: { display: 'flex', borderBottom: '1px solid #f1f5f9', height: '160px' },
        imageHalf: { flex: 1, objectFit: 'cover' as const, cursor: 'pointer' },
        noImage: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, padding: '10px' },
        
        content: { padding: '20px', flex: 1 },
        statusBadge: (status: string) => ({
            display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, marginBottom: '10px',
            backgroundColor: status === 'RESOLVED' ? '#dcfce7' : status === 'IN_PROGRESS' ? '#fef9c3' : status === 'REOPENED' ? '#fee2e2' : '#f1f5f9',
            color: status === 'IN_PROGRESS' ? '#854d0e' : status === 'RESOLVED' ? '#166534' : status === 'REOPENED' ? '#991b1b' : '#64748b',
        }),
        title: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#334155' },
        desc: { fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '10px' },
        
        adminBox: { backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316', padding: '10px', borderRadius: '4px', fontSize: '12px', color: '#7c2d12', marginBottom: '10px' },
        materialsBox: { fontSize: '12px', color: '#475569', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '6px', marginBottom: '10px' },
        
        metaRow: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' },
        timeInfo: { fontSize: '11px', color: '#0ea5e9', fontWeight: 600, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
        emptyState: { textAlign: 'center' as const, padding: '40px', color: '#64748b', fontStyle: 'italic', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }
    };

    // REPLACE THE OLD LOADING CHECK WITH THIS:
    if (loading) return (
        <div style={styles.container}>
            <div style={styles.toolbar}>
                {/* Fake Toolbar */}
                <div style={{height:'38px', width:'150px', background:'#f1f5f9', borderRadius:'8px', marginLeft:'auto'}}></div>
            </div>
            <div style={styles.grid}>
                {/* Show 6 skeletons while loading */}
                {[1, 2, 3, 4, 5, 6].map(n => <SkeletonLoader key={n} />)}
            </div>
        </div>
    );
    const FILE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return (
        <div style={styles.container}>
            {/* CSS for animations */}
            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .star-icon { font-size: 28px; color: #cbd5e1; transition: color 0.2s; }
                .star-icon.filled { color: #fbbf24; }
                .star-btn { background: none; border: none; cursor: pointer; padding: 0; transition: transform 0.2s; }
                .star-btn:hover { transform: scale(1.2); }
                textarea:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
                `}
            </style>

            <div style={styles.toolbar}>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
                    <option value="ALL">Show All Statuses</option>
                    <option value="PENDING">🕒 Pending</option>
                    <option value="IN_PROGRESS">⚡ In Progress</option>
                    <option value="RESOLVED">✅ Resolved</option>
                    <option value="REOPENED">🔄 Reopened</option>
                    <option value="REJECTED">❌ Rejected</option>
                </select>
            </div>

            {filteredComplaints.length === 0 ? (
                <div style={styles.emptyState}>No complaints found with status "{statusFilter}".</div>
            ) : (
                <div style={styles.grid}>
                    {filteredComplaints.map((c) => (
                        <div key={c.id} style={styles.card}>
                            <div style={styles.imgContainer}>
                                {c.imageUrl ? (
                                    <img 
                                        src={`${FILE_BASE_URL}/uploads/${c.imageUrl}`} 
                                        alt="Problem" 
                                        style={styles.imageHalf} 
                                        title="Your Upload" 
                                        onClick={() => setViewerImage(`${FILE_BASE_URL}/uploads/${c.imageUrl}`)}
                                    />
                                ) : <div style={styles.noImage}>No Image</div>}
                                                                
                                {c.resolution_proof_url ? (
                                    <img 
                                        src={`${FILE_BASE_URL}/uploads/${c.resolution_proof_url}`} 
                                        alt="Proof" 
                                        style={{...styles.imageHalf, borderLeft:'2px solid white'}} 
                                        title="Click to zoom"
                                        onClick={() => setViewerImage(`${FILE_BASE_URL}/uploads/${c.resolution_proof_url}`)}
                                    />
                                ) : (c.status === 'RESOLVED' && <div style={styles.noImage}>No Proof</div>)}
                            </div>
                            
                            <div style={styles.content}>
                                <span style={styles.statusBadge(c.status)}>{c.status.replace('_', ' ')}</span>
                                <h3 style={styles.title}>{c.title}</h3>
                                <p style={styles.desc}>{c.description}</p>
                                
                                {c.admin_comment && (
                                    <div style={styles.adminBox}>
                                        <strong>📢 Admin Note:</strong> {c.admin_comment}
                                    </div>
                                )}

                                {c.materialsUsed && (
                                    <div style={styles.materialsBox}>
                                        <strong>🏗️ Materials:</strong> {c.materialsUsed}
                                    </div>
                                )}

                                <div style={styles.metaRow}><span>📍</span> {c.location}</div>
                                <div style={styles.timeInfo}>🕒 Updated: {formatDate(c.updatedAt || c.createdAt)}</div>

                                {/* --- REPLACED ACTION AREA --- */}
                                {c.status === 'RESOLVED' && (
                                    <div style={styles.actionArea}>
                                        {(c.citizen_rating || c.rating) ? (
                                            <div style={{textAlign: 'center'}}>
                                                <div style={{fontSize:'12px', color:'#64748b', marginBottom:'4px'}}>You rated this resolution:</div>
                                                <div style={{color:'#fbbf24', fontSize:'20px'}}>{"★".repeat(c.citizen_rating || c.rating)}</div>
                                            </div>
                                        ) : ratingId === c.id ? (
                                            <div style={styles.ratingCard}>
                                                <div style={{marginBottom:'10px', fontWeight:'700', fontSize:'14px', color:'#334155'}}>How was the resolution?</div>
                                                
                                                {/* INTERACTIVE STARS */}
                                                <div style={styles.starContainer}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            className="star-btn"
                                                            onClick={() => setStars(star)}
                                                            onMouseEnter={() => setHoveredStar(star)}
                                                            onMouseLeave={() => setHoveredStar(0)}
                                                        >
                                                            <span className={`star-icon ${star <= (hoveredStar || stars) ? 'filled' : ''}`}>★</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                <textarea 
                                                    placeholder="Tell us more about your experience..." 
                                                    style={styles.textarea} 
                                                    value={feedbackText} 
                                                    onChange={e => setFeedbackText(e.target.value)}
                                                />
                                                
                                                <div style={styles.btnGroup}>
                                                    {/* Updated buttons to use the new 'variant' system */}
                                                    <button style={styles.btn('primary')} onClick={() => submitFeedback(c.id)}>Submit Review</button>
                                                    <button style={styles.btn('secondary')} onClick={() => setRatingId(null)}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{textAlign: 'center'}}>
                                                <p style={styles.questionText}>Is the issue resolved?</p>
                                                <div style={styles.btnGroup}>
                                                    <button style={styles.btn('primary')} onClick={() => { setRatingId(c.id); setStars(5); setFeedbackText(""); }}>Yes, Rate It</button>
                                                    <button style={styles.btn('danger')} onClick={() => handleReopen(c.id)}>No, Reopen</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* ✅ ADD THIS AT THE BOTTOM */}
            <ImageViewer 
                isOpen={!!viewerImage} 
                src={viewerImage || ""} 
                onClose={() => setViewerImage(null)} 
            />
        </div>
    );
};

export default ComplaintList;

