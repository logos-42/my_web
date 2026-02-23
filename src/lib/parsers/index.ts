import { parseWechat } from './wechat';
import { parseZhihu } from './zhihu';
import { parseParagraph } from './paragraph';
import { parseSubstack } from './substack';

export interface ParsedArticle {
  title: string;
  content: string;
  author?: string;
  publishDate?: string;
  source: string;
  sourceUrl: string;
  coverImage?: string;
  tags?: string[];
}

export interface Parser {
  name: string;
  patterns: RegExp[];
  parse: (url: string) => Promise<ParsedArticle>;
}

const parsers: Parser[] = [
  { name: 'wechat', patterns: [/mp\.weixin\.qq\.com\/s\//], parse: parseWechat },
  { name: 'zhihu', patterns: [/zhuanlan\.zhihu\.com\/p\//], parse: parseZhihu },
  { name: 'paragraph', patterns: [/paragraph\.xyz\/@/], parse: parseParagraph },
  { name: 'substack', patterns: [/\.substack\.com\/p\//], parse: parseSubstack },
];

export function detectPlatform(url: string): Parser | null {
  for (const parser of parsers) {
    for (const pattern of parser.patterns) {
      if (pattern.test(url)) {
        return parser;
      }
    }
  }
  return null;
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const parser = detectPlatform(url);
  if (!parser) {
    throw new Error(`不支持的平台: ${url}`);
  }
  return parser.parse(url);
}

export { parseWechat, parseZhihu, parseParagraph, parseSubstack };
