import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import EssaysPage from './pages/EssaysPage';
import BlogPage from './pages/BlogPage';
import ProjectsPage from './pages/ProjectsPage';
import PodcastPage from './pages/PodcastPage';
import PhilosophyPage from './pages/PhilosophyPage';
import MusicPage from './pages/MusicPage';
import ArtPage from './pages/ArtPage';
import WechatPage from './pages/WechatPage';
import AdminPage from './pages/AdminPage';
import ImportedPage from './pages/ImportedPage';
import './styles/globals.css';
import './styles/admin.css';

import { ThemeProvider } from '@/context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="essays" element={<EssaysPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="podcast" element={<PodcastPage />} />
          <Route path="philosophy" element={<PhilosophyPage />} />
          <Route path="music" element={<MusicPage />} />
          <Route path="art" element={<ArtPage />} />
          <Route path="wechat" element={<WechatPage />} />
          <Route path="imported" element={<ImportedPage />} />
          <Route path=":category/:slug" element={<ArticlePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
