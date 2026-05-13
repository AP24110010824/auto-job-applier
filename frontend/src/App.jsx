import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Play, Square, Terminal, Briefcase, FileText, Settings, KeyRound } from 'lucide-react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    linkedinUser: '',
    linkedinPass: '',
    gmailUser: '',
    gmailPass: '',
    keywords: 'JAVA DEVELOPER AND CONTRACT',
    template: 'Hi,\n\nI am reaching out regarding the Java Developer contract position you posted on LinkedIn. Please find my resume attached.\n\nBest regards,\n[Your Name]',
  });
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), msg, type }]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('Running');
    setLogs([]);
    addLog('Initiating automation sequence...', 'info');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    
    if (resume) {
      data.append('resume', resume);
    }

    try {
      // Use environment variable if available, otherwise default to localhost:5000
      // In a production environment with the routePrefix "/_/backend", this allows flexibility
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${apiUrl}/api/start`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addLog(response.data.message, 'success');
      addLog('Bot is now running in the background. Check Node.js terminal for deep logs.', 'info');
    } catch (error) {
      console.error(error);
      setStatus('Error');
      addLog(error.response?.data?.message || 'An error occurred connecting to the server.', 'error');
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/stop`);
      setStatus('Stopped');
      setIsLoading(false);
      addLog(response.data.message, 'warning');
    } catch (error) {
      addLog(error.response?.data?.message || 'Error connecting to server.', 'error');
    }
  };

  // Container Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-['Inter'] relative overflow-hidden flex items-center justify-center p-6">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none"></div>

      <motion.div 
        className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        
        {/* Left Column: Configuration Form */}
        <motion.div className="lg:col-span-7 space-y-6" variants={itemVariants}>
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-blue-600" />
              Automated Applier
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Configure your LinkedIn and Gmail integration below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* LinkedIn Card */}
            <div className="glass-panel rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                LinkedIn Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="premium-label">Username / Email</label>
                  <input type="text" name="linkedinUser" value={formData.linkedinUser} onChange={handleChange} required className="premium-input" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="premium-label">Password</label>
                  <input type="password" name="linkedinPass" value={formData.linkedinPass} onChange={handleChange} required className="premium-input" placeholder="••••••••" />
                </div>
              </div>
            </div>

            {/* Gmail Card & Tooltip */}
            <div className="glass-panel rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-bl-full blur-2xl -z-10"></div>
              
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                Gmail Integration
              </h2>

              {/* Crucial UI Guidance */}
              <motion.div 
                className="mb-6 bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex gap-4 items-start"
                whileHover={{ scale: 1.01 }}
              >
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 text-sm">App Password Required</h3>
                  <p className="text-amber-800/80 text-sm mt-1 leading-relaxed">
                    Google blocks regular passwords. You <strong>must</strong> go to your Google Account Security settings, turn on 2-Step Verification, and generate a 16-letter "App Password" to paste below.
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="premium-label">Gmail Address</label>
                  <input type="email" name="gmailUser" value={formData.gmailUser} onChange={handleChange} required className="premium-input" placeholder="john@gmail.com" />
                </div>
                <div>
                  <label className="premium-label text-amber-700">16-Letter App Password</label>
                  <input type="password" name="gmailPass" value={formData.gmailPass} onChange={handleChange} required className="premium-input border-amber-200 focus:border-amber-400 focus:ring-amber-500/10" placeholder="abcd efgh ijkl mnop" />
                </div>
              </div>
            </div>

            {/* Job Criteria Card */}
            <div className="glass-panel rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Application Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="premium-label">Search Keywords</label>
                  <input type="text" name="keywords" value={formData.keywords} onChange={handleChange} required className="premium-input" />
                </div>

                <div>
                  <label className="premium-label">Email Message Template</label>
                  <textarea name="template" rows="4" value={formData.template} onChange={handleChange} required className="premium-input resize-none"></textarea>
                </div>

                <div>
                  <label className="premium-label">Resume (PDF)</label>
                  <div className="mt-1 flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white/50 hover:bg-gray-50 hover:border-blue-400 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileText className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">{resume ? resume.name : 'PDF up to 10MB'}</p>
                      </div>
                      <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} required />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isLoading} 
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                   <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                   </span>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Start Automation
                  </>
                )}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button" 
                onClick={handleStop} 
                disabled={!isLoading}
                className="flex items-center justify-center gap-2 py-4 px-8 border border-slate-200 rounded-2xl shadow-sm text-lg font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all"
              >
                <Square className="w-5 h-5 fill-current" />
                Stop
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Right Column: Sleek Terminal/Status */}
        <motion.div className="lg:col-span-5" variants={itemVariants}>
          <div className="sticky top-6">
            <div className="bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 h-[800px] flex flex-col">
              {/* Terminal Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center gap-2 border-b border-slate-800">
                <Terminal className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300 font-medium text-sm tracking-wider">SYSTEM LOG</span>
                
                {/* Traffic Lights */}
                <div className="ml-auto flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-6 flex-1 overflow-y-auto font-mono text-sm">
                <AnimatePresence>
                  {logs.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-slate-600 flex flex-col items-center justify-center h-full text-center"
                    >
                      <Terminal className="w-12 h-12 mb-4 opacity-20" />
                      <p>System idle.</p>
                      <p className="text-xs mt-2">Awaiting automation sequence.</p>
                    </motion.div>
                  ) : (
                    logs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-3 flex gap-3 ${
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'success' ? 'text-emerald-400' :
                          log.type === 'warning' ? 'text-amber-400' :
                          'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-600 select-none">{'>'}</span>
                        <span className="leading-relaxed">{log.msg}</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

export default App;
