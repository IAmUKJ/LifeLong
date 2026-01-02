# LifeLong - Patient-Doctor Connection Platform

A comprehensive healthcare platform connecting patients with doctors, featuring medicine management, real-time chat, health reports, and fitness tracking.

## Features

### Core Features
- **Patient-Doctor Connection**: Patients describe symptoms and get matched with relevant doctors
- **Real-time Chat**: One-to-one chat between patients and doctors
- **Medicine Management**: Doctors assign medicines, patients track and mark them as taken
- **Health Reports**: Doctors generate reports, patients can upload reports for AI-powered insights
- **Doctor Verification**: Admin verifies doctors and hospitals before they appear to patients
- **Rating System**: Patients can rate doctors after treatment

### AI-Powered Features ✨ **NEW**
- **Advanced RAG Chatbot**: Retrieval-Augmented Generation using LangChain, Pinecone, and Groq LLaMA 3
- **Medical Document Analysis**: AI-powered analysis of uploaded PDF medical reports
- **Intelligent Health Q&A**: Context-aware responses based on medical knowledge base
- **Source Citations**: Transparent sourcing of medical information
- **Document Learning**: System learns from uploaded medical documents

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **Socket.io** for real-time chat
- **JWT** for authentication
- **bcryptjs** for password hashing
- **LangChain** for AI orchestration
- **Pinecone** vector database
- **Google Generative AI** for embeddings
- **Groq LLaMA 3** for fast inference

### Frontend
- **React.js** with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io-client** for real-time features

## Database Recommendation

**MongoDB** is recommended for this project because:
- Flexible schema for medical records and chat messages
- Excellent integration with Node.js/Express
- Good scalability for growing user base
- JSON-like structure works well with JavaScript/TypeScript

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lifelong
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
```

3. Start the backend server:
```bash
npm run server
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm start
```

### Running Both Servers

From the root directory:
```bash
npm run dev
```

This will start both backend and frontend servers concurrently.

## 🤖 RAG AI Setup (Advanced Features)

The platform includes an advanced AI chatbot powered by RAG (Retrieval-Augmented Generation) technology. To enable these features:

### Prerequisites
- Pinecone account and API key
- Google AI API key
- Groq API key

### RAG Configuration

1. **Get API Keys**:
   - [Pinecone](https://app.pinecone.io/) - Vector database
   - [Google AI Studio](https://makersuite.google.com/app/apikey) - Embeddings
   - [Groq](https://console.groq.com/) - LLaMA 3 model

2. **Update Environment Variables**:
   Add to `backend/.env`:
   ```env
   PINECONE_API_KEY=your-pinecone-api-key
   GOOGLE_API_KEY=your-google-api-key
   GROQ_API_KEY=your-groq-api-key
   ```

3. **Test RAG System**:
   ```bash
   npm run test-rag
   ```

4. **Detailed Setup Guide**:
   See [RAG_SETUP_GUIDE.md](RAG_SETUP_GUIDE.md) for comprehensive instructions.

### RAG Features
- **Medical Document Analysis**: Upload PDFs for AI-powered analysis
- **Intelligent Q&A**: Context-aware health responses
- **Source Citations**: Transparent medical information sourcing
- **Document Learning**: System learns from uploaded content
- **Fallback Mode**: Graceful degradation when AI services unavailable

****🔹 Redis Caching Strategy****

**This project uses Redis as an in-memory cache to improve performance and scalability while keeping MongoDB as the single source of truth.**

**Redis** is integrated selectively—only for read-heavy, repeatable queries—ensuring data correctness and system stability.

🔸 Where **Redis** Is Used
✅ **Authentication**
   -Cached authenticated user profile (GET /auth/me)

   -Reduces repeated database lookups on dashboard reloads

✅ **Doctors Module**
   -Cached public doctor listings with query-based keys

   -Cached doctor profiles (public & private)

   -Selective cache invalidation on profile updates

✅ **Medicines Module**
   -Cached patient medicine dashboard

   -Cached doctor-assigned medicines list

   -Cache invalidation on assignment and status updates

✅ **Chat System**
   -Cached chat list per user with short TTL

   -Messages and real-time events handled via MongoDB + Socket.IO

   -Cache invalidated on new messages to prevent stale unread counts

✅ **AI Module**
   -Cached AI chat history (read-only) with short TTL

   -AI inference, RAG responses, and file analysis are never cached

   -Cache invalidation triggered after AI chat updates

✅ **Payments & Subscriptions**
   -Cached user credit balance

   -Cached active subscription plan

   -Payment creation & verification always hit MongoDB directly

   -Cache invalidation after successful payment verification

## Project Structure

```
LifeLong/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context
│   │   └── utils/      # Utility functions
│   └── public/
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Doctors
- `GET /api/doctors` - Get all verified doctors
- `POST /api/doctors/filter-by-symptoms` - Filter doctors by symptoms
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/patients/list` - Get doctor's patients

### Patients
- `GET /api/patients/profile` - Get patient profile
- `POST /api/patients/connect-doctor/:doctorId` - Connect with doctor
- `GET /api/patients/doctors` - Get connected doctors

### Chat
- `POST /api/chat/room` - Get or create chat room
- `GET /api/chat/list` - Get all chats
- `GET /api/chat/:roomId/messages` - Get chat messages
- `POST /api/chat/:roomId/message` - Send message

### Medicines
- `POST /api/medicines/assign` - Assign medicine (Doctor)
- `GET /api/medicines/patient` - Get patient medicines
- `PUT /api/medicines/:medicineId/taken` - Mark medicine as taken

### Reports
- `POST /api/reports/generate` - Generate report (Doctor)
- `GET /api/reports/patient` - Get patient reports
- `POST /api/reports/upload` - Upload report for AI analysis

### AI & RAG Features 🤖
- `POST /api/ai/analyze` - Analyze symptoms and recommend doctors
- `POST /api/ai/analyze-report` - Analyze uploaded medical reports (RAG-powered)
- `POST /api/ai/chat` - Chat with AI health assistant (RAG-powered)

### Fitness
- `POST /api/fitness/log` - Log fitness activity
- `GET /api/fitness/stats` - Get fitness statistics
- `GET /api/fitness/history` - Get fitness history

### Hospitals
- `GET /api/hospitals` - Get all verified hospitals
- `POST /api/hospitals/ambulance/book` - Book ambulance
- `PUT /api/hospitals/profile` - Update hospital profile

### Admin
- `GET /api/admin/pending` - Get pending verifications
- `PUT /api/admin/verify-doctor/:doctorId` - Verify doctor
- `PUT /api/admin/verify-hospital/:hospitalId` - Verify hospital

### Ratings
- `POST /api/ratings/rate-doctor` - Rate doctor
- `GET /api/ratings/doctor/:doctorId` - Get doctor ratings

## User Roles

1. **Patient**: Can search doctors, connect, chat, track medicines, view reports, and track fitness
2. **Doctor**: Can view patients, chat, assign medicines, generate reports (requires admin verification)
3. **Hospital**: Can register and provide ambulance services (requires admin verification)
4. **Admin**: Can verify doctors and hospitals

## Future Enhancements

- Integration with AI services for chatbot insights
- File upload to cloud storage (AWS S3, Cloudinary)
- Email notifications
- Push notifications
- Video consultation
- Payment integration
- Advanced analytics dashboard

## License

ISC

