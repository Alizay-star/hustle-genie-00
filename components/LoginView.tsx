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
        
        <div 
          className="mt-8 bg-background-secondary/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-border-primary text-left"
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-accent-primary">Log In to Your Lamp</h2>
          
          <form onSubmit={handleSubmit}>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border-primary" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background-secondary px-2 text-text-secondary rounded-full">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogin} // For demo purposes, this logs in directly
            className="w-full bg-white text-gray-700 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105 text-md flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
            <span>Sign in with Google</span>
          </button>
        </div>
        <p className="text-xs text-text-secondary/50 mt-6">
            (Use any email/password to log in for this demo)
        </p>
      </div>
    </div>
  );
};

export default LoginView;
