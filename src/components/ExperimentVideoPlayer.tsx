// src/components/ExperimentVideoPlayer.tsx
// Enhancement 5: Experiment Video Framework (Phase 1 & Phase 2 Ready)

import React, { useState } from 'react';
import './ExperimentVideoPlayer.css';

interface VideoPlayerProps {
  experimentNumber: number;
  title: string;
}

export default function ExperimentVideoPlayer({ experimentNumber, title }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const numStr = String(experimentNumber).padStart(2, '0');
  
  // Phase 2 video path convention (e.g. /videos/exp01.mp4)
  const videoSrc = `/videos/exp${numStr}.mp4`;

  return (
    <div className="exp-video-card" style={{ margin: '0 0 var(--space-6) 0' }}>
      <div className="exp-video-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🎬</span>
          <h3 className="exp-video-title">Video Introduction: {title}</h3>
        </div>
        <span className="badge badge-navy">2–3 min Explainer</span>
      </div>

      {!hasError ? (
        <div className="exp-video-wrapper">
          <video
            className="exp-video-element"
            src={videoSrc}
            controls
            controlsList="nodownload"
            preload="metadata"
            onError={() => setHasError(true)}
          >
            Your browser does not support embedded MP4 video playback.
          </video>
        </div>
      ) : (
        <div className="exp-video-placeholder">
          <div className="exp-video-placeholder-icon">🎥</div>
          <div className="exp-video-placeholder-title">Experiment introduction video coming soon</div>
          <p className="exp-video-placeholder-desc">
            A 2–3 minute animated explainer for Experiment {numStr} will be available here. Drop <code>exp{numStr}.mp4</code> into the project's <code>public/videos/</code> directory to enable playback automatically.
          </p>
        </div>
      )}
    </div>
  );
}
