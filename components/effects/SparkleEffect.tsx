import React from 'react';
import { useSparkles } from '../../contexts/SparkleContext';
import Sparkle from './Sparkle';

const SPARKLE_COUNT = 15;

const SparkleBurst: React.FC<{ x: number; y: number; onComplete: () => void }> = ({ x, y, onComplete }) => {
  // Use a timeout to remove the burst after the animation duration
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 1000); // Should match longest animation duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  const sparkles = Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
    <Sparkle key={i} />
  ));

  return (
    <div className="absolute" style={{ top: y, left: x }}>
      {sparkles}
    </div>
  );
};

const SparkleEffect: React.FC = () => {
  const { sparkles, removeSparkle } = useSparkles();

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]">
      {sparkles.map(({ id, x, y }) => (
        <SparkleBurst key={id} x={x} y={y} onComplete={() => removeSparkle(id)} />
      ))}
    </div>
  );
};

export default SparkleEffect;
