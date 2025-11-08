import React, { useState } from 'react';
import type { WishFormData } from '../types';

interface WishFormProps {
  onSubmit: (formData: WishFormData) => void;
  onCancel: () => void;
}

const WishForm: React.FC<WishFormProps> = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WishFormData>({
    skills: '',
    time: '5-10 hours',
    location: 'Online',
    goal: '',
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
    handleNext();
  };

  const handleLocationSelect = (location: WishFormData['location']) => {
    setFormData(prev => ({ ...prev, location }));
    handleNext();
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <label className="text-2xl font-bold text-accent-primary">Wish 1: What are your skills?</label>
            <p className="text-text-secondary mb-4 mt-1">List a few things you're good at or enjoy doing.</p>
            <textarea
              className="w-full p-3 bg-background-hover rounded-lg border border-border-primary focus:ring-2 focus:ring-accent-primary focus:outline-none"
              rows={4}
              placeholder="e.g., writing, graphic design, talking to people, organizing events..."
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
          </div>
        );
      case 2:
        const timeOptions = ['<5 hours', '5-10 hours', '10+ hours'];
        return (
          <div>
            <label className="text-2xl font-bold text-accent-primary">Wish 2: How much time can you give weekly?</label>
            <div className="flex gap-4 mt-4">
              {timeOptions.map(opt => (
                <button key={opt} type="button" onClick={() => handleTimeSelect(opt)} className={`py-3 px-6 rounded-full font-semibold border-2 transition-colors ${formData.time === opt ? 'bg-accent-primary text-accent-text border-accent-primary' : 'border-border-primary hover:bg-background-hover'}`}>
                    {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        const locationOptions: WishFormData['location'][] = ['Online', 'Local', 'Hybrid'];
        return (
           <div>
            <label className="text-2xl font-bold text-accent-primary">Wish 3: Do you prefer online or offline?</label>
            <div className="flex gap-4 mt-4">
                 {locationOptions.map(opt => (
                <button key={opt} type="button" onClick={() => handleLocationSelect(opt)} className={`py-3 px-6 rounded-full font-semibold border-2 transition-colors ${formData.location === opt ? 'bg-accent-primary text-accent-text border-accent-primary' : 'border-border-primary hover:bg-background-hover'}`}>
                    {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <label className="text-2xl font-bold text-accent-primary">Wish 4: What's your main goal?</label>
             <p className="text-text-secondary mb-4 mt-1">What's the magic number or feeling you're aiming for?</p>
            <input
              type="text"
              className="w-full p-3 bg-background-hover rounded-lg border border-border-primary focus:ring-2 focus:ring-accent-primary focus:outline-none"
              placeholder="e.g., Earn an extra $500/month, save for a vacation, explore a passion..."
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  }

  const isFormStepValid = () => {
    if (step === 1 && !formData.skills.trim()) return false;
    if (step === 4 && !formData.goal.trim()) return false;
    return true;
  }

  return (
    <div className="w-full max-w-2xl bg-background-secondary backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-border-primary">
      <form onSubmit={handleSubmit}>
        <div className="min-h-[200px]">
         {renderStep()}
        </div>
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-primary">
          <div>
            {step > 1 && (
              <button type="button" onClick={handleBack} className="py-2 px-6 rounded-full font-semibold hover:bg-background-hover transition-colors">
                Back
              </button>
            )}
            {step === 1 && (
                 <button type="button" onClick={onCancel} className="py-2 px-6 rounded-full font-semibold hover:bg-background-hover transition-colors">
                    Cancel
                </button>
            )}
          </div>
           <div className="text-sm text-text-secondary">Step {step} of 4</div>
          <div>
            {step < 4 && (
              <button type="button" onClick={handleNext} disabled={!isFormStepValid()} className="bg-accent-primary text-accent-text font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Next Wish
              </button>
            )}
            {step === 4 && (
              <button type="submit" disabled={!isFormStepValid()} className="bg-accent-primary text-accent-text font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">
                Conjure Ideas ✨
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default WishForm;