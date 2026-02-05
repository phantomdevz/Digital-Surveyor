// src/pages/Scanner.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useScan } from '../hooks/useScan';
import { Upload, Loader2, LogOut, ArrowLeft, Car, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Scanner() {
    const [file, setFile] = useState(null);
    const [carName, setCarName] = useState('');
    const [preview, setPreview] = useState(null);
    const { user, signOut } = useAuth();
    const { submitScan, loading, error, progress } = useScan();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !carName) return;

        try {
            console.log('Submitting scan...', { userId: user.id, carName });
            const result = await submitScan(file, user.id, carName);
            console.log('Scan result:', result);

            if (result.scan_id) {
                navigate(`/scan/${result.scan_id}`, { state: { scanData: result } });
            } else {
                console.error('No scan_id in result:', result);
                alert('Analysis complete but no scan ID returned. Check console.');
            }
        } catch (err) {
            console.error('Scan failed:', err);
            console.error('Error details:', err.response?.data);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Navbar */}
            <nav className="bg-white/10 backdrop-blur-lg border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-white/90 hover:text-white font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </nav>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl"
                >
                    <h1 className="text-4xl font-bold text-white mb-2">New Scan</h1>
                    <p className="text-white/70 mb-8">Upload a photo to analyze damage</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-start gap-3"
                        >
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-white/90 font-medium mb-2">Car Name</label>
                            <div className="relative">
                                <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                                <input
                                    type="text"
                                    value={carName}
                                    onChange={(e) => setCarName(e.target.value)}
                                    required
                                    placeholder="e.g., Honda City"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-white/90 font-medium mb-2">Upload Image</label>
                            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-all bg-white/5">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                    className="hidden"
                                    id="file-input"
                                />
                                <label htmlFor="file-input" className="cursor-pointer">
                                    <Upload className="mx-auto text-white/40 mb-4" size={48} />
                                    <p className="text-white/70">Click to upload or drag and drop</p>
                                    <p className="text-sm text-white/40 mt-2">PNG, JPG up to 10MB</p>
                                </label>
                            </div>
                        </div>

                        {preview && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4"
                            >
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full rounded-lg shadow-lg border border-white/20"
                                />
                            </motion.div>
                        )}

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-blue-500/10 border border-blue-500/30 px-4 py-3 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Loader2 className="animate-spin text-blue-400" />
                                    <span className="text-blue-300">
                                        Analyzing... {progress}%
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !file || !carName}
                            className="w-full py-3 bg-white/10 backdrop-blur-lg border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300"
                        >
                            {loading ? 'Analyzing...' : 'Analyze Damage'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
