'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useModelStore } from '@/store/modelStore';
import { PART_MAP } from '@/data/engineParts';
import * as THREE from 'three';
import type { PartId } from '@/types';

// ─── Utilities ──────────────────────────────────────────────────────────────
const getStage = (progress: number, start: number, end: number) => {
  return THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
};

// ─── Colour palette ────────────────────────────────────────────────────────
const MAT = {
  block:      '#3a3f4b',
  head:       '#4a5060',
  valveCover: '#2a2d35',
  piston:     '#8ca0b8',
  rod:        '#6e7d92',
  crankshaft: '#5a3fa8',
  camshaft:   '#1a6fff',
  valve:      '#20c070',
  exhaust:    '#c0784a',
  sparkplug:  '#ff7320',
  oilPan:     '#1e2128',
  timing:     '#2a2d35',
  selected:   '#00d4ff',
};

// ─── Clickable wrapper ─────────────────────────────────────────────────────
interface ClickGroupProps {
  partId: PartId;
  children: React.ReactNode;
}
function ClickGroup({ partId, children }: ClickGroupProps) {
  const { selectedPartId, setSelectedPart } = useModelStore();
  const isSelected = selectedPartId === partId;
  return (
    <group
      onClick={(e) => {
        // We do NOT stop propagation. 
        // This allows raycasting to hit internal parts (like pistons) through the glass block.
        // Because RTF events bubble up, the deepest/furthest clicked object might set the state last, 
        // which means clicking a piston through a block selects the piston!
        setSelectedPart(isSelected ? null : partId);
      }}
    >
      {children}
    </group>
  );
}

// ─── Smart Material ────────────────────────────────────────────────────────
interface EngineMaterialProps {
  color: string;
  roughness?: number;
  metalness?: number;
  partId?: PartId | 'decorative' | 'shell';
  side?: THREE.Side;
}

function EngineMaterial({ color, roughness = 0.5, metalness = 0.5, partId = 'decorative', side = THREE.FrontSide }: EngineMaterialProps) {
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const { selectedPartId, isXRay } = useModelStore();
  
  const isSelected = selectedPartId !== null && selectedPartId === partId;
  const isGhosted = selectedPartId !== null && !isSelected;
  
  // Outer shells (cylinder block, head, oil pan) are ALWAYS glass so we can see inside.
  // Unless they are specifically selected, then they glow.
  const isShell = partId === 'cylinder' || partId === 'decorative';
  const shouldBeWireframe = isXRay && isShell && !isSelected;
  const shouldBeGlass = isGhosted || (!isSelected && isShell && !isXRay);

  useFrame((state) => {
    if (!materialRef.current) return;
    const t = state.clock.getElapsedTime();
    if (isSelected) {
      materialRef.current.emissiveIntensity = 0.6 + Math.sin(t * 5) * 0.3;
      materialRef.current.emissive.set(MAT.selected);
      materialRef.current.color.set(MAT.selected);
    } else if (shouldBeWireframe) {
      materialRef.current.emissiveIntensity = 0.5;
      materialRef.current.emissive.set('#00aaff');
      materialRef.current.color.set('#00aaff');
    } else {
      materialRef.current.emissiveIntensity = 0;
      materialRef.current.color.set(shouldBeGlass ? '#a0b0c0' : color);
    }
  });

  return (
    <meshPhysicalMaterial
      ref={materialRef}
      color={isSelected ? MAT.selected : (shouldBeWireframe ? '#00aaff' : (shouldBeGlass ? '#a0b0c0' : color))}
      roughness={shouldBeGlass ? 0.1 : roughness}
      metalness={shouldBeGlass ? 0.1 : metalness}
      emissive={isSelected ? MAT.selected : (shouldBeWireframe ? '#00aaff' : '#000000')}
      emissiveIntensity={isSelected ? 0.6 : (shouldBeWireframe ? 0.5 : 0)}
      transparent={shouldBeGlass || shouldBeWireframe}
      opacity={shouldBeWireframe ? 0.2 : (shouldBeGlass ? 0.4 : 1)}
      transmission={shouldBeGlass ? 0.9 : 0}
      thickness={shouldBeGlass ? 0.5 : 0}
      ior={shouldBeGlass ? 1.5 : 1.5}
      depthWrite={!shouldBeGlass && !shouldBeWireframe}
      side={side}
      wireframe={shouldBeWireframe}
    />
  );
}

