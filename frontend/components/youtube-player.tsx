"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: Record<string, (event?: unknown) => void>;
        },
      ) => YouTubePlayerInstance;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YouTubePlayerHandle = {
  play: () => void;
  pause: () => void;
  getCurrentTimeMs: () => number;
  seekToMs: (ms: number) => void;
};

type YouTubePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  loadVideoById: (videoId: string) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
};


function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
    window.onYouTubeIframeAPIReady = () => resolve();
  });
}


export const YouTubePlayer = ({
  videoId,
  currentTimeMs,
  onCurrentTimeChange,
  playerRef,
}: {
  videoId: string | null;
  currentTimeMs: number;
  onCurrentTimeChange: (timeMs: number) => void;
  playerRef: React.RefObject<YouTubePlayerHandle | null>;
}) => {
  const hostId = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const internalPlayer = useRef<YouTubePlayerInstance | null>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    playerRef,
    () => ({
      play: () => internalPlayer.current?.playVideo(),
      pause: () => internalPlayer.current?.pauseVideo(),
      getCurrentTimeMs: () => Math.round((internalPlayer.current?.getCurrentTime() || 0) * 1000),
      seekToMs: (ms: number) => internalPlayer.current?.seekTo(ms / 1000, true),
    }),
    [],
  );

  useEffect(() => {
    let interval: number | undefined;

    loadYouTubeApi().then(() => {
      if (!window.YT || !videoId) return;
      if (internalPlayer.current) {
        internalPlayer.current.loadVideoById(videoId);
        setReady(true);
        return;
      }
      internalPlayer.current = new window.YT.Player(hostId.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => setReady(true),
        },
      });
      interval = window.setInterval(() => {
        if (!internalPlayer.current) return;
        onCurrentTimeChange(Math.round(internalPlayer.current.getCurrentTime() * 1000));
      }, 150);
    });

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [videoId, onCurrentTimeChange]);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-slate-950/95">
      {videoId ? (
        <div id={hostId.current} className="aspect-video w-full" />
      ) : (
        <div className="flex aspect-video items-center justify-center text-sm text-white/70">
          Paste a YouTube link to load the player
        </div>
      )}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
        <span>Live player time</span>
        <span>{ready ? `${(currentTimeMs / 1000).toFixed(3)}s` : "Loading player..."}</span>
      </div>
    </div>
  );
};

