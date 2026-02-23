// Shared types for parsers  
  
export interface ParsedArticle {  
  title: string;  
  content: string;  
  author?: string;  
  date?: string;  
  publishDate?: string;  
  source: string;  
  sourceUrl: string;  
  coverImage?: string;  
  tags?: string[];  
} 
