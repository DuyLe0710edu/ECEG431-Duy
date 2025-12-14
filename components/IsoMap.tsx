/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, SoftShadows, Float, Outlines, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Grid, BuildingType } from '../types';
import { GRID_SIZE } from '../constants';

// --- Constants & Helpers ---
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

// Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
const torusGeo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
const octahedronGeo = new THREE.OctahedronGeometry(1, 0);

// --- Helpers for Checkpoint Logic ---
const CHECKPOINT_COUNT = 5;
const getCheckpointIndices = (totalPathLength: number) => {
    const indices = [];
    // Distribute checkpoints evenly along path (skipping start 0)
    for(let i=1; i<=CHECKPOINT_COUNT; i++) {
        const index = Math.floor(totalPathLength * (i / (CHECKPOINT_COUNT + 1)));
        indices.push(index);
    }
    return indices;
}

// --- Minecraft Style Cyclist ---
interface CyclistProps { 
    path: {x: number, y: number}[];
    isPaused: boolean;
    onReachCheckpoint: (checkpointIndex: number) => void;
    onFinish: () => void;
}

const Cyclist = ({ path, isPaused, onReachCheckpoint, onFinish }: CyclistProps) => {
    const group = useRef<THREE.Group>(null);
    const bodyGroup = useRef<THREE.Group>(null);
    const frontWheel = useRef<THREE.Group>(null);
    const backWheel = useRef<THREE.Group>(null);

    const [progress, setProgress] = useState(0);
    const lastTriggeredCheckpoint = useRef<number>(-1);
    const hasFinished = useRef(false);
    
    // Slowed down from 2.5 to 1.2 for a more leisurely pace
    const speed = 1.2; 

    // Calculate checkpoint locations on the path indices
    const checkpointIndices = useMemo(() => getCheckpointIndices(path.length), [path.length]);

    useFrame((state, delta) => {
        if (!group.current || path.length < 2) return;
        
        let currentSpeed = speed;
        // If paused or finished, effectively stop visual animation updates related to speed
        if (isPaused || hasFinished.current) {
            currentSpeed = 0;
        }

        // --- Animation Logic ---
        
        // Rotate Wheels (visual only)
        // Wheels are in groups, we rotate the inner mesh or the group locally
        // Since we want them to spin, we'll rotate the wheel groups around their local X axis
        if (frontWheel.current) frontWheel.current.rotation.x -= currentSpeed * delta * 5;
        if (backWheel.current) backWheel.current.rotation.x -= currentSpeed * delta * 5;

        // Bob Body (Pedaling effect)
        if (bodyGroup.current) {
            if (currentSpeed > 0) {
                // Bob up and down
                bodyGroup.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 15) * 0.03;
                // Sway slightly side to side
                bodyGroup.current.rotation.z = Math.cos(state.clock.elapsedTime * 7) * 0.05;
                // Lean forward slightly
                bodyGroup.current.rotation.x = 0.2;
            } else {
                 // Return to neutral if stopped
                 bodyGroup.current.position.y = THREE.MathUtils.lerp(bodyGroup.current.position.y, 0.5, delta * 5);
                 bodyGroup.current.rotation.z = THREE.MathUtils.lerp(bodyGroup.current.rotation.z, 0, delta * 5);
                 bodyGroup.current.rotation.x = THREE.MathUtils.lerp(bodyGroup.current.rotation.x, 0, delta * 5);
            }
        }

        // --- Movement Logic ---
        if (!isPaused && !hasFinished.current) {
            const totalDistance = path.length;
            const newProgress = (progress + speed * delta);
            
            // STOP at the end (totalDistance - 1 is the last index)
            if (newProgress >= totalDistance - 1) {
                setProgress(totalDistance - 1);
                hasFinished.current = true;
                onFinish();
            } else {
                setProgress(newProgress);
            }
            
            // Checkpoint Trigger Logic
            const currentIndex = Math.floor(newProgress);
            const cpIndex = checkpointIndices.indexOf(currentIndex);
            
            if (cpIndex !== -1) {
                if (lastTriggeredCheckpoint.current !== currentIndex) {
                    lastTriggeredCheckpoint.current = currentIndex;
                    onReachCheckpoint(cpIndex);
                }
            } else {
                if (!checkpointIndices.includes(currentIndex)) {
                   lastTriggeredCheckpoint.current = -1;
                }
            }
        }

        // Update Position Visuals
        const totalDistance = path.length;
        // Clamp display progress to end if finished
        const displayProgress = Math.min(progress, totalDistance - 1.001); 
        
        const index = Math.floor(displayProgress);
        const nextIndex = index + 1;

        if (path[nextIndex]) {
            const p1 = path[index];
            const p2 = path[nextIndex];
            const t = displayProgress - index;
            
            const curX = THREE.MathUtils.lerp(p1.x, p2.x, t);
            const curY = THREE.MathUtils.lerp(p1.y, p2.y, t);
            
            const [wx, _, wz] = gridToWorld(curX, curY);
            group.current.position.set(wx, 0.3, wz);
            
            const [nx, __, nz] = gridToWorld(p2.x, p2.y);
            group.current.lookAt(nx, 0.3, nz);
        }
    });

    return (
        <group ref={group}>
            {/* Bike Frame */}
            <mesh position={[0, 0.3, 0]} scale={[0.1, 0.1, 0.8]} geometry={boxGeo}><meshStandardMaterial color="#333" /></mesh>
            
            {/* Front Wheel */}
            <group position={[0, 0, 0.4]} ref={frontWheel}>
                <mesh rotation={[0, 0, Math.PI/2]} geometry={cylinderGeo} scale={[0.25, 0.1, 0.25]}>
                    <meshStandardMaterial color="black" />
                </mesh>
                {/* Hub/Detail to see rotation */}
                <mesh rotation={[0, 0, Math.PI/2]} scale={[0.1, 0.12, 0.1]} geometry={boxGeo}><meshStandardMaterial color="#777" /></mesh>
            </group>

            {/* Back Wheel */}
            <group position={[0, 0, -0.4]} ref={backWheel}>
                <mesh rotation={[0, 0, Math.PI/2]} geometry={cylinderGeo} scale={[0.25, 0.1, 0.25]}>
                    <meshStandardMaterial color="black" />
                </mesh>
                {/* Hub/Detail to see rotation */}
                <mesh rotation={[0, 0, Math.PI/2]} scale={[0.1, 0.12, 0.1]} geometry={boxGeo}><meshStandardMaterial color="#777" /></mesh>
            </group>

            {/* Human */}
            <group position={[0, 0.5, 0]} ref={bodyGroup}>
                {/* Torso */}
                <mesh position={[0, 0.15, 0]} scale={[0.3, 0.4, 0.2]} geometry={boxGeo}><meshStandardMaterial color="#0ea5e9" /></mesh> 
                {/* Head */}
                <mesh position={[0, 0.45, 0]} scale={[0.2, 0.2, 0.2]} geometry={boxGeo}><meshStandardMaterial color="#fcc" /></mesh>
                {/* Arms extending to handlebars (simulated) */}
                <mesh position={[0, 0.3, 0.25]} rotation={[0.5, 0, 0]} scale={[0.25, 0.1, 0.3]} geometry={boxGeo}><meshStandardMaterial color="#0ea5e9" /></mesh>
            </group>
        </group>
    )
}

