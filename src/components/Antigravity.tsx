"use client";

/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

export const AntigravityInner = ({
    count = 5000,
    magnetRadius = 8,
    ringRadius = 8,
    waveSpeed = 0.001,
    waveAmplitude = 5,
    particleSize = 5,
    lerpSpeed = 0.1,
    color = '#006eff',
    autoAnimate = false,
    particleVariance = 1,
    rotationSpeed = 1,
    depthFactor = 1,
    pulseSpeed = 3,
    particleShape = 'capsule',
    fieldStrength = 5,
    areaMultiplier = 2,
    text = "",
    textStep = 4,
    textScale = 0.5,
    font = 'Arial',
    fontWeight = 'bold'
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { viewport } = useThree();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const lastMousePos = useRef({ x: 0, y: 0 });
    const lastMouseMoveTime = useRef(0);
    const virtualMouse = useRef({ x: 0, y: 0 });

    // Define Wave interface
    interface Wave {
        x: number;
        nx: number;
        ny: number;
        startTime: number;
        id: number;
    }

    // Store active waves: { x, y, startTime, id }
    const wavesRef = useRef<Wave[]>([]);
    const lastWaveTime = useRef(0);

    const particles = useMemo(() => {
        const temp = [];
        const width = (viewport.width || 100) * areaMultiplier;
        const height = (viewport.height || 100) * areaMultiplier;

        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;

            const x = (Math.random() - 0.5) * width;
            const y = (Math.random() - 0.5) * height;
            const z = (Math.random() - 0.5) * 20;

            const randomRadiusOffset = (Math.random() - 0.5) * 2;

            temp.push({
                t,
                factor,
                speed,
                mx: x,
                my: y,
                mz: z,
                cx: x,
                cy: y,
                cz: z,
                randomRadiusOffset
            });
        }
        return temp;
    }, [count, viewport.width, viewport.height, areaMultiplier]);

    // Manual mouse tracking & Wave Spawning
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;

            lastMousePos.current = { x, y };
            const now = Date.now() / 1000;
            lastMouseMoveTime.current = Date.now(); // Keep ms for activity check

            // Spawn a new wave if enough time passed (e.g., every 100ms)
            if (Date.now() - lastWaveTime.current > 100) {
                wavesRef.current.push({
                    x: (x * window.innerWidth / window.innerHeight) * (viewport.width > viewport.height ? viewport.height : viewport.width),
                    nx: x,
                    ny: y,
                    startTime: now,
                    id: Math.random()
                });
                lastWaveTime.current = Date.now();

                if (wavesRef.current.length > 20) {
                    wavesRef.current.shift();
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [viewport]);

    useFrame(state => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const { viewport: v } = state;
        const time = Date.now() / 1000;

        // 1. Clean up old waves
        const WAVE_LIFETIME = 4.0;
        wavesRef.current = wavesRef.current.filter(w => time - w.startTime < WAVE_LIFETIME);

        particles.forEach((particle, i) => {
            particle.t += particle.speed;

            let { t, mx, my, mz, cx, cy, cz, randomRadiusOffset } = particle;

            // 1. IDLE: Small moving animation everywhere
            // Gentle, continuous floating
            let targetPos = {
                x: mx + Math.sin(t * 0.3 + randomRadiusOffset + i) * 0.5,
                y: my + Math.cos(t * 0.2 + randomRadiusOffset + i) * 0.5,
                z: mz + Math.sin(t * 0.3 + i) * 1.5
            };

            // Continuous slow idle rotation
            // We'll apply this to the dummy rotation later or add to a base rotation
            const idleRotX = t * 0.3 + i * 0.1;
            const idleRotY = t * 0.3;

            let maxRippleZ = 0;
            let totalRippleX = 0;
            let totalRippleY = 0;
            let interacting = true;

            // 2. PROCESS WAVES
            wavesRef.current.forEach(wave => {
                // Calculate wave world pos here to be accurate to current viewport
                const wx = (wave.nx * v.width) / 2;
                const wy = (wave.ny * v.height) / 2;

                const dx = mx - wx;
                const dy = my - wy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Radius of this specific wave ring
                const waveExpandSpeed = 20;
                const currentWaveRadius = (time - wave.startTime) * waveExpandSpeed;

                const distFromWavefront = Math.abs(dist - currentWaveRadius);

                // Thickness of the wavefront
                const waveThickness = 4.0;

                if (distFromWavefront < waveThickness) {
                    const intensity = 1 - (distFromWavefront / waveThickness);
                    const fade = Math.max(0, 1 - ((time - wave.startTime) / WAVE_LIFETIME));

                    // Stronger displacement
                    const finalStrength = intensity * fade * 8;

                    // Use MAX to prevent stacking into infinity
                    if (finalStrength > maxRippleZ) {
                        maxRippleZ = finalStrength;
                    }

                    const angle = Math.atan2(dy, dx);
                    // Accumulate lateral pushes but dampen them
                    totalRippleX += Math.cos(angle) * finalStrength * 0.2;
                    totalRippleY += Math.sin(angle) * finalStrength * 0.2;

                    interacting = true;
                }
            });

            // Clamp lateral displacement
            totalRippleX = Math.max(-5, Math.min(5, totalRippleX));
            totalRippleY = Math.max(-5, Math.min(5, totalRippleY));

            targetPos.x += totalRippleX;
            targetPos.y += totalRippleY;
            targetPos.z += maxRippleZ; // Use the max Z we found

            // Increase lerp speed so particles react fast enough to the wave
            const currentLerp = interacting ? 0.3 : 0.05;

            particle.cx += (targetPos.x - cx) * currentLerp;
            particle.cy += (targetPos.y - cy) * currentLerp;
            particle.cz += (targetPos.z - cz) * currentLerp;

            dummy.position.set(particle.cx, particle.cy, particle.cz);

            // Rotation
            dummy.rotation.set(idleRotX, idleRotY, 0);
            if (interacting) {
                dummy.rotation.x += maxRippleZ * 0.5;
                dummy.rotation.z += maxRippleZ * 0.2;
            }

            // Scale effect
            let scaleFactor = particleSize;
            if (interacting) {
                // Grow slightly on the wave, but not too much
                scaleFactor = particleSize * (1 + maxRippleZ * 0.1);
            } else {
                // Subtle pulse for idle
                scaleFactor *= (0.9 + Math.sin(t * 2) * 0.1);
            }

            dummy.scale.set(scaleFactor, scaleFactor, scaleFactor);

            dummy.updateMatrix();
            (mesh as any).setMatrixAt(i, dummy.matrix);
        });

        (mesh as any).instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            {particleShape === 'capsule' && <capsuleGeometry args={[0.2, 0.2, 6, 6]} />}
            {particleShape === 'sphere' && <sphereGeometry args={[0.4, 8, 8]} />}
            {particleShape === 'box' && <boxGeometry args={[0.5, 0.5, 0.5]} />}
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </instancedMesh>
    );
};

const Antigravity = (props: any) => {
    return (
        <Canvas camera={{ position: [0, 0, 50], fov: 35 }}>
            <AntigravityInner {...props} />
        </Canvas>
    );
};

export default Antigravity;
