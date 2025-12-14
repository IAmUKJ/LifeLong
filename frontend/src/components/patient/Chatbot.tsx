import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    content: string;
    source: string;
    type: string;
  }>;
  fallback?: boolean;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '🤖 **Advanced AI Health Assistant**\n\nPowered by RAG (Retrieval-Augmented Generation) technology!\n\nI can help you with:\n\n📄 **Document Analysis**: Upload and analyze medical reports using AI\n💬 **Intelligent Q&A**: Answer complex health questions using medical knowledge base\n🏥 **Clinical Insights**: Provide evidence-based health information\n🔍 **Source Citations**: Show you where my information comes from\n📚 **Continuous Learning**: Learn from uploaded medical documents\n\n**New Features**:\n• Real-time medical document processing\n• Context-aware responses using vector search\n• Fallback protection for reliable answers\n• Source transparency for medical accuracy\n\nUpload a medical report or ask me any health-related question!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: '🤖 **New Chat Session Started**\n\nI\'m ready for a new conversation! Upload a medical report or ask me any health-related question.',
        timestamp: new Date()
      }
    ]);
    setUploadedFile(null);
  };

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.get('/ai/chat-history');

      if (response.data.chats && response.data.chats.length > 0) {
        const latestChat = response.data.chats[0];
        setSessionId(latestChat.sessionId);

        const historyMessages: Message[] = latestChat.messages.map((msg: any, index: number) => ({
          id: `${latestChat.sessionId}_${index}`,
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          sources: msg.sources || [],
          fallback: msg.fallback || false
        }));

        setMessages(historyMessages);
      } else {
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `Uploaded file: ${file.name}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const analyzeReport = async () => {
    if (!uploadedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('report', uploadedFile);
      formData.append('sessionId', sessionId);

      const response = await api.post('/ai/analyze-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.data.analysis || 'I\'ve analyzed your report. Here are the key insights...',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: 'Sorry, I couldn\'t analyze your report. Please try again or upload a different file.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setUploadedFile(null);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: inputMessage,
        context: messages.slice(-5).map(m => m.content),
        sessionId: sessionId
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.data.response || 'I understand. How else can I help you?',
        timestamp: new Date(),
        sources: response.data.sources || [],
        fallback: response.data.fallback || false
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <motion.div 
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Health Assistant</h2>
              <p className="text-blue-100 text-sm mt-1">Powered by Advanced RAG Technology</p>
              {isLoadingHistory && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-white/90 flex items-center"
                >
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                  Loading chat history...
                </motion.div>
              )}
            </div>
          </div>
          <motion.button
            onClick={startNewSession}
            disabled={isLoadingHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-semibold text-sm transition-colors shadow-lg disabled:opacity-50"
          >
            ✨ New Chat
          </motion.button>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Upload Report</span>
          </motion.button>
          
          <AnimatePresence>
            {uploadedFile && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
              >
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700 font-medium">{uploadedFile.name}</span>
                <motion.button
                  onClick={analyzeReport}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-semibold transition-colors"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-xs text-gray-600 mt-2 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Supported formats: PDF, JPG, PNG, DOC, DOCX
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-2xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <motion.div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {message.type === 'user' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </motion.div>

                {/* Message Bubble */}
                <div
                  className={`px-5 py-3 rounded-2xl shadow-md ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white text-gray-800 border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                  
                  {message.fallback && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 flex items-start space-x-2"
                    >
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Using basic response mode - advanced AI features unavailable</span>
                    </motion.div>
                  )}
                  
                  {message.sources && message.sources.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs"
                    >
                      <div className="font-semibold text-blue-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Sources:
                      </div>
                      {message.sources.slice(0, 2).map((source, idx) => (
                        <div key={idx} className="text-blue-700 mb-1 pl-5 relative">
                          <span className="absolute left-0">•</span>
                          {source.title} <span className="text-blue-500">({source.type})</span>
                        </div>
                      ))}
                      {message.sources.length > 2 && (
                        <div className="text-blue-600 pl-5 font-medium">
                          ... and {message.sources.length - 2} more sources
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-end space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-green-600 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-green-600 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-green-600 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about health, symptoms, or wellness tips..."
            className="flex-1 px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            disabled={isLoading}
          />
          <motion.button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <span>Send</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Chatbot;