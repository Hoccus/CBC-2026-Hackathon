import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

async function readRawBody(req: NextApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function getSiteUrl() {
  const siteUrl =
    process.env.CONVEX_SITE_URL || process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (!siteUrl) {
    throw new Error("CONVEX_SITE_URL is not set");
  }
  return siteUrl;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const target = new URL(req.url || "/api/auth", getSiteUrl());
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }
      } else {
        headers.set(key, value);
      }
    }

    headers.delete("content-length");
    headers.set("accept-encoding", "identity");
    headers.set("host", new URL(getSiteUrl()).host);

    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (req.method && !["GET", "HEAD"].includes(req.method)) {
      const body = await readRawBody(req);
      if (body.length > 0) {
        init.body = body;
      }
    }

    const response = await fetch(target, init);

    res.status(response.status);
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];

    response.headers.forEach((value, key) => {
      if (
        key === "content-encoding" ||
        key === "transfer-encoding" ||
        key === "set-cookie"
      ) {
        return;
      }
      res.setHeader(key, value);
    });
    if (setCookies.length > 0) {
      res.setHeader("set-cookie", setCookies);
    }

    const body = Buffer.from(await response.arrayBuffer());
    res.send(body);
  } catch (error) {
    res.status(500).json({
      detail: error instanceof Error ? error.message : "Auth proxy failed",
    });
  }
}
