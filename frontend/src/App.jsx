import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, ArrowLeft } from 'lucide-react'
import TestInputForm from './components/TestInputForm'
import ResultDashboard from './components/ResultDashboard'
import HealthSummary from './components/HealthSummary'
import TrendAnalysis from './components/TrendAnalysis'
import FileUploader from './components/FileUploader'

function App() {
  const [biomarkers, setBiomarkers] = useState([])
  const [payload, setPayload] = useState(null)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('input') // 'input', 'result', 'history', 'trends'
  const [currentReportDate, setCurrentReportDate] = useState(new Date().toISOString().split('T')[0])
  const [prefillData, setPrefillData] = useState(null)

  useEffect(() => {
    // Fetch available biomarkers
    const fetchBiomarkers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/biomarkers')
        setBiomarkers(response.data)
      } catch (err) {
        console.error("Failed to fetch biomarkers", err)
        setError("Could not connect to the backend server.")
      }
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user')
        setUser(response.data.user)
        setToken(response.data.token)
        localStorage.setItem('hemasense_token', response.data.token) // For persistence
      } catch (err) {
        console.error("Failed to fetch user", err)
      }
    }

    fetchBiomarkers()
    fetchUser()
  }, [])

  const handleAnalyze = async (reportData, reportDate) => {
    setIsLoading(true)
    setError(null)
    setPayload(null)
    setCurrentReportDate(reportDate) 
    try {
      const response = await axios.post('http://localhost:5000/api/analyze', { reportData })
      setPayload(response.data)
      setView('result')
    } catch (err) {
      console.error(err)
      setError("Failed to analyze the report.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveReport = async () => {
    if (!user || !payload) return;
    setIsLoading(true);
    try {
      // Re-send with persists option or just the raw data
      // Using /api/reports endpoint
      const reportData = payload.results.map(r => ({ 
        name: r.name, 
        value: r.value,
        unit: r.unit 
      }));
      await axios.post('http://localhost:5000/api/reports', 
        { userId: user._id, reportData, date: currentReportDate },
        { headers: { 'x-auth-token': token } }
      );
      alert("Report saved to your clinical history!");
    } catch (err) {
      console.error(err);
      setError("Failed to save report.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 font-sans selection:bg-blue-200">
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-600">
            <Activity className="h-8 w-8" strokeWidth={2.5} />
            <span className="text-xl font-bold tracking-tight text-gray-900">HemaSense</span>
          </div>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Personal Blood Test Insight System
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100">
            {error}
          </div>
        )}

        {view === 'input' && !isLoading && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-10 text-center flex justify-between items-end">
              <div className="text-left">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Understand your health.
                </h1>
                <p className="mt-4 text-gray-500 text-lg max-w-md">
                  Enter lab values manually for instant deterministic insights.
                </p>
              </div>
              <button 
                onClick={() => setView('trends')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
              >
                <Activity size={16} /> History & Trends
              </button>
            </div>

            <div className="mb-8 p-1 bg-white/50 rounded-3xl border border-gray-100 shadow-sm">
                <FileUploader token={token} onOcrComplete={(data) => setPrefillData(data)} />
            </div>

            {biomarkers.length > 0 ? (
              <TestInputForm 
                biomarkers={biomarkers} 
                onSubmit={handleAnalyze} 
                isLoading={isLoading} 
                prefillData={prefillData}
              />
            ) : (
              <div className="text-gray-400 animate-pulse bg-white/50 p-6 rounded-2xl h-64 flex items-center justify-center border border-gray-100">
                {error ? "Backend unavailable" : "Loading reference ranges..."}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="max-w-3xl mx-auto h-96 flex flex-col items-center justify-center text-center p-10 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-xl">
             <div className="bg-blue-600 p-4 rounded-2xl text-white mb-6 animate-pulse">
               <Activity size={48} />
             </div>
             <h3 className="text-2xl font-bold text-gray-800">Processing Clinical Logic...</h3>
             <p className="text-gray-500 mt-2 max-w-md">Syncing with medical database and preparing visualization layer.</p>
          </div>
        )}

        {view === 'result' && payload && !isLoading && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setView('input')}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 font-medium transition-colors bg-white/50 px-4 py-2 rounded-xl hover:bg-white shadow-sm border border-gray-100"
              >
                <ArrowLeft size={18} />
                <span>New Analysis</span>
              </button>
              <button 
                onClick={handleSaveReport}
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
              >
                Save to History
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-6 px-1">
              <div className="bg-white/50 px-4 py-2 rounded-2xl border border-gray-100 flex items-center space-x-2 shadow-sm">
                <Activity size={16} className="text-blue-500" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Report Date:</span>
                <span className="text-sm font-bold text-gray-700">{new Date(currentReportDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
            </div>

            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <HealthSummary summary={payload.aiSummary} />
              
              <div className="bg-white/40 p-1 rounded-3xl shadow-sm border border-gray-100/50">
                <ResultDashboard data={payload} />
              </div>
            </div>
          </div>
        )}

        {view === 'trends' && user && (
          <div className="max-w-5xl mx-auto">
             <button 
              onClick={() => setView('input')}
              className="mb-8 flex items-center space-x-2 text-gray-500 hover:text-blue-600 font-medium transition-colors bg-white/50 px-4 py-2 rounded-xl hover:bg-white shadow-sm border border-gray-100"
            >
              <ArrowLeft size={18} />
              <span>Back to Analysis</span>
            </button>
            
            <div className="bg-white/40 p-8 rounded-[3rem] shadow-sm border border-gray-100/50">
               <TrendAnalysis userId={user._id} token={token} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