// ─── Selectable mesh ──────────────────────────────────────────────────────
interface SMeshProps {
  partId: PartId;
  geometry: THREE.BufferGeometry;
  color: string;
  position?: [number, number, number];
  rotation?: THREE.Euler;
  scale?: [number, number, number];
  roughness?: number;
  metalness?: number;
}
function SMesh({ partId, geometry, color, position, rotation, roughness = 0.45, metalness = 0.75 }: SMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { isAnimating, animationTarget } = useModelStore();
  const part = PART_MAP[partId];

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    if (isAnimating && animationTarget) {
      if (animationTarget === 'crankshaftSpin' && partId === 'crankshaft') {
        meshRef.current.rotation.z = t * 4;
      }
      if (animationTarget === 'camshaftRotate' && partId === 'camshaft') {
        meshRef.current.rotation.z = t * 2;
      }
      if (animationTarget === 'sparkIgnite' && partId === 'sparkplug') {
        meshRef.current.scale.setScalar(1 + Math.abs(Math.sin(t * 8)) * 0.12);
      }
      if (animationTarget === 'fullCycle') {
        if (partId === 'crankshaft') meshRef.current.rotation.z = t * 4;
        if (partId === 'camshaft')   meshRef.current.rotation.z = t * 2;
      }
    } else if (part && !isAnimating) {
      if (position) meshRef.current.position.set(...position);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation}>
      <EngineMaterial partId={partId} color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ENGINE BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function EngineBlock() {
  const mainGeo = useMemo(() => new THREE.BoxGeometry(1.9, 1.1, 1.1), []);

  return (
    <ClickGroup partId="cylinder">
      {/* Main block */}
      <SMesh partId="cylinder" geometry={mainGeo} color={MAT.block} position={[0, 0, 0]} roughness={0.6} metalness={0.5} />
      {/* Cylinder liner walls (open-top tubes) */}
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0]}>
          <cylinderGeometry args={[0.175, 0.175, 1.0, 24, 1, true]} />
          <EngineMaterial partId="cylinder" color="#1a1e26" roughness={0.3} metalness={0.8} side={THREE.BackSide} />
        </mesh>
      ))}
      {/* Deck surface */}
      <mesh position={[0, 0.552, 0]}>
        <boxGeometry args={[1.9, 0.012, 1.1]} />
        <EngineMaterial partId="cylinder" color="#555e6e" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Structural ribs on front face */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
        <mesh key={`rib-${i}`} position={[x, 0, 0.56]}>
          <boxGeometry args={[0.06, 1.0, 0.03]} />
          <EngineMaterial partId="cylinder" color="#30353f" roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
      {/* Main bearing caps */}
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <mesh key={`cap-${i}`} position={[x, -0.62, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.8]} />
          <EngineMaterial partId="cylinder" color="#2e333d" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </ClickGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CYLINDER HEAD
