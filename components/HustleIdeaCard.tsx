import React from 'react';
import type { HustleIdea } from '../types';

// Fix: Define the HustleIdeaCardProps interface.
interface HustleIdeaCardProps {
  idea: HustleIdea;
  onGeneratePlan: (idea: HustleIdea) => void;
}

const HustleIdeaCard: React.FC<HustleIdeaCardProps> = ({ idea, onGeneratePlan }) => {
  return (
    <div className="bg-parchment text-parchment-text p-6 rounded-2xl shadow-lg flex flex-col h-full transform transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105">
      <div className="flex-grow">
        <h3 className="text-xl font-bold mb-2">{idea.title}</h3>
        <p className="text-sm opacity-80 mb-4 italic">✨ {idea.description}</p>
        
        <div className="text-xs space-y-2 mb-4">
          <p><span className="font-semibold">🕒 Time:</span> {idea.timeCommitment}</p>
          <p><span className="font-semibold">💸 Est. Earnings:</span> {idea.estimatedEarnings}</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🪄 Hustle Steps:</h4>
          <ul className="list-none space-y-1 text-sm">
            {idea.hustleSteps.map((step, index) => (
              <li key={index} className="opacity-90">{step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => onGeneratePlan(idea)}
          className="w-full bg-parchment-text text-parchment font-bold py-2 px-4 rounded-full hover:opacity-80 transition-colors">
          Generate Launch Plan
        </button>
      </div>
    </div>
  );
};

export default HustleIdeaCard;
