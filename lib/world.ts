export type Zone = "plaza" | "cafe" | "garden";
export type Vec2 = { x: number; z: number };
export type Collider = Vec2 & { hx: number; hz: number };
export type InteractionId = "bench" | "board" | "cafe" | "gate" | "exit";
export type Interaction = Vec2 & {
  id: InteractionId;
  label: string;
  hint: string;
  radius: number;
};
export type PlayerSnapshot = Vec2 & { rotation: number; moving: boolean };
export type InputState = { x: number; y: number };
export const ZONE_NAMES: Record<Zone, string> = {
  plaza: "느티나무 광장",
  cafe: "카페, 오후",
  garden: "바람의 정원",
};
export const SPAWNS: Record<Zone, Vec2> = {
  plaza: { x: 0, z: 8 },
  cafe: { x: 0, z: 3 },
  garden: { x: 0, z: 5 },
};
export const TREES: Vec2[] = [
  { x: -15, z: -10 },
  { x: -12, z: 2 },
  { x: -16, z: 8 },
  { x: 12, z: -12 },
  { x: 15, z: 0 },
  { x: 14, z: 8 },
  { x: -3, z: -14 },
  { x: 7, z: -15 },
  { x: -15, z: -3 },
  { x: 16, z: -7 },
];
export const COLLIDERS: Record<Zone, Collider[]> = {
  plaza: [
    { x: 0, z: 0, hx: 2.3, hz: 2.3 },
    { x: -8, z: -6, hx: 3.7, hz: 2.8 },
    { x: 8, z: -8, hx: 3.1, hz: 2.6 },
    { x: 7, z: 3, hx: 1.65, hz: 0.55 },
    { x: -5, z: 2, hx: 1.5, hz: 0.4 },
    ...TREES.map((p) => ({ ...p, hx: 0.5, hz: 0.5 })),
    // Lamp posts, awning supports, gate pillars and planters are solid too.
    ...[
      { x: -4.2, z: 6.5 },
      { x: 6.4, z: -1.2 },
      { x: -4, z: -11 },
      { x: 4.2, z: -11 },
    ].map((p) => ({ ...p, hx: 0.22, hz: 0.22 })),
    ...[
      { x: -11.05, z: -2.5 },
      { x: -4.95, z: -2.5 },
    ].map((p) => ({ ...p, hx: 0.1, hz: 0.1 })),
    ...[
      { x: -1.9, z: -13 },
      { x: 1.9, z: -13 },
    ].map((p) => ({ ...p, hx: 0.2, hz: 0.2 })),
    { x: 5.4, z: -4.9, hx: 0.9, hz: 0.3 },
    { x: 10.6, z: -4.9, hx: 0.9, hz: 0.3 },
    { x: -6.8, z: 1.8, hx: 0.4, hz: 0.3 },
    { x: -3.85, z: -3.1, hx: 0.4, hz: 0.32 },
    // The entrance through the north fence remains open.
    { x: -10, z: -13, hx: 4.6, hz: 0.12 },
    { x: 11, z: -15, hx: 4.1, hz: 0.12 },
  ],
  cafe: [
    { x: 0, z: -3, hx: 4.6, hz: 0.7 },
    { x: -2.4, z: 0, hx: 1, hz: 1 },
    { x: 2.4, z: 0, hx: 1, hz: 1 },
    { x: -5, z: 3.4, hx: 0.42, hz: 0.42 },
    { x: 4.65, z: -4.5, hx: 0.48, hz: 0.48 },
  ],
  garden: [
    { x: 0, z: -1, hx: 2.25, hz: 1.8 },
    { x: -4, z: 1, hx: 1.5, hz: 0.4 },
    ...[
      { x: -9, z: -5 },
      { x: -7, z: -9 },
      { x: 0, z: -10 },
      { x: 8, z: -8 },
      { x: 10, z: -1 },
      { x: 9, z: 6 },
      { x: -10, z: 4 },
    ].map((p) => ({ ...p, hx: 0.45, hz: 0.45 })),
    { x: -1.8, z: 7.3, hx: 0.15, hz: 0.15 },
    { x: 1.8, z: 7.3, hx: 0.15, hz: 0.15 },
    { x: 6, z: -3, hx: 0.12, hz: 0.12 },
  ],
};
export const INTERACTIONS: Record<Zone, Interaction[]> = {
  plaza: [
    {
      id: "bench",
      x: -5,
      z: 3.3,
      label: "벤치에 앉기",
      hint: "잠깐, 쉬어가도 좋아요",
      radius: 2.2,
    },
    {
      id: "board",
      x: 7,
      z: 4.2,
      label: "마을 게시판",
      hint: "이웃들의 이야기가 모이는 곳",
      radius: 2.4,
    },
    {
      id: "cafe",
      x: -8,
      z: -2.3,
      label: "카페 들어가기",
      hint: "따뜻한 오후 한 잔",
      radius: 2.5,
    },
    {
      id: "gate",
      x: 0,
      z: -13,
      label: "정원으로 가기",
      hint: "새로운 풍경을 만나보세요",
      radius: 2.7,
    },
  ],
  cafe: [
    {
      id: "exit",
      x: 0,
      z: 4.5,
      label: "광장으로 돌아가기",
      hint: "다시 마을 산책",
      radius: 2.4,
    },
  ],
  garden: [
    {
      id: "exit",
      x: 0,
      z: 6.4,
      label: "광장으로 돌아가기",
      hint: "다시 마을 산책",
      radius: 2.4,
    },
    {
      id: "bench",
      x: -4,
      z: 2.3,
      label: "벤치에 앉기",
      hint: "바람 소리에 귀 기울여요",
      radius: 2.2,
    },
  ],
};
export const BOUNDS: Record<Zone, number> = { plaza: 17, cafe: 5.5, garden: 9 };
export function nearestInteraction(
  zone: Zone,
  position: Vec2,
): Interaction | null {
  let closest: Interaction | null = null;
  let best = Infinity;
  for (const item of INTERACTIONS[zone]) {
    const distance = Math.hypot(position.x - item.x, position.z - item.z);
    if (distance < item.radius && distance < best) {
      closest = item;
      best = distance;
    }
  }
  return closest;
}
export function canOccupy(
  zone: Zone,
  x: number,
  z: number,
  radius = 0.32,
): boolean {
  const bound = BOUNDS[zone] - radius;
  if (Math.abs(x) > bound || Math.abs(z) > bound) return false;
  return !COLLIDERS[zone].some(
    (c) =>
      Math.abs(x - c.x) < c.hx + radius && Math.abs(z - c.z) < c.hz + radius,
  );
}
export function moveWithCollision(
  zone: Zone,
  p: Vec2,
  dx: number,
  dz: number,
): Vec2 {
  // Substeps avoid tunnelling through thin props after a slow frame.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
  let { x, z } = p;
  for (let i = 0; i < steps; i++) {
    if (canOccupy(zone, x + dx / steps, z)) x += dx / steps;
    if (canOccupy(zone, x, z + dz / steps)) z += dz / steps;
  }
  return { x, z };
}
