"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TREES, type Zone } from "@/lib/world";
import { CafeInterior, GardenScene } from "./Interiors";

type Position = [number, number, number];
const C = {
  grass: "#b5c497",
  grassLight: "#c0ceaa",
  darkGreen: "#668e71",
  leaf: "#8fa877",
  leafLight: "#adc394",
  cream: "#f5ead5",
  stone: "#d6c8ad",
  terracotta: "#b9765f",
  wood: "#916e50",
  darkWood: "#725945",
  water: "#8abfba",
  metal: "#687963",
};

function Box({
  position,
  size,
  color,
  rotation,
  castShadow = true,
}: {
  position: Position;
  size: Position;
  color: string;
  rotation?: Position;
  castShadow?: boolean;
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}
function Cylinder({
  position,
  radius,
  height,
  color,
  topRadius = radius,
  segments = 12,
}: {
  position: Position;
  radius: number;
  height: number;
  color: string;
  topRadius?: number;
  segments?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={[topRadius, radius, height, segments]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}
function Label({
  text,
  position,
  width = 2.4,
  color = "#f7edda",
  ink = "#4f6651",
  fontSize = 50,
}: {
  text: string;
  position: Position;
  width?: number;
  color?: string;
  ink?: string;
  fontSize?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.fillText(text, 384, 96);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text, color, ink, fontSize]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position}>
      <planeGeometry args={[width, width / 4]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  );
}

function Tree({
  x,
  z,
  scale = 1,
  index = 0,
}: {
  x: number;
  z: number;
  scale?: number;
  index?: number;
}) {
  const colors = ["#91aa7b", "#9fb68a", "#7f9e77", "#b6c79a"];
  return (
    <group position={[x, 0, z]} scale={scale}>
      <Cylinder
        position={[0, 1.2, 0]}
        radius={0.23}
        topRadius={0.15}
        height={2.4}
        color={C.wood}
        segments={7}
      />
      <mesh position={[0.23, 2.1, 0]} rotation={[0, 0, -0.55]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 1.2, 6]} />
        <meshStandardMaterial color={C.wood} />
      </mesh>
      {[
        [0, 3, 0, 1.7],
        [-0.9, 2.9, 0.1, 1.15],
        [0.8, 3.4, 0.2, 1.35],
        [0, 3.9, -0.5, 1.2],
      ].map(([a, b, c, s], i) => (
        <mesh key={i} position={[a, b, c]} scale={[s, s * 0.9, s]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={colors[(index + i) % colors.length]}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
      <mesh
        position={[0, 0.018, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[1.25, 12]} />
        <meshStandardMaterial color="#9bad84" />
      </mesh>
    </group>
  );
}

function FlowerPatch({
  x,
  z,
  color = "#e8b8a1",
  count = 8,
  seed = 0,
}: {
  x: number;
  z: number;
  color?: string;
  count?: number;
  seed?: number;
}) {
  const stems = useRef<THREE.InstancedMesh>(null),
    blooms = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = i * 2.399 + seed,
        d = Math.sqrt((i + 0.5) / count) * 0.75,
        px = Math.cos(a) * d,
        pz = Math.sin(a) * d;
      object.position.set(px, 0.16, pz);
      object.scale.set(0.035, 0.3, 0.035);
      object.updateMatrix();
      stems.current?.setMatrixAt(i, object.matrix);
      object.position.y = 0.34;
      object.scale.set(0.13, 0.0715, 0.13);
      object.updateMatrix();
      blooms.current?.setMatrixAt(i, object.matrix);
      blooms.current?.setColorAt(i, tint.set(i % 3 === 0 ? "#f3e8bd" : color));
    }
    if (stems.current) {
      stems.current.instanceMatrix.needsUpdate = true;
      stems.current.computeBoundingSphere();
    }
    if (blooms.current) {
      blooms.current.instanceMatrix.needsUpdate = true;
      blooms.current.computeBoundingSphere();
      if (blooms.current.instanceColor)
        blooms.current.instanceColor.needsUpdate = true;
    }
  }, [count, seed, color]);
  return (
    <group position={[x, 0, z]}>
      <instancedMesh ref={stems} args={[undefined, undefined, count]}>
        <boxGeometry />
        <meshStandardMaterial color="#7e9968" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={blooms} args={[undefined, undefined, count]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  );
}

function Planter({
  position,
  width = 1.7,
}: {
  position: Position;
  width?: number;
}) {
  return (
    <group position={position}>
      <Box position={[0, 0.15, 0]} size={[width, 0.3, 0.5]} color="#b58f6e" />
      <Box
        position={[0, 0.32, 0]}
        size={[width + 0.1, 0.09, 0.58]}
        color="#c59c78"
      />
      {[-0.5, 0, 0.5]
        .filter((x) => Math.abs(x) < width / 2)
        .map((x, i) => (
          <mesh
            key={x}
            position={[x, 0.52, 0]}
            scale={[0.4, 0.3, 0.33]}
            castShadow
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={i % 2 ? "#e7baa5" : "#91a67e"} />
          </mesh>
        ))}
    </group>
  );
}

function Roof({
  width,
  depth,
  height = 1.6,
  color = C.terracotta,
}: {
  width: number;
  depth: number;
  height?: number;
  color?: string;
}) {
  const geo = useMemo(() => {
    const w = width / 2,
      d = depth / 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [-w, 0, d, w, 0, d, 0, height, d, -w, 0, -d, w, 0, -d, 0, height, -d],
        3,
      ),
    );
    g.setIndex([
      0, 1, 2, 5, 4, 3, 0, 2, 5, 0, 5, 3, 2, 1, 4, 2, 4, 5, 3, 4, 1, 3, 1, 0,
    ]);
    g.computeVertexNormals();
    return g;
  }, [width, depth, height]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={1}
        flatShading
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Window({
  x,
  y,
  z,
  width = 1.2,
}: {
  x: number;
  y: number;
  z: number;
  width?: number;
}) {
  return (
    <group position={[x, y, z]}>
      <Box
        position={[0, 0, 0]}
        size={[width + 0.2, 1.65, 0.16]}
        color="#e5d5b8"
      />
      <Box position={[0, 0, 0.1]} size={[width, 1.45, 0.08]} color="#9bbdb4" />
      <Box position={[0, 0, 0.17]} size={[0.09, 1.5, 0.06]} color={C.cream} />
      <Box
        position={[0, 0.05, 0.17]}
        size={[width, 0.09, 0.06]}
        color={C.cream}
      />
      <Box
        position={[-width / 2 - 0.28, 0, 0.1]}
        size={[0.36, 1.6, 0.14]}
        color="#79917a"
      />
      <Box
        position={[width / 2 + 0.28, 0, 0.1]}
        size={[0.36, 1.6, 0.14]}
        color="#79917a"
      />
      <Planter position={[0, -0.95, 0.2]} width={width + 0.35} />
    </group>
  );
}

function Cafe() {
  return (
    <group position={[-8, 0, -6]}>
      <Box position={[0, 0.15, 0]} size={[7.8, 0.3, 6]} color="#d0bd9b" />
      <Box position={[0, 1.8, 0]} size={[7.2, 3.3, 5.4]} color="#efe0bf" />
      <Box position={[0, 0.6, 2.73]} size={[7.25, 0.5, 0.15]} color="#d8c4a3" />
      <group position={[0, 3.42, 0]}>
        <Roof width={8.1} depth={6.4} height={1.8} />
      </group>
      <Box
        position={[1.7, 4.2, -1.3]}
        size={[0.7, 1.65, 0.75]}
        color="#d1b194"
      />
      <Box
        position={[1.7, 5.08, -1.3]}
        size={[0.85, 0.18, 0.85]}
        color="#b78970"
      />
      <Window x={-2.05} y={1.9} z={2.77} width={1.5} />
      <Window x={2.05} y={1.9} z={2.77} width={1.5} />
      <Box position={[0, 1.3, 2.8]} size={[1.25, 2.3, 0.16]} color="#79917a" />
      <Box position={[0, 1.7, 2.9]} size={[0.9, 1.1, 0.05]} color="#b1ccc1" />
      <Box
        position={[0, 1.7, 2.95]}
        size={[0.06, 1.15, 0.04]}
        color="#edf0d6"
      />
      <mesh position={[0.42, 1.1, 2.97]}>
        <sphereGeometry args={[0.065, 8, 6]} />
        <meshStandardMaterial color="#dfc58f" />
      </mesh>
      <Box position={[0, 0.15, 3.13]} size={[2, 0.25, 0.8]} color="#d7c7ab" />
      <Box
        position={[0, 3.05, 2.82]}
        size={[2.55, 0.62, 0.14]}
        color="#f5ecd7"
      />
      <Label
        text="café, 오후"
        position={[0, 3.05, 2.9]}
        width={2.4}
        fontSize={66}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          position={[-3.4 + i * 0.62, 2.62, 3.13]}
          size={[0.62, 0.12, 1.15]}
          color={i % 2 ? "#eee8cd" : "#8f9e80"}
          rotation={[0.18, 0, 0]}
        />
      ))}
      <Box
        position={[-3.05, 1.5, 3.5]}
        size={[0.07, 2.3, 0.07]}
        color="#879578"
      />
      <Box
        position={[3.05, 1.5, 3.5]}
        size={[0.07, 2.3, 0.07]}
        color="#879578"
      />
      <group position={[4.15, 0, 2.9]} rotation={[0, -0.1, 0.09]}>
        <Box position={[0, 0.7, 0]} size={[0.75, 1.3, 0.1]} color="#8d7155" />
        <Box
          position={[0, 0.75, 0.07]}
          size={[0.6, 1.0, 0.05]}
          color="#536853"
        />
        <Label
          text="COFFEE"
          position={[0, 1, 0.105]}
          width={0.56}
          color="#536853"
          ink="#f2e6cd"
          fontSize={80}
        />
        <Box
          position={[0, 0.24, -0.33]}
          size={[0.75, 0.08, 0.65]}
          color="#8d7155"
        />
      </group>
    </group>
  );
}

function Cottage() {
  return (
    <group position={[8, 0, -8]}>
      <Box position={[0, 0.1, 0]} size={[6.5, 0.2, 5.5]} color="#cabb9d" />
      <Box position={[0, 1.6, 0]} size={[6, 3.1, 5]} color="#e9c9a6" />
      <group position={[0, 3.15, 0]}>
        <Roof width={6.9} depth={5.8} height={1.65} color="#758c80" />
      </group>
      <Window x={-1.65} y={1.75} z={2.54} />
      <Window x={1.65} y={1.75} z={2.54} />
      <Box position={[0, 1.1, 2.56]} size={[1, 2.1, 0.12]} color="#987d5f" />
      <Box
        position={[0, 1.6, 2.65]}
        size={[0.65, 0.65, 0.06]}
        color="#c5d3bb"
      />
      <Label
        text="작은 책방"
        position={[0, 2.75, 2.59]}
        width={1.8}
        ink="#695d47"
        color="#eadaba"
        fontSize={65}
      />
      <Planter position={[-2.6, 0.1, 3.1]} />
      <Planter position={[2.6, 0.1, 3.1]} />
    </group>
  );
}

export function Bench({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1.1, 1.1].map((a) => (
        <group key={a}>
          <Box
            position={[a, 0.31, 0]}
            size={[0.16, 0.62, 0.62]}
            color="#697e68"
          />
          <Box
            position={[a, 0.8, -0.28]}
            size={[0.13, 1.15, 0.14]}
            color="#697e68"
          />
          <Box
            position={[a, 0.82, 0.14]}
            size={[0.13, 0.1, 0.62]}
            color="#697e68"
          />
        </group>
      ))}
      {[-0.24, -0.05, 0.14, 0.33].map((s) => (
        <Box
          key={s}
          position={[0, 0.63, s]}
          size={[3, 0.13, 0.16]}
          color="#b6946a"
        />
      ))}
      {[0.93, 1.17].map((y) => (
        <Box
          key={y}
          position={[0, y, -0.3]}
          size={[3, 0.18, 0.12]}
          color="#b6946a"
        />
      ))}
    </group>
  );
}

function Noticeboard() {
  return (
    <group position={[7, 0, 3]}>
      {[-1.3, 1.3].map((x) => (
        <Box
          key={x}
          position={[x, 1.1, 0]}
          size={[0.18, 2.2, 0.2]}
          color="#8e7656"
        />
      ))}
      <Box position={[0, 1.6, 0]} size={[3, 1.8, 0.2]} color="#8b7254" />
      <Box
        position={[0, 1.6, 0.13]}
        size={[2.75, 1.55, 0.09]}
        color="#b49a75"
      />
      <Box
        position={[0, 2.65, 0.0]}
        size={[3.4, 0.18, 0.85]}
        color="#77947b"
        rotation={[-0.05, 0, 0]}
      />
      <Label
        text="우리 마을 이야기"
        position={[0, 2.2, 0.2]}
        width={2.5}
        color="#b49a75"
        ink="#fff2d5"
        fontSize={53}
      />
      {[
        [-0.83, 1.5, 0.55, 0.7, "#f0e1bc"],
        [-0.1, 1.4, 0.52, 0.65, "#e4bdac"],
        [0.75, 1.53, 0.7, 0.76, "#cdd9b5"],
      ].map(([x, y, w, h, c], i) => (
        <group key={i}>
          <Box
            position={[Number(x), Number(y), 0.23]}
            size={[Number(w), Number(h), 0.035]}
            color={String(c)}
            rotation={[0, 0, (i - 1) * 0.08]}
          />
          <Box
            position={[Number(x), Number(y) + Number(h) / 2 - 0.08, 0.26]}
            size={[0.08, 0.05, 0.04]}
            color="#8e9f72"
          />
          {[0, 0.15, 0.3].map((t) => (
            <Box
              key={t}
              position={[Number(x), Number(y) + 0.08 - t, 0.255]}
              size={[Number(w) * 0.65, 0.025, 0.01]}
              color="#ad9b7c"
              castShadow={false}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function Fountain() {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current)
      water.current.position.y =
        0.52 + Math.sin(clock.elapsedTime * 1.8) * 0.012;
  });
  return (
    <group>
      <Cylinder
        position={[0, 0.09, 0]}
        radius={2.55}
        height={0.18}
        color="#c4bda5"
        segments={16}
      />
      <Cylinder
        position={[0, 0.28, 0]}
        radius={2.2}
        height={0.38}
        color="#e3d7bc"
        segments={16}
      />
      <mesh
        position={[0, 0.51, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        ref={water}
        receiveShadow
      >
        <circleGeometry args={[2.03, 32]} />
        <meshStandardMaterial
          color={C.water}
          metalness={0.2}
          roughness={0.26}
        />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[2.12, 0.16, 5, 16]} />
        <meshStandardMaterial color="#f1e5cb" roughness={1} />
      </mesh>
      <Cylinder
        position={[0, 0.9, 0]}
        radius={0.48}
        topRadius={0.33}
        height={1.25}
        color="#e3d7bf"
      />
      <Cylinder
        position={[0, 1.49, 0]}
        radius={1.02}
        topRadius={1.1}
        height={0.15}
        color="#e9dec6"
      />
      <Cylinder
        position={[0, 1.55, 0]}
        radius={0.92}
        height={0.025}
        color="#9fc9c0"
      />
      <Cylinder
        position={[0, 1.91, 0]}
        radius={0.18}
        topRadius={0.13}
        height={0.7}
        color="#e3d7bf"
      />
      <mesh position={[0, 2.29, 0]} castShadow>
        <sphereGeometry args={[0.23, 8, 6]} />
        <meshStandardMaterial color="#f2e9d1" />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i * Math.PI) / 4;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.93, 1.01, Math.cos(a) * 0.93]}
          >
            <cylinderGeometry args={[0.018, 0.036, 0.91, 5]} />
            <meshStandardMaterial color="#b8d9ce" transparent opacity={0.7} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.49, 32]} />
        <meshStandardMaterial color="#cee1ce" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Paving() {
  const tiles = useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    for (let ring = 0; ring < 7; ring++) {
      const radius = 3.05 + ring * 0.65;
      const n = Math.floor(radius * 6.2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (ring % 2) * 0.1;
        o.position.set(Math.sin(a) * radius, 0.012, Math.cos(a) * radius);
        o.rotation.set(0, a, 0);
        o.scale.set(0.48, 0.025, 0.48);
        o.updateMatrix();
        out.push(o.matrix.clone());
      }
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    if (!tiles.current) return;
    matrices.forEach((m, i) => tiles.current!.setMatrixAt(i, m));
    tiles.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        receiveShadow
      >
        <circleGeometry args={[8.2, 48]} />
        <meshStandardMaterial color="#d9d0b8" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, 0]}
        receiveShadow
      >
        <ringGeometry args={[7.8, 8.15, 48]} />
        <meshStandardMaterial color="#beb99e" />
      </mesh>
      <instancedMesh
        ref={tiles}
        args={[undefined, undefined, matrices.length]}
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial color="#e4dbc4" roughness={1} />
      </instancedMesh>
      <Box
        position={[0, 0.007, -11]}
        size={[3.6, 0.015, 9.5]}
        color="#d9d0b8"
        castShadow={false}
      />
      <Box
        position={[-7, 0.008, -1.8]}
        size={[6, 0.02, 2.7]}
        color="#d9d0b8"
        castShadow={false}
      />
      <Box
        position={[0, 0.007, 12]}
        size={[4.2, 0.015, 9]}
        color="#d9d0b8"
        castShadow={false}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          position={[0, 0.022, 8 + i * 0.8]}
          size={[3.8, 0.02, 0.03]}
          color="#c9bfa7"
          castShadow={false}
        />
      ))}
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cylinder
        position={[0, 0.14, 0]}
        radius={0.22}
        height={0.28}
        color="#75846c"
      />
      <Cylinder
        position={[0, 1.4, 0]}
        radius={0.065}
        height={2.7}
        color="#697963"
        segments={6}
      />
      <Box position={[0, 2.85, 0]} size={[0.38, 0.52, 0.38]} color="#e9d8a1" />
      <Box position={[0, 2.56, 0]} size={[0.46, 0.09, 0.46]} color="#697963" />
      <mesh position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.4, 0.28, 4]} />
        <meshStandardMaterial color="#697963" />
      </mesh>
    </group>
  );
}

function Gate() {
  return (
    <group position={[0, 0, -13]}>
      {[-1.9, 1.9].map((x) => (
        <group key={x}>
          <Box position={[x, 1.6, 0]} size={[0.3, 3.2, 0.35]} color="#b8a585" />
          <Box position={[x, 3.2, 0]} size={[0.5, 0.15, 0.5]} color="#d8cbb0" />
        </group>
      ))}
      <Box position={[0, 3.1, 0]} size={[4.4, 0.22, 0.42]} color="#b8a585" />
      <Box position={[0, 2.6, 0.02]} size={[2.8, 0.62, 0.13]} color="#e5dac0" />
      <Label
        text="바람의 정원"
        position={[0, 2.6, 0.1]}
        width={2.7}
        fontSize={58}
      />
      {[-1.9, 1.9].map((x, j) => (
        <group key={x}>
          {[0.7, 1.5, 2.3, 3].map((y, i) => (
            <mesh
              key={y}
              position={[x + (i % 2 ? 0.16 : -0.1), y, 0.2]}
              scale={[0.35, 0.32, 0.32]}
              castShadow
            >
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={(i + j) % 2 ? "#91a77b" : "#b0bf93"}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Fence({
  x,
  z,
  length,
  rotation = 0,
}: {
  x: number;
  z: number;
  length: number;
  rotation?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {[0.4, 0.78].map((y) => (
        <Box
          key={y}
          position={[0, y, 0]}
          size={[length, 0.13, 0.13]}
          color="#e0d4b8"
        />
      ))}
      {Array.from({ length: Math.ceil(length / 1.5) + 1 }, (_, i) => {
        const a = -length / 2 + i * (length / Math.ceil(length / 1.5));
        return (
          <group key={i}>
            <Box
              position={[a, 0.53, 0]}
              size={[0.16, 1.06, 0.16]}
              color="#eee2c9"
            />
            <mesh position={[a, 1.12, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[0.14, 0.14, 4]} />
              <meshStandardMaterial color="#eee2c9" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GrassTufts() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    for (let i = 0; i < 180; i++) {
      const x = Math.sin(i * 127.1) * 16.5,
        z = Math.sin(i * 311.7) * 16.5;
      if (Math.hypot(x, z) < 9 || Math.abs(x) < 2.5) continue;
      o.position.set(x, 0.13, z);
      o.rotation.set(0, i * 0.7, Math.sin(i) * 0.12);
      o.scale.set(0.1, 0.2 + (i % 3) * 0.04, 0.08);
      o.updateMatrix();
      out.push(o.matrix.clone());
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    matrices.forEach((m, i) => ref.current?.setMatrixAt(i, m));
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]}>
      <coneGeometry args={[1, 1, 3]} />
      <meshStandardMaterial color="#92a87b" roughness={1} />
    </instancedMesh>
  );
}

function Clouds() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.position.x = Math.sin(clock.elapsedTime * 0.025) * 2;
  });
  return (
    <group ref={ref}>
      {[
        [-17, 14, -27, 1],
        [12, 15, -30, 1.4],
        [27, 13, -15, 0.8],
        [-30, 13, -8, 0.9],
      ].map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]} scale={s}>
          {[
            [-1, 0, 0],
            [0, 0.3, 0],
            [1.1, 0, 0],
            [0.4, 0, 0.6],
          ].map(([a, b, c], j) => (
            <mesh key={j} position={[a, b, c]} scale={[1.6, 0.65, 0.85]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#f5f2df" roughness={1} flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Plaza() {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.045, 0]}
        receiveShadow
      >
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color={C.grass} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.015, 0]}
        receiveShadow
      >
        <circleGeometry args={[22, 48]} />
        <meshStandardMaterial color={C.grassLight} />
      </mesh>
      <Paving />
      <Fountain />
      <Cafe />
      <Cottage />
      <Bench x={-5} z={2} />
      <Noticeboard />
      <Gate />
      {TREES.map((p, i) => (
        <Tree key={i} {...p} index={i} scale={0.88 + (i % 3) * 0.13} />
      ))}
      {[
        [-19, -15],
        [19, -14],
        [-21, 0],
        [22, 4],
        [-10, -22],
        [6, -23],
        [24, -4],
        [-23, 9],
        [20, 16],
        [-12, 19],
      ].map(([x, z], i) => (
        <Tree key={`far${i}`} x={x} z={z} index={i} scale={1 + (i % 3) * 0.2} />
      ))}
      <Fence x={-10} z={-13} length={9} />
      <Fence x={11} z={-15} length={8} />
      <Fence x={-17.6} z={2} length={8} rotation={Math.PI / 2} />
      <Fence x={17.5} z={5} length={8} rotation={Math.PI / 2} />
      <Lamp x={-4.2} z={6.5} />
      <Lamp x={6.4} z={-1.2} />
      <Lamp x={-4} z={-11} />
      <Lamp x={4.2} z={-11} />
      <Planter position={[-6.8, 0, 1.8]} width={0.7} />
      <FlowerPatch x={-7} z={3.5} />
      <FlowerPatch x={9} z={4.5} color="#cba9b4" />
      <FlowerPatch x={-10} z={4.8} color="#f3dab0" count={13} />
      <FlowerPatch x={11} z={7} count={13} />
      <FlowerPatch x={-3} z={-11} color="#efceaf" />
      <FlowerPatch x={3} z={-12} color="#c6afc5" />
      <GrassTufts />
      <Clouds />
      {/* Low hills extend the world while keeping the playable town completely level. */}
      {[
        [-24, -28, 11],
        [-8, -35, 13],
        [15, -34, 14],
        [33, -24, 11],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, -4, z]} scale={[s, 7, s * 0.8]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color={i % 2 ? "#a4ba92" : "#9eb38b"}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

export default function World({ zone }: { zone: Zone }) {
  return (
    <>
      <color attach="background" args={["#dce4cf"]} />
      <fog attach="fog" args={["#dce4cf", 42, 95]} />
      {zone === "plaza" ? (
        <Plaza />
      ) : zone === "cafe" ? (
        <CafeInterior />
      ) : (
        <GardenScene />
      )}
    </>
  );
}
