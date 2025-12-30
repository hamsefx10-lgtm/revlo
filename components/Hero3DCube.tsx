'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- Configuration ---
const CUBE_SIZE = 0.95;
const SPACING = 1;
const MOVE_SPEED = 3.0;
const WAIT_TIME = 800;
const BORDER_WIDTH = 0.05; // Black border between cubelets

// --- Colors ---
const COLORS = [
    '#3498DB', // Primary Blue
    '#2ECC71', // Secondary Green
    '#2C3E50', // Dark
    '#3498DB', // More Blue
    '#1A252F', // Darker
];

/**
 * Single Cube Mesh
 */
const CubeMesh = ({ position, color, meshRef }: { position: [number, number, number], color: string, meshRef: React.RefObject<THREE.Mesh> }) => {
    return (
        <mesh ref={meshRef} position={position}>
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <meshStandardMaterial
                color={color}
                roughness={0.2}
                metalness={0.7}
                envMapIntensity={2}
            />
        </mesh>
    );
};

/**
 * The Self-Playing Rubik's Cube
 */
const RubiksCube = () => {
    const groupRef = useRef<THREE.Group>(null);

    // References to all 27 cubes
    const cubeRefs = useMemo(() => Array.from({ length: 27 }).map(() => React.createRef<THREE.Mesh>()), []);
    const cubeData = useMemo(() => {
        const data = [];
        let i = 0;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    data.push({
                        initialPos: new THREE.Vector3(x * SPACING, y * SPACING, z * SPACING),
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        id: i++
                    });
                }
            }
        }
        return data;
    }, []);

    // Animation State
    const state = useRef({
        isAnimating: false,
        moveAxis: 'x' as 'x' | 'y' | 'z',
        moveSlice: 0,
        rotateProgress: 0,
        targetRotationAngle: Math.PI / 2,
        lastMoveTime: 0,
        cubesInSlice: [] as number[],
        rotationDirection: 1,
    });

    const applyRotationToSlice = (indices: number[], axis: 'x' | 'y' | 'z', angle: number, snap: boolean) => {
        const rotMatrix = new THREE.Matrix4();
        if (axis === 'x') rotMatrix.makeRotationX(angle);
        if (axis === 'y') rotMatrix.makeRotationY(angle);
        if (axis === 'z') rotMatrix.makeRotationZ(angle);

        indices.forEach(idx => {
            const mesh = cubeRefs[idx].current;
            if (mesh) {
                if (snap) {
                    const remainingAngle = state.current.targetRotationAngle * state.current.rotationDirection - state.current.rotateProgress * state.current.rotationDirection;
                    const finalRotMatrix = new THREE.Matrix4();
                    if (axis === 'x') finalRotMatrix.makeRotationX(remainingAngle);
                    if (axis === 'y') finalRotMatrix.makeRotationY(remainingAngle);
                    if (axis === 'z') finalRotMatrix.makeRotationZ(remainingAngle);
                    mesh.applyMatrix4(finalRotMatrix);

                    // Snap positions
                    mesh.position.set(
                        Math.round(mesh.position.x / SPACING) * SPACING,
                        Math.round(mesh.position.y / SPACING) * SPACING,
                        Math.round(mesh.position.z / SPACING) * SPACING
                    );

                    // Snap rotations
                    const snapTo90 = (rad: number) => Math.round(rad / (Math.PI / 2)) * (Math.PI / 2);
                    mesh.rotation.set(
                        snapTo90(mesh.rotation.x),
                        snapTo90(mesh.rotation.y),
                        snapTo90(mesh.rotation.z)
                    );
                } else {
                    mesh.applyMatrix4(rotMatrix);
                }
            }
        });
    };

    useFrame((rootState, delta) => {
        if (!groupRef.current) return;
        const s = state.current;
        const now = performance.now();

        // --- GLOBAL TUMBLE ROTATION (Multi-axis) ---
        groupRef.current.rotation.y += delta * 0.2;
        groupRef.current.rotation.x += delta * 0.15;
        groupRef.current.rotation.z += delta * 0.1;

        // --- RUBIK'S MECHANIC ---
        if (!s.isAnimating) {
            if (now - s.lastMoveTime > WAIT_TIME) {
                s.isAnimating = true;
                s.rotateProgress = 0;

                const axes = ['x', 'y', 'z'] as const;
                s.moveAxis = axes[Math.floor(Math.random() * axes.length)];
                s.moveSlice = Math.floor(Math.random() * 3) - 1;
                s.rotationDirection = Math.random() > 0.5 ? 1 : -1;

                s.cubesInSlice = [];
                cubeRefs.forEach((ref, index) => {
                    if (ref.current) {
                        const localPos = ref.current.position;
                        const val = s.moveAxis === 'x' ? localPos.x : (s.moveAxis === 'y' ? localPos.y : localPos.z);
                        if (Math.abs(val - s.moveSlice * SPACING) < 0.1) {
                            s.cubesInSlice.push(index);
                        }
                    }
                });
            }
        } else {
            const rotationStep = delta * MOVE_SPEED;
            s.rotateProgress += rotationStep;

            if (s.rotateProgress >= s.targetRotationAngle) {
                applyRotationToSlice(s.cubesInSlice, s.moveAxis, 0, true);
                s.isAnimating = false;
                s.lastMoveTime = now;
            } else {
                applyRotationToSlice(s.cubesInSlice, s.moveAxis, rotationStep * s.rotationDirection, false);
            }
        }
    });

    return (
        <group ref={groupRef} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            {cubeData.map((d, i) => (
                <CubeMesh
                    key={i}
                    meshRef={cubeRefs[i]}
                    position={[d.initialPos.x, d.initialPos.y, d.initialPos.z]}
                    color={d.color}
                />
            ))}
        </group>
    );
};

// --- Responsive Camera Controller ---
const ResponsiveCamera = () => {
    const { camera } = useThree();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            // --- ADJUST SIZE HERE ---
            if (width < 640) {
                // Mobile
                camera.position.set(0, 0, 7.5);
            } else if (width < 1024) {
                // Tablet
                camera.position.set(0, 0, 6.0);
            } else {
                // Desktop - Reduced slightly from 4.2 to 5.5 as requested
                camera.position.set(0, 0, 5.5);
            }
            camera.updateProjectionMatrix();
        };

        handleResize();
        setMounted(true);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [camera]);

    return null;
}

export default function Hero3DCube() {
    return (
        <div className="w-full h-full relative z-10 fade-in-up">
            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={50} />
                <ResponsiveCamera />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                />

                <ambientLight intensity={0.7} />
                <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#3498DB" />
                <pointLight position={[10, -5, 5]} intensity={1} color="#2ECC71" />

                <Float
                    speed={2}
                    rotationIntensity={0.2}
                    floatIntensity={0.5}
                    floatingRange={[-0.1, 0.1]}
                >
                    <RubiksCube />
                </Float>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
