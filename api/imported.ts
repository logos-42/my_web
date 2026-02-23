import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { getImportedUrls } from "./lib/github";

async function verifyGitHubToken(token: string): Promise<{ login: string; id: number } | null> {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return { login: response.data.login, id: response.data.id };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未授权" });
  }

  const token = authHeader.substring(7);
  
  // Verify GitHub OAuth token
  const user = await verifyGitHubToken(token);
  if (!user) {
    return res.status(401).json({ error: "无效的 token" });
  }

  // Verify user is admin
  const adminGithubId = process.env.ADMIN_GITHUB_ID;
  if (user.login !== adminGithubId) {
    return res.status(403).json({ error: "无权限" });
  }

  try {
    const urls = await getImportedUrls();
    return res.status(200).json({ urls });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}