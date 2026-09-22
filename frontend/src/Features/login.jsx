import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Image } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import BackgroundImage from '../assets/bg.jpeg'; 
import LoginImage from '../assets/left-bg.jpeg';

const API_BASE_URL = "http://localhost:8000";

export default function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    employeeID: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeID) {
      newErrors.employeeID = 'Employee ID is required';
    } 
    else if (/\s/.test(formData.employeeID)) {
      newErrors.employeeID = 'Employee ID must not contain spaces';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    // Form data format required by FastAPI OAuth2PasswordRequestForm Depends()
    const formDetails = new URLSearchParams();
    formDetails.append('username', formData.employeeID); // Maps Employee ID to expected username key
    formDetails.append('password', formData.password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formDetails,
      });

      const data = await response.json();

      if (!response.ok) {
        // Fallback to FastAPI's default exception detail message layout
        throw new Error(data.detail || 'Authentication failed');
      }

      // Store the JWT Access Token securely in browser local storage
      localStorage.setItem('token', data.access_token);
      
      // Store basic contextual meta payload if your UI needs it
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('username', data.username);

      // Redirect based on role: staff goes to POS, admin goes to dashboard
      navigate(data.role === 'staff' ? '/pos' : '/dashboard');

    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 h-screen w-screen bg-[#d1d1d1] flex items-center justify-center p-4 sm:p-8 overflow-hidden font-['Montserrat',_sans-serif] bg-cover bg-center bg-no-repeat z-50"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.60), rgba(0, 0, 0, 0.90)), url(${BackgroundImage})` 
      }}
    >
      {/* Main Container Card */}
      <div className="w-full max-w-[900px] bg-[#2a2a2a]/70 backdrop-blur-md border border-white/10 rounded-[16px] p-6 flex flex-col md:flex-row gap-6 items-stretch justify-center shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto md:overflow-visible">
        
        {/* Left Side: Background Image Container */}
        <div className="hidden md:flex flex-[0.6] max-w-[320px] min-h-[400px] bg-[#3a3a3a] rounded-[12px] relative overflow-hidden items-center justify-center border border-dashed border-gray-600 group">
          <img src={LoginImage} alt="Login Banner" className="absolute inset-0 w-full h-full object-cover" />  
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Right Side: Form Container Box Frame */}
        <div className="flex-[0.9] flex flex-col justify-center px-2 py-4 sm:px-6 text-white relative">
          <header className="text-left mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide uppercase mb-1 text-white">
              WELCOME BACK, TEAM
            </h1>
            <p className="text-xs sm:text-xs text-gray-400 font-normal">
              Sign in to start your shift
            </p>
          </header>

          {/* Backend Error Notification Banner */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-900/40 backdrop-blur-sm border border-red-500/50 text-red-200 rounded-[10px] text-xs text-center font-medium tracking-wide">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Employee ID Input Field */}
            <div>
              <label className="block text-xs font-normal text-gray-300 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeID" 
                value={formData.employeeID} 
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-3.5 bg-[#dcdcdc] text-[#222222] font rounded-[10px] focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all disabled:opacity-50 ${
                  errors.employeeID ? 'ring-2 ring-red-500' : ''
                } placeholder:text-gray-500 placeholder:text-xs placeholder:font-light`} 
                placeholder="Enter your employee ID"
              />
              {errors.employeeID && (
                <p className="mt-1 text-xs text-red-400">{errors.employeeID}</p>
              )}
            </div>

            {/* Password Input Field */}
            <div className="relative">
              <label className="block text-xs font-normal text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-3.5 bg-[#dcdcdc] text-[#222222] font-xs rounded-[10px] pr-12 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all disabled:opacity-50 ${
                    errors.password ? 'ring-2 ring-red-500' : ''
                  } placeholder:text-gray-500 placeholder:text-xs placeholder:font-light`} 
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <Eye size={18}/> : <EyeOff size={18}/>}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Actions Submit Action Control */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#dcdcdc] text-[#2a2a2a] font-bold rounded-[25px] uppercase tracking-wider text-sm hover:bg-white active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#2a2a2a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  'LOG IN'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}