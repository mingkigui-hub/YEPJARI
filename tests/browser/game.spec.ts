import { test, expect, type Page } from "@playwright/test";

type Point = { x: number; z: number };
const state = (page: Page) =>
  page.locator("canvas").evaluate((el) => ({
    ...JSON.parse(el.dataset.position || '{"x":0,"z":0}'),
    yaw: Number(el.dataset.cameraYaw || ".45"),
  })) as Promise<Point & { yaw: number }>;
async function ready(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toHaveAttribute("data-position", /x/, {
    timeout: 60000,
  });
  await expect(page.getByTestId("game-shell")).toHaveAttribute(
    "data-zone",
    "plaza",
  );
}
async function walkTo(page: Page, target: Point, tolerance = 0.55) {
  const held = new Set<string>();
  const deadline = Date.now() + 35000;
  try {
    while (Date.now() < deadline) {
      const p = await state(page);
      const dx = target.x - p.x,
        dz = target.z - p.z;
      if (Math.hypot(dx, dz) < tolerance) return;
      const h = dx * Math.cos(p.yaw) - dz * Math.sin(p.yaw),
        v = -dx * Math.sin(p.yaw) - dz * Math.cos(p.yaw);
      const max = Math.max(Math.abs(h), Math.abs(v));
      const next = new Set<string>();
      if (Math.abs(h) > max * 0.4) next.add(h > 0 ? "KeyD" : "KeyA");
      if (Math.abs(v) > max * 0.4) next.add(v > 0 ? "KeyW" : "KeyS");
      for (const key of held)
        if (!next.has(key)) {
          await page.keyboard.up(key);
          held.delete(key);
        }
      for (const key of next)
        if (!held.has(key)) {
          await page.keyboard.down(key);
          held.add(key);
        }
      await page.waitForTimeout(130);
    }
    throw new Error(
      `Could not walk to ${JSON.stringify(target)}; stopped at ${JSON.stringify(await state(page))}`,
    );
  } finally {
    for (const key of held) await page.keyboard.up(key);
  }
}
async function moveFor(page: Page, key: string, duration: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(250);
}

test("desktop: keyboard movement, camera orbit and collision", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  const initial = await state(page);
  await page.keyboard.down("ArrowRight");
  try {
    await expect
      .poll(
        async () => {
          const current = await state(page);
          return Math.hypot(current.x - initial.x, current.z - initial.z);
        },
        { timeout: 30000 },
      )
      .toBeGreaterThan(0.3);
  } finally {
    await page.keyboard.up("ArrowRight");
  }
  await expect(page.locator("canvas")).toHaveAttribute("data-moving", "false");
  const stopped = await state(page);
  await page.waitForTimeout(350);
  const idle = await state(page);
  expect(Math.hypot(idle.x - stopped.x, idle.z - stopped.z)).toBeLessThan(0.05);
  await moveFor(page, "KeyA", 300);
  const canvas = page.locator("canvas");
  const rect = await canvas.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.width * 0.6, rect!.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(rect!.width * 0.6 + 100, rect!.height * 0.55 + 20, {
    steps: 10,
  });
  await page.mouse.up();
  await expect
    .poll(async () => Math.abs((await state(page)).yaw - initial.yaw))
    .toBeGreaterThan(0.3);
  // Approach the fountain from south; its solid bowl must stop the avatar.
  await walkTo(page, { x: 0, z: 4 });
  const p = await state(page);
  const yaw = p.yaw;
  const forwardKeys = [Math.cos(yaw) > 0 ? "KeyW" : "KeyS"];
  if (Math.abs(Math.sin(yaw)) > 0.4)
    forwardKeys.push(Math.sin(yaw) > 0 ? "KeyD" : "KeyA");
  for (const key of forwardKeys) await page.keyboard.down(key);
  await expect.poll(async () => (await state(page)).z).toBeLessThan(2.9);
  await page.waitForTimeout(500);
  for (const key of forwardKeys) await page.keyboard.up(key);
  const near = await state(page);
  expect(near.z).toBeGreaterThanOrEqual(2.6);
  expect(errors).toEqual([]);
});

