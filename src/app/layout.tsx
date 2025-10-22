import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '我的个人网站',
  description: '这里是我记录思考、分享知识的地方。在这里，你可以找到我关于技术、艺术、哲学等多个领域的思考和创作。',
  keywords: '个人网站,博客,技术,艺术,哲学',
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: '我的个人网站',
    description: '这里是我记录思考、分享知识的地方',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
