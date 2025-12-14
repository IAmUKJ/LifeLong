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
        // Avoid duplicates
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

    // Optimistically add message
    setMessages((prev) => [...prev, messageData]);

    try {
      // Save to database
      await api.post(`/chat/${roomId}/message`, { 
        message: messageText,
        messageType: 'text'
      });
      // Emit via socket
      socket.emit('send-message', messageData);
      markAsRead();
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col" style={{ height: '600px' }}>
      <div className="p-4 border-b flex items-center">
        <button onClick={onBack} className="mr-4 text-primary-600 hover:text-primary-700">
          ← Back
        </button>
        <h2 className="text-xl font-semibold">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isOwnMessage = (msg.senderId?.toString() === user?.id?.toString()) || 
                               (msg.senderId?._id?.toString() === user?.id?.toString());
          return (
            <div
              key={index}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-black'
                }`}
              >
                {msg.messageType === 'image' && msg.fileUrl ? (
                  <div>
                    <img src={msg.fileUrl} alt="Shared image" className="max-w-full rounded mb-1" />
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                ) : msg.messageType === 'file' && msg.fileUrl ? (
                  <div>
                    <a 
                      href={msg.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:underline"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{msg.fileName || 'File'}</span>
                    </a>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <>
                    <p>{msg.message}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer flex items-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </label>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={uploading}
        />
        <button
          onClick={sendMessage}
          disabled={uploading || !newMessage.trim()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;

