"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";
import type { InputState } from "@/lib/world";

type Props = { input: RefObject<InputState>; disabled: boolean };

/** x: right positive; y: up positive, in camera-relative screen space. */
export default function Joystick({ input, disabled }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reset = () => {
    input.current.x = 0;
    input.current.y = 0;
    pointer.current = null;
    setOffset({ x: 0, y: 0 });
  };
  useEffect(() => {
    if (disabled) reset();
    const clear = () => reset();
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      input.current.x = 0;
      input.current.y = 0;
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
    // Reset only when the input ref or availability changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, input]);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerId !== pointer.current || !area.current)
      return;
    const rect = area.current.getBoundingClientRect();
    const max = rect.width * 0.29;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(dx, dy);
    const factor = length > max ? max / length : 1;
    const x = dx * factor;
    const y = dy * factor;
    const deadzone = length < 5;
    input.current.x = deadzone ? 0 : x / max;
    input.current.y = deadzone ? 0 : -y / max;
    setOffset({ x, y });
  };
  return (
    <div className="joystick-wrap">
      <div
        ref={area}
        className={`joystick${disabled ? " is-disabled" : ""}`}
        aria-label="이동 조이스틱"
        role="group"
        data-testid="joystick"
        style={{
          touchAction: "none",
          position: "relative",
          width: 112,
          height: 112,
          borderRadius: "50%",
        }}
        onPointerDown={(event) => {
          if (disabled || pointer.current !== null) return;
          event.preventDefault();
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event);
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          if (pointer.current !== event.pointerId) return;
          reset();
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
      >
        <span className="joystick-guide" aria-hidden="true">
          ⌃
        </span>
        <div
          className="joystick-knob"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        />
      </div>
      <span className="joystick-label">이동</span>
    </div>
  );
}
