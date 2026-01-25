'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, useCursor } from '@react-three/drei';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  width: 100%;
  height: 600px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-primary);
  font-family: var(--font-inter);
  z-index: 10;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  z-index: 5;
  box-shadow: var(--shadow-lg);

  .dark & {
    background: rgba(0, 0, 0, 0.6);
  }
`;

const Tip = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--primary);
    border-radius: 50%;
    display: inline-block;
  }
`;

function Box(props: any) {
    const ref = useRef<any>(null!);
    const [hovered, hover] = useState(false);
    const [clicked, click] = useState(false);

    useCursor(hovered);

    useFrame((state, delta) => (ref.current.rotation.x += delta * 0.2));

    return (
        <mesh
            {...props}
            ref={ref}
            scale={clicked ? 1.2 : 1}
            onClick={(event) => click(!clicked)}
            onPointerOver={(event) => hover(true)}
            onPointerOut={(event) => hover(false)}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={hovered ? 'hotpink' : '#4079ff'}
                roughness={0.3}
                metalness={0.8}
            />
        </mesh>
    );
}

export default function ProductViewer() {
    return (
        <ViewerContainer>
            <Suspense fallback={<LoadingOverlay>Loading 3D Experience...</LoadingOverlay>}>
                <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]}>
                    <Stage environment="city" intensity={0.5}>
                        <Box position={[0, 0, 0]} />
                    </Stage>
                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={4}
                        enableZoom={true}
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.75}
                    />
                </Canvas>
            </Suspense>

            <ControlsContainer>
                <Tip>Drag to Rotate</Tip>
                <Tip>Scroll to Zoom</Tip>
                <Tip>Click to Interact</Tip>
            </ControlsContainer>
        </ViewerContainer>
    );
}
