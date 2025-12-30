import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SymptomFilterProps {
  onFilter: (symptoms: string[]) => void;
}

const SymptomFilter: React.FC<SymptomFilterProps> = ({ onFilter }) => {
  const [symptom, setSymptom] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);

  const addSymptom = () => {
    if (symptom.trim() && !symptoms.includes(symptom.trim())) {
      const newSymptoms = [...symptoms, symptom.trim()];
      setSymptoms(newSymptoms);
      setSymptom('');
      onFilter(newSymptoms);
    }
  };

  const removeSymptom = (index: number) => {
    const newSymptoms = symptoms.filter((_, i) => i !== index);
    setSymptoms(newSymptoms);
    onFilter(newSymptoms);
  };

  return (
    <div className="bg-pink-500 p-4 rounded-2xl shadow-lg border border-pink-700">
      <h3 className="font-semibold text-white mb-3">Describe Your Symptoms</h3>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
          placeholder="e.g., fever, headache"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-700 focus:border-transparent"
        />
        <button
          onClick={addSymptom}
          className="px-4 py-2 bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-700 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
        >
          Add
        </button>
      </div>
      {symptoms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {symptoms.map((sym, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100"
              >
                {sym}
                <button
                  onClick={() => removeSymptom(index)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  ×
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SymptomFilter;