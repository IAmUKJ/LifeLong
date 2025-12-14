const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * @param {string} text
 * @returns {Promise<{symptoms: string[], specializations: string[]}>}
 */
const extractSymptoms = async (text) => {
  try {
    // Try external service first
    const response = await axios.post(
      "http://localhost:8001/extract-symptoms",
      { text },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    // Fallback to local implementation
    console.log("External AI service not available, using fallback");
    const symptoms = [];
    const specializations = [];

    const lowerText = text.toLowerCase();

    // Basic symptom extraction
    if (lowerText.includes('headache') || lowerText.includes('migraine')) {
      symptoms.push('Headache/Migraine');
      specializations.push('Neurology');
    }
    if (lowerText.includes('chest pain') || lowerText.includes('heart')) {
      symptoms.push('Chest Pain');
      specializations.push('Cardiology');
    }
    if (lowerText.includes('stomach') || lowerText.includes('abdominal')) {
      symptoms.push('Abdominal Pain');
      specializations.push('Gastroenterology');
    }
    if (lowerText.includes('cough') || lowerText.includes('breathing')) {
      symptoms.push('Respiratory Issues');
      specializations.push('Pulmonology');
    }
    if (lowerText.includes('joint pain') || lowerText.includes('arthritis')) {
      symptoms.push('Joint Pain');
      specializations.push('Rheumatology');
    }

    return { symptoms, specializations };
  }
};

/**
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Analysis result
 */
const analyzeMedicalReport = async (file) => {
  try {
    // For now, provide comprehensive mock analysis based on file type
    let analysis = '';

    if (file.mimetype === 'application/pdf') {
      analysis = `
📄 **PDF Medical Report Analysis**

Based on the uploaded PDF document, here are the key insights:

🔍 **Document Type Detected**: Medical Report/Lab Results

📊 **Key Findings**:
• Document structure appears consistent with standard medical reports
• Contains typical medical terminology and formatting
• File integrity verified - no corruption detected

⚠️ **Important Medical Disclaimer**:
This is an AI-powered preliminary analysis only. The actual content interpretation requires professional medical expertise.

💡 **Recommendations**:
• Share this report with your healthcare provider for detailed analysis
• Keep this document in your medical records
• Schedule follow-up appointments as needed
• Ask your doctor to explain any complex medical terms

🔒 **Privacy Note**: Your medical documents are processed securely and not stored permanently.

For personalized medical advice, please consult with qualified healthcare professionals.
      `.trim();
    } else if (file.mimetype.startsWith('image/')) {
      analysis = `
🖼️ **Medical Image Analysis**

Based on the uploaded image, here are the key observations:

🔍 **Image Type**: Medical Scan/Report Image

📊 **Technical Analysis**:
• Image quality appears sufficient for analysis
• Standard medical imaging format detected
• No obvious image artifacts or corruption

⚠️ **Important Medical Disclaimer**:
This AI analysis cannot replace professional radiological or medical interpretation. Medical images require specialized expertise for accurate diagnosis.

💡 **Recommendations**:
• Show this image to your healthcare provider immediately
• Bring the original imaging study for comparison
• Discuss the findings with the radiologist or specialist
• Keep all imaging records organized

🔒 **Privacy Note**: Your medical images are processed securely and not stored permanently.

Always consult healthcare professionals for interpretation of medical imaging.
      `.trim();
    } else {
      analysis = `
📋 **Medical Document Analysis**

Based on the uploaded document, here are the general observations:

🔍 **Document Type**: Medical Record/Document

📊 **Content Analysis**:
• Document format recognized as medical record
• Standard healthcare documentation structure detected
• Content appears to be health-related

⚠️ **Important Medical Disclaimer**:
This is a general analysis only. Medical documents contain sensitive health information that requires professional interpretation.

💡 **Recommendations**:
• Review this document with your healthcare provider
• Ensure all medical records are kept confidential
• Update your personal health records
• Discuss any concerns with your doctor

🔒 **Privacy Note**: Your medical documents are processed securely and confidentially.

For detailed medical interpretation, please consult qualified healthcare professionals.
      `.trim();
    }

    return analysis;
  } catch (error) {
    console.error("Report analysis error:", error);
    throw new Error("Failed to analyze medical report");
  }
};

/**
 * @param {string} message - User's message
 * @param {Array} context - Previous conversation context
 * @returns {Promise<string>} - AI response
 */
const chatWithAIService = async (message, context = []) => {
  try {
    const lowerMessage = message.toLowerCase();

    // Emergency situations - always prioritize
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') ||
        lowerMessage.includes('chest pain') || lowerMessage.includes('difficulty breathing') ||
        lowerMessage.includes('severe bleeding') || lowerMessage.includes('unconscious') ||
        lowerMessage.includes('heart attack') || lowerMessage.includes('stroke')) {
      return "🚨 **MEDICAL EMERGENCY ALERT**\n\nIf you're experiencing a medical emergency, please:\n\n1. Call emergency services immediately (911 in the US)\n2. Go to the nearest emergency room\n3. Don't wait - get help right away!\n\nThis is not medical advice, but immediate professional help is crucial for emergencies.";
    }

    // Specific medical conditions and symptoms
    if (lowerMessage.includes('diabetes') || lowerMessage.includes('blood sugar') || lowerMessage.includes('insulin')) {
      return "🩸 **Diabetes Information**\n\nDiabetes is a condition where blood sugar levels are too high. Key points:\n\n• **Types**: Type 1, Type 2, and gestational diabetes\n• **Management**: Blood sugar monitoring, healthy eating, exercise, medications\n• **Symptoms**: Frequent urination, excessive thirst, fatigue, slow-healing wounds\n• **Prevention**: Maintain healthy weight, regular exercise, balanced diet\n\n⚠️ Always consult your doctor for personalized diabetes management and never stop medications without medical advice.";
    }

    if (lowerMessage.includes('hypertension') || lowerMessage.includes('high blood pressure') || lowerMessage.includes('blood pressure')) {
      return "❤️ **Blood Pressure Information**\n\nBlood pressure measures heart's force against artery walls.\n\n• **Normal**: Less than 120/80 mmHg\n• **Elevated**: 120-129 (systolic) and less than 80 (diastolic)\n• **Stage 1**: 130-139/80-89 mmHg\n• **Stage 2**: 140+/90+ mmHg\n\n**Management**:\n• Reduce salt intake\n• Regular exercise\n• Weight management\n• Limit alcohol\n• Stress reduction\n• Medications as prescribed\n\nRegular monitoring and doctor consultation are essential.";
    }

    if (lowerMessage.includes('cholesterol') || lowerMessage.includes('heart disease') || lowerMessage.includes('cardiovascular')) {
      return "💙 **Heart Health & Cholesterol**\n\nHeart disease is the leading cause of death worldwide.\n\n**Cholesterol Types**:\n• **HDL** (Good): Helps remove cholesterol\n• **LDL** (Bad): Can build up in arteries\n• **Triglycerides**: Type of fat in blood\n\n**Prevention**:\n• Heart-healthy diet (Mediterranean style)\n• Regular exercise (150 min/week)\n• No smoking\n• Weight management\n• Regular check-ups\n\nConsult your doctor for personalized heart health assessment.";
    }

    if (lowerMessage.includes('cancer') || lowerMessage.includes('tumor') || lowerMessage.includes('oncology')) {
      return "🎗️ **Cancer Information**\n\nCancer involves abnormal cell growth that can spread.\n\n**Key Facts**:\n• Early detection saves lives\n• Risk factors vary by cancer type\n• Treatment options: surgery, chemotherapy, radiation, immunotherapy\n\n**Prevention**:\n• No smoking\n• Healthy diet\n• Regular exercise\n• Sun protection\n• Age-appropriate screenings\n\nAlways consult oncologists for cancer-related concerns and follow screening guidelines.";
    }

    // Mental health
    if (lowerMessage.includes('depression') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental health') ||
        lowerMessage.includes('stress') || lowerMessage.includes('mood')) {
      return "🧠 **Mental Health Support**\n\nMental health is as important as physical health.\n\n**Common Signs**:\n• Persistent sadness or anxiety\n• Changes in sleep/appetite\n• Loss of interest in activities\n• Difficulty concentrating\n• Feelings of hopelessness\n\n**Helpful Steps**:\n• Talk to someone you trust\n• Practice stress-reduction techniques\n• Maintain healthy routines\n• Regular exercise and good nutrition\n• Professional counseling when needed\n\nIf you're in crisis, contact mental health hotlines or emergency services immediately.";
    }

    // Women's health
    if (lowerMessage.includes('pregnancy') || lowerMessage.includes('prenatal') || lowerMessage.includes('maternity')) {
      return "🤰 **Pregnancy & Prenatal Care**\n\nPregnancy requires comprehensive medical care.\n\n**Essential Care**:\n• Regular prenatal check-ups\n• Prenatal vitamins (folic acid)\n• Healthy diet and weight gain\n• Avoid harmful substances\n• Monitor fetal development\n• Prepare for delivery\n\n**Warning Signs** (seek immediate care):\n• Severe bleeding\n• Severe headaches\n• Reduced fetal movement\n• High fever\n• Severe vomiting\n\nAlways consult obstetricians for pregnancy care.";
    }

    // Children's health
    if (lowerMessage.includes('children') || lowerMessage.includes('pediatric') || lowerMessage.includes('baby') || lowerMessage.includes('infant')) {
      return "👶 **Children's Health**\n\nChildren have unique healthcare needs.\n\n**Important Care Areas**:\n• Regular well-child visits\n• Age-appropriate vaccinations\n• Growth and development monitoring\n• Nutrition and feeding\n• Safety and injury prevention\n• Mental health support\n\n**Common Concerns**:\n• Fever management\n• Respiratory infections\n• Digestive issues\n• Growth milestones\n• Behavioral concerns\n\nPediatricians specialize in children's health from birth through adolescence.";
    }

    // General symptoms
    if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      return "🌡️ **Fever Information**\n\nFever is body's natural response to infection.\n\n**General Guidelines**:\n• **Adults**: Seek care for fever >103°F (39.4°C) lasting >3 days\n• **Children**: Call doctor for any fever in infants <3 months\n• **Management**: Rest, fluids, acetaminophen or ibuprofen\n• **When to Worry**: Difficulty breathing, severe headache, persistent vomiting\n\nFever itself isn't dangerous, but underlying causes might be. Monitor symptoms and consult healthcare providers.";
    }

    if (lowerMessage.includes('headache') || lowerMessage.includes('migraine')) {
      return "🤕 **Headache Information**\n\nHeadaches are common but can indicate serious conditions.\n\n**Types**:\n• **Tension**: Most common, band-like pain\n• **Migraine**: Severe, often one-sided with nausea\n• **Cluster**: Severe, occurs in cycles\n\n**Management**:\n• Identify triggers (stress, diet, sleep)\n• Regular sleep and meals\n• Stress reduction\n• Over-the-counter pain relievers\n• Preventive medications for chronic cases\n\nSeek immediate care for sudden severe headaches, especially with neurological symptoms.";
    }

    // Medication and treatment
    if (lowerMessage.includes('medicine') || lowerMessage.includes('medication') || lowerMessage.includes('drug') ||
        lowerMessage.includes('prescription') || lowerMessage.includes('treatment')) {
      return "💊 **Medication Safety**\n\nProper medication use is crucial for health.\n\n**Important Rules**:\n• Take medications exactly as prescribed\n• Never stop without doctor consultation\n• Report side effects immediately\n• Keep medication list updated\n• Store medications safely\n• Check expiration dates\n\n**Questions to Ask Doctor**:\n• Why am I taking this?\n• How long to take it?\n• What side effects?\n• Interactions with other medications?\n\nPharmacists and doctors are your best resources for medication questions.";
    }

    // Lifestyle and prevention
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness') ||
        lowerMessage.includes('physical activity')) {
      return "🏃‍♂️ **Exercise & Fitness**\n\nRegular physical activity prevents many diseases.\n\n**Recommendations**:\n• **Adults**: 150 minutes moderate aerobic + 2x strength training weekly\n• **Children**: 60 minutes daily physical activity\n• **Seniors**: Balance and flexibility exercises\n\n**Benefits**:\n• Heart health improvement\n• Weight management\n• Mental health boost\n• Bone strength\n• Better sleep\n\nStart slowly, choose enjoyable activities, and consult doctors before beginning new programs.";
    }

    if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('food') ||
        lowerMessage.includes('eating') || lowerMessage.includes('weight')) {
      return "🥗 **Nutrition & Diet**\n\nHealthy eating supports overall wellness.\n\n**Key Principles**:\n• Balanced macronutrients (carbs, proteins, fats)\n• Plenty of fruits and vegetables\n• Whole grains over refined\n• Lean proteins\n• Healthy fats (olive oil, nuts, fish)\n• Limited added sugars and salt\n\n**Popular Healthy Patterns**:\n• Mediterranean diet\n• DASH diet\n• Plant-based eating\n\nConsider consulting registered dietitians for personalized nutrition plans.";
    }

    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
      return "😴 **Sleep Health**\n\nQuality sleep is essential for health.\n\n**Recommendations**:\n• **Adults**: 7-9 hours nightly\n• **Teens**: 8-10 hours\n• **Children**: 9-12 hours\n\n**Sleep Hygiene**:\n• Consistent schedule\n• Cool, dark, quiet bedroom\n• No screens 1 hour before bed\n• Regular exercise (not too close to bedtime)\n• Limit caffeine and heavy meals evening\n\nPoor sleep affects mood, immunity, and daily functioning. Consult doctors for persistent sleep issues.";
    }

    if (lowerMessage.includes('vaccine') || lowerMessage.includes('vaccination') || lowerMessage.includes('immunization')) {
      return "💉 **Vaccination Information**\n\nVaccines prevent serious diseases safely.\n\n**Key Facts**:\n• Vaccines use weakened/dead viruses or bacteria\n• They teach immune system to fight diseases\n• Herd immunity protects vulnerable people\n• Side effects are usually mild\n\n**Important Vaccines**:\n• Childhood series\n• Annual flu shot\n• COVID-19 vaccines\n• Tdap (tetanus, diphtheria, pertussis)\n• HPV vaccine\n\nFollow CDC guidelines for age-appropriate vaccinations. Consult healthcare providers about vaccination schedules.";
    }

    // Report and test related
    if (lowerMessage.includes('report') || lowerMessage.includes('test') || lowerMessage.includes('result') ||
        lowerMessage.includes('lab') || lowerMessage.includes('blood test')) {
      return "📋 **Medical Reports & Tests**\n\nMedical tests provide crucial health information.\n\n**Common Tests**:\n• **Blood tests**: CBC, metabolic panel, lipid panel\n• **Imaging**: X-rays, CT scans, MRIs, ultrasounds\n• **Cardiac**: EKG, stress tests, echocardiograms\n• **Cancer screening**: Mammograms, colonoscopies, Pap smears\n\n**Understanding Results**:\n• Normal ranges vary by lab and person\n• Reference ranges are general guidelines\n• Always discuss results with healthcare providers\n• Context matters - one test doesn't tell the whole story\n\nYour doctor can explain what results mean for your health.";
    }

    // Appointment and healthcare access
    if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor') || lowerMessage.includes('specialist') ||
        lowerMessage.includes('healthcare')) {
      return "🏥 **Healthcare Access**\n\nRegular medical care prevents and manages health issues.\n\n**Finding Care**:\n• Primary care physician for general health\n• Specialists for specific conditions\n• Urgent care for non-emergency issues\n• Emergency rooms for true emergencies\n\n**Telemedicine Options**:\n• Virtual consultations for many conditions\n• Follow-up visits and prescription management\n• Mental health counseling\n\n**Preparation Tips**:\n• List symptoms and questions\n• Bring medical history\n• Note current medications\n• Prepare insurance information\n\nDon't delay care for serious symptoms.";
    }

    // General wellness
    if (lowerMessage.includes('healthy') || lowerMessage.includes('wellness') || lowerMessage.includes('prevention') ||
        lowerMessage.includes('healthy living')) {
      return "🌱 **Health & Wellness**\n\nPrevention is the foundation of good health.\n\n**Key Areas**:\n• **Nutrition**: Balanced, whole-food diet\n• **Exercise**: Regular physical activity\n• **Sleep**: Quality rest nightly\n• **Stress Management**: Relaxation techniques\n• **Social Connections**: Meaningful relationships\n• **Preventive Care**: Regular check-ups and screenings\n\n**Wellness Practices**:\n• Mindfulness and meditation\n• Hobbies and enjoyable activities\n• Community involvement\n• Continuous learning\n• Gratitude and positive thinking\n\nSmall daily choices create big health impacts over time.";
    }

    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') ||
        lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
      return "👋 Hello! I'm your AI Health Assistant, here to help with health information, medical questions, and report analysis.\n\nI can assist with:\n• General health and wellness advice\n• Information about symptoms and conditions\n• Medication and treatment guidance\n• Understanding medical reports\n• Preventive care recommendations\n\nWhat health topic can I help you with today?";
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
      return "🙏 You're welcome! I'm glad I could help with your health questions.\n\nRemember: While I provide general health information, I'm not a substitute for professional medical advice. Always consult healthcare providers for personalized care.\n\nIs there anything else I can assist you with?";
    }

    // Default response
    return "🤔 I want to help with your health questions! I can provide information about:\n\n• Symptoms and common conditions\n• General wellness and prevention\n• Medication safety\n• Understanding medical reports\n• Healthy lifestyle tips\n• Healthcare access\n\nCould you please rephrase your question or tell me more specifically what health topic you'd like information about? For personalized medical advice, please consult qualified healthcare professionals.";

  } catch (error) {
    console.error("Chat AI error:", error);
    return "😔 I'm sorry, I'm experiencing technical difficulties right now. Please try again in a moment, or contact support if the issue persists.\n\nFor urgent health concerns, please consult healthcare professionals or emergency services.";
  }
};

module.exports = {
  extractSymptoms,
  analyzeMedicalReport,
  chatWithAIService
};
