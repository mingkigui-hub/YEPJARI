"use client";
import { Canvas } from "@react-three/fiber";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  type RefObject,
} from "react";
import World from "./World";
import Player from "./Player";
import type { Zone, PlayerSnapshot, InputState } from "@/lib/world";
type Props = {
  zone: Zone;
  nickname: string;
  enabled: boolean;
  seated: boolean;
  input: RefObject<InputState>;
  resetToken: number;
  onUpdate: (s: PlayerSnapshot) => void;
};
class SceneBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("3D scene could not start", error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <div className="loading-screen">
        <strong>3D 화면을 열 수 없어요</strong>
        <p>WebGL을 지원하는 브라우저에서 하드웨어 가속을 켜 주세요.</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function GameCanvas(props: Props) {
  return (
    <SceneBoundary>
      <div
        className="game-canvas"
        aria-label="옆자리 3D 마을. WASD 또는 방향키로 이동, 화면을 드래그하여 시점 회전"
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [12, 18, 26], fov: 44, near: 0.1, far: 150 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
        >
          <hemisphereLight args={["#fff6dc", "#8d9c76", 2.2]} />
          <ambientLight intensity={0.45} />
          <directionalLight
            key={props.zone}
            shadow-autoUpdate={false}
            shadow-needsUpdate={true}
            position={[-12, 25, 12]}
            intensity={3}
            color="#fff0cd"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-27}
            shadow-camera-right={27}
            shadow-camera-top={27}
            shadow-camera-bottom={-27}
            shadow-camera-far={75}
            shadow-bias={-0.0005}
            shadow-normalBias={0.04}
          />
          <World zone={props.zone} />
          <Player {...props} />
        </Canvas>
      </div>
    </SceneBoundary>
  );
}
