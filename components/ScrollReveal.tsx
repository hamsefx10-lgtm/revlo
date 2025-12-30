'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
    children: React.ReactNode;
    width?: 'fit-content' | '100%';
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    distance?: number;
    duration?: number;
    className?: string; // Allow passing extra classes
}

export const ScrollReveal = ({
    children,
    width = '100%',
    delay = 0,
    direction = 'up',
    distance = 50,
    duration = 0.5,
    className = ""
}: Props) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const getVariants = () => {
        switch (direction) {
            case 'up':
                return {
                    hidden: { opacity: 0, y: distance },
                    visible: { opacity: 1, y: 0 },
                };
            case 'down':
                return {
                    hidden: { opacity: 0, y: -distance },
                    visible: { opacity: 1, y: 0 },
                };
            case 'left':
                return {
                    hidden: { opacity: 0, x: distance },
                    visible: { opacity: 1, x: 0 },
                };
            case 'right':
                return {
                    hidden: { opacity: 0, x: -distance },
                    visible: { opacity: 1, x: 0 },
                };
            case 'none':
                return {
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                };
            default:
                return {
                    hidden: { opacity: 0, y: distance },
                    visible: { opacity: 1, y: 0 },
                };
        }
    };

    return (
        <div ref={ref} style={{ position: 'relative', width, overflow: 'hidden' }} className={className}>
            <motion.div
                variants={getVariants()}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ duration, delay, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </div>
    );
};
