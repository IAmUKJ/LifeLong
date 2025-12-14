import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  roomId: string;
  onBack: () => void;
  onMessageSent: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, onBack, onMessageSent }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL.replace('/api', ''));
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.emit('join-room', roomId);
    console.log('ChatWindow joined room:', roomId);
    
    newSocket.on('receive-message', (data) => {
      console.log('ChatWindow received message:', data);
      setMessages((prev) => {
        const exists = prev.some(msg => 
          msg.timestamp === data.timestamp && 
          msg.senderId === data.senderId && 
          msg.message === data.message
        );
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
      markAsRead();
    });

    fetchMessages();
    markAsRead();

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const markAsRead = async () => {
    try {
      await api.put(`/chat/${roomId}/read`);
      onMessageSent();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${roomId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        sendFile(file, 'image');
      } else {
        sendFile(file, 'file');
      }
    }
  };

  const sendFile = async (file: File, messageType: 'image' | 'file') => {
    if (!socket) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageType', messageType);
      formData.append('fileName', file.name);
      formData.append('message', '');

      const response = await api.post(`/chat/${roomId}/message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const messageData = {
        roomId,
        senderId: user?.id,
        message: messageType === 'image' ? '📷 Image' : '📎 File',
        messageType,
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, messageData]);
      socket.emit('send-message', messageData);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onMessageSent();
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !socket.connected) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const messageData = {
      roomId,
      senderId: user?.id,
      message: messageText,
      messageType: 'text',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, messageData]);

    try {
      await api.post(`/chat/${roomId}/message`, { 
        message: messageText,
        messageType: 'text'
      });
      socket.emit('send-message', messageData);
      markAsRead();
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.slice(0, -1));
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden" 
      style={{ height: '600px' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex items-center space-x-4 shadow-md">
        <motion.button 
          onClick={onBack} 
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
          className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <div className="flex items-center space-x-3 flex-1">
          <motion.div 
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white">Live Chat</h2>
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className="text-blue-100 text-sm">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwnMessage = (msg.senderId?.toString() === user?.id?.toString()) || 
                                 (msg.senderId?._id?.toString() === user?.id?.toString());
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <motion.div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                      isOwnMessage 
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </motion.div>

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-md ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : 'bg-white text-gray-800 border border-gray-100'
                    }`}
                  >
                    {msg.messageType === 'image' && msg.fileUrl ? (
                      <div>
                        <motion.img 
                          src={msg.fileUrl} 
                          alt="Shared image" 
                          className="max-w-full rounded-xl mb-2 shadow-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.02 }}
                        />
                        <p className="text-xs opacity-70 flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </p>
                      </div>
                    ) : msg.messageType === 'file' && msg.fileUrl ? (
                      <div>
                        <motion.a 
                          href={msg.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-center space-x-2 p-3 rounded-xl border-2 border-dashed mb-2 ${
                            isOwnMessage ? 'border-white/30 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isOwnMessage ? 'bg-white/20' : 'bg-blue-100'}`}>
                            <svg className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{msg.fileName || 'File'}</p>
                            <p className="text-xs opacity-70">Click to download</p>
                          </div>
                        </motion.a>
                        <p className="text-xs opacity-70 flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-2 flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-end space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-md">
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-blue-600 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                  <span className="text-sm text-gray-600 ml-2">Uploading...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            id="file-input"
          />
          <motion.label
            htmlFor="file-input"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 cursor-pointer flex items-center transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </motion.label>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            disabled={uploading}
          />
          
          <motion.button
            onClick={sendMessage}
            disabled={uploading || !newMessage.trim()}
            whileHover={{ scale: uploading || !newMessage.trim() ? 1 : 1.05 }}
            whileTap={{ scale: uploading || !newMessage.trim() ? 1 : 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <span>{uploading ? 'Sending...' : 'Send'}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;