// --- High Visibility Neon Checkpoints ---
const CheckpointNode = ({ position, isActive }: { position: [number, number, number], isActive: boolean }) => {
    // Active = Yellow, Inactive = Cyan/Blue
    const mainColor = isActive ? "#fbbf24" : "#00ffff"; // Amber-400 vs Cyan
    const emissiveColor = isActive ? "#f59e0b" : "#00ffff";
    const beamOpacity = isActive ? 0.6 : 0.4;
    
    return (
        <group position={position}>
             {/* Thinner Light Beam (Line) */}
             <mesh position={[0, 10, 0]}>
                 <cylinderGeometry args={[0.02, 0.02, 20, 8, 1, true]} />
                 <meshBasicMaterial 
                    color={mainColor}
                    transparent 
                    opacity={beamOpacity} 
                    side={THREE.DoubleSide} 
                    blending={THREE.AdditiveBlending} 
                    depthWrite={false}
                 />
             </mesh>
             
             {/* Inner Core Beam - Very Thin */}
             <mesh position={[0, 2, 0]}>
                 <cylinderGeometry args={[0.005, 0.005, 4, 8]} />
                 <meshBasicMaterial color="white" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
             </mesh>

             {/* Floating Marker - Keeping the complex diamond polygon */}
             <Float speed={isActive ? 0 : 4} rotationIntensity={isActive ? 0.2 : 1} floatIntensity={isActive ? 0.2 : 1}>
                {/* Outer Diamond Wireframe */}
                <mesh position={[0, 1.5, 0]} rotation={[0, isActive ? Date.now() / 1000 : 0, 0]}>
                    <octahedronGeometry args={[0.8, 0]} />
                    <meshBasicMaterial color={mainColor} wireframe />
                </mesh>
                {/* Inner Solid Core */}
                <mesh position={[0, 1.5, 0]}>
                    <octahedronGeometry args={[0.4, 0]} />
                    <meshStandardMaterial 
                        color={mainColor}
                        emissive={emissiveColor}
                        emissiveIntensity={3} 
                        toneMapped={false} 
                    />
                </mesh>
             </Float>

             {/* Floor Rings - reduced size slightly */}
             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                 <ringGeometry args={[0.3, 0.4, 32]} />
                 <meshBasicMaterial color={mainColor} transparent opacity={0.5} />
             </mesh>
        </group>
    )
}

