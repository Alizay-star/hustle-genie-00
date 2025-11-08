import React, { useMemo } from 'react';

const Sparkle: React.FC = () => {
  const style = useMemo(() => {
    const size = Math.random() * 25 + 10; // 10px to 35px
    const angleStart = Math.random() * 360;
    const angleEnd = angleStart + (Math.random() * 180 - 90); // Add a twist
    const distance = Math.random() * 200 + 75; // 75px to 275px
    const duration = Math.random() * 0.6 + 0.8; // 0.8s to 1.4s
    const delay = Math.random() * 0.3;

    return {
      '--size': `${size}px`,
      '--angle-start': `${angleStart}deg`,
      '--angle-end': `${angleEnd}deg`,
      '--distance': `${distance}px`,
      '--duration': `${duration}s`,
      '--delay': `${delay}s`,
    };
  }, []);

  return (
    <div
      className="absolute sparkle"
      style={style as React.CSSProperties}
    >
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.25L13.125 7.125L16.875 5.625L15.375 9.375L20.25 10.5L15.375 11.625L16.875 15.375L13.125 13.875L12 18.75L10.875 13.875L7.125 15.375L8.625 11.625L3.75 10.5L8.625 9.375L7.125 5.625L10.875 7.125L12 2.25Z" fill="var(--color-accent-primary)" />
        </svg>
    </div>
  );
};

export default Sparkle;