import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function ImageUpload({ inputId, value, onChange, label = 'Product photo', compact = false }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    const input = e.target;
    if (!file) return;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/upload/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  const height = compact ? 'h-20' : 'h-32';

  return (
    <div>
      <label className="block text-gray-300 text-sm mb-1">{label}</label>

      <label
        htmlFor={inputId}
        className={`flex flex-col items-center justify-center gap-2 ${height} rounded-lg bg-gray-800 border border-dashed border-gray-600 cursor-pointer hover:bg-gray-700 transition overflow-hidden ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <span className="text-gray-400 text-xs">Uploading...</span>
          </>
        ) : value ? (
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <>
            <Camera size={22} className="text-gray-400" />
            <span className="text-gray-400 text-xs">Click to take photo or upload</span>
          </>
        )}
      </label>

      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-1 text-xs text-gray-500 hover:text-red-400 transition"
        >
          Remove photo
        </button>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