const PathCheckpoints = ({ path, activeIndex }: { path: {x: number, y: number}[], activeIndex: number | null }) => {
    if (path.length === 0) return null;
    
    const indices = useMemo(() => getCheckpointIndices(path.length), [path.length]);

    return (
        <group>
            {indices.map((pathIndex, i) => {
                 if (!path[pathIndex]) return null;
                 const [wx, _, wz] = gridToWorld(path[pathIndex].x, path[pathIndex].y);
                 return <CheckpointNode key={i} position={[wx, 0, wz]} isActive={activeIndex === i} />
            })}
        </group>
    )
}

// --- Specialized Building Components ---

const ResidentialBuilding = ({ x, y }: { x: number, y: number }) => {
    const hash = getHash(x, y);

    if (hash < 0.20) {
        // --- Transparent Glass House ---
        return (
            <group>
                <mesh position={[0, 0.45, 0]} scale={[0.8, 0.9, 0.8]} geometry={boxGeo}>
                    <meshPhysicalMaterial 
                        color="#a5f3fc" 
                        transparent 
                        opacity={0.3} 
                        roughness={0} 
                        metalness={0.9} 
                        transmission={0.5}
                        thickness={1}
                    />
                </mesh>
                <mesh position={[0, 0.2, 0]} scale={0.3} geometry={sphereGeo}>
                    <meshStandardMaterial color="#60a5fa" />
                </mesh>
                <mesh position={[0, 0.9, 0]} scale={[0.82, 0.05, 0.82]} geometry={boxGeo}>
                    <meshStandardMaterial color="#fff" />
                </mesh>
            </group>
        );
    } else if (hash < 0.40) {
        // --- Platinum Villa (Replaces Gold to avoid brown) ---
        return (
            <group>
                <mesh position={[0, 0.5, 0]} scale={[0.9, 1.0, 0.9]} geometry={boxGeo} castShadow receiveShadow>
                    <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} /> {/* Platinum */}
                </mesh>
                <mesh position={[0, 1.0, 0]} scale={[0.6, 0.3, 0.6]} geometry={cylinderGeo}>
                    <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} /> {/* Cyan Dome */}
                </mesh>
            </group>
        );
    } else if (hash < 0.60) {
        // --- Modern Art Stack ---
        return (
            <group position={[0, 0.5, 0]}>
                <mesh rotation={[0, 0.2, 0]} position={[0, -0.3, 0]} scale={[0.7, 0.3, 0.7]} geometry={boxGeo} castShadow>
                     <meshStandardMaterial color="#64748b" />
                </mesh>
                <mesh rotation={[0, -0.4, 0]} position={[0, 0, 0]} scale={[0.6, 0.3, 0.6]} geometry={boxGeo} castShadow>
                     <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh rotation={[0, 0.5, 0]} position={[0, 0.3, 0]} scale={[0.5, 0.3, 0.5]} geometry={boxGeo} castShadow>
                     <meshStandardMaterial color="#cbd5e1" />
                </mesh>
            </group>
        );
    } else if (hash < 0.80) {
        // --- Neon Gamer House ---
        return (
            <group>
                <mesh position={[0, 0.4, 0]} scale={[0.8, 0.8, 0.8]} geometry={boxGeo} castShadow>
                    <meshStandardMaterial color="#1e1b4b" /> {/* Dark Blue */}
                </mesh>
                <mesh position={[0.41, 0.4, 0]} scale={[0.05, 0.8, 0.1]} geometry={boxGeo}>
                    <meshStandardMaterial color="#f0abfc" emissive="#f0abfc" emissiveIntensity={2} />
                </mesh>
                <mesh position={[-0.41, 0.4, 0]} scale={[0.05, 0.8, 0.1]} geometry={boxGeo}>
                    <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
                </mesh>
            </group>
        );
    } else {
        // --- Standard Modern House (NO BROWN) ---
        let color = "#e0f2fe"; // Light Blue
        if (hash > 0.95) color = "#86efac"; // Green
        else if (hash > 0.90) color = "#ffffff"; // White
        
        return (
            <group>
                <mesh castShadow receiveShadow geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.7, 0.6, 0.7]}>
                    <meshStandardMaterial color={color} roughness={0.8} /> 
                </mesh>
                <mesh castShadow receiveShadow geometry={coneGeo} position={[0, 0.85, 0]} scale={[0.6, 0.4, 0.6]} rotation={[0, Math.PI/4, 0]}>
                    <meshStandardMaterial color="#334155" roughness={1} /> 
                </mesh>
            </group>
        );
    }
}

