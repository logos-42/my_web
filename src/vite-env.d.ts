/// <reference types="vite/client" />

interface ImportMeta {
  glob(pattern: string, options?: any): Record<string, () => Promise<any>>
  globEager(pattern: string, options?: any): Record<string, any>
}
