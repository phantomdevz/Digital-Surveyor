// src/pages/DigitalGarage.jsx (Updated for new backend)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { Plus, Car, Loader2, LogOut, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DigitalGarage() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadScans();
    }, [user]);

    const loadScans = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setScans(data || []);
        } catch (err) {
            console.error('Error loading scans:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Navbar */}
            <nav className="bg-white/10 backdrop-blur-lg border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Car className="text-white" size={28} />
                    <h1 className="text-xl font-bold text-white">Digital Surveyor</h1>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </nav>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-between items-center mb-8"
                >
                    <div>
                        <h2 className="text-4xl font-bold text-white">My Scans</h2>
                        <p className="text-white/70 mt-2">View your damage assessment history</p>
                    </div>
                    <button
                        onClick={() => navigate('/scan/new')}
                        className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 transition-all duration-300"
                    >
                        <Plus size={20} />
                        New Scan
                    </button>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-white" size={48} />
                    </div>
                )}

                {/* Scans Grid */}
                {!loading && scans.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {scans.map((scan, index) => (
                            <motion.div
                                key={scan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                onClick={() => navigate(`/scan/${scan.id}`)}
                                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
                            >
                                {scan.processed_image_url && (
                                    <img
                                        src={scan.processed_image_url}
                                        alt={scan.car_name}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                {!scan.processed_image_url && (
                                    <div className="w-full h-48 bg-white/5 flex items-center justify-center">
                                        <Car className="text-white/30" size={64} />
                                    </div>
                                )}

                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        {scan.car_name}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                                        <Calendar size={16} />
                                        {new Date(scan.created_at).toLocaleDateString()}
                                    </div>

                                    <div className="flex items-center gap-2 text-lg font-bold text-blue-400 mb-3">
                                        <DollarSign size={20} />
                                        ₹{scan.total_cost?.toLocaleString() || '0'}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-white/50">
                                            {scan.damage_count || 0} damages detected
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${scan.status === 'complete'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                }`}
                                        >
                                            {scan.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && scans.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center shadow-2xl"
                    >
                        <Car className="mx-auto text-white/30 mb-6" size={80} />
                        <h3 className="text-3xl font-bold text-white mb-3">
                            No Scans Yet
                        </h3>
                        <p className="text-white/60 mb-8 text-lg">
                            Upload a damage photo to get started
                        </p>
                        <button
                            onClick={() => navigate('/scan/new')}
                            className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] inline-flex items-center gap-2 transition-all duration-300"
                        >
                            <Plus size={20} />
                            Create First Scan
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