const CommercialBuilding = ({ x, y }: { x: number, y: number }) => {
    const hash = getHash(x, y);

    if (hash < 0.2) {
        // --- Eco Dome ---
        return (
            <group>
                <mesh position={[0, 0.1, 0]} scale={[0.9, 0.2, 0.9]} geometry={cylinderGeo}>
                    <meshStandardMaterial color="#94a3b8" /> {/* Slate Base */}
                </mesh>
                <mesh position={[0, 0.5, 0]} scale={0.7} geometry={sphereGeo}>
                    <meshPhysicalMaterial color="#86efac" transparent opacity={0.4} roughness={0} metalness={0.1} />
                </mesh>
                <mesh position={[0, 0.4, 0]} scale={[0.2, 0.5, 0.2]} geometry={coneGeo}>
                    <meshStandardMaterial color="#16a34a" />
                </mesh>
            </group>
        );
    } else if (hash < 0.4) {
        // --- Arcade ---
        return (
            <group>
                 <mesh castShadow receiveShadow geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.9, 1.0, 0.9]}>
                    <meshStandardMaterial color="#4c1d95" /> 
                </mesh>
                <mesh position={[0, 1.1, 0]} scale={[0.4, 0.4, 0.1]} geometry={boxGeo}>
                    <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={1} />
                </mesh>
                <mesh position={[0, 1.1, 0]} scale={[0.5, 0.5, 0.05]} geometry={torusGeo}>
                     <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} />
                </mesh>
            </group>
        );
    } else if (hash < 0.6) {
        // --- Pizza ---
        return (
             <group>
                 <mesh castShadow receiveShadow geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.9]}>
                    <meshStandardMaterial color="#fef2f2" />
                </mesh>
                <mesh castShadow position={[0, 0.9, 0]} scale={[0.95, 0.2, 0.95]} geometry={boxGeo}>
                    <meshStandardMaterial color="#dc2626" />
                </mesh>
                <mesh position={[0, 1.2, 0]} scale={[0.6, 0.3, 0.1]} geometry={boxGeo}>
                    <meshStandardMaterial color="#fee2e2" />
                </mesh>
            </group>
        );
    } else if (hash < 0.8) {
        // --- Tech Store ---
        return (
             <group>
                 <mesh castShadow receiveShadow geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.85, 0.8, 0.85]}>
                    <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[0, 0.6, 0.45]} rotation={[Math.PI/6, 0, 0]} scale={[0.85, 0.1, 0.4]} geometry={boxGeo}>
                     <meshStandardMaterial color="#3b82f6" />
                </mesh>
                <mesh position={[0, 0.9, 0.41]} scale={[0.4, 0.3, 0.05]} geometry={boxGeo}>
                    <meshStandardMaterial color="black" />
                </mesh>
            </group>
        );
    } else {
        // --- Skyscraper ---
        const height = 2 + hash * 1.5;
        return (
            <group>
                <mesh castShadow receiveShadow geometry={boxGeo} position={[0, height/2, 0]} scale={[0.8, height, 0.8]}>
                    <meshStandardMaterial color="#60a5fa" roughness={0.2} /> 
                </mesh>
                <mesh position={[0, height/2, 0.41]} scale={[0.6, height*0.9, 0.05]} geometry={boxGeo}>
                    <meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.3} />
                </mesh>
            </group>
        );
    }
}

