// Location: src/components/Common/SkeletonLoader.tsx


const SkeletonLoader = () => {
    const styles = {
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            height: '400px',
            display: 'flex',
            flexDirection: 'column' as const,
            position: 'relative' as const,
        },
        imagePlaceholder: {
            width: '100%',
            height: '160px',
            backgroundColor: '#e2e8f0',
        },
        content: { padding: '20px', flex: 1 },
        textLine: (width: string, height = '16px') => ({
            width: width,
            height: height,
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            marginBottom: '10px',
        }),
        shimmerWrapper: {
            position: 'absolute' as const,
            top: 0, left: 0, width: '100%', height: '100%',
            animation: 'shimmer 1.5s infinite',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
        }
    };

    return (
        <div style={styles.card}>
            <style>
                {`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}
            </style>
            
            {/* Image Area */}
            <div style={styles.imagePlaceholder}></div>
            
            {/* Content Area */}
            <div style={styles.content}>
                <div style={styles.textLine('30%', '24px')} /> {/* Status Badge */}
                <div style={{height: '10px'}} />
                <div style={styles.textLine('80%', '28px')} /> {/* Title */}
                <div style={styles.textLine('100%')} />       {/* Description Line 1 */}
                <div style={styles.textLine('90%')} />        {/* Description Line 2 */}
                <div style={{marginTop: 'auto'}}>
                    <div style={styles.textLine('40%')} />    {/* Location */}
                    <div style={styles.textLine('50%')} />    {/* Date */}
                </div>
            </div>

            {/* The Moving Shine Effect */}
            <div style={styles.shimmerWrapper}></div>
        </div>
    );
};

export default SkeletonLoader;