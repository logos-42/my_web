import axios from 'axios';
import { supabase } from './supabase.js';
import type { ParsedArticle } from './parsers.js';

export interface ManifestEntry {
  title: string;
  importedAt: string;
  path: string;
}

export interface Manifest {
  urls: Record<string, ManifestEntry>;
}

const API_BASE = 'https://api.github.com';

const REQUEST_DELAY_MS = 2000;

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

let cachedConfig: GitHubConfig | null = null;

export function initGitHubConfig(): GitHubConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
  const repoStr = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || '';
  const branch = process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || 'main';

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }

  if (!repoStr || !repoStr.includes('/')) {
    throw new Error('GITHUB_REPO environment variable must be in format owner/repo');
  }

  const [owner, repo] = repoStr.split('/');

  cachedConfig = { token, owner, repo, branch };
  return cachedConfig;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let lastRequestTime = 0;
async function delayBetweenRequests(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
}

async function githubApi<T = unknown>(
  path: string,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET',
  body?: object
): Promise<T> {
  const config = initGitHubConfig();
  const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;

  try {
    await delayBetweenRequests();
    
    const response = await axios<T>(url, {
      method,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      data: body,
      params: method === 'GET' ? { ref: config.branch } : undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        if (resetTime) {
          const resetDate = new Date(parseInt(String(resetTime)) * 1000);
          throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`);
        }
        throw new Error('GitHub API rate limit exceeded');
      }
      if (error.response?.status === 404) {
        throw new Error('File not found');
      }
      const message = (error.response?.data as { message?: string })?.message || error.message;
      throw new Error(`GitHub API error: ${message}`);
    }
    throw error;
  }
}

interface GitHubFileResponse {
  content: string;
  sha: string;
  encoding: string;
}

async function saveFile(
  path: string,
  content: string,
  message: string
): Promise<{ success: boolean; sha?: string; error?: string }> {
  const config = initGitHubConfig();
  const encodedContent = Buffer.from(content).toString('base64');

  try {
    let sha: string | undefined;
    try {
      const existing = await githubApi<GitHubFileResponse>(path, 'GET');
      sha = existing.sha;
    } catch {
      // File does not exist, will create new
    }

    const body: { message: string; content: string; branch: string; sha?: string } = {
      message,
      content: encodedContent,
      branch: config.branch,
    };

    if (sha) {
      body.sha = sha;
    }

    await githubApi(path, 'PUT', body);
    return { success: true, sha };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

async function getManifest(): Promise<Manifest> {
  const { data, error } = await supabase
    .from('imported_manifest')
    .select('data')
    .single();
  
  if (error || !data) {
    return { urls: {} };
  }
  return data.data as Manifest;
}

async function updateManifest(data: Manifest): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('imported_manifest')
    .upsert({ id: 'main', data }, { onConflict: 'id' });
  
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export function generateFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const date = new Date();
  const datePrefix = date.toISOString().split('T')[0];

  return `${datePrefix}-${slug || 'untitled'}.md`;
}

export async function isUrlImported(url: string): Promise<boolean> {
  try {
    const manifest = await getManifest();
    return url in manifest.urls;
  } catch {
    return false;
  }
}

export async function getImportedUrls(): Promise<Record<string, ManifestEntry>> {
  try {
    const manifest = await getManifest();
    return manifest.urls;
  } catch {
    return {};
  }
}

interface SaveResult {
  success: boolean;
  path?: string;
  error?: string;
}

function generateFrontmatter(article: ParsedArticle): string {
  const date = article.publishDate || new Date().toISOString().split('T')[0];
  let frontmatter = `---
title: "${article.title.replace(/"/g, '\\"')}"
date: "${date}"
source: "${article.source}"
url: "${article.sourceUrl}"
`;
  if (article.author) {
    frontmatter += `author: "${article.author.replace(/"/g, '\\"')}"\n`;
  }
  if (article.coverImage) {
    frontmatter += `cover: "${article.coverImage}"\n`;
  }
  if (article.tags && article.tags.length > 0) {
    frontmatter += `tags: ${JSON.stringify(article.tags)}\n`;
  }
  frontmatter += `---\n`;
  return frontmatter;
}

export async function saveArticle(article: ParsedArticle, category: string): Promise<SaveResult> {
  try {
    const fileName = generateFileName(article.title);
    const path = `src/content/${category}/${fileName}`;
    const frontmatter = generateFrontmatter(article);
    const content = `${frontmatter}\n${article.content}`;

    const result = await saveFile(path, content, `导入文章: ${article.title}`);
    
    if (result.success) {
      const manifest = await getManifest();
      manifest.urls[article.sourceUrl] = {
        title: article.title,
        importedAt: new Date().toISOString(),
        path
      };
      await updateManifest(manifest);
      
      return { success: true, path };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