// --- Industrial (Removed Yellow/Brown) ---
const IndustrialBuilding = ({ x, y }: { x: number, y: number }) => {
    return (
        <group position={[0, 0, 0]}>
            {/* Changed from Yellow to Slate-600 */}
            <mesh castShadow receiveShadow geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.9]}>
                <meshStandardMaterial color="#475569" roughness={0.6} /> 
            </mesh>
            {/* Slate-300 */}
            <mesh castShadow receiveShadow geometry={cylinderGeo} position={[0.25, 0.8, 0.25]} scale={[0.15, 0.8, 0.15]}>
                <meshStandardMaterial color="#cbd5e1" /> 
            </mesh>
            <group position={[0.25, 1.3, 0.25]}>
                <mesh geometry={sphereGeo} scale={0.15} position={[0,0,0]}>
                    <meshStandardMaterial color="#0ea5e9" transparent opacity={0.8} /> {/* Sky Blue Bulb */}
                </mesh>
            </group>
        </group>
    )
}

// --- Park (COMPLETELY REDESIGNED - Crystal Gardens) ---
const ParkBuilding = ({ x, y }: { x: number, y: number }) => {
    const hash = getHash(x, y);
    // New design: Crystal Garden / Digital Flora
    // No "brown" or "stump" shapes.
    
    // Randomize height and count
    const count = 1 + Math.floor(hash * 3);

    return (
        <group position={[0, 0, 0]}>
             {/* Base Plate - Clean White */}
             <mesh position={[0, 0.05, 0]} receiveShadow>
                 <cylinderGeometry args={[0.4, 0.45, 0.1, 6]} />
                 <meshStandardMaterial color="#ffffff" />
             </mesh>
             
             {Array.from({length: count}).map((_, i) => {
                const offsetX = (getHash(x+i, y) - 0.5) * 0.6;
                const offsetZ = (getHash(y+i, x) - 0.5) * 0.6;
                const scale = 0.5 + getHash(x, y+i) * 0.5;
                const hue = i % 2 === 0 ? "#22d3ee" : "#c084fc"; // Cyan or Purple

                return (
                    <group key={i} position={[offsetX, 0.1, offsetZ]} scale={scale}>
                        {/* Crystal Shard */}
                        <mesh position={[0, 0.5, 0]} castShadow>
                            <octahedronGeometry args={[0.3, 0]} />
                            <meshStandardMaterial 
                                color={hue} 
                                emissive={hue}
                                emissiveIntensity={0.5}
                                metalness={0.8}
                                roughness={0.2}
                            />
                        </mesh>
                    </group>
                )
             })}
        </group>
    )
}

const RoadTile = () => {
    return (
        <mesh receiveShadow geometry={boxGeo} position={[0, 0.05, 0]} scale={[1, 0.1, 1]}>
            <meshStandardMaterial color="#334155" roughness={0.9} /> {/* Slate Road */}
        </mesh>
    )
}

const StartEndMarker = ({ x, y, label }: { x: number, y: number, label: string }) => {
    const [wx, _, wz] = gridToWorld(x, y);
    
    return (
        <group position={[wx, 0.5, wz]}>
             <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0.2, 0.5]}>
                <mesh position={[0, 1.5, 0]}>
                    <coneGeometry args={[0.3, 0.8, 8]} />
                    <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} />
                    <mesh position={[0, 0.4, 0]}>
                        <sphereGeometry args={[0.25]} />
                        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} />
                    </mesh>
                </mesh>
             </Float>
             <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5, 32]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
             </mesh>
        </group>
    )
}

const Cloud = ({ position, scale }: { position: [number, number, number], scale: number }) => (
    <group position={position} scale={scale}>
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
            <mesh geometry={sphereGeo} position={[0,0,0]} scale={1}><meshStandardMaterial color="white" flatShading /></mesh>
            <mesh geometry={sphereGeo} position={[0.8,-0.2,0]} scale={0.7}><meshStandardMaterial color="white" flatShading /></mesh>
            <mesh geometry={sphereGeo} position={[-0.7,0.1,0.4]} scale={0.8}><meshStandardMaterial color="white" flatShading /></mesh>
        </Float>
    </group>
)

const Clouds = () => {
    const clouds = useMemo(() => {
        const items = [];
        const count = 12;
        const radius = GRID_SIZE / 1.2;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius * 1.5;
            const z = Math.sin(angle) * radius * 1.5;
            const y = Math.random() * 5 + 2;
            items.push({ pos: [x, y, z] as [number, number, number], scale: 1 + Math.random() * 2 });
        }
        return items;
    }, []);
    return <group>{clouds.map((c, i) => <Cloud key={i} position={c.pos} scale={c.scale} />)}</group>
}

