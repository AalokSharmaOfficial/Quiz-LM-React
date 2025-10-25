import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export function AiExplainerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 2000); // Simulate API call
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalVariants = {
        hidden: { y: "100%" },
        visible: { y: "0%" },
        exit: { y: "100%" }
    };
    
    return createPortal(
        <div className="ai-explainer-modal-overlay" onClick={onClose}>
            <motion.div
                className="ai-explainer-modal"
                onClick={e => e.stopPropagation()}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
                <div className="ai-modal-header">
                    <h3>AI Explainer</h3>
                    <button className="ai-modal-close-btn" onClick={onClose} aria-label="Close AI Explainer"><FiX/></button>
                </div>
                {isLoading ? (
                    <div className="ai-loading-spinner"></div>
                ) : (
                    <div>
                        <h4>Feature Under Development</h4>
                        <p>This feature will provide an in-depth, AI-generated explanation of the topic. The full UI is ready, but the backend connection is pending.</p>
                    </div>
                )}
            </motion.div>
        </div>,
        document.getElementById('portal-root')!
    );
}
