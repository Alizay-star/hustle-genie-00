
import React, { useState, useEffect } from 'react';
import WishForm from './components/WishForm';
import { generateHustleIdeas, generateLaunchPlan, generateInspirationalIdea } from './services/geminiService';
import type { HustleGoal, HustleIdea, WishFormData, LaunchPlan, Settings, User, ChatHistoryItem, UserData } from './types';
import { getUserData, saveUserData, migrateOldData } from './services/geminiService';
import HustleGoalCard from './components/HustleGoalCard';
import HustleIdeaCard from './components/HustleIdeaCard';
import { GenieLampIcon } from './components/icons/GenieLampIcon';
import ChatView from './components/ChatView';
import Sidebar from './components/Sidebar';
import AddGoalForm from './components/AddGoalForm';
import LaunchPlanView from './components/LaunchPlanView';
import { SparkleProvider, useSparkles } from './contexts/SparkleContext';
import SparkleEffect from './components/effects/SparkleEffect';
import { MenuIcon } from './components/icons/MenuIcon';
import LoginView from './components/LoginView';

export type AppView = 'home' | 'wishing' | 'loading' | 'results' | 'error' | 'chat' | 'launchPlan';

const defaultPersonality = 'You are HustleGenie, an AI assistant with a witty, encouraging, and magical personality. You help users with their side hustle questions, offering advice, motivation, and creative ideas. Keep your answers concise and fun. Format longer responses into paragraphs for readability.';