// --- Main Component ---

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType | null;
  population: number;
  path: {x: number, y: number}[];
  activeCheckpointIndex: number | null;
  onReachCheckpoint: (index: number) => void;
  cycleKey: number; // Used to reset cyclist
  onCycleFinish: () => void;
}

const IsoMap: React.FC<IsoMapProps> = ({ grid, onTileClick, hoveredTool, population, path, activeCheckpointIndex, onReachCheckpoint, cycleKey, onCycleFinish }) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);

  const cursorColor = useMemo(() => {
     if (!hoveredTool || hoveredTool === BuildingType.None) return 'red';
     return 'white';
  }, [hoveredTool]);

  return (
    <div className="absolute inset-0 bg-sky-300"> 
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={30} near={-50} far={200} />
        <MapControls enableRotate={false} enableZoom={true} minZoom={10} maxZoom={60} dampingFactor={0.1} />

        <ambientLight intensity={0.7} color="#cceeff" />
        <directionalLight castShadow position={[10, 20, 5]} intensity={1.2} color="#fff7ed" shadow-mapSize={[1024, 1024]}>
             <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
        </directionalLight>

        <group position={[0, -2, 0]}> 
            <Clouds />
            
            {/* Ground - Changed from Brown to Dark Slate Blue */}
            <mesh position={[0, -0.6, 0]} receiveShadow>
                <boxGeometry args={[GRID_SIZE, 0.2, GRID_SIZE]} />
                <meshStandardMaterial color="#0f172a" /> 
            </mesh>

            {grid.map((row, y) =>
                row.map((tile, x) => {
                  const [wx, _, wz] = gridToWorld(x, y);
                  const isEven = (x + y) % 2 === 0;
                  const color = isEven ? '#86efac' : '#34d399'; 
                  return (
                    <group key={`${x}-${y}`} position={[wx, 0, wz]}>
                        <mesh 
                            receiveShadow 
                            onPointerDown={(e) => { e.stopPropagation(); onTileClick(x, y); }}
                            onPointerEnter={(e) => { e.stopPropagation(); setHoveredTile({x,y}); }}
                            onPointerOut={(e) => { e.stopPropagation(); setHoveredTile(null); }}
                        >
                            <boxGeometry args={[1, 0.2, 1]} /> 
                            <meshStandardMaterial color={color} />
                        </mesh>
                    </group>
                  );
                })
            )}

            <StartEndMarker x={0} y={14} label="Start" />
            <StartEndMarker x={14} y={0} label="End" />

            {/* Buildings */}
            {grid.map((row, y) =>
                row.map((tile, x) => {
                    if (tile.buildingType === BuildingType.None) return null;
                    const [wx, _, wz] = gridToWorld(x, y);
                    return (
                        <group key={`b-${x}-${y}`} position={[wx, 0.1, wz]}>
                            {tile.buildingType === BuildingType.Residential && <ResidentialBuilding x={x} y={y} />}
                            {tile.buildingType === BuildingType.Commercial && <CommercialBuilding x={x} y={y} />}
                            {tile.buildingType === BuildingType.Industrial && <IndustrialBuilding x={x} y={y} />}
                            {tile.buildingType === BuildingType.Park && <ParkBuilding x={x} y={y} />}
                            {tile.buildingType === BuildingType.Road && <RoadTile />}
                        </group>
                    )
                })
            )}

            {/* Path Objects */}
            <PathCheckpoints path={path} activeIndex={activeCheckpointIndex} />
            <Cyclist 
                key={cycleKey}
                path={path} 
                isPaused={activeCheckpointIndex !== null} 
                onReachCheckpoint={onReachCheckpoint} 
                onFinish={onCycleFinish}
            />

            {hoveredTile && (
                <mesh position={[gridToWorld(hoveredTile.x, hoveredTile.y)[0], 0.2, gridToWorld(hoveredTile.x, hoveredTile.y)[2]]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial color={cursorColor} transparent opacity={0.4} />
                    <Outlines thickness={0.05} color={cursorColor} />
                </mesh>
            )}
        </group>
        <SoftShadows size={10} samples={8} />
      </Canvas>
    </div>
  );
};

export default IsoMap;