const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

class MedicalRAGService {
  constructor() {
    this.isInitialized = false;
    this.medicalDocuments = []; // Store documents for simple search
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.googleApiKey = process.env.GOOGLE_API_KEY;
    console.log('RAG Service initialized with Groq API key:', this.groqApiKey ? 'Present' : 'Missing');
    console.log('RAG Service initialized with Google API key:', this.googleApiKey ? 'Present' : 'Missing');
  }

  async initialize() {
    try {
      // For now, just mark as initialized
      // TODO: Add full Pinecone and LangChain initialization when API keys are available
      this.isInitialized = true;
      console.log('Medical RAG Service initialized (basic mode)');
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  async loadMedicalDocuments() {
    try {
      // Load sample medical documents (you can expand this)
      const sampleDocuments = [
        {
          title: 'General Medical Guidelines',
          content: `
Medical Guidelines and Best Practices:

1. Preventive Care:
   - Regular health screenings based on age and risk factors
   - Annual physical examinations
   - Age-appropriate vaccinations
   - Cancer screenings (mammograms, colonoscopies, etc.)

2. Chronic Disease Management:
   - Diabetes: Regular blood sugar monitoring, HbA1c testing every 3-6 months
   - Hypertension: Home blood pressure monitoring, lifestyle modifications
   - Heart Disease: Lipid profile monitoring, regular cardiac evaluations

3. Medication Management:
   - Take medications exactly as prescribed
   - Never stop medications without consulting healthcare provider
   - Report side effects immediately
   - Keep updated medication list

4. Emergency Situations:
   - Call emergency services for chest pain, difficulty breathing, severe bleeding
   - Stroke symptoms: sudden numbness, confusion, trouble speaking
   - Heart attack: chest pain, shortness of breath, nausea

5. Healthy Lifestyle:
   - Balanced diet rich in fruits, vegetables, whole grains, and lean proteins
   - Regular exercise: 150 minutes moderate aerobic + 2x strength training weekly
   - Adequate sleep: 7-9 hours nightly
   - Stress management and mental health support
          `
        },
        {
          title: 'Common Medical Conditions',
          content: `
Common Medical Conditions and Management:

1. Respiratory Conditions:
   - Asthma: Use inhalers as prescribed, avoid triggers, regular check-ups
   - COPD: Smoking cessation, pulmonary rehabilitation, oxygen therapy if needed
   - Pneumonia: Antibiotics, rest, hydration, vaccination prevention

2. Cardiovascular Conditions:
   - Coronary Artery Disease: Lifestyle changes, medications, possible procedures
   - Heart Failure: Fluid management, medications, regular monitoring
   - Arrhythmias: Rate/rhythm control medications, possible device therapy

3. Metabolic Disorders:
   - Diabetes Type 2: Diet, exercise, oral medications, insulin if needed
   - Thyroid Disorders: Hormone replacement, regular thyroid function tests
   - Metabolic Syndrome: Weight management, blood pressure control

4. Mental Health Conditions:
   - Depression: Therapy, medications, lifestyle changes, support systems
   - Anxiety Disorders: Cognitive behavioral therapy, medications, relaxation techniques
   - Bipolar Disorder: Mood stabilizers, therapy, lifestyle management

5. Gastrointestinal Conditions:
   - GERD: Dietary changes, medications, lifestyle modifications
   - Irritable Bowel Syndrome: Dietary management, stress reduction
   - Inflammatory Bowel Disease: Medications, regular monitoring, nutrition support
          `
        },
        {
          title: 'Medication Safety and Guidelines',
          content: `
Medication Safety and Guidelines:

1. General Principles:
   - Read medication labels carefully
   - Take medications with food or water as directed
   - Use pill organizers for multiple medications
   - Set reminders for medication times

2. Drug Interactions:
   - Inform all healthcare providers of all medications
   - Include over-the-counter medications and supplements
   - Check for interactions before starting new medications
   - Consult pharmacist for drug interaction questions

3. Side Effects Management:
   - Know common side effects of your medications
   - Report unexpected side effects to healthcare provider
   - Don't stop medications abruptly without medical advice
   - Keep emergency contact information handy

4. Storage and Disposal:
   - Store medications in cool, dry place
   - Keep medications out of reach of children
   - Dispose of expired medications properly
   - Don't share prescription medications

5. Special Considerations:
   - Pregnancy and breastfeeding: Consult healthcare provider
   - Driving and operating machinery: Check medication warnings
   - Alcohol consumption: Check for interactions
   - Dietary restrictions: Some medications require specific diets
          `
        }
      ];

      // Convert to simple document format
      for (const doc of sampleDocuments) {
        this.medicalDocuments.push({
          title: doc.title,
          content: doc.content,
          type: 'guidelines'
        });
      }

      console.log(`Loaded ${this.medicalDocuments.length} medical documents into knowledge base`);

      return this.medicalDocuments.length;
    } catch (error) {
      console.error('Error loading medical documents:', error);
      throw error;
    }
  }

  async queryMedicalKnowledge(query, context = []) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // For now, use a simple keyword-based approach with the medical knowledge
      const lowerQuery = query.toLowerCase();

      // Improved keyword matching for medical queries
      const medicalKeywords = [
        'diabetes', 'blood', 'pressure', 'hypertension', 'heart', 'cancer', 'medication',
        'treatment', 'symptoms', 'diagnosis', 'test', 'results', 'report', 'analysis',
        'health', 'medical', 'doctor', 'patient', 'condition', 'disease', 'therapy',
        'prevention', 'screening', 'vaccine', 'exercise', 'diet', 'nutrition', 'mental',
        'anxiety', 'depression', 'stress', 'emergency', 'pain', 'fever', 'infection'
      ];

      const queryWords = lowerQuery.split(' ');
      const hasMedicalKeyword = medicalKeywords.some(keyword =>
        queryWords.some(word => word.includes(keyword) || keyword.includes(word))
      );

      // Search through our medical documents for relevant information
      let relevantContent = '';
      let sources = [];

      if (hasMedicalKeyword) {
        // If query contains medical keywords, search all documents
        for (const doc of this.medicalDocuments || []) {
          relevantContent += doc.content + '\n\n';
          sources.push({
            title: doc.title,
            content: doc.content.substring(0, 200) + '...',
            source: 'medical-knowledge-base',
            type: doc.type
          });
        }
      } else {
        // Fallback to original simple matching
        for (const doc of this.medicalDocuments || []) {
          if (doc.content.toLowerCase().includes(lowerQuery.split(' ')[0])) {
            relevantContent += doc.content + '\n\n';
            sources.push({
              title: doc.title,
              content: doc.content.substring(0, 200) + '...',
              source: 'medical-knowledge-base',
              type: doc.type
            });
          }
        }
      }

      if (relevantContent && this.groqApiKey) {
        console.log('Using Groq API for query:', query.substring(0, 50) + '...');
        // Use Groq API directly to generate a response
        const prompt = `You are a medical assistant. Based on the following medical information, answer the question accurately and helpfully. If the information is insufficient, provide general medical guidance but advise consulting healthcare professionals.

Question: "${query}"

Medical Information:
${relevantContent}

Provide a clear, concise answer based on the medical information provided.`;

        try {
          const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
              model: 'llama-3.1-8b-instant', // Use available Llama 3.1 8B instant model
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.1,
              max_tokens: 1000
            }, {
              headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json'
              }
            });

          return {
            answer: response.data.choices[0].message.content,
            sourceDocuments: sources.slice(0, 3),
            fallback: false
          };
        } catch (apiError) {
          console.log('Groq API error:', apiError.message);
          if (apiError.response) {
            console.log('Error status:', apiError.response.status);
            console.log('Error data:', apiError.response.data);
          }
          console.log('Falling back to basic response');
        }
      }

      // Fallback to basic response
      const fallbackAnswer = await this.fallbackResponse(query);
      return {
        answer: fallbackAnswer,
        sourceDocuments: [],
        fallback: true
      };

    } catch (error) {
      console.error('Error querying medical knowledge:', error);
      const fallbackAnswer = await this.fallbackResponse(query);
      return {
        answer: fallbackAnswer,
        sourceDocuments: [],
        fallback: true
      };
    }
  }

  async fallbackResponse(query) {
    // Simple keyword-based fallback (similar to original implementation)
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('emergency') || lowerQuery.includes('urgent')) {
      return "🚨 MEDICAL EMERGENCY ALERT: If you're experiencing a medical emergency, call emergency services immediately (911 in the US) or go to the nearest emergency room. This AI cannot provide emergency medical care.";
    }

    if (lowerQuery.includes('diabetes')) {
      return "Diabetes management involves blood sugar monitoring, healthy eating, regular exercise, and medications as prescribed by your healthcare provider. Regular check-ups and HbA1c testing are essential. Please consult your doctor for personalized diabetes care.";
    }

    if (lowerQuery.includes('hypertension') || lowerQuery.includes('blood pressure')) {
      return "High blood pressure should be managed through lifestyle changes (diet, exercise, stress reduction) and medications as prescribed. Regular monitoring and doctor visits are crucial for blood pressure management.";
    }

    return "I'm currently experiencing technical difficulties with advanced medical queries. For accurate medical information, please consult qualified healthcare professionals. You can also try rephrasing your question or upload medical documents for analysis.";
  }

  async analyzeMedicalReport(file) {
    try {
      // For PDF files, process through RAG system
      if (file.mimetype === 'application/pdf') {
        const analysis = await this.processUploadedPDF(file.path);

        // Extract text for AI analysis
        const pdfText = analysis.text;

        if (this.groqApiKey && pdfText.length > 100) {
          try {
            // Use Groq to analyze the medical report
            const prompt = `You are a medical AI assistant. Analyze the following medical report text and provide a comprehensive summary. Focus on:

1. Key findings and results
2. Normal vs abnormal values (if applicable)
3. Clinical significance
4. Recommendations or next steps
5. Any concerning findings that require immediate attention

Medical Report Content:
${pdfText.substring(0, 4000)}  // Limit text length for API

Please provide a clear, structured analysis suitable for patient understanding. Include appropriate medical disclaimers.`;

            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
              model: 'llama-3.1-8b-instant', // Use available Llama 3.1 8B instant model
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.1,
              max_tokens: 1000
            }, {
              headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json'
              },
            });

            const aiAnalysis = response.data.choices[0].message.content;

            return `
🩺 **AI-Powered Medical Report Analysis**

📄 **Document Processed**: ${analysis.title}
📊 **Technical Summary**:
• Total Pages: ${analysis.pages}
• Content Length: ${analysis.textLength} characters
• Analysis Method: Advanced AI (LLaMA 3)

🔍 **AI Analysis Results**:

${aiAnalysis}

💡 **Additional Recommendations**:
• Share this analysis with your healthcare provider for professional interpretation
• Keep this document in your medical records
• Schedule follow-up appointments as needed
• Ask your doctor to explain any complex medical terms

⚠️ **Important Medical Disclaimer**:
This AI analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for interpretation of medical reports and clinical decision-making.
            `.trim();

          } catch (apiError) {
            console.log('Groq API not available for report analysis, using basic analysis');
          }
        }

        // Fallback basic analysis
        return `
🩺 **Medical Report Analysis**

📄 **Document Processed**: ${analysis.title}
📊 **Analysis Summary**:
• Total Pages: ${analysis.pages}
• Content Chunks: ${analysis.chunks}
• Text Length: ${analysis.textLength} characters

🔍 **Basic Analysis**:
The document has been processed and integrated into our medical knowledge base. The content appears to be medical in nature and contains typical healthcare documentation.

💡 **Recommendations**:
• Ask specific questions about the report content using the chat feature
• The AI can now provide context-aware answers about this document
• Consult healthcare professionals for clinical interpretation

⚠️ **Medical Disclaimer**: This is a technical document analysis only. Clinical interpretation requires qualified medical professionals.
        `.trim();
      }

      // For image files (X-rays, scans, etc.), use Google AI Vision
      else if (file.mimetype.startsWith('image/')) {
        return await this.analyzeMedicalImage(file);
      }

      // For other file types, provide basic analysis
      return `
📋 **Medical Document Analysis**

Based on the uploaded ${file.mimetype} file:

🔍 **Document Type**: ${file.originalname}
📊 **Technical Analysis**:
• File size: ${file.size} bytes
• Format: ${file.mimetype}

💡 **Next Steps**:
• For PDF documents, upload them to enable AI-powered analysis
• For medical images (X-rays, scans), upload image files for AI analysis
• Consult healthcare providers for document interpretation
• Keep medical records secure and accessible

⚠️ **Important**: Always consult qualified medical professionals for health document interpretation.
      `.trim();

    } catch (error) {
      console.error('Report analysis error:', error);
      throw new Error('Failed to analyze medical report');
    }
  }

  async processUploadedPDF(filePath) {
    try {
      // Read and parse PDF
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      // Extract text content
      const text = data.text;

      // Add to knowledge base
      this.medicalDocuments.push({
        title: path.basename(filePath),
        content: text,
        type: 'uploaded-pdf'
      });

      console.log(`Processed PDF: ${path.basename(filePath)} - ${text.length} characters added`);

      return {
        title: path.basename(filePath),
        pages: data.numpages,
        chunks: 1,
        textLength: text.length,
        text: text
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  async analyzeMedicalImage(file) {
    try {
      console.log('Starting medical image analysis for:', file.originalname);
      console.log('File path:', file.path);
      console.log('File size:', file.size);
      console.log('MIME type:', file.mimetype);

      // Check if Google AI API key is available
      if (!this.googleApiKey) {
        console.log('Google API key not available');
        return `
📋 **Medical Image Analysis**

🔍 **Image Detected**: ${file.originalname}
📊 **Technical Details**:
• File size: ${file.size} bytes
• Format: ${file.mimetype}

⚠️ **Analysis Unavailable**:
Google AI Vision API key not configured. Unable to analyze medical images.

💡 **Next Steps**:
• Configure Google AI API key for image analysis
• Upload PDF reports for text-based analysis
• Consult healthcare providers for image interpretation

⚠️ **Important**: Always consult qualified medical professionals for interpretation of medical images.
        `.trim();
      }

      console.log('Initializing Google AI with API key present');

      // For medical images, use Google AI Vision API
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.googleApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      console.log('Google AI model initialized');

      // Check if file is available (either in memory or on disk)
      if (!file.buffer && (!file.path || !fs.existsSync(file.path))) {
        console.error('File not available - no buffer and file does not exist at path:', file.path);
        throw new Error('Uploaded file not found');
      }

      console.log('Reading image file...');
      // Read the image file - handle both memory storage (buffer) and disk storage (path)
      let imageData;
      if (file.buffer) {
        // File is stored in memory
        imageData = file.buffer;
        console.log('Using file buffer for image data');
      } else if (file.path && fs.existsSync(file.path)) {
        // File is stored on disk
        imageData = fs.readFileSync(file.path);
        console.log('Using file path for image data');
      } else {
        console.error('File does not exist at path:', file.path);
        throw new Error('Uploaded file not found');
      }

      const base64Image = imageData.toString('base64');

      console.log('Image converted to base64, length:', base64Image.length);

      const prompt = `You are a medical AI assistant specialized in analyzing medical images. Analyze this medical image and provide a comprehensive assessment. Focus on:

1. **Image Type**: What type of medical imaging is this? (X-ray, CT scan, MRI, ultrasound, etc.)
2. **Anatomical Region**: Which part of the body is being imaged?
3. **Key Findings**: Describe any visible abnormalities, fractures, lesions, or notable features
4. **Technical Quality**: Comment on image quality and visibility
5. **Clinical Significance**: What might these findings indicate?
6. **Recommendations**: Suggest next steps or additional tests if applicable

IMPORTANT: This is NOT a formal medical diagnosis. Always consult qualified radiologists and physicians for proper interpretation.

Please provide a clear, structured analysis suitable for patient understanding.`;

      console.log('Sending request to Google AI...');

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.mimetype,
            data: base64Image
          }
        }
      ]);

      console.log('Received response from Google AI');

      const analysis = result.response.text();

      console.log('Analysis completed successfully');

      return `
🩺 **AI-Powered Medical Image Analysis**

${analysis}

⚠️ **Critical Medical Disclaimer**:
This AI analysis is for informational purposes only and does not constitute a medical diagnosis, radiology report, or professional medical opinion. Medical images must be interpreted by qualified radiologists, physicians, or healthcare professionals. AI analysis can assist but NEVER replaces professional medical expertise.

**Required Actions**:
• Share this image with a qualified radiologist or physician
• Provide complete clinical context for accurate interpretation
• Follow up with healthcare provider for proper diagnosis and treatment
        `.trim();

    } catch (error) {
      console.error('Error analyzing medical image:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      return `
📋 **Medical Image Analysis**

🔍 **Image Detected**: ${file.originalname}
📊 **Technical Details**:
• File size: ${file.size} bytes
• Format: ${file.mimetype}

⚠️ **Analysis Error**:
Unable to analyze the medical image due to technical issues: ${error.message}

💡 **Next Steps**:
• Try uploading again
• Ensure the image file is not corrupted
• Upload PDF reports for text-based analysis
• Consult healthcare providers directly for image interpretation

⚠️ **Important**: Always consult qualified medical professionals for interpretation of medical images.
      `.trim();
    }
  }
}

module.exports = new MedicalRAGService();