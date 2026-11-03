"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  SRGBColorSpace,
} from "three";

function Box({
  position,
  size,
  color,
  rotation = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.87} />
    </mesh>
  );
}
function Cylinder({
  position,
  size,
  color,
  sides = 12,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  sides?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={[...size, sides]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}
function Sign({
  text,
  position,
  width = 2,
  color = "#f3eddd",
  ink = "#4c6451",
}: {
  text: string;
  position: [number, number, number];
  width?: number;
  color?: string;
  ink?: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 256;
    const c = canvas.getContext("2d")!;
    c.fillStyle = color;
    c.fillRect(0, 0, 768, 256);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(15, 15, 738, 226);
    c.fillStyle = ink;
    c.font = "600 57px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, 384, 129);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [text, color, ink]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, width / 3]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  );
}
function Plant({
  x,
  z,
  y = 0,
  scale = 1,
  pot = "#b67759",
}: {
  x: number;
  z: number;
  y?: number;
  scale?: number;
  pot?: string;
}) {
  return (
    <group position={[x, y, z]} scale={scale}>
      <Cylinder
        position={[0, 0.27, 0]}
        size={[0.29, 0.22, 0.5]}
        color={pot}
        sides={8}
      />
      <Cylinder
        position={[0, 0.52, 0]}
        size={[0.31, 0.31, 0.08]}
        color={pot}
        sides={8}
      />
      <Cylinder
        position={[0, 0.56, 0]}
        size={[0.25, 0.25, 0.025]}
        color="#635341"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.4) * 0.13,
            0.85 + (i % 2) * 0.13,
            Math.cos(i * 2.4) * 0.13,
          ]}
          rotation={[0.3 * Math.sin(i), i, 0.4 * Math.cos(i)]}
          castShadow
        >
          <sphereGeometry args={[0.24, 5, 4]} />
          <meshStandardMaterial
            color={i % 2 ? "#789065" : "#4d7252"}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}
function Cup({ x, z, y = 1.2 }: { x: number; z: number; y?: number }) {
  return (
    <group position={[x, y, z]}>
      <Cylinder
        position={[0, 0, 0]}
        size={[0.15, 0.15, 0.035]}
        color="#e9e5cd"
      />
      <Cylinder
        position={[0, 0.105, 0]}
        size={[0.105, 0.075, 0.2]}
        color="#f8f3df"
      />
      <Cylinder
        position={[0, 0.21, 0]}
        size={[0.082, 0.082, 0.01]}
        color="#634533"
      />
      <mesh position={[0.1, 0.12, 0]}>
        <torusGeometry args={[0.065, 0.022, 5, 10]} />
        <meshStandardMaterial color="#f8f3df" />
      </mesh>
    </group>
  );
}
function Table({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <Cylinder
        position={[0, 1.13, 0]}
        size={[0.73, 0.73, 0.13]}
        color="#be9163"
      />
      <Cylinder
        position={[0, 0.59, 0]}
        size={[0.085, 0.12, 1]}
        color="#526255"
      />
      <Cylinder
        position={[0, 0.07, 0]}
        size={[0.35, 0.35, 0.1]}
        color="#526255"
      />
      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * 0.81]}>
          <Cylinder
            position={[0, 0.66, 0]}
            size={[0.28, 0.28, 0.12]}
            color="#6d8570"
          />
          {[
            [-0.17, -0.17],
            [0.17, -0.17],
            [-0.17, 0.17],
            [0.17, 0.17],
          ].map(([a, b], i) => (
            <Box
              key={i}
              position={[a, 0.33, b]}
              size={[0.055, 0.6, 0.055]}
              color="#af8458"
            />
          ))}
        </group>
      ))}
      <Cup x={-0.2} z={0.1} />
      <Cup x={0.22} z={-0.15} />
      <Plant x={0.12} z={0.27} y={1.2} scale={0.28} pot="#dbc79c" />
    </group>
  );
}
function Pendant({ x }: { x: number }) {
  return (
    <group position={[x, 0, -2]}>
      <Cylinder
        position={[0, 3.45, 0]}
        size={[0.018, 0.018, 1.2]}
        color="#746451"
      />
      <Cylinder
        position={[0, 2.83, 0]}
        size={[0.08, 0.42, 0.28]}
        color="#b8925e"
        sides={12}
      />
      <mesh position={[0, 2.68, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial
          color="#fff2be"
          emissive="#f5d28c"
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  );
}

export function CafeInterior() {
  return (
    <group>
      <Box position={[0, -0.25, 0]} size={[12, 0.5, 12]} color="#ba9770" />
      <Box position={[0, 0.01, 0]} size={[11.8, 0.04, 11.8]} color="#d7b98d" />
      {Array.from({ length: 16 }, (_, i) => (
        <Box
          key={i}
          position={[-5.6 + i * 0.75, 0.035, 0]}
          size={[0.025, 0.009, 11.7]}
          color="#c4a47b"
        />
      ))}
      <Box position={[0, 2, -5.7]} size={[11.8, 4, 0.24]} color="#e6dfc7" />
      <Box
        position={[0, 0.7, -5.53]}
        size={[11.8, 1.4, 0.11]}
        color="#7b927d"
      />
      {Array.from({ length: 20 }, (_, i) => (
        <Box
          key={i}
          position={[-5.6 + i * 0.6, 0.7, -5.45]}
          size={[0.025, 1.4, 0.05]}
          color="#657c68"
        />
      ))}
      <Box position={[-5.7, 1.5, -1.9]} size={[0.2, 3, 7.6]} color="#e9e2ce" />
      <Box position={[5.7, 0.3, -1.9]} size={[0.2, 0.6, 7.6]} color="#7b927d" />
      {[-3.5, 3.5].map((x) => (
        <group key={x} position={[x, 2.6, -5.5]}>
          <Box position={[0, 0, 0]} size={[2.45, 1.85, 0.15]} color="#ab835b" />
          <Box
            position={[0, 0, 0.09]}
            size={[2.2, 1.6, 0.035]}
            color="#c2d9d4"
          />
          <Box
            position={[0, 0, 0.13]}
            size={[0.08, 1.7, 0.06]}
            color="#f3e9cf"
          />
          <Box
            position={[0, 0, 0.14]}
            size={[2.3, 0.08, 0.06]}
            color="#f3e9cf"
          />
          <Box
            position={[0, -0.95, 0.1]}
            size={[2.6, 0.12, 0.4]}
            color="#bd956a"
          />
        </group>
      ))}
      <Sign text="카페, 오후" position={[0, 3.15, -5.51]} width={2.8} />
      <Box position={[0, 0.7, -3]} size={[9.2, 1.4, 1.4]} color="#71866c" />
      {Array.from({ length: 15 }, (_, i) => (
        <Box
          key={i}
          position={[-4.2 + i * 0.6, 0.7, -2.28]}
          size={[0.035, 1.2, 0.035]}
          color="#516d56"
        />
      ))}
      <Box position={[0, 1.45, -3]} size={[9.5, 0.14, 1.55]} color="#b98b62" />
      <Box
        position={[-1.4, 1.9, -3.2]}
        size={[1.6, 0.75, 0.75]}
        color="#d8d7ca"
      />
      <Box
        position={[-1.4, 1.9, -2.79]}
        size={[1.35, 0.42, 0.1]}
        color="#424f48"
      />
      <Box
        position={[-1.4, 1.58, -2.62]}
        size={[1.55, 0.07, 0.3]}
        color="#81918a"
      />
      {[-1.75, -1.1].map((x) => (
        <group key={x}>
          <Cylinder
            position={[x, 2.34, -3.2]}
            size={[0.16, 0.16, 0.1]}
            color="#eee9d9"
          />
          <Cup x={x} z={-2.65} y={1.61} />
        </group>
      ))}
      <Box position={[2.3, 1.82, -3]} size={[2.05, 0.6, 0.8]} color="#becbc0" />
      <Box
        position={[2.3, 1.83, -2.57]}
        size={[1.9, 0.42, 0.04]}
        color="#b6cfc4"
      />
      {[-0.55, 0, 0.55].map((o, i) => (
        <mesh
          key={i}
          position={[2.3 + o, 1.65, -2.63]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.13, 0.065, 5, 12]} />
          <meshStandardMaterial
            color={i === 1 ? "#ba8960" : "#d3a465"}
            roughness={1}
          />
        </mesh>
      ))}
      <Sign
        text="COFFEE · SLOW MOMENTS"
        position={[0, 2.38, -5.5]}
        width={2.1}
        color="#485c4c"
        ink="#e5dfc8"
      />
      <Box
        position={[-4.5, 2.3, -4.5]}
        size={[1.1, 0.1, 0.6]}
        color="#9c7852"
      />
      <Plant x={-4.5} z={-4.5} y={2.35} scale={0.7} />
      <Plant x={4.65} z={-4.5} scale={1.5} pot="#dfcaac" />
      <Plant x={-5} z={3.4} scale={1.3} pot="#b88561" />
      <Table x={-2.4} />
      <Table x={2.4} />
      {[-3, 0, 3].map((x) => (
        <Pendant key={x} x={x} />
      ))}
      <Box position={[0, 0.055, 4.6]} size={[2.7, 0.06, 1.5]} color="#8e9e7b" />
      <Box position={[0, 0.09, 4.6]} size={[2.4, 0.01, 1.22]} color="#b3bb96" />
      <Sign
        text="어서 와요, 당신의 오후"
        position={[0, 1.9, -5.5]}
        width={2.1}
      />
      <group position={[0, 0.1, 5.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <Sign
          text="광장으로  ↓"
          position={[0, 0, 0]}
          width={2.5}
          color="#e5e4c9"
        />
      </group>
    </group>
  );
}

function GardenTree({
  x,
  z,
  scale = 1,
  color = "#8da66f",
}: {
  x: number;
  z: number;
  scale?: number;
  color?: string;
}) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <Cylinder
        position={[0, 1.2, 0]}
        size={[0.17, 0.24, 2.4]}
        color="#9b7b58"
        sides={7}
      />
      {[
        [-0.5, 2.6, 0],
        [0.45, 2.9, 0.2],
        [0, 3.5, -0.1],
      ].map(([a, b, c], i) => (
        <mesh key={i} position={[a, b, c]} castShadow>
          <icosahedronGeometry args={[1.2 - i * 0.12, 1]} />
          <meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
function FlowerBed({
  x,
  z,
  color = "#e7bb97",
  count = 6,
}: {
  x: number;
  z: number;
  color?: string;
  count?: number;
}) {
  const stems = useRef<InstancedMesh>(null);
  const blooms = useRef<InstancedMesh>(null);
  const leaves = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const stemMesh = stems.current,
      bloomMesh = blooms.current,
      leafMesh = leaves.current;
    if (!stemMesh || !bloomMesh || !leafMesh) return;
    const transform = new Object3D();
    for (let i = 0; i < count; i++) {
      const angle = i * 2.4,
        radius = 0.18 + Math.sqrt(i) * 0.25;
      const px = Math.cos(angle) * radius,
        pz = Math.sin(angle) * radius;
      transform.position.set(px, 0.16, pz);
      transform.rotation.set(0, 0, 0);
      transform.updateMatrix();
      stemMesh.setMatrixAt(i, transform.matrix);
      transform.position.set(px, 0.32, pz);
      transform.updateMatrix();
      bloomMesh.setMatrixAt(i, transform.matrix);
      transform.position.set(px + 0.08, 0.16, pz);
      transform.rotation.set(0, 0, -0.6);
      transform.updateMatrix();
      leafMesh.setMatrixAt(i, transform.matrix);
    }
    for (const mesh of [stemMesh, bloomMesh, leafMesh]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [count]);
  return (
    <group position={[x, 0, z]}>
      <instancedMesh
        ref={stems}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.018, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#6b8b57" roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={blooms}
        args={[undefined, undefined, count]}
        castShadow
      >
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={color} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.09, 4, 3]} />
        <meshStandardMaterial color="#83a166" />
      </instancedMesh>
    </group>
  );
}
function GardenBench() {
  return (
    <group position={[-4, 0, 1]}>
      {[-1.1, 1.1].map((x) => (
        <group key={x}>
          <Box
            position={[x, 0.35, 0]}
            size={[0.12, 0.7, 0.65]}
            color="#54664d"
          />
          <Box
            position={[x, 0.85, -0.27]}
            size={[0.1, 1.15, 0.1]}
            color="#54664d"
          />
        </group>
      ))}
      {[-0.22, 0, 0.22].map((z) => (
        <Box
          key={z}
          position={[0, 0.68, z]}
          size={[2.8, 0.1, 0.17]}
          color="#b68c60"
        />
      ))}
      {[0.94, 1.2].map((y) => (
        <Box
          key={y}
          position={[0, y, -0.32]}
          size={[2.8, 0.18, 0.1]}
          color="#bd9469"
        />
      ))}
    </group>
  );
}
function Pond() {
  const water = useRef<Mesh>(null);
  const ripples = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (water.current)
      water.current.position.y =
        0.13 + Math.sin(clock.elapsedTime * 1.3) * 0.01;
    if (ripples.current)
      ripples.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.1;
  });
  return (
    <group position={[0, 0, -1]}>
      <mesh position={[0, 0.025, 0]} scale={[1, 1, 0.76]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.2, 0.12, 20]} />
        <meshStandardMaterial color="#baa88a" roughness={1} />
      </mesh>
      <mesh ref={water} position={[0, 0.13, 0]} scale={[1, 1, 0.73]}>
        <cylinderGeometry args={[1.95, 1.95, 0.04, 24]} />
        <meshStandardMaterial
          color="#83b8b0"
          roughness={0.27}
          metalness={0.12}
        />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i * Math.PI * 2) / 18;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 2.08, 0.16, Math.sin(a) * 1.57]}
            scale={[0.38, 0.2, 0.27]}
            rotation={[0, a, 0]}
            castShadow
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={i % 2 ? "#d0c2a4" : "#c3b695"}
              flatShading
            />
          </mesh>
        );
      })}
      <group ref={ripples}>
        {[0.45, 0.9, 1.5].map((r, i) => (
          <mesh
            key={r}
            position={[0.05, 0.163, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[1, 0.75, 1]}
          >
            <ringGeometry args={[r, r + 0.025, 32]} />
            <meshStandardMaterial
              color="#c2d9c4"
              transparent
              opacity={0.35 - i * 0.05}
            />
          </mesh>
        ))}
      </group>
      {[
        [-0.8, 0.3],
        [0.7, -0.5],
        [0.9, 0.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.2, 9]} />
          <meshStandardMaterial color="#799760" roughness={1} />
        </mesh>
      ))}
      <mesh position={[-0.8, 0.24, 0.3]}>
        <icosahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#f3c3b6" />
      </mesh>
    </group>
  );
}

