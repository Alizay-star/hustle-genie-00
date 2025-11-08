import React from 'react';
import type { HustleGoal } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface HustleGoalCardProps {
  goal: HustleGoal;
  onUpdate: (newCurrent: number) => void;
  onDelete: () => void;
}

const HustleGoalCard: React.FC<HustleGoalCardProps> = ({ goal, onUpdate, onDelete }) => {
  const percentage = goal.goal > 0 ? (goal.current / goal.goal) * 100 : 0;
  
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(Number(event.target.value));
  };

  return (
    <div className="bg-background-hover/50 p-4 rounded-xl border border-border-primary relative group flex items-center gap-4 transition-all duration-200 ease-in-out hover:bg-background-hover hover:scale-[1.02]">
      {goal.imageUrl && (
        <img 
          src={goal.imageUrl} 
          alt={goal.title} 
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-grow">
        <button 
          onClick={onDelete} 
          className="absolute top-2 right-2 p-1 rounded-full bg-background-secondary text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-red-500/50 hover:text-white transition-opacity z-10"
          aria-label={`Delete ${goal.title} goal`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
        <div className="flex justify-between items-baseline">
          <p className="font-semibold text-text-primary pr-8">{goal.title}</p>
          <p className="text-text-secondary text-sm flex-shrink-0">
            ${goal.current} / <span className="text-text-primary font-medium">${goal.goal}</span>
          </p>
        </div>
        <div className="mt-3 relative flex items-center h-[22px]">
          <input
            type="range"
            min="0"
            max={goal.goal}
            value={goal.current}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-transparent appearance-none cursor-pointer slider-progress"
            style={{'--progress-percentage': `${percentage}%`} as React.CSSProperties}
            aria-label={`${goal.title} progress`}
          />
        </div>
      </div>
    </div>
  );
};

export default HustleGoalCard;