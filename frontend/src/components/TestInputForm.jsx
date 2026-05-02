import React, { useState, useEffect } from 'react';
import { Activity, Beaker, HeartPulse, Droplets, FlaskConical, Stethoscope, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const getCategoryIcon = (categoryName) => {
  if (categoryName.includes('Blood')) return Droplets;
  if (categoryName.includes('Lipid')) return HeartPulse;
  if (categoryName.includes('Liver') || categoryName.includes('Metabolic')) return Beaker;
  if (categoryName.includes('Urine') || categoryName.includes('Renal')) return FlaskConical;
  return Stethoscope;
};

export default function TestInputForm({ biomarkers, onSubmit, isLoading, prefillData }) {
  const [formData, setFormData] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle auto-fill from OCR results
  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({ ...prev, ...prefillData }));
    }
  }, [prefillData]);

  // Dynamically extract categories from the DB objects
  const dynamicCategories = [...new Set(biomarkers.map(b => b.category))].map(cat => ({
    id: cat,
    name: cat,
    icon: getCategoryIcon(cat)
  }));

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUnitChange = (name, unit) => {
    setSelectedUnits((prev) => ({ ...prev, [name]: unit }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = Object.entries(formData)
      .filter(entry => entry[1] !== '' && entry[1] !== undefined)
      .map(([name, value]) => {
        let numericValue = isNaN(value) ? value : Number(value);
        
        // Handle Unit Conversion
        const biomarker = biomarkers.find(b => b.name === name);
        
        if (biomarker) {
          const currentUnit = selectedUnits[name] || biomarker.unit || '';
          
          if (biomarker.altUnits && currentUnit !== biomarker.unit) {
            const alt = biomarker.altUnits.find(a => a.unit === currentUnit);
            if (alt && typeof numericValue === 'number') {
              numericValue = parseFloat((numericValue * alt.factor).toFixed(2));
            }
          }
        }

        return { name, value: numericValue };
      });
    onSubmit(formattedData, reportDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* OCR Verification Banner */}
      {prefillData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-blue-600 border-2 border-blue-400 p-4 rounded-2xl flex items-center justify-between text-white shadow-lg shadow-blue-200"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-black text-lg">Auto-filled via OCR</p>
              <p className="text-xs font-bold text-blue-100 opacity-90 uppercase tracking-widest">Please verify all values before proceeding</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 bg-white text-blue-600 font-black rounded-xl text-xs hover:bg-blue-50 transition-colors"
          >
            Review Now
          </button>
        </motion.div>
      )}

      {/* Date Selection Card */}
      <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-6 border-2 border-blue-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Report Date</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">When was this test performed?</p>
            </div>
          </div>
          <input 
            type="date"
            required
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-4 py-2 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white font-bold text-gray-700"
          />
        </div>
      </div>

      {dynamicCategories.map((category) => {
        const categoryBiomarkers = biomarkers.filter(
          (b) => b.category === category.id
        );
        
        if (categoryBiomarkers.length === 0) return null;

        return (
          <div key={category.id} className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-6 border border-white/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg">
                <category.icon size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{category.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categoryBiomarkers.map((b) => (
                <div key={b.name} className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    <span>{b.name}</span>
                    <span className="text-gray-400 text-xs">({b.unit || 'qualitative'})</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type={(b.min !== null && b.min !== undefined) ? "number" : "text"}
                      step="0.01"
                      placeholder={(b.min !== null && b.min !== undefined) ? `e.g. ${b.min} - ${b.max}` : "Enter result..."}
                      value={formData[b.name] || ''}
                      onChange={(e) => handleChange(b.name, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white/50"
                    />
                    {b.altUnits && b.altUnits.length > 0 && (
                      <select
                        value={selectedUnits[b.name] || b.unit || ''}
                        onChange={(e) => handleUnitChange(b.name, e.target.value)}
                        className="px-2 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value={b.unit}>{b.unit}</option>
                        {b.altUnits.map(alt => (
                          <option key={alt.unit} value={alt.unit}>{alt.unit}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{b.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading || Object.keys(formData).length === 0}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <span className="animate-pulse">Analyzing...</span>
          ) : (
            <>
              <Activity size={20} />
              <span>Generate Insights</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
