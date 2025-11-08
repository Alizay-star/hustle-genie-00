import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { startChatSession, sendMessageToGenie, generateImageFromPrompt } from '../services/geminiService';
import type { ChatMessage as Message, ChatHistoryItem, Settings, Theme, FontTheme } from '../types';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { ChatHistoryIcon } from './icons/ChatHistoryIcon';
import { PlusIcon } from './icons/PlusIcon';
import { GenieLampIcon } from './icons/GenieLampIcon';
import { ImageIcon } from './icons/ImageIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PinIcon } from './icons/PinIcon';
import { useSparkles } from '../contexts/SparkleContext';
import { CloseIcon } from './icons/CloseIcon';

// This type is based on the expected structure for the Gemini API history.
// Fix: Correct `GeminiHistory` to be an array type to match the API's expectation.
type GeminiHistory = {
  role: "user" | "model";
  parts: { text: string }[];
}[];

interface ChatViewProps {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
}

type ChatMode = 'text' | 'image';
type HistoryTab = 'chats' | 'images' | 'pinned';
const LOCAL_STORAGE_KEY = 'hustleGenieChatHistory';
const CHAR_LIMIT = 1000;

const themes: { name: Theme; color: string; label: string, icon?: React.ReactNode }[] = [
    { name: 'default', color: '#FFD85E', label: 'Default', icon: <SparklesIcon className="w-5 h-5"/> },
    { name: 'light', color: '#F3F4F6', label: 'Light', icon: <SunIcon className="w-5 h-5"/> },
    { name: 'dark', color: '#374151', label: 'Dark', icon: <MoonIcon className="w-5 h-5"/> },
    { name: 'red', color: '#EF4444', label: 'Crimson' },
    { name: 'green', color: '#10B981', label: 'Emerald' },
    { name: 'blue', color: '#3B82F6', label: 'Sapphire' },
    { name: 'purple', color: '#8B5CF6', label: 'Amethyst' },
];

const TypingIndicator: React.FC<{mode: ChatMode}> = ({ mode }) => (
    <div className="flex items-center space-x-2 py-1">
        <div className="font-medium text-text-primary/90">
             {mode === 'image' ? 'Genie is painting' : 'Genie is thinking'}
        </div>
        <div className="flex items-baseline space-x-1">
            <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.2s' }}></div>
        </div>
    </div>
);

const PromptButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="p-4 bg-background-hover/50 border border-border-primary rounded-lg text-left text-text-secondary hover:bg-background-hover transition-colors text-sm"
    >
        {children}
    </button>
);


