"use client";

import { useEffect, useRef } from "react";
import "./cursor.css";

export default function CursorFollower() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Refs for mutable state to avoid re-renders on every frame
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const particlesRef = useRef<any[]>([]);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D | null;

        if (!canvas || !ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle Class
        const colors = ['#4A90E2', '#7B68EE', '#50C878', '#FF6B9D', '#FFA500', '#00CED1'];

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            life: number;
            rotation: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 5 + 6;
                this.speedX = (Math.random() - 0.5) * 2;
                this.speedY = (Math.random() - 0.5) * 2;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.life = 100;
                this.rotation = Math.random() * Math.PI * 2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life -= 2;
                if (this.size > 0.5) this.size -= 0.1;
                this.rotation += 0.05;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life / 100;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        // Mouse Move Handler
        const handleMouseMove = (e: MouseEvent) => {
            // Spawn particles based on distance
            const distance = Math.sqrt(
                Math.pow(e.clientX - lastMouseRef.current.x, 2) +
                Math.pow(e.clientY - lastMouseRef.current.y, 2)
            );

            if (distance > 3) {
                for (let i = 0; i < 6; i++) {
                    particlesRef.current.push(new Particle(e.clientX, e.clientY));
                }
                lastMouseRef.current = { x: e.clientX, y: e.clientY };
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        const animate = () => {
            // Particle System Logic
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.update();
                p.draw(ctx);

                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    return (
        <canvas ref={canvasRef} id="particleCanvas"></canvas>
    );
}
