import React from 'react';
import { AlertCircle, CheckCircle, Info, ChevronDown, Activity, ShieldAlert, ChevronRight, Beaker, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'High':
    case 'Low':
      return <AlertCircle className="text-amber-500" size={20} />;
    case 'Normal':
      return <CheckCircle className="text-emerald-500" size={20} />;
    default:
      return <Info className="text-gray-300" size={20} />;
  }
};

const getStatusColor = (status, severity) => {
  if (status === 'Normal') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (severity === 2) return 'bg-red-50 text-red-700 border-red-100'; 
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const ResultCard = ({ item, index, expandedItem, setExpandedItem, isMinor = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`bg-white rounded-2xl border transition-all duration-200 ${item.isSuppressed ? 'border-gray-200 opacity-85 hover:opacity-100' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
  >
    <div 
      className="p-5 flex items-center justify-between cursor-pointer"
      onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
    >
      <div className="flex items-center space-x-4">
        <StatusIcon status={item.status} />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 tracking-tight">{item.name}</h3>
            {item.weight === 'High' && <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase leading-none">Primary</span>}
            {item.isSuppressed && <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase leading-none">Non-Significant</span>}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-gray-900 leading-none">{item.value}</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{item.unit}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden sm:block text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1">Ref Range</p>
          <p className="text-sm text-gray-600 font-mono">{item.range}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(item.status, item.severity)}`}>
            {item.status}
          </span>
          {item.deviationPercentage > 0 && (
            <span className="text-[10px] font-bold text-gray-500">
              {item.deviationPercentage}% {item.severityGrade}
            </span>
          )}
        </div>
        
        <ChevronDown 
          size={18} 
          className={`text-gray-300 transition-transform duration-300 ${expandedItem === item.name ? 'rotate-180 text-blue-500' : ''}`} 
        />
      </div>
    </div>

    <AnimatePresence>
      {expandedItem === item.name && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-5 space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">{item.explanation}</p>
            
            {item.isSuppressed ? (
              <div className="bg-white/80 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldAlert size={14} /> 
                  Clinical Filtering Log
                </h4>
                <p className="text-sm text-gray-600 font-medium italic">“{item.suppressionReason}”</p>
              </div>
            ) : (item.severityGrade === 'Moderate' || item.severityGrade === 'Severe' || !isMinor) && item.causes && item.causes.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Beaker size={14} className="text-blue-500" /> 
                   Conditional Correlation Factors
                </h4>
                <ul className="space-y-2">
                  {item.causes.map((cause, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

export default function ResultDashboard({ data }) {
  const [expandedItem, setExpandedItem] = React.useState(null);
  const [showMinor, setShowMinor] = React.useState(false);
  const [showNormal, setShowNormal] = React.useState(data?.significantFindings?.length === 0 && data?.minorFindings?.length === 0);

  if (!data) return null;
  
  const { 
    significantFindings = [], 
    minorFindings = [], 
    normalFindings = [], 
    patterns = [], 
    conclusions = [] 
  } = data;

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Overall System Conclusions */}
      {conclusions.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="h-5 w-1 bg-emerald-500 rounded-full" />
            <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase">System Summary</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {conclusions.map((c, idx) => (
              <div 
                key={idx} 
                className="bg-emerald-50 border-2 border-emerald-100 p-5 rounded-3xl flex items-start gap-5"
              >
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-200">
                  <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h5 className="font-black text-emerald-900 text-lg leading-tight mb-1">{c.system}: {c.status}</h5>
                  <p className="text-emerald-800 font-medium">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 2. Clinically Significant Patterns */}
      {patterns.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="h-5 w-1 bg-indigo-500 rounded-full" />
            <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase">Causal Intelligence</h4>
          </div>
          <div className="space-y-4">
            {patterns.map((p, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={idx} 
                className={`p-6 rounded-3xl border-2 ${p.isAnomaly ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100 shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h5 className={`font-black text-xl tracking-tight ${p.isAnomaly ? 'text-red-900' : 'text-indigo-900'}`}>
                      {p.pattern}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 flex items-center gap-1">
                         <Activity size={10} /> Pattern Detected
                      </span>
                    </div>
                  </div>
                  <div className={`text-xs px-4 py-1.5 rounded-2xl font-black uppercase tracking-widest border-2 ${p.isAnomaly ? 'bg-white text-red-700 border-red-200' : 'bg-white text-indigo-700 border-indigo-200'}`}>
                    Signal: {p.confidence}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-5">
                  {p.contributing.map(item => (
                    <span key={item} className="text-[10px] font-bold bg-white text-gray-500 px-3 py-1 rounded-full border border-gray-200 uppercase tracking-tighter">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100 shadow-inner">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-widest mb-2">
                    <ShieldAlert size={14} className="text-amber-500" /> Clinical Action Protocol
                  </div>
                  <p className="text-gray-700 font-medium text-sm leading-relaxed">{p.action}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 3. High Significance Biomarkers */}
      {significantFindings.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2 pt-4">
            <div className="h-5 w-1 bg-red-400 rounded-full" />
            <h4 className="text-lg font-black text-gray-900 tracking-tight uppercase">Significant Deviations</h4>
          </div>
          <div className="space-y-3">
            {significantFindings.map((item, index) => (
              <ResultCard 
                key={`${item.name}-${index}`} 
                item={item} 
                index={index} 
                expandedItem={expandedItem}
                setExpandedItem={setExpandedItem}
              />
            ))}
          </div>
        </section>
      )}


      {/* 4. Filtered / Minor Findings */}
      {minorFindings.length > 0 && (
        <section className="pt-4">
          <div className={`rounded-3xl border-2 transition-all duration-500 overflow-hidden ${showMinor ? 'bg-white border-gray-100 shadow-xl' : 'bg-gray-50/50 border-gray-200 shadow-none'}`}>
            <button 
              onClick={() => setShowMinor(!showMinor)}
              className="w-full p-6 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors duration-300 ${showMinor ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-400 border border-gray-200'}`}>
                  <FileText size={20} />
                </div>
                <div>
                   <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm mb-0.5">Minor Observations</h4>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{minorFindings.length} Items Suppressed By Judgment Engine</p>
                </div>
              </div>
              <ChevronRight size={24} className={`text-gray-300 transition-transform duration-500 ${showMinor ? 'rotate-90 text-gray-600' : 'group-hover:translate-x-1'}`} />
            </button>
            <AnimatePresence>
              {showMinor && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 pt-2"
                >
                  <div className="space-y-3">
                    {minorFindings.map((item, index) => (
                      <ResultCard 
                        key={`${item.name}-${index}`} 
                        item={item} 
                        index={index} 
                        isMinor={true} 
                        expandedItem={expandedItem}
                        setExpandedItem={setExpandedItem}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* 5. Normal Findings */}
      {normalFindings.length > 0 && (
        <section className="pt-2">
          <div className={`rounded-3xl border-2 transition-all duration-500 overflow-hidden ${showNormal ? 'bg-emerald-50/20 border-emerald-100 shadow-lg' : 'bg-gray-50/30 border-gray-100/50'}`}>
             <button 
              onClick={() => setShowNormal(!showNormal)}
              className="w-full p-6 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-emerald-500 shadow-sm border border-emerald-100">
                  <CheckCircle size={20} />
                </div>
                <div>
                   <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm mb-0.5">Reference Optimal</h4>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{normalFindings.length} Parameters Within Stable Range</p>
                </div>
              </div>
              <ChevronRight size={24} className={`text-gray-300 transition-transform duration-500 ${showNormal ? 'rotate-90 text-emerald-600' : 'group-hover:translate-x-1'}`} />
            </button>
            <AnimatePresence>
              {showNormal && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 pt-2"
                >
                  <div className="space-y-3">
                    {normalFindings.map((item, index) => (
                      <ResultCard 
                        key={`${item.name}-${index}`} 
                        item={item} 
                        index={index} 
                        expandedItem={expandedItem}
                        setExpandedItem={setExpandedItem}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      <footer className="pt-8 border-t border-gray-100 px-4">
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200">
            <ShieldAlert className="text-blue-600" size={32} />
          </div>
          <div>
            <h5 className="font-black text-blue-900 uppercase tracking-widest text-sm mb-1">Clinical Trust Verification</h5>
            <p className="text-sm text-blue-800 font-medium leading-relaxed">
              Calculations are derived from deterministic empirical datasets. This engine prioritizes significant physiological patterns over individual fluctuations. Always consult a licensed physician for diagnostic confirmation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
