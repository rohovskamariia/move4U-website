// Photo upload + serving routes
// POST /storage/uploads/request-url  — returns a presigned GCS URL for direct upload
// GET  /storage/objects/*             — serves uploaded files back to the browser

import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const RequestUploadUrlBody = z.object({
  name:        z.string().min(1),
  size:        z.number().int().positive(),
  contentType: z.string().min(1),
});

// ── POST /storage/uploads/request-url ────────────────────────
// Client sends JSON metadata (NOT the file).
// Server returns a presigned PUT URL + the objectPath to store.
// Client then PUTs the file directly to GCS via that URL.
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "name, size, and contentType are required" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;
    const uploadURL  = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("App Storage service suspended")) {
      res.status(503).json({ error: "Storage service unavailable — budget exceeded" });
      return;
    }
    console.error("Error generating upload URL", err);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// ── GET /storage/public-objects/* ────────────────────────────
// Serves public assets from PUBLIC_OBJECT_SEARCH_PATHS — no auth needed.
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) { res.status(404).json({ error: "File not found" }); return; }
    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("Error serving public object", err);
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

// ── GET /storage/objects/* ────────────────────────────────────
// Serves uploaded booking photos. Accessible to anyone with the UUID URL.
// No auth required — URLs contain a hard-to-guess UUID.
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response   = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    console.error("Error serving object", err);
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
