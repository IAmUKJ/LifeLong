import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

interface ChatListProps {
  selectedChatId?: string | null;
  onChatSelected?: () => void;
}

interface Participant {
  userId: {
    _id: string;
    name: string;
  };
}

interface Chat {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onChatSelected }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, hasActivePlan } = useAuth();

  const fetchChats = useCallback(async () => {
  if (!hasActivePlan) {
    setChats([]);
    setIsLoading(false);
    return;
  }

  try {
    setIsLoading(true);
    const response = await api.get('/chat/list');
    setChats(response.data);
  } catch (error) {
    console.error('Error fetching chats:', error);
  } finally {
    setIsLoading(false);
  }
}, [hasActivePlan]);


  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      const chatExists = chats.some(chat => chat._id === selectedChatId);
      if (chatExists) {
        setSelectedChat(selectedChatId);
      }
    }
  }, [selectedChatId, chats]);

  const handleChatSelect = useCallback(async (chatId: string) => {
  if (!hasActivePlan) return;

  setSelectedChat(chatId);
  try {
    await api.put(`/chat/${chatId}/read`);
    fetchChats();
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
}, [fetchChats, hasActivePlan]);


  const handleBack = useCallback(() => {
    setSelectedChat(null);
    fetchChats();
    if (onChatSelected) onChatSelected();
  }, [fetchChats, onChatSelected]);

  // Memoized valid chats to prevent recalculation
  const validChats = useMemo(() => {
    return chats.filter(chat => {
      if (!chat || !chat.participants || !Array.isArray(chat.participants)) {
        return false;
      }
      
      const otherParticipant = chat.participants.find(
        (p: any) => p && p.userId && p.userId._id && p.userId._id !== user?.id
      );
      
      return otherParticipant && otherParticipant.userId && otherParticipant.userId._id;
    });
  }, [chats, user?.id]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  if (selectedChat && hasActivePlan) {
    return (
      <ChatWindow
        roomId={selectedChat}
        onBack={handleBack}
        onMessageSent={fetchChats}
      />
    );
  }
  if (!hasActivePlan) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-10 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c0-3.866 3.134-7 7-7M5 12h14m-7 7a7 7 0 01-7-7"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Chat Locked
      </h2>

      <p className="text-gray-600 max-w-md mb-6">
        Your subscription has expired or you don’t have an active plan.
        Upgrade your plan to chat with doctors.
      </p>

      <button
        onClick={() => window.location.href = "/subscription"}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
      >
        Upgrade Plan
      </button>
    </div>
  );
}

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Messages</h2>
              <p className="text-sm text-blue-100">{validChats.length} conversation{validChats.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat List */}
          {validChats.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {validChats.map((chat) => {
                const otherParticipant = chat.participants.find(
                  (p: any) => p.userId._id !== user?.id
                );
                const unreadCount = chat.unreadCount || 0;
                
                return (
                  <button
                      key={chat._id}
                      onClick={() => handleChatSelect(chat._id)}
                      disabled={!hasActivePlan}
                      className={`w-full p-4 text-left transition-colors duration-150
                        ${
                          hasActivePlan
                            ? "hover:bg-blue-50"
                            : "cursor-not-allowed opacity-60"
                        }
                      `}
                    >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                        {otherParticipant?.userId?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherParticipant?.userId?.name || 'Unknown'}
                          </h3>
                          {chat.lastMessageTime && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatDate(chat.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                Connect with a doctor to start a conversation. Your messages will appear here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatList;