'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef, useEffect, useMemo } from 'react';
import { useModelStore } from '@/store/modelStore';
import { EngineModelParts } from './ModelParts';
import * as THREE from 'three';

interface EngineModelProps {
  isARMode?: boolean;
  markerFound?: boolean;
  cameraMatrix?: Float32Array | null;
  projectionMatrix?: Float32Array | null;
}

function EngineGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const { scale } = useModelStore();

  useFrame((state) => {
    if (!groupRef.current) return;
    // Gentle idle rotation
    groupRef.current.rotation.y += 0.002;
    // Subtle floating
    groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <EngineModelParts />
    </group>
  );
}

function MindARMarkerPositioner({
  cameraMatrix,
  projectionMatrix,
  children,
}: {
  cameraMatrix: Float32Array;
  projectionMatrix: Float32Array | null;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (groupRef.current && cameraMatrix) {
      // MindAR provides a column-major 4x4 world matrix
      const markerMatrix = new THREE.Matrix4().fromArray(cameraMatrix);
      groupRef.current.matrixAutoUpdate = false;
      groupRef.current.matrix.copy(markerMatrix);
    }
  }, [cameraMatrix]);

  useEffect(() => {
    if (projectionMatrix && camera instanceof THREE.PerspectiveCamera) {
      const pm = new THREE.Matrix4().fromArray(projectionMatrix);
      camera.projectionMatrix.copy(pm);
      camera.projectionMatrixInverse.copy(pm).invert();
    }
  }, [projectionMatrix, camera]);

  return <group ref={groupRef}>{children}</group>;
}

function SceneSetup({ isARMode }: { isARMode: boolean }) {
  return (
    <>
      <ambientLight intensity={isARMode ? 0.6 : 0.3} color="#e0e8ff" />
      <directionalLight
        position={[5, 8, 3]}
        intensity={isARMode ? 2.2 : 1.5}
        color="#ffffff"
        castShadow={!isARMode}
      />
      <pointLight position={[-4, 2, -2]} intensity={isARMode ? 1.2 : 0.8} color="#00d4ff" />
      <pointLight position={[4, -2, 4]} intensity={isARMode ? 0.8 : 0.5} color="#7c3aed" />
      <pointLight position={[0, 6, 0]} intensity={isARMode ? 0.6 : 0.4} color="#0080ff" />

      {!isARMode && (
        <>
          <Stars radius={80} depth={50} count={2000} factor={3} fade speed={0.5} />
          <Grid
            position={[0, -1.5, 0]}
            args={[12, 12]}
            cellSize={0.5}
            cellThickness={0.3}
            cellColor="#00d4ff22"
            sectionSize={2}
            sectionThickness={0.8}
            sectionColor="#00d4ff44"
            fadeDistance={10}
            infiniteGrid
          />
        </>
      )}

      {isARMode && (
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial transparent opacity={0.25} />
        </mesh>
      )}
    </>
  );
}

export function EngineModel({
  isARMode = false,
  markerFound = false,
  cameraMatrix = null,
  projectionMatrix = null,
}: EngineModelProps) {
  return (
    <div className="w-full h-full" style={{ background: 'transparent' }}>
      <Canvas
        shadows={!isARMode}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isARMode ? 1.5 : 1.2,
          alpha: isARMode,
          premultipliedAlpha: false,
        }}
        onCreated={({ gl }) => {
          if (isARMode) {
            gl.setClearColor(0x000000, 0);
          }
        }}
        style={{
          background: isARMode ? 'transparent' : undefined,
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 1.2, 5]} fov={52} />

        <Suspense fallback={null}>
          <SceneSetup isARMode={isARMode} />

          {isARMode && markerFound && cameraMatrix ? (
            <MindARMarkerPositioner cameraMatrix={cameraMatrix} projectionMatrix={projectionMatrix}>
              <EngineGroup />
            </MindARMarkerPositioner>
          ) : isARMode ? (
            /* In AR but no marker: show the engine at default position */
            <EngineGroup />
          ) : (
            <EngineGroup />
          )}

          <Environment preset="city" />
        </Suspense>

        {!isARMode && (
          <OrbitControls
            enablePan={false}
            minDistance={2.5}
            maxDistance={9}
            minPolarAngle={Math.PI * 0.1}
            maxPolarAngle={Math.PI * 0.85}
            enableDamping
            dampingFactor={0.05}
          />
        )}
      </Canvas>
    </div>
  );
}
