import React, { createContext, useState, useCallback, useContext } from 'react';

interface SparkleBurst {
  id: string;
  x: number;
  y: number;
}

interface SparkleContextType {
  showSparkles: (position: { x: number; y: number }) => void;
  sparkles: SparkleBurst[];
  removeSparkle: (id: string) => void;
}

const SparkleContext = createContext<SparkleContextType | undefined>(undefined);

export const SparkleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sparkles, setSparkles] = useState<SparkleBurst[]>([]);

  const removeSparkle = useCallback((id: string) => {
    setSparkles(prev => prev.filter(s => s.id !== id));
  }, []);

  const showSparkles = useCallback((position: { x: number; y: number }) => {
    const newSparkle = {
      id: `sparkle-${Date.now()}-${Math.random()}`,
      x: position.x,
      y: position.y,
    };
    setSparkles(prev => [...prev, newSparkle]);
  }, []);

  return (
    <SparkleContext.Provider value={{ sparkles, showSparkles, removeSparkle }}>
      {children}
    </SparkleContext.Provider>
  );
};

export const useSparkles = () => {
  const context = useContext(SparkleContext);
  if (!context) {
    throw new Error('useSparkles must be used within a SparkleProvider');
  }
  return context;
};