const ChatView: React.FC<ChatViewProps> = ({ settings, onSettingsChange }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [mode, setMode] = useState<ChatMode>('text');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [historyTab, setHistoryTab] = useState<HistoryTab>('chats');
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(() => {
        try {
            const savedHistory = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Failed to load chat history from local storage", error);
            return [];
        }
    });
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [showInactivityPrompts, setShowInactivityPrompts] = useState(false);
    const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inactivityTimerRef = useRef<number | null>(null);
    const { showSparkles } = useSparkles();

    // Save chat history to local storage whenever it changes
    useEffect(() => {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
        } catch (error) {
            console.error("Failed to save chat history to local storage", error);
        }
    }, [chatHistory]);

    useEffect(() => {
        if (scrollToMessageId) {
            const element = document.getElementById(`message-${scrollToMessageId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary highlight effect
            if (element) {
                element.style.backgroundColor = 'var(--color-accent-primary-alpha, rgba(255, 216, 94, 0.2))';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                }, 2000);
            }
            setScrollToMessageId(null);
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, scrollToMessageId]);
    
    const inactivityPrompts = [
        "What are some common mistakes to avoid?",
        "How can I use social media for my hustle?",
        "Suggest a creative name for my new business.",
        "Help me write a pitch for a client."
    ];

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        setShowInactivityPrompts(false);
        inactivityTimerRef.current = window.setTimeout(() => {
            const isChatting = messages.length > 1 || (messages.length === 1 && !messages[0].isInitial);
            if (isChatting && !isLoading) {
                setShowInactivityPrompts(true);
            }
        }, 15000); // 15 seconds
    }, [messages, isLoading]);

    useEffect(() => {
        resetInactivityTimer();
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [resetInactivityTimer]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        resetInactivityTimer();
    };

    const reinitializeChat = (history: GeminiHistory = []) => {
        chatSessionRef.current = startChatSession(history, settings.personality);
    };

    const createGeminiHistory = (messageHistory: Message[]): GeminiHistory => {
        return messageHistory
            .filter(msg => {
                if (msg.role === 'user') {
                    return msg.text && typeof msg.text === 'string';
                }
                if (msg.role === 'model') {
                    const activeResponse = msg.responses?.[msg.activeResponseIndex ?? 0];
                    const fallbackText = typeof msg.text === 'string' ? msg.text : null;
                    return (activeResponse?.text && typeof activeResponse.text === 'string') || fallbackText;
                }
                return false;
            })
            .map(msg => {
                let text = '';
                if (msg.role === 'user') {
                    text = msg.text as string;
                } else { // model
                    const activeResponse = msg.responses?.[msg.activeResponseIndex ?? 0];
                    if (activeResponse?.text && typeof activeResponse.text === 'string') {
                        text = activeResponse.text;
                    } else if (typeof msg.text === 'string') {
                        text = msg.text; // Fallback for old format
                    }
                }
                return {
                    role: msg.role as 'user' | 'model',
                    parts: [{ text }],
                };
            });
    };
    
    const handleSelectChat = (id: string) => {
        if (editingChatId) return; // Prevent switching chats while editing a title
        const selectedChat = chatHistory.find(chat => chat.id === id);
        if (selectedChat) {
            const geminiHistory = createGeminiHistory(selectedChat.messages);
            reinitializeChat(geminiHistory);
            setMessages(selectedChat.messages);
            setActiveChatId(selectedChat.id);
            setIsHistoryOpen(false);
        }
    };

    const handleNewChat = () => {
        reinitializeChat();
        setMessages([{ id: `msg-${Date.now()}`, role: 'model', responses: [{text: "A fresh start! What new wonders shall we explore today?"}], activeResponseIndex: 0, isInitial: true }]);
        setActiveChatId(null);
        setIsHistoryOpen(false);
    };
    
    // On initial load, if there's history, load the most recent chat. Otherwise, start a new one.
    useEffect(() => {
        if (chatHistory.length > 0 && !activeChatId) {
            handleSelectChat(chatHistory[0].id);
        } else if (chatHistory.length === 0 && !activeChatId) {
            handleNewChat();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSendMessageInternal = async (messageText: string) => {
        if (isLoading) return;
    
        setShowInactivityPrompts(false);
        const userMessage: Message = { id: `msg-user-${Date.now()}`, role: 'user', text: messageText, isPending: true };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);
    
        if (!chatSessionRef.current) {
            const geminiHistory = createGeminiHistory(messages);
            reinitializeChat(geminiHistory);
        }
    
        let currentChatId = activeChatId;
    
        // If it's a new chat, create a history item
        if (currentChatId === null) {
            const newId = new Date().toISOString();
            const newTitle = messageText.length > 30 ? messageText.substring(0, 27) + '...' : messageText;
            const newHistoryItem: ChatHistoryItem = {
                id: newId,
                title: newTitle,
                date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                messages: updatedMessages,
            };
            setChatHistory(prev => [newHistoryItem, ...prev]);
            setActiveChatId(newId);
            currentChatId = newId;
        } else {
            setChatHistory(prev => prev.map(chat =>
                chat.id === currentChatId ? { ...chat, messages: updatedMessages } : chat
            ));
        }
    
        let modelMessage: Message;
        if (mode === 'text') {
            const responseText = await sendMessageToGenie(chatSessionRef.current!, messageText);
            modelMessage = { id: `msg-model-${Date.now()}`, role: 'model', responses: [{ text: responseText, isTyping: true }], activeResponseIndex: 0 };
        } else {
            try {
                const imageUrl = await generateImageFromPrompt(messageText);
                modelMessage = { id: `msg-model-${Date.now()}`, role: 'model', responses: [{ imageUrl: imageUrl }], activeResponseIndex: 0 };
            } catch (error) {
                modelMessage = { id: `msg-model-${Date.now()}`, role: 'model', responses: [{ text: 'Sorry, I couldn\'t generate that image. My magic might be a bit fuzzy.' }], activeResponseIndex: 0 };
            }
        }
    
        const messagesWithPendingResolved = updatedMessages.map(msg =>
            msg.id === userMessage.id ? { ...msg, isPending: false } : msg
        );
        const finalMessages = [...messagesWithPendingResolved, modelMessage];
        setMessages(finalMessages);
    
        setChatHistory(prev => prev.map(chat =>
            chat.id === currentChatId ? { ...chat, messages: finalMessages } : chat
        ));
    
        setIsLoading(false);
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput) return;
        setInputValue('');
        await handleSendMessageInternal(trimmedInput);
    };
    
    const handlePromptClick = async (prompt: string) => {
        setMode('text'); // Ensure text mode for prompts
        setInputValue(prompt); // Set input value to show user what's being sent
        await handleSendMessageInternal(prompt);
        setInputValue('');
    };

    const handleDeleteChat = (idToDelete: string) => {
        setChatHistory(prev => prev.filter(item => item.id !== idToDelete));
        if (activeChatId === idToDelete) {
            handleNewChat();
        }
    };

    const handleConfirmClearHistory = () => {
        setChatHistory([]);
        try {
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear chat history from local storage", error);
        }
        handleNewChat();
        setIsConfirmingClear(false);
        setIsSettingsOpen(false);
    };
    
    const handleNavigateResponse = (messageId: string, direction: 'prev' | 'next') => {
        const updateNavigation = (msgs: Message[]): Message[] => {
            return msgs.map(msg => {
                if (msg.id === messageId && msg.role === 'model' && msg.responses && msg.responses.length > 1) {
                    const newMsg = { ...msg };
                    let currentIndex = newMsg.activeResponseIndex ?? 0;
                    if (direction === 'prev' && currentIndex > 0) {
                        currentIndex--;
                    } else if (direction === 'next' && currentIndex < newMsg.responses.length - 1) {
                        currentIndex++;
                    } else {
                        return msg; // No change if at boundaries
                    }
                    newMsg.activeResponseIndex = currentIndex;
                    return newMsg;
                }
                return msg;
            });
        };
        
        setMessages(prev => updateNavigation(prev));

        if (activeChatId) {
            setChatHistory(prevHistory => prevHistory.map(chat => {
                if (chat.id === activeChatId) {
                    return { ...chat, messages: updateNavigation(chat.messages) };
                }
                return chat;
            }));
        }
    };


    const handleRegenerateResponse = async () => {
        if (isLoading || isRegenerating || messages.length < 2) return;
    
        const lastModelMessage = messages[messages.length - 1];
        const userPromptMessage = messages[messages.length - 2];
    
        if (lastModelMessage.role !== 'model' || userPromptMessage.role !== 'user' || !userPromptMessage.text || typeof userPromptMessage.text !== 'string') {
            return;
        }
        
        setIsRegenerating(true);
        setIsLoading(true); // Disable main input
    
        const historyForNewSession = createGeminiHistory(messages.slice(0, -2));
        chatSessionRef.current = startChatSession(historyForNewSession, settings.personality);
    
        const promptText = userPromptMessage.text;
        const lastActiveResponse = lastModelMessage.responses?.[lastModelMessage.activeResponseIndex ?? 0];
        const wasImageRequest = !!lastActiveResponse?.imageUrl;
    
        try {
            let newModelResponseData: string;
            if (wasImageRequest) {
                newModelResponseData = await generateImageFromPrompt(promptText);
            } else {
                newModelResponseData = await sendMessageToGenie(chatSessionRef.current!, promptText);
            }
            
            const newResponse = wasImageRequest ? { imageUrl: newModelResponseData } : { text: newModelResponseData, isTyping: true };
    
            // Create a new message object with the new response appended
            const updatedModelMessage = { ...lastModelMessage };
            
            if (!updatedModelMessage.responses) {
                const firstResponse = { text: updatedModelMessage.text, imageUrl: updatedModelMessage.imageUrl };
                updatedModelMessage.responses = [firstResponse];
            } else {
                updatedModelMessage.responses = [...updatedModelMessage.responses];
            }
    
            updatedModelMessage.responses.push(newResponse);
            updatedModelMessage.activeResponseIndex = updatedModelMessage.responses.length - 1;
            delete updatedModelMessage.text;
            delete updatedModelMessage.imageUrl;
            
            // Replace the last message in the state
            const finalMessages = [...messages.slice(0, -1), updatedModelMessage];
            setMessages(finalMessages);
    
            if (activeChatId) {
                setChatHistory(prev => prev.map(chat => 
                    chat.id === activeChatId ? { ...chat, messages: finalMessages } : chat
                ));
            }
        } catch (error) {
            console.error("Regeneration failed:", error);
            // In case of an error, just stop the loading states
        } finally {
            setIsLoading(false);
            setIsRegenerating(false);
        }
    };

    const handleTypingComplete = () => {
        const updateTypingStatus = (msgs: Message[]): Message[] => {
            if (!msgs || msgs.length === 0) return msgs;

            const lastMessage = msgs[msgs.length - 1];
            if (lastMessage?.role === 'model') {
                const activeResponse = lastMessage.responses?.[lastMessage.activeResponseIndex ?? 0];
                if (activeResponse?.isTyping) {
                    const newMessages = [...msgs];
                    const newLastMsg = { ...lastMessage };
                    if (newLastMsg.responses) {
                        newLastMsg.responses = [...newLastMsg.responses];
                        const activeIdx = newLastMsg.activeResponseIndex ?? 0;
                        const newActiveResp = { ...newLastMsg.responses[activeIdx] };
                        newActiveResp.isTyping = false;
                        newLastMsg.responses[activeIdx] = newActiveResp;
                        newMessages[newMessages.length - 1] = newLastMsg;
                    }
                    return newMessages;
                }
            }
            return msgs;
        };

        setMessages(prev => updateTypingStatus(prev));
        if (activeChatId) {
            setChatHistory(prevHistory => prevHistory.map(chat => {
                if (chat.id === activeChatId) {
                    return { ...chat, messages: updateTypingStatus(chat.messages) };
                }
                return chat;
            }));
        }
    };

    const handleStartEditing = (item: ChatHistoryItem) => {
        setEditingChatId(item.id);
        setEditingTitle(item.title);
    };

    const handleSaveTitle = (id: string) => {
        if (!editingTitle.trim()) return; // Don't save empty titles
        setChatHistory(prev => prev.map(chat => 
            chat.id === id ? { ...chat, title: editingTitle.trim() } : chat
        ));
        setEditingChatId(null);
        setEditingTitle('');
    };

    const handleToggleMessagePin = (messageId: string) => {
        const updatedMessages = messages.map(msg =>
            msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        );
        setMessages(updatedMessages);

        if (activeChatId) {
            setChatHistory(prev => prev.map(chat =>
                chat.id === activeChatId ? { ...chat, messages: updatedMessages } : chat
            ));
        }
    };

    const handleToggleChatPin = (chatId: string) => {
        setChatHistory(prev => prev.map(chat =>
            chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
        ));
    };

    const handleToggleReaction = (messageId: string, emoji: string) => {
        const updateReactions = (msgs: Message[]): Message[] => {
            return msgs.map(msg => {
                if (msg.id === messageId) {
                    const existingReactions = msg.reactions || [];
                    const hasReaction = existingReactions.includes(emoji);
                    const newReactions = hasReaction
                        ? existingReactions.filter(r => r !== emoji)
                        : [...existingReactions, emoji];
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            });
        };

        setMessages(prev => updateReactions(prev));

        if (activeChatId) {
            setChatHistory(prevHistory => prevHistory.map(chat => {
                if (chat.id === activeChatId) {
                    return { ...chat, messages: updateReactions(chat.messages) };
                }
                return chat;
            }));
        }
    };
    
    type PinnedMessageItem = {
      chatId: string;
      chatTitle: string;
      message: Message;
    };
    
    const handleSelectPinnedMessage = (item: PinnedMessageItem) => {
        if (activeChatId === item.chatId) {
            setScrollToMessageId(item.message.id);
        } else {
            const selectedChat = chatHistory.find(chat => chat.id === item.chatId);
            if (selectedChat) {
                const geminiHistory = createGeminiHistory(selectedChat.messages);
                reinitializeChat(geminiHistory);
                setMessages(selectedChat.messages);
                setActiveChatId(selectedChat.id);
                setScrollToMessageId(item.message.id);
            }
        }
        setIsHistoryOpen(false);
    };

    // Memoized lists for history and filtering
    const generatedImages = useMemo(() => {
        const allImages: { src: string; chatId: string }[] = [];
        chatHistory.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.role === 'model') {
                    if (message.imageUrl) {
                        allImages.push({ src: message.imageUrl, chatId: chat.id });
                    }
                    if (message.responses) {
                        message.responses.forEach(response => {
                            if (response.imageUrl) {
                                allImages.push({ src: response.imageUrl, chatId: chat.id });
                            }
                        });
                    }
                }
            });
        });
        const uniqueImages = Array.from(new Map(allImages.map(img => [img.src, img])).values());
        return uniqueImages.reverse();
    }, [chatHistory]);
    
    const pinnedChats = useMemo(() => chatHistory.filter(c => c.isPinned), [chatHistory]);

    const pinnedMessages = useMemo(() => {
        const allPinned: PinnedMessageItem[] = [];
        chatHistory.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.isPinned) {
                    allPinned.push({ chatId: chat.id, chatTitle: chat.title, message });
                }
            });
        });
        return allPinned.reverse();
    }, [chatHistory]);

    // Memoized filtered lists for search
    const filteredChatHistory = useMemo(() => chatHistory.filter(item =>
        item.title.toLowerCase().includes(historySearchTerm.toLowerCase())
    ), [chatHistory, historySearchTerm]);

    const filteredGeneratedImages = useMemo(() => {
        if (!historySearchTerm) return generatedImages;
        const searchTerm = historySearchTerm.toLowerCase();
        return generatedImages.filter(image => {
            const chat = chatHistory.find(c => c.id === image.chatId);
            return chat?.title.toLowerCase().includes(searchTerm);
        });
    }, [generatedImages, chatHistory, historySearchTerm]);

    const filteredPinnedChats = useMemo(() => {
        if (!historySearchTerm) return pinnedChats;
        const searchTerm = historySearchTerm.toLowerCase();
        return pinnedChats.filter(item => 
            item.title.toLowerCase().includes(searchTerm)
        );
    }, [pinnedChats, historySearchTerm]);

    const filteredPinnedMessages = useMemo(() => {
        if (!historySearchTerm) return pinnedMessages;
        const searchTerm = historySearchTerm.toLowerCase();
        return pinnedMessages.filter(item => {
            const messageText = typeof item.message.text === 'string' ? item.message.text.toLowerCase() : '';
            const chatTitle = item.chatTitle.toLowerCase();
            return messageText.includes(searchTerm) || chatTitle.includes(searchTerm);
        });
    }, [pinnedMessages, historySearchTerm]);


    const ChatWelcome = () => {
        const handleIconClick = (e: React.MouseEvent) => {
            showSparkles({ x: e.clientX, y: e.clientY });
        };

        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <button onClick={handleIconClick} className="sparkle-trigger rounded-full" aria-label="Sparkle effect">
                    <GenieLampIcon className="w-24 h-24 text-accent-primary/50" />
                </button>
                <h2 className="mt-6 text-3xl font-bold text-text-primary">Ask the Genie Anything</h2>
                <p className="mt-2 text-text-secondary">What side hustle secrets can I unlock for you?</p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                    <PromptButton onClick={() => handlePromptClick("How do I find my first client?")}>
                        "How do I find my first client?"
                    </PromptButton>
                    <PromptButton onClick={() => handlePromptClick("Give me a motivational quote.")}>
                        "Give me a motivational quote."
                    </PromptButton>
                    <PromptButton onClick={() => handlePromptClick("What's a good hustle for a writer?")}>
                        "What's a good hustle for a writer?"
                    </PromptButton>
                    <PromptButton onClick={() => handlePromptClick("Help me price my services.")}>
                        "Help me price my services."
                    </PromptButton>
                </div>
            </div>
        );
    }

    const FontButton = ({ font, label }: { font: FontTheme, label: string }) => (
        <button
            onClick={() => onSettingsChange({ font })}
            className={`w-full text-center py-3 rounded-lg border-2 font-${font} ${settings.font === font ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary hover:border-accent-primary/50'}`}
        >
            {label}
        </button>
    );

    const charCount = inputValue.length;
    const isApproachingLimit = charCount > CHAR_LIMIT * 0.9;
    const isOverLimit = charCount >= CHAR_LIMIT;

    const counterColor = isOverLimit ? 'text-red-500' : isApproachingLimit ? 'text-yellow-400' : 'text-text-secondary';
    
    let inputBorderColor = 'border-border-primary';
    if (mode === 'image') {
        inputBorderColor = 'border-accent-primary';
    } else if (isOverLimit) {
        inputBorderColor = 'border-red-500';
    } else if (isApproachingLimit) {
        inputBorderColor = 'border-yellow-500';
    }

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
             {isConfirmingClear && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background-secondary p-8 rounded-2xl shadow-2xl border border-border-primary max-w-md w-full text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h3 className="text-2xl font-bold text-red-400">Are you absolutely sure?</h3>
                        <p className="text-text-secondary mt-4 mb-6">
                            This will permanently delete your entire chat history, including all messages, pinned items, and generated images. This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsConfirmingClear(false)}
                                className="py-2 px-8 rounded-full font-semibold bg-background-hover hover:bg-background-tertiary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmClearHistory}
                                className="py-2 px-8 rounded-full font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Yes, Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="absolute top-8 right-8 z-20 flex gap-2">
                 <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full text-text-secondary bg-background-secondary hover:bg-background-hover transition-colors"
                    aria-label="Open settings"
                 >
                    <SettingsIcon className="w-6 h-6"/>
                 </button>

                {!isHistoryOpen && (
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2 rounded-full text-text-secondary bg-background-secondary hover:bg-background-hover transition-colors"
                        aria-label="Open chat history"
                    >
                        <ChatHistoryIcon className="w-6 h-6"/>
                    </button>
                )}
            </div>
            
            {/* Settings Panel */}
            <div className={`absolute top-0 bottom-0 right-0 z-40 w-full max-w-sm h-full bg-background-primary backdrop-blur-lg shadow-2xl border-l border-border-primary transition-transform duration-300 ease-in-out ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-accent-primary flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6"/>
                            Settings
                        </h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-background-hover transition-colors" aria-label="Close settings">
                            <ChevronRightIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-8">
                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Appearance</h4>
                            <div className="space-y-2">
                                <label className="text-text-primary font-medium">Theme</label>
                                <div className="grid grid-cols-4 gap-4 pt-1">
                                    {themes.map((theme) => {
                                        const isSelected = settings.theme === theme.name;
                                        return (
                                            <div key={theme.name} className="flex flex-col items-center gap-1.5">
                                                <button
                                                    onClick={() => onSettingsChange({ theme: theme.name })}
                                                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                                                        ${isSelected ? 'border-accent-primary ring-2 ring-accent-primary ring-offset-2 ring-offset-background-tertiary' : 'border-border-primary hover:border-text-secondary/50'}
                                                    `}
                                                    style={{ backgroundColor: theme.color }}
                                                    aria-label={`Select ${theme.label} theme`}
                                                >
                                                    {theme.icon && (
                                                        <span className={`${theme.name === 'light' ? 'text-parchment-text' : 'text-accent-text'}`}>
                                                            {theme.icon}
                                                        </span>
                                                    )}
                                                    {isSelected && !theme.icon && (
                                                        <CheckIcon className={`w-5 h-5 ${theme.name === 'light' ? 'text-parchment-text' : 'text-accent-text'}`} />
                                                    )}
                                                </button>
                                                <span className={`text-xs font-medium ${isSelected ? 'text-accent-primary' : 'text-text-secondary'}`}>{theme.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <label className="text-text-primary font-medium">Font</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <FontButton font="nunito" label="Nunito" />
                                    <FontButton font="inter" label="Inter" />
                                    <FontButton font="lora" label="Lora" />
                                    <FontButton font="mono" label="Roboto Mono" />
                                    <FontButton font="poppins" label="Poppins" />
                                    <FontButton font="playfair" label="Playfair" />
                                    <FontButton font="source-code-pro" label="Source Code" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Genie Personality</h4>
                            <textarea
                                value={settings.personality}
                                onChange={(e) => onSettingsChange({ personality: e.target.value })}
                                onBlur={() => {
                                    const currentHistory = createGeminiHistory(messages);
                                    reinitializeChat(currentHistory);
                                }}
                                rows={6}
                                className="w-full bg-background-tertiary text-text-primary placeholder-text-secondary/80 p-3 rounded-lg border border-border-primary focus:outline-none focus:border-accent-primary transition-colors text-sm"
                                placeholder="Describe how you want the genie to behave..."
                            />
                            <p className="text-xs text-text-secondary/80 mt-2">Changes apply to the current chat session when you click away.</p>
                        </div>
                    </div>
                    <div className="mt-auto pt-6 border-t border-border-primary">
                        <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Data Management</h4>
                        <button
                            onClick={() => setIsConfirmingClear(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold transition-colors"
                        >
                            <TrashIcon className="w-5 h-5" />
                            Clear All Chat History
                        </button>
                    </div>
                </div>
            </div>

             {/* Collapsible History Panel */}
            <div className={`absolute top-0 bottom-0 right-0 z-30 w-full max-w-sm h-full bg-background-primary backdrop-blur-lg shadow-2xl border-l border-border-primary transition-transform duration-300 ease-in-out ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center">
                         <button
                            onClick={() => setIsHistoryOpen(false)}
                            className="p-2 rounded-full hover:bg-background-hover transition-colors"
                            aria-label="Close chat history"
                        >
                            <ChevronRightIcon className="w-6 h-6"/>
                        </button>
                        <h3 className="text-xl font-bold text-accent-primary flex items-center gap-2">
                            <ChatHistoryIcon className="w-6 h-6"/>
                            History
                        </h3>
                        <button onClick={handleNewChat} className="p-2 rounded-full hover:bg-background-hover transition-colors" aria-label="New Chat">
                            <PlusIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="flex flex-col flex-grow mt-4 min-h-0">
                            <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={historySearchTerm}
                                onChange={(e) => setHistorySearchTerm(e.target.value)}
                                className="w-full bg-background-tertiary text-text-primary placeholder-text-secondary/80 pl-10 pr-4 py-2 rounded-lg border border-border-primary focus:outline-none focus:border-accent-primary transition-colors"
                                aria-label="Search history"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex border-b border-border-primary mb-4">
                            <button
                                onClick={() => setHistoryTab('chats')}
                                className={`flex-1 py-2 text-sm font-semibold transition-colors ${historyTab === 'chats' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Chats
                            </button>
                            <button
                                onClick={() => setHistoryTab('images')}
                                className={`flex-1 py-2 text-sm font-semibold transition-colors ${historyTab === 'images' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Images
                            </button>
                            <button
                                onClick={() => setHistoryTab('pinned')}
                                className={`flex-1 py-2 text-sm font-semibold transition-colors ${historyTab === 'pinned' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Pinned
                            </button>
                        </div>

                        {historyTab === 'chats' && (
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                                {filteredChatHistory.length > 0 ? (
                                    <ul className="space-y-2">
                                        {filteredChatHistory.map(item => {
                                            const isEditing = editingChatId === item.id;
                                            return (
                                                <li 
                                                    key={item.id} 
                                                    onClick={() => !isEditing && handleSelectChat(item.id)} 
                                                    className={`p-3 rounded-lg transition-colors relative group ${activeChatId === item.id ? 'bg-background-hover' : 'hover:bg-background-hover'} ${isEditing ? 'bg-background-hover' : 'cursor-pointer'}`}
                                                >
                                                    <div className="pr-16">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editingTitle}
                                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                                onKeyDown={(e) => { 
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleSaveTitle(item.id);
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        setEditingTitle(item.title);
                                                                        setEditingChatId(null);
                                                                    }
                                                                }}
                                                                onBlur={() => handleSaveTitle(item.id)}
                                                                className="w-full bg-background-tertiary text-text-primary p-1 rounded-md border border-accent-primary focus:outline-none text-sm font-semibold"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <>
                                                                <p className="font-semibold truncate">{item.title}</p>
                                                                <p className="text-xs text-text-secondary">{item.date}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 z-10">
                                                        {isEditing ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSaveTitle(item.id); }}
                                                                className="p-1.5 rounded-full text-green-400 bg-green-500/20 hover:bg-green-500/30 transition-all"
                                                                aria-label={`Save title`}
                                                            >
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleToggleChatPin(item.id); }}
                                                                    className={`p-1.5 rounded-full hover:bg-background-tertiary transition-all ${item.isPinned ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                                                    aria-label={item.isPinned ? 'Unpin chat' : 'Pin chat'}
                                                                >
                                                                    <PinIcon isPinned={!!item.isPinned} className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStartEditing(item); }}
                                                                    className="p-1.5 rounded-full text-text-secondary hover:bg-background-tertiary hover:text-text-primary transition-all"
                                                                    aria-label={`Edit title for chat: ${item.title}`}
                                                                >
                                                                    <PencilIcon className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteChat(item.id); }}
                                                                    className="p-1.5 rounded-full text-text-secondary hover:bg-red-500/20 hover:text-red-400 transition-all"
                                                                    aria-label={`Delete chat: ${item.title}`}
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                ) : (
                                    <div className="text-center text-text-secondary text-sm py-8">
                                        <p>No chats found{historySearchTerm && ' matching your search'}.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {historyTab === 'images' && (
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                                {filteredGeneratedImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredGeneratedImages.map((image, index) => (
                                            <div 
                                                key={`${image.src}-${index}`} 
                                                className="aspect-square bg-background-tertiary rounded-lg overflow-hidden cursor-pointer group"
                                                onClick={() => handleSelectChat(image.chatId)}
                                            >
                                                <img 
                                                    src={image.src} 
                                                    alt="Generated image" 
                                                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-text-secondary text-sm py-8 flex flex-col items-center">
                                        <ImageIcon className="w-12 h-12 text-text-secondary/50 mb-4"/>
                                        <p>No images found{historySearchTerm && ' matching your search'}.</p>
                                    </div>
                                )}
                            </div>
                        )}

                            {historyTab === 'pinned' && (
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Pinned Chats</h4>
                                    {filteredPinnedChats.length > 0 ? (
                                        <ul className="space-y-2">
                                            {filteredPinnedChats.map(item => (
                                                <li key={item.id} onClick={() => handleSelectChat(item.id)} className="p-3 rounded-lg transition-colors hover:bg-background-hover cursor-pointer group relative">
                                                    <p className="font-semibold truncate pr-8">{item.title}</p>
                                                    <p className="text-xs text-text-secondary">{item.date}</p>
                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleChatPin(item.id); }} className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-accent-primary bg-background-hover opacity-0 group-hover:opacity-100 hover:bg-background-tertiary" aria-label="Unpin chat"><PinIcon isPinned className="w-4 h-4" /></button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-center text-text-secondary text-sm py-4">No pinned chats found{historySearchTerm && ' matching your search'}.</p>}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Pinned Messages</h4>
                                    {filteredPinnedMessages.length > 0 ? (
                                        <ul className="space-y-3">
                                            {filteredPinnedMessages.map(item => (
                                                <li key={item.message.id} onClick={() => handleSelectPinnedMessage(item)} className="p-3 rounded-lg transition-colors hover:bg-background-hover cursor-pointer text-sm">
                                                    <p className="text-text-secondary truncate">{typeof item.message.text === 'string' ? item.message.text : item.message.responses?.[0]?.imageUrl ? '[Image]' : '[Message]'}</p>
                                                    <p className="text-xs text-text-secondary/70 mt-1">from: <span className="font-semibold">{item.chatTitle}</span></p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-center text-text-secondary text-sm py-4">No pinned messages found{historySearchTerm && ' matching your search'}.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            {messages.length <= 1 && messages.every(m => m.isInitial) ? <ChatWelcome /> : (
                <div className="flex-grow p-4 overflow-y-auto custom-scrollbar min-h-0">
                    <div className="flex flex-col space-y-4">
                        {messages.map((msg, index) => (
                            <ChatMessage 
                                key={msg.id} 
                                message={msg} 
                                isLastMessage={!isLoading && !isRegenerating && index === messages.length - 1}
                                isBeingRegenerated={isRegenerating && index === messages.length - 1}
                                onRegenerate={handleRegenerateResponse}
                                onNavigateResponse={handleNavigateResponse}
                                onTypingComplete={handleTypingComplete}
                                onTogglePin={() => handleToggleMessagePin(msg.id)}
                                onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                            />
                        ))}
                        {isLoading && !isRegenerating && <ChatMessage message={{id: 'typing-indicator', role: 'model', text: <TypingIndicator mode={mode} />}} isLastMessage={false} onRegenerate={() => {}} onNavigateResponse={() => {}} onTypingComplete={() => {}} onTogglePin={() => {}} onToggleReaction={() => {}} />}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}
            
            <div className="p-4 flex-shrink-0">
                {showInactivityPrompts && (
                    <div className="relative max-w-3xl mx-auto w-full mb-4 p-4 rounded-xl bg-background-secondary/50 border border-border-primary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={() => setShowInactivityPrompts(false)}
                            className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors"
                            aria-label="Close suggestions"
                        >
                            <CloseIcon className="w-4 h-4" />
                        </button>
                        <p className="text-sm text-text-secondary mb-2 text-center font-semibold">Still pondering? Maybe try these:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {inactivityPrompts.map((prompt, index) => (
                                <PromptButton key={index} onClick={() => handlePromptClick(prompt)}>
                                    {prompt}
                                </PromptButton>
                            ))}
                        </div>
                    </div>
                )}
                <div className="max-w-3xl mx-auto w-full">
                    <form onSubmit={handleFormSubmit} className="relative w-full">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder={mode === 'text' ? 'Make a wish...' : 'Describe the image you wish to see...'}
                            maxLength={CHAR_LIMIT}
                            className={`w-full bg-background-tertiary text-text-primary placeholder-text-secondary/80 pl-12 pr-14 py-3 rounded-xl border-2 focus:outline-none focus:border-accent-primary transition-colors ${inputBorderColor}`}
                            aria-label="Chat input"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'text' ? 'image' : 'text')}
                            className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-background-hover transition-colors ${mode === 'image' ? 'text-accent-primary' : 'text-text-secondary'}`}
                            aria-label="Toggle image generation mode"
                            disabled={isLoading}
                        >
                            <ImageIcon className="w-5 h-5"/>
                        </button>
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-accent-primary text-accent-text p-2 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed hover:opacity-90 transition-colors"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                    {charCount > 0 && mode === 'text' && (
                        <div className={`text-right text-xs mt-1.5 pr-2 font-mono ${counterColor}`}>
                            {charCount}/{CHAR_LIMIT}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatView;