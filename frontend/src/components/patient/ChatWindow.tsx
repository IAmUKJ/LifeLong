import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  roomId: string;
  onBack: () => void;
  onMessageSent: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, onBack, onMessageSent }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /* =========================
     SOCKET SETUP
  ========================= */
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const socket = io(API_URL.replace('/api', ''), {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id);
      socket.emit('joinRoom', roomId);
    });

    socket.on('receiveMessage', ({ message }) => {
      console.log('📩 Received message:', message);
      setMessages(prev => [...prev, message]);
      
      // Check if user is scrolled up when new message arrives
      if (isUserScrolledUp) {
        setUnreadCount(prevCount => prevCount + 1);
      } else {
        markAsRead();
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
    });

    fetchMessages();
    markAsRead();

    return () => {
      socket.off('receiveMessage');
      socket.disconnect();
    };
  }, [roomId]);

  /* =========================
     SCROLL DETECTION
  ========================= */
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setIsUserScrolledUp(!isAtBottom);
    
    // If user scrolls to bottom, mark as read and reset unread count
    if (isAtBottom && unreadCount > 0) {
      setUnreadCount(0);
      markAsRead();
    }
  };

  /* =========================
     SCROLL TO BOTTOM FUNCTION
  ========================= */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
    setIsUserScrolledUp(false);
    markAsRead();
  };

  /* =========================
     FETCH HISTORY
  ========================= */
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${roomId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  /* =========================
     MARK AS READ
  ========================= */
  const markAsRead = async () => {
    try {
      await api.put(`/chat/${roomId}/read`);
      onMessageSent();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  /* =========================
     SEND TEXT MESSAGE
  ========================= */
  const sendMessage = async () => {
    if (!newMessage.trim() || uploading) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await api.post(`/chat/${roomId}/message`, {
        message: text,
        messageType: 'text'
      });
      onMessageSent();
    } catch (err) {
      console.error('Send failed', err);
      setNewMessage(text);
    }
  };

  /* =========================
     FILE / IMAGE UPLOAD
  ========================= */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const messageType = file.type.startsWith('image/')
      ? 'image'
      : 'file';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('messageType', messageType);
    formData.append('fileName', file.name);
    formData.append('message', '');

    setUploading(true);

    try {
      await api.post(`/chat/${roomId}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onMessageSent();
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to send file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* =========================
     AUTO SCROLL
  ========================= */
  useEffect(() => {
    if (!isUserScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="flex flex-col h-full max-h-screen bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 sm:px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onBack}
            className="hover:bg-white/20 rounded-full p-2 transition-all duration-200 active:scale-95 flex items-center justify-center"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-bold text-lg shadow-lg">
                💬
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg sm:text-xl tracking-tight">Live Chat</h2>
              <p className="text-xs sm:text-sm text-blue-100 opacity-90">Active now</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hover:bg-white/20 rounded-full p-2 transition-all duration-200 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="hover:bg-white/20 rounded-full p-2 transition-all duration-200 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent relative"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine =
              msg.senderId?.toString() === user?.id?.toString() ||
              msg.senderId?._id?.toString() === user?.id?.toString();

            return (
              <div
                key={idx}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex gap-2 max-w-[85%] sm:max-w-md md:max-w-lg ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md">
                      {msg.senderId?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1">
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
                        isMine 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.messageType === 'image' && msg.fileUrl ? (
                        <div className="rounded-lg overflow-hidden">
                          <img
                            src={msg.fileUrl}
                            alt="shared"
                            className="max-w-full h-auto rounded-lg hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : msg.messageType === 'file' && msg.fileUrl ? (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 ${isMine ? 'text-white' : 'text-blue-600'} hover:underline group`}
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium truncate max-w-[200px]">{msg.fileName || 'Download file'}</span>
                        </a>
                      ) : (
                        <p className="text-sm sm:text-base leading-relaxed break-words">{msg.message}</p>
                      )}
                    </div>

                    <div className={`text-xs text-slate-500 px-2 ${isMine ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isMine && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md">
                      {user?.name?.[0]?.toUpperCase() || 'Y'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        
        {/* Unread Messages Indicator - WhatsApp Style */}
        {unreadCount > 0 && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <button
              onClick={scrollToBottom}
              className="pointer-events-auto bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 transition-all duration-200 active:scale-95 animate-bounce-subtle"
              aria-label="Scroll to new messages"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{unreadCount}</span>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex gap-2 sm:gap-3 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            hidden
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2.5 sm:p-3 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group"
            disabled={uploading}
            aria-label="Attach file"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="w-full border-2 border-slate-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 pr-12 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={uploading}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <button
            onClick={sendMessage}
            disabled={uploading || !newMessage.trim()}
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg active:scale-95 flex items-center justify-center min-w-[44px] sm:min-w-[52px]"
            aria-label="Send message"
          >
            {uploading ? (
              <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {uploading && (
          <div className="mt-2 text-xs sm:text-sm text-blue-600 flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Uploading...</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;