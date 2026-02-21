import { useState } from 'react';

interface Podcast {
  id: string;
  title: string;
  description: string;
  duration: string;
  date: string;
  audioUrl?: string;
}

export default function PodcastPage() {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const podcasts: Podcast[] = [
    {
      id: '1',
      title: '第一期：开篇介绍',
      description: '这是我的第一期播客节目，带你了解我的创作理念和未来计划。',
      duration: '15:30',
      date: '2025-01-15',
    },
    {
      id: '2',
      title: '第二期：技术分享',
      description: '本期聊聊最近在技术领域的探索和思考。',
      duration: '22:45',
      date: '2025-01-22',
    },
    {
      id: '3',
      title: '第三期：艺术与创作',
      description: '探讨艺术创作背后的故事和灵感来源。',
      duration: '18:20',
      date: '2025-01-29',
    },
  ];

  const handlePlay = (id: string) => {
    setCurrentPlaying(currentPlaying === id ? null : id);
  };

  return (
    <>
      <h1>播客</h1>
      <p className="intro">
        这里是我的播客节目，记录我的思考、分享和讨论。
      </p>

      <div className="podcast-list">
        {podcasts.map((podcast) => (
          <div key={podcast.id} className="podcast-item">
            <div className="podcast-info">
              <h3 className="podcast-title">{podcast.title}</h3>
              <p className="podcast-description">{podcast.description}</p>
              <div className="podcast-meta">
                <span className="podcast-date">{podcast.date}</span>
                <span className="podcast-duration">时长: {podcast.duration}</span>
              </div>
            </div>
            <button
              className={`podcast-play-btn ${currentPlaying === podcast.id ? 'playing' : ''}`}
              onClick={() => handlePlay(podcast.id)}
            >
              {currentPlaying === podcast.id ? '⏸' : '▶'}
            </button>
          </div>
        ))}
      </div>

      {currentPlaying && (
        <div className="podcast-player">
          <audio controls autoPlay>
            <source src="" type="audio/mpeg" />
            您的浏览器不支持音频播放
          </audio>
        </div>
      )}
    </>
  );
}