export function GardenScene() {
  return (
    <group>
      <Box position={[0, -0.3, 0]} size={[21, 0.6, 21]} color="#b2bf8f" />
      <mesh position={[0, 0.005, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, 32]} />
        <meshStandardMaterial color="#c3c99a" roughness={1} />
      </mesh>
      <Box
        position={[0, 0.018, 4.7]}
        size={[2.5, 0.025, 8.4]}
        color="#e0d6b1"
      />
      <Box position={[-3, 0.018, 2.4]} size={[5, 0.025, 1.5]} color="#e0d6b1" />
      {Array.from({ length: 11 }, (_, i) => (
        <Box
          key={i}
          position={[i % 2 ? -0.14 : 0.14, 0.039, 0.9 + i * 0.66]}
          size={[1.75, 0.035, 0.5]}
          color={i % 2 ? "#d6ccaa" : "#e9ddbb"}
          rotation={((i % 3) - 1) * 0.05}
        />
      ))}
      <Pond />
      <GardenBench />
      {[
        [-9, -5, 1.2],
        [-7, -9, 1.4],
        [0, -10, 1.2],
        [8, -8, 1.5],
        [10, -1, 1.2],
        [9, 6, 1.1],
        [-10, 4, 1.1],
      ].map(([x, z, s], i) => (
        <GardenTree
          key={i}
          x={x}
          z={z}
          scale={s}
          color={i % 3 === 0 ? "#aebc7e" : "#8eaa73"}
        />
      ))}
      {[
        [-5, -4],
        [-3, -5],
        [4, -4],
        [5, -1],
        [5, 3],
        [-5, 5],
        [3, 6],
        [-7, 1],
        [-6, 7],
        [6, 7],
        [-7, -6],
        [7, -6],
      ].map(([x, z], i) => (
        <FlowerBed
          key={i}
          x={x}
          z={z}
          color={["#e9bb93", "#ecd8a1", "#c5a5b5", "#f0e9c2"][i % 4]}
          count={9}
        />
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.8, 0, 7.3]}>
          <Box
            position={[0, 0.9, 0]}
            size={[0.15, 1.8, 0.15]}
            color="#ad8961"
          />
          <Plant x={0} z={0} y={1.7} scale={0.7} pot="#dcc6a0" />
        </group>
      ))}
      <Box position={[0, 2.1, 7.3]} size={[3.8, 0.15, 0.2]} color="#af8e68" />
      <Sign text="느티나무 광장  ↓" position={[0, 1.8, 7.42]} width={2.2} />
      <group position={[6, 0, -3]}>
        <Box position={[0, 0.8, 0]} size={[0.12, 1.6, 0.12]} color="#97774e" />
        <Sign text="바람의 정원" position={[0, 1.45, 0.08]} width={1.8} />
      </group>
    </group>
  );
}
