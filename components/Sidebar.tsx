import React from 'react';
import type { AppView } from '../App';
import { GenieLampIcon } from './icons/GenieLampIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { useSparkles } from '../contexts/SparkleContext';
import { LogoutIcon } from './icons/LogoutIcon';


interface SidebarProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    isSidebarOpen: boolean;
    onToggle: () => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isSidebarOpen, onToggle, onLogout }) => {
    const { showSparkles } = useSparkles();

    const handleLogoClick = (e: React.MouseEvent) => {
        showSparkles({ x: e.clientX, y: e.clientY });
        onNavigate('home');
    };
    
    const NavItem = ({ view, icon, label }: { view: AppView, icon: React.ReactNode, label: string }) => {
        const isActive = currentView === view;
        return (
            <button
                onClick={() => onNavigate(view)}
                className={`w-full flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                    isActive ? 'bg-accent-primary text-accent-text' : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
                } ${!isSidebarOpen && 'justify-center'}`}
            >
                {icon}
                <span className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'}`}>
                    {label}
                </span>
            </button>
        );
    };

    return (
        <div className={`bg-background-primary backdrop-blur-lg flex flex-col h-full border-r border-border-primary transition-all duration-300 ease-in-out fixed md:relative inset-y-0 left-0 z-40
            ${isSidebarOpen 
                ? 'w-64 p-6 translate-x-0' 
                : 'w-64 p-6 -translate-x-full md:w-20 md:p-4 md:translate-x-0'
            }
        `}>
            <div className="flex-grow">
                <div 
                    className={`flex items-center gap-2 mb-12 cursor-pointer ${!isSidebarOpen && 'justify-center'}`}
                    onClick={handleLogoClick}
                >
                    <div className="sparkle-trigger rounded-full">
                        <GenieLampIcon className="w-12 h-12 text-accent-primary flex-shrink-0" />
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'}`}>
                        <h1 className="text-2xl font-bold text-text-primary leading-tight whitespace-nowrap">
                        Hustle<span className="text-accent-primary">Genie</span>
                        </h1>
                    </div>
                </div>

                <nav className="space-y-2">
                    <NavItem 
                        view="home" 
                        icon={<HomeIcon className="w-6 h-6 flex-shrink-0"/>} 
                        label="Dashboard" 
                    />
                    <NavItem 
                        view="chat" 
                        icon={<ChatIcon className="w-6 h-6 flex-shrink-0"/>} 
                        label="Chat with Genie" 
                    />
                </nav>
            </div>

            <div className="flex-shrink-0 space-y-2">
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center space-x-4 p-3 rounded-lg transition-colors text-text-secondary hover:bg-red-500/20 hover:text-red-400 ${!isSidebarOpen && 'justify-center'}`}
                    aria-label="Log Out"
                >
                    <LogoutIcon className="w-6 h-6 flex-shrink-0" />
                    <span className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-full opacity-100' : 'max-w-0 opacity-0'}`}>
                        Log Out
                    </span>
                </button>
                 <button
                    onClick={onToggle}
                    className="w-full hidden md:flex items-center justify-center p-3 rounded-lg transition-colors text-text-secondary hover:bg-background-hover"
                    aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <ChevronLeftIcon className={`w-6 h-6 transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} />
                 </button>
            </div>
        </div>
    );
};

export default Sidebar;
