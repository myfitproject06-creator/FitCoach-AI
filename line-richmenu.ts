import crypto from "crypto";
import sharp from "sharp";
import type { Express, Request, Response } from "express";

const LINE_API_BASE = "https://api.line.me/v2/bot";
const LINE_DATA_BASE = "https://api-data.line.me/v2/bot";

// Helper: Check ADMIN_KEY auth
export function verifyAdminAuth(req: Request): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    console.warn("ADMIN_KEY environment variable is not configured");
    return false;
  }

  const candidate =
    (req.headers["x-admin-key"] as string) ||
    (req.headers["authorization"] ? req.headers["authorization"].replace(/^Bearer\s+/i, "") : "") ||
    (req.query.key as string);

  if (!candidate) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(adminKey);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// CRC32 calculation for PNG chunk generation
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Generate a standalone 2500x1686 PNG image buffer in pure Node.js (zero C++ dependencies)
 * Features a 2x3 athletic grid with emerald/dark accents compliant with LINE Rich Menu specs.
 */
export async function generateDefaultRichMenuPng(): Promise<Buffer> {
  const width = 2500;
  const height = 1686;
  const tileW = 833;
  const tileH = 843;
  const tiles = [
    { x: 0, y: 0, title: "WORKOUT", subtitle: "โปรแกรมวันนี้", accent: "#22C55E" },
    { x: 833, y: 0, title: "NUTRITION", subtitle: "บันทึกอาหาร", accent: "#F59E0B" },
    { x: 1667, y: 0, title: "COACH", subtitle: "คุยกับ AI Coach", accent: "#60A5FA" },
    { x: 0, y: 843, title: "DISCIPLINE", subtitle: "เช็ควินัย + ตารางซ้อม", accent: "#A78BFA" },
    { x: 833, y: 843, title: "ADAPT", subtitle: "ปรับแผนวันนี้", accent: "#06B6D4" },
    { x: 1667, y: 843, title: "PROGRESS", subtitle: "สรุปผลการฝึก", accent: "#F472B6" },
  ];
  const rects = tiles.map((t) => `
    <rect x="${t.x + 8}" y="${t.y + 8}" width="${tileW - 16}" height="${tileH - 16}" rx="42" fill="#111827" stroke="#263244" stroke-width="4"/>
    <rect x="${t.x + 32}" y="${t.y + 32}" width="140" height="12" rx="6" fill="${t.accent}"/>
    <circle cx="${t.x + 90}" cy="${t.y + 130}" r="34" fill="${t.accent}" opacity="0.18" stroke="${t.accent}" stroke-width="3"/>
    <text x="${t.x + 150}" y="${t.y + 148}" font-family="Noto Sans, Noto Sans Thai, Arial" font-size="52" font-weight="800" fill="#F8FAFC">${t.title}</text>
    <text x="${t.x + 80}" y="${t.y + 255}" font-family="Noto Sans Thai, Noto Sans, Arial" font-size="40" font-weight="700" fill="#D1D5DB">${t.subtitle}</text>
    <text x="${t.x + 80}" y="${t.y + 330}" font-family="Noto Sans, Noto Sans Thai, Arial" font-size="28" fill="#6B7280">FITCOACH AI</text>
  `).join("\n");
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#070B14"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    ${rects}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Standard 6-Tile FitCoach Rich Menu Configuration (2500x1686)
 * Each button triggers message or postback action.
 */
export function getStandardRichMenuConfig() {
  return {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "FitCoach AI Rich Menu V2",
    chatBarText: "▲ เมนูหลัก FitCoach AI",
    areas: [
      // 1. Top Left: Workout Today (Postback)
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: {
          type: "postback",
          data: "action=workout_today",
          displayText: "ขอตารางซ้อมวันนี้หน่อยครับ",
        },
      },
      // 2. Top Mid: Food Logging (Postback)
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: {
          type: "postback",
          data: "action=log_food",
          displayText: "บันทึกอาหารวันนี้ให้หน่อยครับ",
        },
      },
      // 3. Top Right: 3-Month Plan (Postback)
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: {
          type: "postback",
          data: "action=plan_3months",
          displayText: "จัดแผน 3 เดือนหุ่น Tom Holland ให้หน่อยครับ",
        },
      },
      // 4. Bottom Left: Discipline & Check-in (Postback)
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: {
          type: "postback",
          data: "action=discipline_check",
          displayText: "เช็คสถานะวินัยและเวลานัดซ้อม",
        },
      },
      // 5. Bottom Mid: Adaptive Workout (Message)
      {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: {
          type: "message",
          text: "วันนี้รู้สึกเหนื่อยมาก ช่วยปรับแผนการฝึกให้เบาลงหน่อยครับ",
        },
      },
      // 6. Bottom Right: Weekly Report & Stats (Postback)
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: {
          type: "postback",
          data: "action=weekly_report",
          displayText: "สรุปผลการออกกำลังกายสัปดาห์นี้",
        },
      },
    ],
  };
}

