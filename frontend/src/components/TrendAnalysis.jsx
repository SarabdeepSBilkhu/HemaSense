import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, AreaChart, Area 
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrendAnalysis({ userId, token, initialParameter = 'Hemoglobin' }) {
  const [selectedParam, setSelectedParam] = useState(initialParameter);
  const [trendData, setTrendData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableParams, setAvailableParams] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/reports/${userId}`, {
          headers: { 'x-auth-token': token }
        });
        const reports = response.data;
        if (reports.length > 0) {
          // Extract all unique parameter names from all reports
          const params = new Set();
          reports.forEach(r => r.results.forEach(res => params.add(res.name)));
          setAvailableParams(Array.from(params));
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };
    fetchHistory();
  }, [userId, token]);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/trends/${userId}/${selectedParam}`, {
          headers: { 'x-auth-token': token }
        });
        setTrendData(response.data);
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (selectedParam) fetchTrends();
  }, [userId, selectedParam, token]);

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'Increasing': return <TrendingUp className="text-red-500" />;
      case 'Decreasing': return <TrendingDown className="text-blue-500" />;
      default: return <Minus className="text-gray-400" />;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (isLoading && !trendData) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-gray-100 animate-pulse">
        <Activity className="text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} />
            Longitudinal Tracking
          </h3>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">Biomarker progression over time</p>
        </div>
        
        <select 
          value={selectedParam}
          onChange={(e) => setSelectedParam(e.target.value)}
          className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-2 font-bold text-gray-700 shadow-sm focus:border-blue-500 transition-all outline-none"
        >
          {availableParams.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {trendData && trendData.series.length > 1 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl">
                {getTrendIcon(trendData.trendDirection)}
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Trend Direction</p>
                <h4 className="text-xl font-black text-gray-900 leading-tight">{trendData.trendDirection}</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Stability Index</p>
              <h4 className="text-xl font-black text-emerald-600 leading-tight">High Confidence</h4>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '1rem'
                  }}
                  labelFormatter={formatDate}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-50">
             <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Latest Value</p>
                <p className="text-lg font-black text-gray-900">{trendData.series[trendData.series.length-1]?.value} {trendData.series[0]?.unit}</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Baseline</p>
                <p className="text-lg font-black text-gray-500">{trendData.series[0]?.value} {trendData.series[0]?.unit}</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Relative Diff</p>
                <p className={`text-lg font-black ${trendData.trendDirection === 'Increasing' ? 'text-red-500' : 'text-blue-500'}`}>
                  {((trendData.series[trendData.series.length-1]?.value - trendData.series[0]?.value) / trendData.series[0]?.value * 100).toFixed(1)}%
                </p>
             </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
           <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <Activity className="text-gray-300" size={32} />
           </div>
           <h4 className="text-lg font-bold text-gray-800 mb-2">Insufficient Historical Data</h4>
           <p className="text-gray-500 max-w-sm mx-auto text-sm">We need at least two reports to visualize trends and calculate health trajectories.</p>
        </div>
      )}
    </div>
  );
}
