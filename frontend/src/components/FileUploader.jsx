import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function FileUploader({ onOcrComplete, token }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError("File is too large (max 5MB)");
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('report', file);

    try {
      const response = await axios.post('http://localhost:5000/api/ocr/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token 
        }
      });
      onOcrComplete(response.data.mappedData);
      setFile(null);
      // Success state is handled by the parent (App/TestInputForm) showing a banner
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to process report");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-8 border-2 border-dashed border-blue-200 text-center">
      <div className="flex flex-col items-center">
        <div className="p-4 bg-blue-50 rounded-full text-blue-600 mb-4">
          <Upload size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Auto-fill via OCR</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Upload an image of your blood report (JPEG/PNG) and our AI will attempt to extract the values for you.
        </p>

        <input
          type="file"
          id="report-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {!file ? (
          <label
            htmlFor="report-upload"
            className="cursor-pointer px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-lg shadow-blue-100"
          >
            <FileText size={20} />
            <span>Select Report Image</span>
          </label>
        ) : (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl mb-4 border border-blue-100">
              <span className="text-sm font-bold text-blue-800 truncate">{file.name}</span>
              <CheckCircle2 size={18} className="text-blue-600" />
            </div>
            
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Analyze & Auto-fill</span>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center space-x-2 text-red-600 text-sm font-medium">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
