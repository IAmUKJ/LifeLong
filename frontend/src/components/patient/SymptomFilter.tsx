import React, { useState } from 'react';

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
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-xl font-semibold mb-4">Describe Your Symptoms</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
          placeholder="Enter symptom (e.g., fever, headache)"
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          onClick={addSymptom}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Add
        </button>
      </div>
      {symptoms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {symptoms.map((sym, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full flex items-center gap-2"
            >
              {sym}
              <button
                onClick={() => removeSymptom(index)}
                className="text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SymptomFilter;