"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import GameUI from "./GameUI";
import Joystick from "./Joystick";
import {
  SPAWNS,
  nearestInteraction,
  type Zone,
  type PlayerSnapshot,
  type InputState,
} from "@/lib/world";
const GameCanvas = dynamic(() => import("./GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="loading-screen">
      <span className="loading-sprout">✳</span>
      <strong>작은 마을에 햇살을 들이는 중</strong>
      <span>잠시만 기다려 주세요</span>
    </div>
  ),
});
export default function Game() {
  const [zone, setZone] = useState<Zone>("plaza");
  const [nickname, setNickname] = useState("산책하는 감자");
  const [position, setPosition] = useState<PlayerSnapshot>({
    ...SPAWNS.plaza,
    rotation: 0,
    moving: false,
  });
  const [seated, setSeated] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [resetToken, setResetToken] = useState(0);
  const input = useRef<InputState>({ x: 0, y: 0 });
  const nearby = nearestInteraction(zone, position);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("yepjari-nickname");
      if (stored) setNickname(stored.slice(0, 12));
    } catch {
      /* Private browsing can disable storage. */
    }
  }, []);
  const changeNickname = useCallback((value: string) => {
    const next = value.trim().slice(0, 12) || "산책하는 감자";
    setNickname(next);
    try {
      localStorage.setItem("yepjari-nickname", next);
    } catch {
      /* Session nickname still works. */
    }
  }, []);
  const enterZone = useCallback((next: Zone) => {
    setSeated(false);
    setZone(next);
    setPosition({ ...SPAWNS[next], rotation: 0, moving: false });
    input.current = { x: 0, y: 0 };
    setResetToken((t) => t + 1);
  }, []);
  const interact = useCallback(() => {
    if (paused || boardOpen) return;
    if (seated) {
      setSeated(false);
      return;
    }
    if (!nearby) return;
    setVisited((v) => (v.includes(nearby.id) ? v : [...v, nearby.id]));
    if (nearby.id === "bench") setSeated(true);
    if (nearby.id === "board") setBoardOpen(true);
    if (nearby.id === "cafe") enterZone("cafe");
    if (nearby.id === "gate") enterZone("garden");
    if (nearby.id === "exit") enterZone("plaza");
  }, [paused, boardOpen, seated, nearby, enterZone]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'input,textarea,[role="dialog"],[contenteditable="true"]',
        )
      )
        return;
      if (e.code === "KeyE" && !e.repeat) {
        e.preventDefault();
        interact();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interact]);
  const reset = useCallback(() => {
    enterZone("plaza");
    setBoardOpen(false);
  }, [enterZone]);
  const enabled = !paused && !boardOpen;
  return (
    <div className="game-shell" data-zone={zone} data-testid="game-shell">
      <GameCanvas
        zone={zone}
        nickname={nickname}
        enabled={enabled}
        seated={seated}
        input={input}
        resetToken={resetToken}
        onUpdate={setPosition}
      />
      <GameUI
        nickname={nickname}
        zone={zone}
        position={position}
        nearby={nearby}
        seated={seated}
        visited={visited}
        onInteract={interact}
        onReset={reset}
        onNickname={changeNickname}
        onPause={setPaused}
        onCloseBoard={() => setBoardOpen(false)}
        boardOpen={boardOpen}
      />
      <Joystick input={input} disabled={!enabled || seated} />
      <output
        className="sr-only"
        data-testid="player-state"
        data-x={position.x.toFixed(3)}
        data-z={position.z.toFixed(3)}
        data-seated={seated}
        data-nearby={nearby?.id ?? ""}
        aria-live="off"
      >
        {nickname}, {zone},{" "}
        {seated ? "앉아 있음" : position.moving ? "걷는 중" : "쉬는 중"}
      </output>
    </div>
  );
}
