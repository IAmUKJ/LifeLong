import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

interface ChatListProps {
  selectedChatId?: string | null;
  onChatSelected?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onChatSelected }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      // Only set selected chat if it exists in the chats list
      const chatExists = chats.some(chat => chat._id === selectedChatId);
      if (chatExists) {
        setSelectedChat(selectedChatId);
      }
    }
  }, [selectedChatId, chats]);

  useEffect(() => {
    if (selectedChatId) {
      setSelectedChat(selectedChatId);
    }
  }, [selectedChatId]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat/list');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  if (selectedChat) {
    return (
      <ChatWindow
        roomId={selectedChat}
        onBack={() => {
          setSelectedChat(null);
          fetchChats();
          if (onChatSelected) onChatSelected();
        }}
        onMessageSent={fetchChats}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Your Chats</h2>
      </div>
      <div className="divide-y">
        {chats.map((chat) => {
          // Skip invalid chats
          if (!chat || !chat.participants || !Array.isArray(chat.participants)) {
            return null;
          }
          
          const otherParticipant = chat.participants.find(
            (p: any) => p && p.userId && p.userId._id && p.userId._id !== user?.id
          );
          const unreadCount = chat.unreadCount || 0;
          
          // Skip chats where other participant is not found or invalid
          if (!otherParticipant || !otherParticipant.userId || !otherParticipant.userId._id) {
            return null;
          }
          
          return (
            <button
              key={chat._id}
              onClick={() => {
                setSelectedChat(chat._id);
                // Mark as read when opening
                api.put(`/chat/${chat._id}/read`).then(() => fetchChats());
              }}
              className="w-full p-4 text-left hover:bg-gray-50 relative"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">
                      {otherParticipant?.userId?.name || 'Unknown'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{chat.lastMessage || 'No messages yet'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {chats.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No chats yet. Connect with a doctor to start chatting.
        </div>
      )}
    </div>
  );
};

export default ChatList;

