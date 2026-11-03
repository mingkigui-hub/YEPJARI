"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  COLLIDERS,
  moveWithCollision,
  SPAWNS,
  type InputState,
  type PlayerSnapshot,
  type Zone,
} from "@/lib/world";

type Props = {
  zone: Zone;
  nickname: string;
  enabled: boolean;
  seated: boolean;
  input: RefObject<InputState>;
  resetToken: number;
  onUpdate: (snapshot: PlayerSnapshot) => void;
};

function NameTag({ nickname }: { nickname: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#fffdf3";
      context.beginPath();
      context.roundRect(6, 12, 500, 70, 35);
      context.fill();
      context.font = "600 31px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#3c5149";
      context.fillText(nickname, 256, 49, 450);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [nickname]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, 2.55, 0]} scale={[2.2, 0.42, 1]} renderOrder={10}>
      <spriteMaterial map={texture} depthTest={false} transparent />
    </sprite>
  );
}

export default function Player({
  zone,
  nickname,
  enabled,
  seated,
  input,
  resetToken,
  onUpdate,
}: Props) {
  const { camera, gl } = useThree();
  const root = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftCalf = useRef<THREE.Group>(null);
  const rightCalf = useRef<THREE.Group>(null);
  const position = useRef({ ...SPAWNS[zone] });
  const keys = useRef(new Set<string>());
  const orbit = useRef({ yaw: 0.45, pitch: 0.68, distance: 23 });
  const phase = useRef(0);
  const lastPublish = useRef(-1);
  const facing = useRef(0);
  const cameraSnap = useRef(true);
  const wasSeated = useRef(false);
  const targetVector = useMemo(() => new THREE.Vector3(), []);
  const desiredCamera = useMemo(() => new THREE.Vector3(), []);
  const smoothTarget = useRef(new THREE.Vector3());
  const avatarEye = useMemo(() => new THREE.Vector3(), []);
  const cameraRay = useMemo(() => new THREE.Ray(), []);
  const rayDirection = useMemo(() => new THREE.Vector3(), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const cameraSolids = useMemo(
    () =>
      COLLIDERS[zone].map((solid, index) => {
        const height =
          zone === "plaza"
            ? ([2.6, 5.6, 5.2, 2.85, 1.4][index] ?? 4.9)
            : zone === "cafe"
              ? index === 0
                ? 2.5
                : 1.35
              : index === 0
                ? 0.5
                : 1.4;
        return new THREE.Box3(
          new THREE.Vector3(
            solid.x - solid.hx - 0.12,
            0,
            solid.z - solid.hz - 0.12,
          ),
          new THREE.Vector3(
            solid.x + solid.hx + 0.12,
            height,
            solid.z + solid.hz + 0.12,
          ),
        );
      }),
    [zone],
  );
  const cameraObstruction = (point: THREE.Vector3) => {
    rayDirection.subVectors(point, avatarEye);
    const length = rayDirection.length();
    cameraRay.set(avatarEye, rayDirection.normalize());
    let nearest = Infinity;
    for (const solid of cameraSolids) {
      if (cameraRay.intersectBox(solid, hitPoint)) {
        const distance = hitPoint.distanceTo(avatarEye);
        if (distance > 0.01 && distance < length + 0.25)
          nearest = Math.min(nearest, distance);
      }
    }
    return nearest;
  };

  useEffect(() => {
    position.current = { ...SPAWNS[zone] };
    facing.current = 0;
    cameraSnap.current = true;
    keys.current.clear();
    wasSeated.current = false;
    input.current.x = 0;
    input.current.y = 0;
    orbit.current.distance = zone === "plaza" ? 23 : zone === "cafe" ? 13 : 18;
    lastPublish.current = -1;
  }, [zone, resetToken, input]);

  useEffect(() => {
    if (seated) {
      position.current =
        zone === "garden" ? { x: -4, z: 1.25 } : { x: -5, z: 2.25 };
      facing.current = 0;
    } else if (wasSeated.current) {
      position.current =
        zone === "garden" ? { x: -4, z: 2.25 } : { x: -5, z: 3.25 };
    }
    wasSeated.current = seated;
    lastPublish.current = -1;
  }, [seated, zone]);

  useEffect(() => {
    const clear = () => {
      keys.current.clear();
      input.current.x = 0;
      input.current.y = 0;
    };
    if (!enabled) clear();
    const supported = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowLeft",
      "ArrowDown",
      "ArrowRight",
      "ShiftLeft",
      "ShiftRight",
    ]);
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        !enabled ||
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      if (supported.has(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    };
    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [enabled, input]);

  useEffect(() => {
    const canvas = gl.domElement;
    let drag: { id: number; x: number; y: number } | null = null;
    const down = (event: PointerEvent) => {
      if (!enabled || event.button > 0 || drag) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      orbit.current.yaw -= (event.clientX - drag.x) * 0.006;
      orbit.current.pitch = THREE.MathUtils.clamp(
        orbit.current.pitch + (event.clientY - drag.y) * 0.004,
        0.48,
        1.15,
      );
      drag.x = event.clientX;
      drag.y = event.clientY;
    };
    const end = (event: PointerEvent) => {
      if (drag?.id !== event.pointerId) return;
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = "grab";
    };
    const wheel = (event: WheelEvent) => {
      if (!enabled) return;
      event.preventDefault();
      orbit.current.distance = THREE.MathUtils.clamp(
        orbit.current.distance + event.deltaY * 0.012,
        zone === "cafe" ? 8 : 12,
        zone === "plaza" ? 32 : 22,
      );
    };
    canvas.style.cursor = enabled ? "grab" : "default";
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("lostpointercapture", end);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
      canvas.removeEventListener("lostpointercapture", end);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [gl, enabled, zone]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    // Collision substeps permit real-time movement even on low frame-rate devices.
    const movementDt = Math.min(delta, 0.25);
    const active = enabled && !seated;
    const pressed = keys.current;
    let horizontal = active
      ? Number(pressed.has("KeyD") || pressed.has("ArrowRight")) -
        Number(pressed.has("KeyA") || pressed.has("ArrowLeft")) +
        input.current.x
      : 0;
    let vertical = active
      ? Number(pressed.has("KeyW") || pressed.has("ArrowUp")) -
        Number(pressed.has("KeyS") || pressed.has("ArrowDown")) +
        input.current.y
      : 0;
    const magnitude = Math.hypot(horizontal, vertical);
    if (magnitude > 1) {
      horizontal /= magnitude;
      vertical /= magnitude;
    }
    const { yaw, pitch, distance } = orbit.current;
    const speed =
      pressed.has("ShiftLeft") || pressed.has("ShiftRight") ? 6 : 3.8;
    const dx =
      (horizontal * Math.cos(yaw) - vertical * Math.sin(yaw)) *
      speed *
      movementDt;
    const dz =
      (-horizontal * Math.sin(yaw) - vertical * Math.cos(yaw)) *
      speed *
      movementDt;
    const previous = position.current;
    const next = active ? moveWithCollision(zone, previous, dx, dz) : previous;
    const moving =
      Math.hypot(next.x - previous.x, next.z - previous.z) > 0.0001;
    position.current = next;
    if (moving) facing.current = Math.atan2(dx, dz);
    if (root.current) {
      root.current.position.set(
        next.x,
        seated ? (zone === "garden" ? 0.13 : 0.1) : 0,
        next.z,
      );
      const angle = Math.atan2(
        Math.sin(facing.current - root.current.rotation.y),
        Math.cos(facing.current - root.current.rotation.y),
      );
      root.current.rotation.y += angle * (1 - Math.exp(-dt * 14));
    }
    phase.current += dt * (moving ? 10.5 : 2);
    const swing = moving
      ? Math.sin(phase.current) * 0.65
      : Math.sin(phase.current) * 0.035;
    if (rig.current)
      rig.current.position.y = seated
        ? 0
        : moving
          ? Math.abs(Math.sin(phase.current)) * 0.045
          : Math.sin(phase.current) * 0.018;
    if (leftArm.current) leftArm.current.rotation.x = seated ? -0.45 : swing;
    if (rightArm.current) rightArm.current.rotation.x = seated ? -0.45 : -swing;
    if (leftLeg.current)
      leftLeg.current.rotation.x = seated ? -Math.PI / 2 : -swing;
    if (rightLeg.current)
      rightLeg.current.rotation.x = seated ? -Math.PI / 2 : swing;
    if (leftCalf.current)
      leftCalf.current.rotation.x = seated ? Math.PI / 2 : 0.04;
    if (rightCalf.current)
      rightCalf.current.rotation.x = seated ? Math.PI / 2 : 0.04;
    // High, restrained orbit keeps the ground visible and the avatar in the lower third.
    targetVector.set(next.x, 0.7, next.z - (zone === "plaza" ? 2 : 0));
    desiredCamera.set(
      targetVector.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      targetVector.y + Math.sin(pitch) * distance,
      targetVector.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    avatarEye.set(next.x, seated ? 1.4 : 1.65, next.z);
    const obstruction = cameraObstruction(desiredCamera);
    if (Number.isFinite(obstruction)) {
      if (obstruction > 6) {
        // Pull the orbit in front of a distant wall instead of seeing through it.
        desiredCamera
          .sub(avatarEye)
          .setLength(Math.max(2, obstruction - 0.6))
          .add(avatarEye);
      } else {
        // Near a wall, lift and narrow the orbit until it can see the avatar.
        for (
          let attempt = 0;
          attempt < 14 && Number.isFinite(cameraObstruction(desiredCamera));
          attempt++
        ) {
          desiredCamera.x =
            avatarEye.x + (desiredCamera.x - avatarEye.x) * 0.77;
          desiredCamera.z =
            avatarEye.z + (desiredCamera.z - avatarEye.z) * 0.77;
          desiredCamera.y += 1.2;
        }
      }
    }
    if (cameraSnap.current) {
      camera.position.copy(desiredCamera);
      smoothTarget.current.copy(targetVector);
      cameraSnap.current = false;
    } else {
      const smoothing = 1 - Math.exp(-dt * 6);
      camera.position.lerp(desiredCamera, smoothing);
      if (Number.isFinite(cameraObstruction(camera.position)))
        camera.position.copy(desiredCamera);
      smoothTarget.current.lerp(targetVector, smoothing);
    }
    camera.lookAt(smoothTarget.current);
    if (
      clock.elapsedTime - lastPublish.current >= 0.1 ||
      lastPublish.current < 0
    ) {
      lastPublish.current = clock.elapsedTime;
      const snapshot = {
        x: next.x,
        z: next.z,
        rotation: facing.current,
        moving,
      };
      gl.domElement.dataset.position = JSON.stringify({
        x: +next.x.toFixed(3),
        z: +next.z.toFixed(3),
      });
      gl.domElement.dataset.rotation = String(facing.current);
      gl.domElement.dataset.moving = String(moving);
      gl.domElement.dataset.zone = zone;
      gl.domElement.dataset.seated = String(seated);
      gl.domElement.dataset.cameraPosition = JSON.stringify(
        camera.position.toArray().map((n) => +n.toFixed(3)),
      );
      gl.domElement.dataset.cameraTarget = JSON.stringify(
        smoothTarget.current.toArray().map((n) => +n.toFixed(3)),
      );
      gl.domElement.dataset.cameraYaw = String(yaw);
      onUpdate(snapshot);
    }
  });

  return (
    <group ref={root}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.43, 24]} />
        <meshBasicMaterial
          color="#475744"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
      <group ref={rig}>
        <group ref={leftLeg} position={[-0.17, 0.74, 0]}>
          <mesh position={[0, -0.17, 0]}>
            <boxGeometry args={[0.24, 0.34, 0.28]} />
            <meshStandardMaterial color="#d7c5a3" />
          </mesh>
          <group ref={leftCalf} position={[0, -0.34, 0]}>
            <mesh position={[0, -0.14, 0]}>
              <boxGeometry args={[0.21, 0.28, 0.25]} />
              <meshStandardMaterial color="#d7c5a3" />
            </mesh>
            <mesh position={[0, -0.27, 0.07]}>
              <boxGeometry args={[0.27, 0.18, 0.41]} />
              <meshStandardMaterial color="#9b7350" />
            </mesh>
          </group>
        </group>
        <group ref={rightLeg} position={[0.17, 0.74, 0]}>
          <mesh position={[0, -0.17, 0]}>
            <boxGeometry args={[0.24, 0.34, 0.28]} />
            <meshStandardMaterial color="#d7c5a3" />
          </mesh>
          <group ref={rightCalf} position={[0, -0.34, 0]}>
            <mesh position={[0, -0.14, 0]}>
              <boxGeometry args={[0.21, 0.28, 0.25]} />
              <meshStandardMaterial color="#d7c5a3" />
            </mesh>
            <mesh position={[0, -0.27, 0.07]}>
              <boxGeometry args={[0.27, 0.18, 0.41]} />
              <meshStandardMaterial color="#9b7350" />
            </mesh>
          </group>
        </group>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.67, 0.77, 0.42]} />
          <meshStandardMaterial color="#8ca68a" />
        </mesh>
        <mesh position={[0, 1.46, 0.04]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
          <meshStandardMaterial color="#f0c4a0" />
        </mesh>
        <group ref={leftArm} position={[-0.43, 1.36, 0]}>
          <mesh position={[0, -0.23, 0]}>
            <boxGeometry args={[0.23, 0.47, 0.29]} />
            <meshStandardMaterial color="#8ca68a" />
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <boxGeometry args={[0.2, 0.18, 0.22]} />
            <meshStandardMaterial color="#f0c4a0" />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.43, 1.36, 0]}>
          <mesh position={[0, -0.23, 0]}>
            <boxGeometry args={[0.23, 0.47, 0.29]} />
            <meshStandardMaterial color="#8ca68a" />
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <boxGeometry args={[0.2, 0.18, 0.22]} />
            <meshStandardMaterial color="#f0c4a0" />
          </mesh>
        </group>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.37, 12, 10]} />
          <meshStandardMaterial color="#f0c4a0" flatShading />
        </mesh>
        <mesh position={[0, 1.83, -0.08]}>
          <sphereGeometry args={[0.33, 12, 8]} />
          <meshStandardMaterial color="#624736" flatShading />
        </mesh>
        <mesh position={[0, 2.02, 0]}>
          <cylinderGeometry args={[0.33, 0.42, 0.38, 12]} />
          <meshStandardMaterial color="#ece2be" flatShading />
        </mesh>
        <mesh position={[0, 1.83, 0.02]}>
          <cylinderGeometry args={[0.5, 0.49, 0.055, 12]} />
          <meshStandardMaterial color="#e4d5ae" flatShading />
        </mesh>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 1.72, 0.334]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#493f35" />
          </mesh>
        ))}
        <mesh position={[0, 1.61, 0.343]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.009, 0.055, 3, 6]} />
          <meshStandardMaterial color="#ac705d" />
        </mesh>
        <mesh position={[0.35, 0.95, 0.25]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.29, 0.37, 0.18]} />
          <meshStandardMaterial color="#b37756" />
        </mesh>
        <mesh position={[0.08, 1.18, 0.23]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.065, 0.8, 0.035]} />
          <meshStandardMaterial color="#aa7352" />
        </mesh>
      </group>
      <NameTag nickname={nickname} />
    </group>
  );
}