// ═══════════════════════════════════════════════════════════════════════════
function CylinderHead() {
  return (
    <group position={[0, 0.75, 0]}>
      {/* Head body */}
      <mesh>
        <boxGeometry args={[1.9, 0.35, 1.05]} />
        <EngineMaterial color={MAT.head} roughness={0.5} metalness={0.55} />
      </mesh>
      {/* Combustion chamber domes */}
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <mesh key={i} position={[x, -0.2, 0]}>
          <sphereGeometry args={[0.17, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <EngineMaterial color="#3a404e" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Head bolt holes */}
      {[-0.8,-0.55,-0.3,-0.05,0.05,0.3,0.55,0.8].map((x, i) => (
        <mesh key={`bolt-${i}`} position={[x, 0.19, 0.45]}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 8]} />
          <EngineMaterial color="#1a1d24" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
      {/* Valve cover */}
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[1.88, 0.18, 1.02]} />
        <EngineMaterial color={MAT.valveCover} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Valve cover ribs */}
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <mesh key={`vcrib-${i}`} position={[x, 0.365, 0]}>
          <boxGeometry args={[0.08, 0.02, 1.0]} />
          <EngineMaterial color="#1a1d24" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {/* Oil cap */}
      <mesh position={[0.7, 0.38, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <EngineMaterial color="#111318" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  OIL PAN
// ═══════════════════════════════════════════════════════════════════════════
function OilPan() {
  return (
    <group position={[0, -0.78, 0]}>
      <mesh>
        <boxGeometry args={[1.85, 0.32, 1.0]} />
        <EngineMaterial color={MAT.oilPan} roughness={0.55} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.17, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
        <EngineMaterial color="#111318" roughness={0.4} metalness={0.8} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CRANKSHAFT
// ═══════════════════════════════════════════════════════════════════════════
function Crankshaft() {
  const crankRef = useRef<THREE.Group>(null);
  const { isAnimating, animationTarget } = useModelStore();

  useFrame((state) => {
    if (!crankRef.current) return;
    const t = state.clock.getElapsedTime();
    const doAnim = isAnimating && (animationTarget === 'crankshaftSpin' || animationTarget === 'fullCycle');
    crankRef.current.rotation.x = doAnim ? t * 4 : t * 0.3;
  });

  const throws = [
    { x: -0.675, angle: 0 },
    { x: -0.225, angle: Math.PI * 0.5 },
    { x:  0.225, angle: Math.PI },
    { x:  0.675, angle: Math.PI * 1.5 },
  ];

  return (
    <ClickGroup partId="crankshaft">
      <group ref={crankRef} position={[0, -0.45, 0]}>
        {/* Main journal shaft */}
        <mesh rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
          <cylinderGeometry args={[0.055, 0.055, 1.85, 16]} />
          <EngineMaterial partId="crankshaft" color={MAT.crankshaft} roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Crank throws */}
        {throws.map(({ x, angle }, i) => (
          <group key={i} position={[x, 0, 0]}>
            {/* Left cheek */}
            <mesh position={[-0.08, Math.sin(angle) * 0.11, Math.cos(angle) * 0.11]}
                  rotation={new THREE.Euler(angle, 0, 0)}>
              <boxGeometry args={[0.12, 0.22, 0.1]} />
              <EngineMaterial partId="crankshaft" color={MAT.crankshaft} roughness={0.25} metalness={0.9} />
            </mesh>
            {/* Right cheek */}
            <mesh position={[0.08, Math.sin(angle) * 0.11, Math.cos(angle) * 0.11]}
                  rotation={new THREE.Euler(angle, 0, 0)}>
              <boxGeometry args={[0.12, 0.22, 0.1]} />
              <EngineMaterial partId="crankshaft" color={MAT.crankshaft} roughness={0.25} metalness={0.9} />
            </mesh>
            {/* Crank pin */}
            <mesh position={[0, Math.sin(angle) * 0.22, Math.cos(angle) * 0.22]}
                  rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
              <cylinderGeometry args={[0.04, 0.04, 0.17, 12]} />
              <EngineMaterial partId="crankshaft" color="#7c5ace" roughness={0.2} metalness={0.95} />
            </mesh>
            {/* Counterweight */}
            <mesh position={[0, -Math.sin(angle) * 0.17, -Math.cos(angle) * 0.17]}
                  rotation={new THREE.Euler(angle, 0, 0)}>
              <boxGeometry args={[0.17, 0.22, 0.14]} />
              <EngineMaterial partId="crankshaft" color="#4a3580" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Crankshaft sprocket */}
        <mesh position={[-0.93, 0, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 18]} />
          <EngineMaterial partId="crankshaft" color="#3a2878" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>
    </ClickGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PISTONS + CONNECTING RODS
// ═══════════════════════════════════════════════════════════════════════════
function PistonAssembly({ x, phase }: { x: number; phase: number }) {
  const pistonRef = useRef<THREE.Group>(null);
  const { isAnimating, animationTarget } = useModelStore();

  useFrame((state) => {
    if (!pistonRef.current) return;
    const t = state.clock.getElapsedTime();
    const doAnim = isAnimating && (animationTarget === 'pistonMove' || animationTarget === 'fullCycle');
    const amplitude = doAnim ? 0.28 : 0.012;
    const speed     = doAnim ? 6    : 0.8;
    pistonRef.current.position.y = Math.sin(t * speed + phase) * amplitude;
  });

  return (
    <group position={[x, 0, 0]}>
      <group ref={pistonRef}>
        {/* ── Piston ── */}
        <ClickGroup partId="piston">
          {/* Crown */}
          <mesh position={[0, 0.27, 0]}>
            <cylinderGeometry args={[0.165, 0.165, 0.08, 24]} />
            <EngineMaterial partId="piston" color={MAT.piston} roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Body */}
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.163, 0.163, 0.2, 24]} />
            <EngineMaterial partId="piston" color={MAT.piston} roughness={0.35} metalness={0.75} />
          </mesh>
          {/* Piston rings */}
          {[0.21, 0.17, 0.13].map((ry, ri) => (
            <mesh key={ri} position={[0, ry, 0]}>
              <torusGeometry args={[0.163, 0.009, 8, 32]} />
              <EngineMaterial partId="piston" color="#c0c8d8" roughness={0.2} metalness={0.9} />
            </mesh>
          ))}
          {/* Skirt */}
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.18, 24, 1, true]} />
            <EngineMaterial partId="piston" color="#7a8898" roughness={0.4} metalness={0.65} side={THREE.FrontSide} />
          </mesh>
          {/* Wrist pin */}
          <mesh position={[0, 0.1, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
            <cylinderGeometry args={[0.024, 0.024, 0.22, 12]} />
            <EngineMaterial partId="piston" color="#a0aab8" roughness={0.2} metalness={0.9} />
          </mesh>
        </ClickGroup>

        {/* ── Connecting Rod ── */}
        <ClickGroup partId="crankshaft">
          {/* Rod beam */}
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.055, 0.58, 0.065]} />
            <EngineMaterial partId="crankshaft" color={MAT.rod} roughness={0.4} metalness={0.75} />
          </mesh>
          {/* Big end */}
          <mesh position={[0, -0.46, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
            <cylinderGeometry args={[0.06, 0.06, 0.17, 16]} />
            <EngineMaterial partId="crankshaft" color="#5a6878" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Small end */}
          <mesh position={[0, 0.1, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
            <cylinderGeometry args={[0.04, 0.04, 0.17, 12]} />
            <EngineMaterial partId="crankshaft" color="#5a6878" roughness={0.3} metalness={0.8} />
          </mesh>
        </ClickGroup>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CAMSHAFT
// ═══════════════════════════════════════════════════════════════════════════
function Camshaft() {
  const camRef = useRef<THREE.Group>(null);
  const { isAnimating, animationTarget } = useModelStore();

  useFrame((state) => {
    if (!camRef.current) return;
    const t = state.clock.getElapsedTime();
    const doAnim = isAnimating && (animationTarget === 'camshaftRotate' || animationTarget === 'fullCycle');
    camRef.current.rotation.x = doAnim ? t * 2 : t * 0.15;
  });

  const lobeXs = [-0.72, -0.56, -0.27, -0.11, 0.11, 0.27, 0.56, 0.72];

  return (
    <ClickGroup partId="camshaft">
      <group ref={camRef} position={[0, 1.12, -0.28]}>
        {/* Shaft */}
        <mesh rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
          <cylinderGeometry args={[0.038, 0.038, 1.85, 16]} />
          <EngineMaterial partId="camshaft" color={MAT.camshaft} roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Lobes */}
        {lobeXs.map((lx, i) => (
          <mesh key={i} position={[lx, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.06, 0.09, 12]} />
            <EngineMaterial partId="camshaft" color="#1055cc" roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
        {/* Cam sprocket */}
        <mesh position={[-0.93, 0, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 20]} />
          <EngineMaterial partId="camshaft" color="#0a40aa" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Sprocket teeth */}
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return (
            <mesh key={`tooth-${i}`} position={[-0.93, Math.sin(a) * 0.135, Math.cos(a) * 0.135]}>
              <boxGeometry args={[0.05, 0.03, 0.02]} />
              <EngineMaterial partId="camshaft" color="#0a3a90" roughness={0.4} metalness={0.8} />
            </mesh>
          );
        })}
      </group>
    </ClickGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VALVES  (8 total — intake + exhaust per cylinder)
// ═══════════════════════════════════════════════════════════════════════════
function ValveSet() {
  const valveRefs = useRef<(THREE.Group | null)[]>([]);
  const { isAnimating, animationTarget } = useModelStore();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const doAnim = isAnimating && (animationTarget === 'valveOpen' || animationTarget === 'fullCycle');
    valveRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const phase = (Math.floor(i / 2)) * (Math.PI / 2);
      const lift = doAnim ? Math.max(0, Math.sin(t * 3 + phase)) * 0.14 : 0;
      ref.position.y = lift;
    });
  });

  const cylXs = [-0.675, -0.225, 0.225, 0.675];

  return (
    <ClickGroup partId="valve">
      {cylXs.map((cx, ci) =>
        ([
          { z: -0.22, color: MAT.valve },
          { z:  0.22, color: MAT.exhaust },
        ] as { z: number; color: string }[]).map(({ z, color }, vi) => (
          <group
            key={`v-${ci}-${vi}`}
            ref={(el: THREE.Group | null) => { valveRefs.current[ci * 2 + vi] = el; }}
            position={[cx, 0.82, z]}
          >
            {/* Stem */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.34, 10]} />
              <EngineMaterial partId="valve" color={color} roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Head disc */}
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.072, 0.065, 0.026, 16]} />
              <EngineMaterial partId="valve" color={color} roughness={0.25} metalness={0.85} />
            </mesh>
            {/* Spring coils (3×) */}
            {[0.20, 0.24, 0.28].map((sy, si) => (
              <mesh key={si} position={[0, sy, 0]}>
                <torusGeometry args={[0.033, 0.007, 6, 18]} />
                <EngineMaterial partId="valve" color="#808898" roughness={0.5} metalness={0.7} />
              </mesh>
            ))}
          </group>
        ))
      )}
    </ClickGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SPARK PLUGS
// ═══════════════════════════════════════════════════════════════════════════
function SparkPlugs() {
  const plugRefs = useRef<THREE.Mesh[]>([]);
  const { isAnimating, animationTarget, selectedPartId } = useModelStore();
  const isSelected = selectedPartId === 'sparkplug';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const doAnim = isAnimating && animationTarget === 'sparkIgnite';
    plugRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        const spark = doAnim ? Math.abs(Math.sin(t * 10 + i * 1.2)) : 0;
        mesh.material.emissiveIntensity = isSelected ? 0.4 + spark * 0.6 : spark * 0.8;
        mesh.material.emissive.set(doAnim ? '#ffaa00' : (isSelected ? MAT.selected : '#000000'));
        mesh.material.color.set(isSelected ? MAT.selected : MAT.sparkplug);
      }
    });
  });

  return (
    <ClickGroup partId="sparkplug">
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <group key={i} position={[x, 0.98, 0]}>
          {/* Hex body */}
          <mesh ref={(el: THREE.Mesh | null) => { if (el) plugRefs.current[i] = el; }}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 6]} />
            <EngineMaterial partId="sparkplug" color={MAT.sparkplug} roughness={0.3} metalness={0.85} />
          </mesh>
          {/* Thread tip */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.025, 0.018, 0.1, 12]} />
            <EngineMaterial partId="sparkplug" color="#c0c8d0" roughness={0.2} metalness={0.95} />
          </mesh>
          {/* Ceramic insulator */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.022, 0.032, 0.1, 12]} />
            <EngineMaterial partId="sparkplug" color="#e0e4ea" roughness={0.6} metalness={0.1} />
          </mesh>
          {/* HT lead terminal */}
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
            <EngineMaterial partId="sparkplug" color="#111318" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </ClickGroup>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  TIMING CHAIN COVER
// ═══════════════════════════════════════════════════════════════════════════
function TimingCover() {
  return (
    <group position={[-0.97, 0.1, 0]}>
      <mesh>
        <boxGeometry args={[0.06, 1.5, 1.0]} />
        <EngineMaterial color={MAT.timing} roughness={0.5} metalness={0.55} />
      </mesh>
      {/* Crankshaft pulley */}
      <mesh position={[0, -0.58, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 20]} />
        <EngineMaterial color="#252830" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Belt groove ring */}
      <mesh position={[0, -0.58, 0]} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
        <torusGeometry args={[0.175, 0.018, 8, 24]} />
        <EngineMaterial color="#111318" roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTAKE MANIFOLD
// ═══════════════════════════════════════════════════════════════════════════
function IntakeManifold() {
  return (
    <group position={[0, 0.78, -0.62]}>
      {/* Plenum chamber */}
      <mesh>
        <boxGeometry args={[1.7, 0.28, 0.22]} />
        <EngineMaterial color="#3a4858" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Intake runners */}
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <mesh key={i} position={[x, -0.22, 0.04]}>
          <boxGeometry args={[0.14, 0.2, 0.16]} />
          <EngineMaterial color="#2e3a48" roughness={0.6} metalness={0.45} />
        </mesh>
      ))}
      {/* Throttle body */}
      <mesh position={[0.76, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
        <EngineMaterial color="#2a3040" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXHAUST MANIFOLD
// ═══════════════════════════════════════════════════════════════════════════
function ExhaustManifold() {
  return (
    <group position={[0, 0.65, 0.62]}>
      {/* Header pipes */}
      {[-0.675, -0.225, 0.225, 0.675].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.28, 12]} />
          <EngineMaterial color={MAT.exhaust} roughness={0.45} metalness={0.7} />
        </mesh>
      ))}
      {/* Collector bar */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[1.5, 0.1, 0.1]} />
        <EngineMaterial color="#a06035" roughness={0.5} metalness={0.65} />
      </mesh>
      {/* Outlet pipe */}
      <mesh position={[0.7, -0.28, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.16, 12]} />
        <EngineMaterial color="#904828" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  );
}

// ─── Explode Wrapper ───────────────────────────────────────────────────────
function ExplodeGroup({ children, offset }: { children: React.ReactNode; offset: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const currentProgress = useRef(useModelStore.getState().explosionProgress);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetProgress = useModelStore.getState().explosionProgress;
    // Smoothly interpolate to the target progress
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, targetProgress, delta * 10);
    
    groupRef.current.position.set(
      offset[0] * currentProgress.current,
      offset[1] * currentProgress.current,
      offset[2] * currentProgress.current
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export function EngineModelParts() {
  const pistonData = [
    { x: -0.675, phase: 0 },
    { x: -0.225, phase: Math.PI * 0.5 },
    { x:  0.225, phase: Math.PI },
    { x:  0.675, phase: Math.PI * 1.5 },
  ];

  return (
    <group>
      <ExplodeGroup offset={[0, 0, 0]}>
        <EngineBlock />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, 1.2, 0]}>
        <CylinderHead />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, -1.5, 0]}>
        <OilPan />
      </ExplodeGroup>

      <ExplodeGroup offset={[-1.5, 0, 0]}>
        <TimingCover />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, -1.0, 0]}>
        <Crankshaft />
      </ExplodeGroup>

      {pistonData.map((p) => (
        <ExplodeGroup key={p.x} offset={[0, -1.0, 0]}>
          <PistonAssembly x={p.x} phase={p.phase} />
        </ExplodeGroup>
      ))}

      <ExplodeGroup offset={[0, 2.2, 0]}>
        <Camshaft />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, 1.5, 0]}>
        <ValveSet />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, 2.0, 0]}>
        <SparkPlugs />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, 1.2, -1.2]}>
        <IntakeManifold />
      </ExplodeGroup>

      <ExplodeGroup offset={[0, 1.2, 1.2]}>
        <ExhaustManifold />
      </ExplodeGroup>
    </group>
  );
}
