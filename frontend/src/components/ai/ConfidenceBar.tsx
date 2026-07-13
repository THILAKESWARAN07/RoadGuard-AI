import React, { useEffect, useRef, useState } from 'react';

interface ConfidenceBarProps {
  confidence: number;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = Math.round(confidence * 100);

  useEffect(() => {
    // Animate the bar on mount
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getBarColor = () => {
    if (percentage >= 90) return '#73e19f';
    if (percentage >= 70) return '#f3b63f';
    if (percentage >= 50) return '#ff9c3c';
    return '#ff5252';
  };

  return (
    <div className="confidence-bar-container">
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{
            width: `${animatedWidth}%`,
            backgroundColor: getBarColor(),
          }}
        />
      </div>
      <span className="confidence-percentage">{percentage}%</span>
    </div>
  );
};
