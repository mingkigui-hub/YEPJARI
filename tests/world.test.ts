import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canOccupy,
  moveWithCollision,
  nearestInteraction,
  SPAWNS,
  COLLIDERS,
  INTERACTIONS,
  type Zone,
} from "../lib/world";
test("all zone spawns are walkable with return interactions", () => {
  for (const zone of ["plaza", "cafe", "garden"] as Zone[]) {
    assert.ok(canOccupy(zone, SPAWNS[zone].x, SPAWNS[zone].z), zone);
    assert.ok(INTERACTIONS[zone].length);
  }
});
test("movement stops at fountain and slides along a wall", () => {
  const result = moveWithCollision("plaza", { x: 0, z: 5 }, 0, -10);
  assert.ok(result.z >= 2.62);
  const slide = moveWithCollision("plaza", { x: 2.7, z: 0 }, -1, 1);
  assert.ok(slide.x >= 2.62);
  assert.ok(slide.z > 0.9);
});
test("large movement cannot tunnel through props or escape boundary", () => {
  const result = moveWithCollision("plaza", { x: 7, z: 6 }, 0, -10);
  assert.ok(result.z >= 3.87);
  const edge = moveWithCollision("plaza", { x: 16, z: 10 }, 100, 0);
  assert.ok(edge.x <= 16.68);
});
test("proximity gates each interaction and selects closest target", () => {
  assert.equal(nearestInteraction("plaza", { x: 0, z: 8 }), null);
  assert.equal(nearestInteraction("plaza", { x: -5, z: 3.4 })?.id, "bench");
  assert.equal(nearestInteraction("plaza", { x: 7, z: 4.4 })?.id, "board");
  assert.equal(nearestInteraction("plaza", { x: -8, z: -2.3 })?.id, "cafe");
});
test("all interactables are reachable from walkable approach points", () => {
  for (const zone of ["plaza", "cafe", "garden"] as Zone[]) {
    for (const item of INTERACTIONS[zone]) {
      let reachable = false;
      for (let x = item.x - item.radius; x < item.x + item.radius; x += 0.2) {
        for (let z = item.z - item.radius; z < item.z + item.radius; z += 0.2) {
          if (
            Math.hypot(x - item.x, z - item.z) < item.radius &&
            canOccupy(zone, x, z)
          )
            reachable = true;
        }
      }
      assert.ok(reachable, `${zone}/${item.id}`);
    }
    assert.ok(COLLIDERS[zone].length);
  }
});
