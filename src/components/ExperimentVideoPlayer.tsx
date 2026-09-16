import React, { useState, useEffect } from 'react';
import './ExperimentVideoPlayer.css';

interface VideoPlayerProps {
  experimentNumber: number;
  title: string;
}

export default function ExperimentVideoPlayer({ experimentNumber, title }: VideoPlayerProps) {
  const numStr = String(experimentNumber).padStart(2, '0');
  const num = experimentNumber;

  const candidateSources = [
    `/video/Vlab Exp${num}.mp4`,
    `/video/Vlab Exp${numStr}.mp4`,
    `/videos/Vlab Exp${num}.mp4`,
    `/videos/Vlab Exp${numStr}.mp4`,
    `/video/exp${numStr}.mp4`,
    `/videos/exp${numStr}.mp4`,
    `/video/exp${num}.mp4`,
    `/videos/exp${num}.mp4`,
  ];

  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setHasError(false);
  }, [experimentNumber]);

  const handleSourceError = () => {
    if (sourceIndex < candidateSources.length - 1) {
      setSourceIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="exp-video-card" style={{ margin: '0 0 var(--space-6) 0' }}>
      <div className="exp-video-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🎬</span>
          <h3 className="exp-video-title">Theory Video Explanation: {title}</h3>
        </div>
        <span className="badge badge-navy">Video Lesson</span>
      </div>

      {!hasError ? (
        <div className="exp-video-wrapper">
          <video
            key={candidateSources[sourceIndex]}
            className="exp-video-element"
            src={candidateSources[sourceIndex]}
            controls
            controlsList="nodownload"
            preload="metadata"
            onError={handleSourceError}
          >
            Your browser does not support embedded MP4 video playback.
          </video>
        </div>
      ) : (
        <div className="exp-video-placeholder">
          <div className="exp-video-placeholder-icon">🎥</div>
          <div className="exp-video-placeholder-title">Experiment explanation video coming soon</div>
          <p className="exp-video-placeholder-desc">
            An explainer video for Experiment {num} (<code>Vlab Exp{num}.mp4</code>) will be available here. Place the video file in the project's <code>video/</code> directory.
          </p>
        </div>
      )}
    </div>
  );
}