interface AppContentProps {
  currentUser: User;
  userData: UserData;
  onUserDataChange: (data: UserData) => void;
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ currentUser, userData, onUserDataChange, onLogout }) => {
  const { settings, goals, chatHistory } = userData;

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return true;
  });
  const [view, setView] = useState<AppView>('home');
  const [animationClass, setAnimationClass] = useState('animate-view-in');
  const [hustleIdeas, setHustleIdeas] = useState<HustleIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [launchPlan, setLaunchPlan] = useState<LaunchPlan | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<HustleIdea | null>(null);
  const [inspirationMode, setInspirationMode] = useState<boolean>(false);
  
  const { showSparkles } = useSparkles();

  const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      showSparkles({ x: e.clientX, y: e.clientY });
  };


  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    onUserDataChange({
      ...userData,
      settings: { ...settings, ...newSettings },
    });
  }
  
  const handleChatHistoryChange = (newChatHistory: ChatHistoryItem[]) => {
    onUserDataChange({ ...userData, chatHistory: newChatHistory });
  }

  const handleViewChange = (newView: AppView) => {
    if (view === newView || animationClass === 'animate-view-out') return;

    setAnimationClass('animate-view-out');

    setTimeout(() => {
        setView(newView);
        setAnimationClass('animate-view-in');
    }, 400); // Corresponds to CSS animation duration
  };

  const handleStartWish = () => {
    handleViewChange('wishing');
    setError(null);
    setHustleIdeas([]);
    setInspirationMode(false);
  };

  const handleFinishWish = async (formData: WishFormData) => {
    handleViewChange('loading');
    setInspirationMode(false);
    try {
      const ideas = await generateHustleIdeas(formData);
      setHustleIdeas(ideas);
      handleViewChange('results');
    } catch (err) {
      console.error(err);
      setError('The genie encountered some magical interference. Please try your wish again!');
      handleViewChange('error');
    }
  };
  
  const handleGetInspired = async () => {
    handleViewChange('loading');
    setInspirationMode(true);
    setError(null);
    try {
      const ideas = await generateInspirationalIdea();
      setHustleIdeas(ideas);
      handleViewChange('results');
    } catch (err) {
      console.error(err);
      setError('The genie is searching the cosmos for ideas... but hit some space dust. Please try again!');
      handleViewChange('error');
    }
  };

  const handleGenerateLaunchPlan = async (idea: HustleIdea) => {
    handleViewChange('loading');
    setSelectedIdea(idea);
    setError(null);
    try {
        const plan = await generateLaunchPlan(idea);
        setLaunchPlan(plan);
        handleViewChange('launchPlan');
    } catch (err) {
        console.error(err);
        setError('The genie had trouble mapping the stars for your launch plan. Please try again!');
        handleViewChange('error');
    }
  };
  
  const handleGoalUpdate = (titleToUpdate: string, newCurrent: number) => {
    const newGoals = goals.map(goal =>
      goal.title === titleToUpdate ? { ...goal, current: newCurrent } : goal
    );
    onUserDataChange({ ...userData, goals: newGoals });
  };
  
  const handleGoalAdd = (newGoal: { title: string; goal: number; imageUrl?: string }) => {
    if (goals.some(g => g.title === newGoal.title)) {
        // Simple validation to prevent duplicate titles
        alert("A goal with this title already exists!");
        return;
    }
    const newGoals = [
        ...goals,
        { ...newGoal, current: 0 }
    ];
    onUserDataChange({ ...userData, goals: newGoals });
    setIsAddingGoal(false); // Hide form after adding
  };

  const handleGoalDelete = (titleToDelete: string) => {
    const newGoals = goals.filter(goal => goal.title !== titleToDelete);
    onUserDataChange({ ...userData, goals: newGoals });
  };


  const handleBackToHome = () => {
    handleViewChange('home');
  };

  const renderView = () => {
    switch (view) {
      case 'wishing':
        return <WishForm onSubmit={handleFinishWish} onCancel={handleBackToHome} />;
      case 'loading':
        return (
          <div className="text-center text-text-primary flex flex-col items-center justify-center h-full animate-pulse">
            <button onClick={handleIconClick} className="sparkle-trigger rounded-full" aria-label="Sparkle effect">
              <GenieLampIcon className="w-24 h-24 text-accent-primary" />
            </button>
            <p className="text-2xl font-semibold mt-4">The genie is conjuring your wishes...</p>
            <p className="text-accent-primary/80 mt-2">Turning your dreams into plans!</p>
          </div>
        );
      case 'results':
        return (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            {inspirationMode ? (
              <>
                <h2 className="text-3xl font-bold text-center text-accent-primary mb-2">A Spark of Inspiration!</h2>
                <p className="text-center text-text-secondary mb-8">The genie found this idea floating in the cosmos for you.</p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-center text-accent-primary mb-2">Your Wish is My Command!</h2>
                <p className="text-center text-text-secondary mb-8">Here are a few hustle ideas conjured just for you.</p>
              </>
            )}
            
            <div className={`grid grid-cols-1 ${!inspirationMode && 'md:grid-cols-2 lg:grid-cols-3'} gap-6 ${inspirationMode && 'max-w-sm w-full'}`}>
              {hustleIdeas.map((idea, index) => (
                <HustleIdeaCard key={index} idea={idea} onGeneratePlan={handleGenerateLaunchPlan} />
              ))}
            </div>
            
            {inspirationMode ? (
               <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    onClick={handleGetInspired}
                    className="bg-accent-primary text-accent-text font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
                  >
                    Get Another Spark
                  </button>
                  <button
                    onClick={handleStartWish}
                    className="border-2 border-accent-secondary text-accent-secondary font-bold py-3 px-8 rounded-full shadow-lg hover:bg-accent-secondary/20 transition-all"
                  >
                    Make a Custom Wish
                  </button>
               </div>
            ) : (
              <button
                onClick={handleStartWish}
                className="mt-12 mx-auto block bg-accent-primary text-accent-text font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
              >
                Make Another Wish
              </button>
            )}
          </div>
        );
      case 'launchPlan':
        if (!launchPlan || !selectedIdea) {
          setError('Could not find the selected plan. Please go back and try again.');
          handleViewChange('error');
          return null;
        }
        return <LaunchPlanView idea={selectedIdea} plan={launchPlan} onBack={() => handleViewChange('results')} />;
      case 'error':
        return (
          <div className="text-center text-text-primary bg-red-500/20 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Oh no!</h2>
            <p className="mb-6">{error}</p>
            <button
              onClick={handleStartWish}
              className="bg-accent-primary text-accent-text font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        );
      case 'chat':
        return <ChatView 
          settings={settings}
          onSettingsChange={handleSettingsChange}
          chatHistory={chatHistory}
          onChatHistoryChange={handleChatHistoryChange}
        />;
      case 'home':
      default:
        return (
            <div className="w-full max-w-6xl mx-auto">
                 <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left sm:justify-start gap-4 mb-12">
                    <div>
                        <h1 className="text-5xl font-bold text-text-primary tracking-tight">
                        Hustle<span className="text-accent-primary">Genie</span>
                        </h1>
                        <p className="text-text-secondary mt-1">Your wish for extra income, granted.</p>
                    </div>
                </div>
                <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <div className="lg:col-span-3 bg-background-secondary backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-border-primary">
                    <h2 className="text-4xl font-bold text-text-primary">Welcome back, {currentUser.name}!</h2>
                    <p className="text-text-secondary mt-2 text-lg">Ready to make your next wish?</p>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <button onClick={handleStartWish} className="bg-accent-primary text-accent-text font-bold py-4 px-10 rounded-full shadow-lg hover:opacity-90 transition-transform transform hover:scale-105 text-lg">
                          MAKE A WISH
                      </button>
                      <button onClick={handleGetInspired} className="border-2 border-accent-secondary text-accent-secondary font-bold py-4 px-10 rounded-full shadow-lg hover:bg-accent-secondary/20 transition-all transform hover:scale-105 text-lg">
                          Get Inspired
                      </button>
                    </div>
                    <div className="mt-12">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Current Hustle Goals</h3>
                        <div className="space-y-4 mt-4">
                        {goals.map((goal) => (
                            <HustleGoalCard
                              key={goal.title}
                              goal={goal}
                              onUpdate={(newCurrent) => handleGoalUpdate(goal.title, newCurrent)}
                              onDelete={() => handleGoalDelete(goal.title)}
                            />
                        ))}
                        </div>
                         {isAddingGoal ? (
                            <AddGoalForm
                                onAdd={handleGoalAdd}
                                onCancel={() => setIsAddingGoal(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setIsAddingGoal(true)}
                                className="mt-4 w-full text-center py-3 border-2 border-dashed border-border-primary rounded-lg text-text-secondary hover:bg-background-hover hover:border-border-primary/50 transition-colors"
                            >
                                + Add New Goal
                            </button>
                        )}
                    </div>
                    <div className="mt-8 pt-4 border-t border-border-primary">
                        <p className="text-text-secondary text-sm">Daily inspiration</p>
                        <p className="text-text-primary font-medium italic">Today's magic: Consistency &gt; Luck</p>
                    </div>
                    </div>
                    <div className="lg:col-span-2 space-y-8">
                    <div className="bg-parchment p-8 rounded-3xl text-parchment-text text-center shadow-lg">
                        <p className="font-semibold">Genie's Wisdom</p>
                        <h3 className="text-3xl font-bold mt-2">Top 10 No-Investment Hustles</h3>
                    </div>
                    <div className="hidden lg:flex justify-center items-center">
                      <button onClick={handleIconClick} className="sparkle-trigger rounded-full" aria-label="Sparkle effect">
                        <GenieLampIcon className="w-24 h-24 text-accent-primary opacity-50"/>
                      </button>
                    </div>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className={`theme-${settings.theme} font-${settings.font} h-full text-text-primary bg-background-primary flex overflow-hidden`}
         style={{backgroundImage: 'linear-gradient(to bottom right, var(--gradient-from), var(--gradient-to))'}}
    >
      <SparkleEffect />
      <div 
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)} 
        aria-hidden="true"
      ></div>
      <Sidebar 
        currentUser={currentUser}
        currentView={view}
        onNavigate={(newView) => {
            handleViewChange(newView);
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        }}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={onLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
         {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border-primary flex-shrink-0 bg-background-primary z-10">
            <button className="flex items-center gap-2" onClick={() => {
                handleViewChange('home');
                setIsSidebarOpen(false);
            }}>
                <GenieLampIcon className="w-8 h-8 text-accent-primary"/>
                <h1 className="text-lg font-bold">Hustle<span className="text-accent-primary">Genie</span></h1>
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2" aria-label="Open menu">
                <MenuIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable content area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${view === 'chat' ? '' : 'p-4 sm:p-8'}`}>
            <div className={animationClass}>
                {renderView()}
            </div>
        </div>
      </main>
    </div>
  );
};

const ACTIVE_USER_SESSION_KEY = 'hustleGenieActiveUser';
const USERS_STORAGE_KEY = 'hustleGenieUsers'; // Note: This is now only used for session retrieval, not data logic

const App: React.FC = () => {
  // One-time migration/cleanup of old storage keys
  useEffect(() => {
    migrateOldData();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const userEmail = window.localStorage.getItem(ACTIVE_USER_SESSION_KEY);
      if (!userEmail) return null;

      // We still need the user list to get the user's name, etc.
      const allUsers: User[] = JSON.parse(window.localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      return allUsers.find(user => user.email === userEmail) || null;
    } catch (e) {
      console.error("Failed to read auth state from storage", e);
      return null;
    }
  });

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (currentUser) {
      const data = getUserData(currentUser.email);
      if (data) {
        // Simple data validation/hydration
        if (!data.settings.personality) {
          data.settings.personality = defaultPersonality;
        }
        setUserData(data);
      }
    } else {
      setUserData(null);
    }
  }, [currentUser]);


  const handleLogin = (user: User) => {
    try {
      window.localStorage.setItem(ACTIVE_USER_SESSION_KEY, user.email);
    } catch (e) {
      console.error("Failed to save auth state to storage", e);
    }
    setCurrentUser(user);
  };
  
  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ACTIVE_USER_SESSION_KEY);
    } catch (e) {
      console.error("Failed to clear auth state from storage", e);
    }
    setCurrentUser(null);
  };

  const handleUserDataChange = (newUserData: UserData) => {
    if (currentUser) {
      setUserData(newUserData);
      saveUserData(currentUser.email, newUserData);
    }
  };
  
  return (
    <SparkleProvider>
      {currentUser && userData ? (
        <AppContent 
          currentUser={currentUser} 
          userData={userData}
          onUserDataChange={handleUserDataChange}
          onLogout={handleLogout} 
        />
      ) : (
        <LoginView onLogin={handleLogin} />
      )}
    </SparkleProvider>
  );
}

export default App;
