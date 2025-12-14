import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

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

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

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
        // Use the most recent chat session
        const latestChat = response.data.chats[0];
        setSessionId(latestChat.sessionId);

        // Convert stored messages to component format
        const historyMessages: Message[] = latestChat.messages.map((msg: any, index: number) => ({
          id: `${latestChat.sessionId}_${index}`,
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          sources: msg.sources || [],
          fallback: msg.fallback || false
        }));

        // Replace initial welcome message with chat history
        setMessages(historyMessages);
      } else {
        // Generate new session ID for new chat
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Generate new session ID if history loading fails
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
      formData.append('sessionId', sessionId); // Include session ID for chat history

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
        context: messages.slice(-5).map(m => m.content), // Send last 5 message contents for context
        sessionId: sessionId // Include session ID for chat history
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
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">AI Health Chatbot</h2>
            <p className="text-gray-600 mt-1">Upload reports for analysis or ask health-related questions</p>
            {isLoadingHistory && (
              <div className="mt-2 text-sm text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Loading chat history...
              </div>
            )}
          </div>
          <button
            onClick={startNewSession}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            disabled={isLoadingHistory}
          >
            New Chat
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📎 Upload Report
          </button>
          {uploadedFile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{uploadedFile.name}</span>
              <button
                onClick={analyzeReport}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: PDF, JPG, PNG, DOC, DOCX
        </p>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              {message.fallback && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                  ⚠️ Using basic response mode - advanced AI features unavailable
                </div>
              )}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <div className="font-semibold text-blue-800 mb-1">📚 Sources:</div>
                  {message.sources.slice(0, 2).map((source, index) => (
                    <div key={index} className="text-blue-700 mb-1">
                      • {source.title} ({source.type})
                    </div>
                  ))}
                  {message.sources.length > 2 && (
                    <div className="text-blue-600">
                      ... and {message.sources.length - 2} more sources
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about health, upload reports, or get wellness tips..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;