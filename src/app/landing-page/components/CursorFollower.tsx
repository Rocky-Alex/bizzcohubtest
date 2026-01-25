import React, { useEffect, useRef, useState } from 'react';
import '../styles/cursor-animation.css';

const CursorFollower: React.FC = () => {
    const cursorDotRef = useRef<HTMLDivElement>(null);
    const cursorRingRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        const cursorDot = cursorDotRef.current;
        const cursorRing = cursorRingRef.current;

        if (!cursorDot || !cursorRing) return;

        let mouseX = -100;
        let mouseY = -100;
        let ringX = -100;
        let ringY = -100;

        const colors = ['#667EEA', '#764BA2', '#F093FB', '#111827'];

        const createParticle = (x: number, y: number) => {
            const particle = document.createElement('div');
            particle.className = 'cursor-particle';

            // Random properties
            const size = Math.random() * 4 + 2; // 2px to 6px
            const color = colors[Math.floor(Math.random() * colors.length)];
            const destinationX = (Math.random() - 0.5) * 50; // Random movement X
            const destinationY = (Math.random() - 0.5) * 50; // Random movement Y

            // Apply styles
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--tx', `${destinationX - 50}%`); // CSS Var for transform
            particle.style.setProperty('--ty', `${destinationY - 50}%`);

            // Just use simple translate for destination to avoid complex variable calc
            particle.style.setProperty('--tx', `calc(-50% + ${destinationX}px)`);
            particle.style.setProperty('--ty', `calc(-50% + ${destinationY}px)`);

            document.body.appendChild(particle);

            // Cleanup
            setTimeout(() => {
                particle.remove();
            }, 1000);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Immediate update for dot
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

            // Spawn particle occasionally
            if (Math.random() > 0.7) { // 30% chance per move event to spawn particle
                createParticle(mouseX, mouseY);
            }
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') ||
                target.closest('button') ||
                target.classList.contains('clickable')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseover', handleMouseOver);

        // Smooth animation loop for the ring
        let animationFrameId: number;
        const animateRing = () => {
            // Lerp (Linear Interpolation) for smooth following
            const lerpFactor = 0.15;
            ringX += (mouseX - ringX) * lerpFactor;
            ringY += (mouseY - ringY) * lerpFactor;

            cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
            animationFrameId = requestAnimationFrame(animateRing);
        };

        animateRing();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseover', handleMouseOver);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="cursor-follower-wrapper">
            <div ref={cursorDotRef} className={`cursor-dot ${isHovering ? 'hovering' : ''}`} />
            <div
                ref={cursorRingRef}
                className={`cursor-ring ${isHovering ? 'hovering' : ''} ${isClicking ? 'clicking' : ''}`}
            />
        </div>
    );
};

export default CursorFollower;