test("desktop: walk to bench, board, cafe and garden with real interactions", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  // Use the real drag control to align the camera with map north for repeatable routes.
  const orbit = await state(page);
  await page.mouse.move(480, 360);
  await page.mouse.down();
  await page.mouse.move(480 + orbit.yaw / 0.006, 360, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => Math.abs((await state(page)).yaw))
    .toBeLessThan(0.02);
  await walkTo(page, { x: -5, z: 5 });
  await expect(page.getByTestId("player-state")).toHaveAttribute(
    "data-nearby",
    "bench",
  );
  await page.keyboard.press("KeyE");
  await expect(page.getByTestId("player-state")).toHaveAttribute(
    "data-seated",
    "true",
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-seated", "true");
  const seatedPosition = await state(page);
  await page.keyboard.press("KeyW");
  await page.waitForTimeout(250);
  const stillSeated = await state(page);
  expect(
    Math.hypot(
      stillSeated.x - seatedPosition.x,
      stillSeated.z - seatedPosition.z,
    ),
  ).toBeLessThan(0.05);
  await page.getByTestId("interaction-button").click();
  await expect(page.getByTestId("player-state")).toHaveAttribute(
    "data-seated",
    "false",
  );
  await walkTo(page, { x: 0, z: 6 });
  await walkTo(page, { x: 7, z: 5 });
  await expect(page.getByTestId("player-state")).toHaveAttribute(
    "data-nearby",
    "board",
  );
  await page.keyboard.press("KeyE");
  const board = page.getByRole("dialog", { name: "마을 게시판" });
  await expect(board).toBeVisible();
  const paused = await state(page);
  await moveFor(page, "KeyW", 300);
  const after = await state(page);
  expect(Math.hypot(paused.x - after.x, paused.z - after.z)).toBeLessThan(0.05);
  const field = board.locator("textarea");
  await field.fill("브라우저 테스트에서 남긴 따뜻한 인사");
  await board.getByRole("button", { name: "메모 붙이기" }).click();
  await expect(
    board.getByText("브라우저 테스트에서 남긴 따뜻한 인사"),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("yepjari.notes.v1") || "[]").some(
        (note: { text: string }) =>
          note.text === "브라우저 테스트에서 남긴 따뜻한 인사",
      ),
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(board).not.toBeVisible();
  await walkTo(page, { x: -8, z: 6 });
  await walkTo(page, { x: -8, z: -1 });
  await expect(page.getByTestId("player-state")).toHaveAttribute(
    "data-nearby",
    "cafe",
  );
  await page.getByTestId("interaction-button").click();
  await expect(page.getByTestId("game-shell")).toHaveAttribute(
    "data-zone",
    "cafe",
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-zone", "cafe");
  await expect(page.getByTestId("interaction-button")).toBeVisible();
  await page.getByTestId("interaction-button").click();
  await expect(page.getByTestId("game-shell")).toHaveAttribute(
    "data-zone",
    "plaza",
  );
  await walkTo(page, { x: 3.6, z: 7 });
  await walkTo(page, { x: 3.6, z: -9 });
  await walkTo(page, { x: 0, z: -10 });
  await walkTo(page, { x: 0, z: -11.5 });
  await expect(page.getByTestId("player-state")).toHaveAttribute(
    "data-nearby",
    "gate",
  );
  await page.keyboard.press("KeyE");
  await expect(page.getByTestId("game-shell")).toHaveAttribute(
    "data-zone",
    "garden",
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-zone", "garden");
  await page.getByTestId("interaction-button").click();
  await expect(page.getByTestId("game-shell")).toHaveAttribute(
    "data-zone",
    "plaza",
  );
  expect(errors).toEqual([]);
});

test("mobile: joystick movement, touch camera and responsive layout", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const joystick = page.getByTestId("joystick");
  await expect(joystick).toBeVisible();
  const rect = await joystick.boundingBox();
  expect(rect).not.toBeNull();
  const x = rect!.x + rect!.width / 2,
    y = rect!.y + rect!.height / 2;
  const start = await state(page);
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 35, y: y - 20 }],
  });
  await expect
    .poll(
      async () => {
        const current = await state(page);
        return Math.hypot(current.x - start.x, current.z - start.z);
      },
      { timeout: 30000 },
    )
    .toBeGreaterThan(0.3);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-moving", "false");
  const moved = await state(page);
  expect(Math.hypot(moved.x - start.x, moved.z - start.z)).toBeGreaterThan(0.2);
  await page.waitForTimeout(250);
  const stopped = await state(page);
  expect(Math.hypot(stopped.x - moved.x, stopped.z - moved.z)).toBeLessThan(
    0.05,
  );
  const oldYaw = moved.yaw;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 220, y: 400 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 300, y: 430 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () => Math.abs((await state(page)).yaw - oldYaw))
    .toBeGreaterThan(0.2);
  expect(errors).toEqual([]);
  await client.detach();
});
