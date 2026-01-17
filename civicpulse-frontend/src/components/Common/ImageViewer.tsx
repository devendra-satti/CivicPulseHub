// Location: src/components/Common/ImageViewer.tsx  - 07/01
import React from 'react';

interface ImageViewerProps {
    isOpen: boolean;
    src: string;
    alt?: string;
    onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, src, alt, onClose }) => {
    if (!isOpen || !src) return null;

    return (
        <div 
            onClick={onClose} 
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999, // Super high z-index to sit on top of everything
                cursor: 'zoom-out',
                animation: 'fadeIn 0.2s ease-in'
            }}
        >
            {/* Close Button (Top Right) */}
            <button 
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '30px',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '40px',
                    cursor: 'pointer',
                    opacity: 0.8,
                    transition: 'opacity 0.2s'
                }}
            >
                &times;
            </button>

            {/* The Image */}
            <img 
                src={src} 
                alt={alt || "View"} 
                onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
                style={{
                    maxWidth: '90%',
                    maxHeight: '90vh',
                    borderRadius: '8px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    cursor: 'default',
                    objectFit: 'contain'
                }} 
            />
            
            <style>
                {`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}
            </style>
        </div>
    );
};

export default ImageViewer;