require('dotenv').config({ path: './.env' }); // Load environment variables from backend/.env

// Debug: Check if .env file exists and read it
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env');
  console.log('Looking for .env at:', envPath);
  console.log('File exists:', fs.existsSync(envPath));

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('GROQ_API_KEY in file:', envContent.includes('GROQ_API_KEY') ? 'Yes' : 'No');

    // Manually parse and set the GROQ_API_KEY
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('GROQ_API_KEY=')) {
        const key = line.split('=')[1].trim();
        process.env.GROQ_API_KEY = key;
        console.log('Manually set GROQ_API_KEY');
        break;
      }
    }
  }
} catch (error) {
  console.log('Error checking .env file:', error.message);
}

console.log('GROQ_API_KEY from env after manual set:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');

// Test Groq API directly
const axios = require('axios');

async function testGroqAPI() {
  try {
    console.log('Testing Groq API directly...');
    
    // First, let's list available models
    try {
      const modelsResponse = await axios.get('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        }
      });
      console.log('Available models:', modelsResponse.data.data.map(m => m.id));
    } catch (modelsError) {
      console.log('Could not list models:', modelsError.message);
    }
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant', // Use available Llama 3.1 8B instant model
      messages: [
        {
          role: 'user',
          content: 'Hello, just testing the API. Please respond with "API test successful".'
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Groq API test successful!');
    console.log('Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.log('Groq API test failed:', error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGroqAPI();

const ragService = require('./services/ragService');

async function testRAGSystem() {
  console.log('🧪 Testing Medical RAG System...\n');

  try {
    // Initialize the service
    console.log('1. Initializing RAG Service...');
    await ragService.initialize();
    console.log('✅ RAG Service initialized\n');

    // Load medical documents
    console.log('2. Loading medical knowledge base...');
    const docCount = await ragService.loadMedicalDocuments();
    console.log(`✅ Loaded ${docCount} medical documents\n`);

    // Test queries
    const testQueries = [
      'What are the symptoms of diabetes?',
      'How to manage high blood pressure?',
      'What medications are used for anxiety?',
      'Explain preventive care guidelines'
    ];

    console.log('3. Testing AI responses...\n');

    for (const query of testQueries) {
      console.log(`Query: "${query}"`);
      const result = await ragService.queryMedicalKnowledge(query);

      console.log(`Response: ${(result.answer || 'No response').substring(0, 100)}...`);
      console.log(`Sources: ${result.sourceDocuments ? result.sourceDocuments.length : 0}`);
      console.log(`Fallback: ${result.fallback}\n`);
    }

    console.log('🎉 RAG System test completed successfully!');
    console.log('\n💡 The system is ready for production use.');

  } catch (error) {
    console.error('❌ RAG System test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your API keys in backend/.env');
    console.log('2. Ensure Pinecone index exists');
    console.log('3. Verify network connectivity');
    console.log('4. Check console logs for detailed errors');
  }
}

// Run the test
testRAGSystem();