# Medical Assistant RAG Setup Guide

This guide will help you set up the advanced RAG (Retrieval-Augmented Generation) Medical Assistant Chatbot.

## 🚀 What's New

The chatbot now uses cutting-edge AI technology:
- **LangChain**: Orchestrates the AI pipeline
- **Pinecone**: Vector database for document storage and retrieval
- **Google Embeddings**: Converts medical text to vector representations
- **Groq LLaMA 3**: Fast, accurate AI responses
- **PDF Processing**: Automatic medical document analysis

## 📋 Prerequisites

1. **API Keys Required**:
   - Pinecone API Key
   - Google AI API Key
   - Groq API Key

2. **Node.js Dependencies**:
   - All required packages are already installed

## 🔧 Setup Steps

### 1. Get API Keys

#### Pinecone Setup:
1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create a new account or sign in
3. Create a new project
4. Get your API key from the dashboard

#### Google AI Setup:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for use in the application

#### Groq Setup:
1. Go to [Groq Console](https://console.groq.com/)
2. Create an account
3. Generate an API key

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and add your API keys:
   ```env
   PINECONE_API_KEY=your-actual-pinecone-api-key
   GOOGLE_API_KEY=your-actual-google-api-key
   GROQ_API_KEY=your-actual-groq-api-key
   ```

### 3. Start the Application

1. **Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm start
   ```

## 🧪 Testing the RAG System

### 1. Basic Chat Functionality
- Ask health-related questions
- The AI will provide responses based on the medical knowledge base

### 2. Document Upload
- Upload PDF medical documents
- The system will process and analyze them
- Future queries can reference the uploaded content

### 3. Advanced Queries
Try asking questions like:
- "What are the symptoms of diabetes?"
- "How should I manage high blood pressure?"
- "What medications are used for anxiety?"
- "Explain the preventive care guidelines"

## 🔍 How It Works

### RAG Pipeline:
1. **Document Processing**: Medical documents are converted to vector embeddings
2. **Vector Storage**: Embeddings stored in Pinecone for fast retrieval
3. **Query Processing**: User questions are converted to vectors
4. **Retrieval**: Most relevant medical information is retrieved
5. **Generation**: LLaMA 3 generates context-aware responses
6. **Source Citation**: Responses include source references

### Fallback System:
- If external services are unavailable, the system uses keyword-based responses
- Users are notified when fallback mode is active
- Core functionality remains available

## 📊 Features

### Enhanced Capabilities:
- **Context Awareness**: Responses consider conversation history
- **Source Transparency**: Shows which documents/knowledge informed the answer
- **Medical Accuracy**: Responses based on established medical guidelines
- **Document Learning**: System learns from uploaded medical documents
- **Emergency Detection**: Identifies and prioritizes emergency situations

### User Interface:
- File upload with drag-and-drop support
- Real-time chat interface
- Source citations for transparency
- Fallback mode indicators
- Loading states and error handling

## 🛠️ Troubleshooting

### Common Issues:

1. **API Key Errors**:
   - Verify all API keys are correctly set in `.env`
   - Check API key permissions and quotas

2. **Pinecone Connection Issues**:
   - Ensure Pinecone index is created and accessible
   - Check network connectivity

3. **Document Processing Errors**:
   - Verify PDF files are not corrupted
   - Check file size limits (10MB max)

4. **Slow Responses**:
   - First query may be slower due to initialization
   - Subsequent queries use cached embeddings

### Debug Mode:
Set `NODE_ENV=development` in `.env` for detailed logging.

## 🔒 Security & Privacy

- Medical documents are processed securely
- API keys are stored server-side only
- No medical data is permanently stored
- All communications use HTTPS
- Compliant with medical data handling best practices

## 📈 Performance Optimization

- Vector embeddings cached for faster responses
- Chunked document processing for large files
- Asynchronous processing for non-blocking operations
- Connection pooling for database operations

## 🚀 Future Enhancements

- Multi-language support
- Integration with medical APIs
- Advanced document analysis
- Voice input/output
- Integration with electronic health records

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all API keys are configured
3. Test with simple queries first
4. Check network connectivity

The system includes comprehensive error handling and will gracefully fall back to basic functionality if advanced features are unavailable.