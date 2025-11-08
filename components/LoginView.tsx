import React, { useState } from 'react';
import { GenieLampIcon } from './icons/GenieLampIcon';
import { LoginIcon } from './icons/LoginIcon';
import { useSparkles } from '../contexts/SparkleContext';
import SparkleEffect from './effects/SparkleEffect';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { showSparkles } = useSparkles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showSparkles({ x: e.clientX, y: e.clientY });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    // Simple validation for demo
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onLogin();
  };

  return (
    <div
      className="theme-default font-nunito h-screen text-text-primary bg-background-primary flex flex-col items-center justify-center p-4"
      style={{backgroundImage: 'linear-gradient(to bottom right, var(--gradient-from), var(--gradient-to))'}}
    >
      <SparkleEffect />
      <div className="text-center w-full max-w-sm animate-fade-in-up">
        <button onClick={handleIconClick} className="sparkle-trigger rounded-full mb-4" aria-label="Sparkle effect">
          <GenieLampIcon className="w-20 h-20 text-accent-primary" />
        </button>
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">
          Welcome to Hustle<span className="text-accent-primary">Genie</span>
        </h1>
        <p className="text-text-secondary mt-1 text-md">Your wish for extra income, granted.</p>
        
        <form 
          onSubmit={handleSubmit}
          className="mt-8 bg-background-secondary/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-border-primary text-left"
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-accent-primary">Log In to Your Lamp</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email Address</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                </span>
                <input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="genie@magic.com"
                  className="w-full pl-10 pr-3 py-2 bg-background-tertiary rounded-lg border border-border-primary focus:ring-1 focus:ring-accent-primary focus:outline-none"
                  aria-label="Email Address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password"className="text-sm font-medium text-text-secondary">Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 bg-background-tertiary rounded-lg border border-border-primary focus:ring-1 focus:ring-accent-primary focus:outline-none"
                  aria-label="Password"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-xs">
            <label className="flex items-center text-text-secondary cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded bg-background-tertiary border-border-primary text-accent-primary focus:ring-accent-primary"/>
              <span className="ml-2">Remember me</span>
            </label>
            <a href="#" className="font-medium text-accent-secondary hover:underline">Forgot password?</a>
          </div>

          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          
          <button
            type="submit"
            className="mt-6 w-full bg-accent-primary text-accent-text font-bold py-3 px-6 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105 text-lg flex items-center justify-center gap-2"
          >
            <LoginIcon className="w-5 h-5" />
            <span>Log In</span>
          </button>
        </form>
        <p className="text-xs text-text-secondary/50 mt-6">
            (Use any email/password to log in for this demo)
        </p>
      </div>
    </div>
  );
};

export default LoginView;
