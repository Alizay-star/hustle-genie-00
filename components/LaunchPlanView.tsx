import React from 'react';
import type { HustleIdea, LaunchPlan } from '../types';
import { CheckIcon } from './icons/CheckIcon';

interface LaunchPlanViewProps {
  idea: HustleIdea;
  plan: LaunchPlan;
  onBack: () => void;
}

const LaunchPlanView: React.FC<LaunchPlanViewProps> = ({ idea, plan, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <h2 className="text-3xl font-bold text-center text-accent-primary mb-2">Your 7-Day Launch Scroll</h2>
      <p className="text-center text-text-secondary mb-2 font-semibold text-lg">{idea.title}</p>
      <p className="text-center text-text-secondary/80 mb-8 max-w-2xl italic">"{idea.description}"</p>
      
      <div className="w-full space-y-6">
        {plan.plan.sort((a, b) => a.day - b.day).map((day) => (
          <div key={day.day} className="bg-background-secondary backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border-primary">
            <h3 className="text-xl font-bold text-accent-primary mb-4">
              Day {day.day}: <span className="text-text-primary">{day.title}</span>
            </h3>
            <ul className="space-y-3">
              {day.tasks.map((task, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5 bg-accent-primary/20 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3.5 h-3.5 text-accent-primary" />
                  </div>
                  <span className="text-text-secondary">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-12 mx-auto block bg-accent-primary text-accent-text font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
      >
        Back to Ideas
      </button>
    </div>
  );
};

export default LaunchPlanView;