export function registerLineRichMenuRoutes(app: Express) {
  // 1. Status & Info
  app.get("/api/admin/rich-menu/status", async (req: Request, res: Response) => {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing ADMIN_KEY" });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "LINE_CHANNEL_ACCESS_TOKEN not configured" });
    }

    try {
      // Fetch default rich menu ID
      let defaultMenuId: string | null = null;
      try {
        const defRes = await fetch(`${LINE_API_BASE}/user/all/richmenu`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (defRes.ok) {
          const defData = await defRes.json();
          defaultMenuId = defData.richMenuId || null;
        }
      } catch {}

      // Fetch all menus
      const listRes = await fetch(`${LINE_API_BASE}/richmenu/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = listRes.ok ? await listRes.json() : { richmenus: [] };

      return res.json({
        configured: true,
        defaultMenuId,
        menus: listData.richmenus || [],
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. Setup (Create -> Upload Image -> Set Default)
  // GET is intentionally supported so the admin can activate the Rich Menu
  // directly from a browser without Postman/terminal. ADMIN_KEY is still required.
  const setupRichMenu = async (req: Request, res: Response) => {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing ADMIN_KEY" });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "LINE_CHANNEL_ACCESS_TOKEN is not configured in environment" });
    }

    try {
      const menuConfig = req.body?.config || getStandardRichMenuConfig();

      // Step 1: Create Rich Menu structure on LINE
      const createRes = await fetch(`${LINE_API_BASE}/richmenu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(menuConfig),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("Failed to create rich menu on LINE:", createRes.status, errText);
        return res.status(createRes.status).json({
          error: "LINE API returned error during richmenu creation",
          details: errText,
        });
      }

      const { richMenuId } = await createRes.json();
      console.log("Created LINE Rich Menu with ID:", richMenuId);

      // Step 2: Prepare Image Buffer (base64 from client or server-side generated)
      let imageBuffer: Buffer;
      let contentType = "image/png";

      if (req.body?.imageBase64) {
        const cleanBase64 = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(cleanBase64, "base64");
      } else {
        imageBuffer = await generateDefaultRichMenuPng();
      }

      // Step 3: Upload Image to api-data.line.me
      const uploadRes = await fetch(`${LINE_DATA_BASE}/richmenu/${richMenuId}/content`, {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          Authorization: `Bearer ${token}`,
        },
        body: new Uint8Array(imageBuffer),
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.text();
        console.error("Failed to upload rich menu image:", uploadRes.status, uploadErr);
        return res.status(uploadRes.status).json({
          error: "LINE API image upload failed",
          richMenuId,
          details: uploadErr,
        });
      }

      console.log("Successfully uploaded image for Rich Menu:", richMenuId);

      // Step 4: Set as Default Rich Menu for all users
      const defaultRes = await fetch(`${LINE_API_BASE}/user/all/richmenu/${richMenuId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!defaultRes.ok) {
        const defaultErr = await defaultRes.text();
        console.error("Failed to set default rich menu:", defaultRes.status, defaultErr);
        return res.status(defaultRes.status).json({
          error: "Rich Menu created and uploaded, but failed to set as default",
          richMenuId,
          details: defaultErr,
        });
      }

      console.log("Successfully set Rich Menu as default for all users:", richMenuId);

      return res.json({
        success: true,
        message: "FitCoach Rich Menu created, uploaded, and set as default successfully! 🎉",
        richMenuId,
      });
    } catch (err: any) {
      console.error("Error setting up Rich Menu:", err);
      return res.status(500).json({ error: err.message });
    }
  };

  // Browser-friendly activation: GET /api/admin/rich-menu/setup?key=ADMIN_KEY
  app.get("/api/admin/rich-menu/setup", setupRichMenu);
  // Keep POST support for API clients.
  app.post("/api/admin/rich-menu/setup", setupRichMenu);

  // 3. Delete a Rich Menu
  app.delete("/api/admin/rich-menu/:id", async (req: Request, res: Response) => {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing ADMIN_KEY" });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: "LINE_CHANNEL_ACCESS_TOKEN not configured" });

    const menuId = req.params.id;
    try {
      const delRes = await fetch(`${LINE_API_BASE}/richmenu/${menuId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!delRes.ok) {
        return res.status(delRes.status).json({ error: await delRes.text() });
      }

      return res.json({ success: true, deleted: menuId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
