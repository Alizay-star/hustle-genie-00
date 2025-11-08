import React, { useState } from 'react';

interface AddGoalFormProps {
  onAdd: (newGoal: { title: string; goal: number; imageUrl?: string }) => void;
  onCancel: () => void;
}

const AddGoalForm: React.FC<AddGoalFormProps> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalAmount = Number(goal);
    if (title.trim() && goalAmount > 0) {
      onAdd({ title: title.trim(), goal: goalAmount, imageUrl });
      // Reset form
      setTitle('');
      setGoal('');
      setImageUrl(undefined);
      setImagePreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-background-hover/50 rounded-lg border border-border-primary space-y-3">
      <div className="flex gap-4">
        <div className="flex-grow space-y-3">
          <div>
            <label htmlFor="goal-title" className="text-sm font-medium text-text-secondary">Hustle Title</label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Launch a new Etsy shop"
              className="w-full mt-1 p-2 bg-background-hover rounded-md border border-border-primary focus:ring-1 focus:ring-accent-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="goal-amount" className="text-sm font-medium text-text-secondary">Goal Amount ($)</label>
            <input
              id="goal-amount"
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="500"
              className="w-full mt-1 p-2 bg-background-hover rounded-md border border-border-primary focus:ring-1 focus:ring-accent-primary focus:outline-none"
              required
              min="1"
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <label htmlFor="goal-image" className="text-sm font-medium text-text-secondary">Image (Optional)</label>
          <div className="mt-1 w-28 h-28 border-2 border-dashed border-border-primary rounded-md flex items-center justify-center bg-background-hover/50 cursor-pointer hover:bg-background-hover">
            <input id="goal-image" type="file" accept="image/*" onChange={handleImageChange} className="absolute w-28 h-28 opacity-0 cursor-pointer"/>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
            ) : (
              <span className="text-xs text-text-secondary/80 text-center">Click to upload</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="py-2 px-4 rounded-md font-semibold text-sm hover:bg-background-hover transition-colors">
          Cancel
        </button>
        <button type="submit" className="bg-accent-primary text-accent-text font-bold py-2 px-4 rounded-md shadow-lg text-sm hover:opacity-90 transition-colors">
          Save Goal
        </button>
      </div>
    </form>
  );
};

export default AddGoalForm;