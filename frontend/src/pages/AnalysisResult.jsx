// src/pages/AnalysisResult.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Download, ArrowLeft, Loader2, DollarSign, Camera, Plus, Trash2, Image, Zap, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { RefineAnalysisModal } from '../components/RefineAnalysisModal';
import ManualDamageMarker from '../components/ManualDamageMarker';

export default function AnalysisResult() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [scanData, setScanData] = useState(location.state?.scanData || null);
    const [damages, setDamages] = useState([]);
    const [loading, setLoading] = useState(!scanData);
    const [selectedDamage, setSelectedDamage] = useState(null);
    const [showRefineModal, setShowRefineModal] = useState(false);
    const [showManualMarker, setShowManualMarker] = useState(false);

    useEffect(() => {
        if (!scanData) {
            loadScanData();
        } else {
            loadDamages();
        }
    }, [id]); // Removed scanData from dependencies to prevent reload on delete

    const loadScanData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setScanData(data);
            // Load damages after scan data is loaded
            await loadDamages();
        } catch (err) {
            console.error('Error loading scan:', err);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadDamages = async () => {
        try {
            console.log('Loading damages for scan:', id);
            // Load damages from database (source of truth)
            const { data, error } = await supabase
                .from('damages')
                .select('*')
                .eq('scan_id', id);

            if (error) {
                console.error('Error loading damages:', error);
                setDamages([]);
                return;
            }

            console.log('Loaded damages from database:', data?.length || 0, 'damages');
            // Set damages from database (could be empty array if all deleted)
            setDamages(data || []);
        } catch (err) {
            console.error('Error loading damages:', err);
            setDamages([]);
        }
    };

    const handleRefine = (damage) => {
        setSelectedDamage(damage);
        setShowRefineModal(true);
    };

    const handleRefineComplete = async (result) => {
        // Reload damages to show updated data
        await loadDamages();
        setShowRefineModal(false);
        setSelectedDamage(null);

        alert(`Refinement Complete!\n\nFinal Severity: ${result.final_severity}/100\nAction: ${result.action}\nCost: ₹${result.cost.toLocaleString()}\nConfidence: ${result.confidence}`);
    };

    const handleAddManualDamage = async (damageData) => {
        try {
            const damageType = damageData.type.toLowerCase();
            const requiresVerification = damageType === 'dent' || damageType === 'scratch';

            // Create manual damage record (without ID - let Supabase generate it)
            const damageToInsert = {
                scan_id: id,
                part_name: damageData.part,
                damage_type: damageData.type,
                is_manual: true,
                detection_source: 'manual',
                preliminary_severity: 50,
                preliminary_cost: 5000,
                final_severity: null,
                cost: 5000,
                action: requiresVerification ? 'Pending AI Verification' : 'Manual Entry',
                status: 'preliminary'
            };

            // Insert into Supabase and get the created record back
            const { data, error } = await supabase
                .from('damages')
                .insert([damageToInsert])
                .select();

            if (error) {
                console.error('Supabase error inserting manual damage:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            if (!data || data.length === 0) {
                throw new Error('No data returned from insert');
            }

            // Add the created record to local state
            const createdDamage = data[0];
            setDamages([...damages, createdDamage]);

            // Update total cost
            const newTotal = (scanData.total_cost || 0) + 5000;
            await supabase
                .from('scans')
                .update({
                    total_cost: newTotal,
                    damage_count: damages.length + 1
                })
                .eq('id', id);

            setScanData({ ...scanData, total_cost: newTotal, damage_count: damages.length + 1 });

            // Check if AI verification is required
            if (requiresVerification) {
                // Close the marker modal
                setShowManualMarker(false);

                // Show alert and open verification modal
                alert(`Damage added!\n\nThis ${damageData.type} requires AI verification.\nPlease upload 3 close-up photos from different angles.`);

                // Automatically open the refine modal for verification
                setSelectedDamage(createdDamage);
                setShowRefineModal(true);
            } else {
                // For other damage types, just show success
                alert('Manual damage added successfully!');
            }
        } catch (err) {
            console.error('Error adding manual damage:', err);
            alert(`Failed to add manual damage: ${err.message || err}`);
        }
    };

    const handleDeleteDamage = async (damage) => {
        if (!confirm(`Are you sure you want to delete this ${damage.damage_type} on ${damage.part_name}?`)) {
            return;
        }

        try {
            console.log('Deleting damage:', damage.id);

            // Immediately update UI for better UX
            const updatedDamages = damages.filter(d => d.id !== damage.id);
            setDamages(updatedDamages);

            // Delete from database
            const { error } = await supabase
                .from('damages')
                .delete()
                .eq('id', damage.id);

            if (error) {
                console.error('Supabase error deleting damage:', error);
                // Restore the damage on error
                setDamages(damages);
                throw new Error(`Database error: ${error.message}`);
            }

            console.log('Damage deleted from database successfully');

            // Calculate new values
            const damageCost = damage.cost || damage.preliminary_cost || 0;
            const newTotal = Math.max(0, (scanData.total_cost || 0) - damageCost);
            const newCount = Math.max(0, updatedDamages.length);

            // Update scan record in database
            const { error: updateError } = await supabase
                .from('scans')
                .update({
                    total_cost: newTotal,
                    damage_count: newCount
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating scan totals:', updateError);
            }

            // Update local state
            setScanData({
                ...scanData,
                total_cost: newTotal,
                damage_count: newCount
            });

            console.log('Reloading damages to confirm deletion...');
            // Reload damages from database to ensure sync
            await loadDamages();

            alert('Damage deleted successfully!');
        } catch (err) {
            console.error('Error deleting damage:', err);
            alert(`Failed to delete damage: ${err.message || err}`);
            // Reload to restore correct state
            await loadDamages();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    if (!scanData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-lg border-b border-white/10 px-6 py-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-white/90 hover:text-white font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Title & PDF Download */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 flex justify-between items-start"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Analysis Report
                        </h1>
                        <p className="text-white/70 text-lg">{scanData.car_name}</p>
                    </div>

                    {scanData.pdf_url && (
                        <a
                            href={scanData.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-lg hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all font-semibold"
                        >
                            <Download size={20} />
                            Download PDF Report
                        </a>
                    )}
                </motion.div>

                {/* 3-Column Image Comparison */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                    {/* Original */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
                        <div className="bg-white/5 border-b border-white/10 text-white px-4 py-3 flex items-center gap-2">
                            <Image size={18} />
                            <h3 className="font-semibold">Original</h3>
                        </div>
                        {scanData.original_image_url && (
                            <img
                                src={scanData.original_image_url}
                                alt="Original"
                                className="w-full h-64 object-cover"
                            />
                        )}
                    </div>

                    {/* AI Detections */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
                        <div className="bg-white/5 border-b border-white/10 text-white px-4 py-3 flex items-center gap-2">
                            <Zap size={18} />
                            <h3 className="font-semibold">AI Detections</h3>
                        </div>
                        {scanData.processed_image_url && (
                            <img
                                src={scanData.processed_image_url}
                                alt="Detections"
                                className="w-full h-64 object-cover"
                            />
                        )}
                    </div>

                    {/* Heatmap */}
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
                        <div className="bg-white/5 border-b border-white/10 text-white px-4 py-3 flex items-center gap-2">
                            <Activity size={18} />
                            <h3 className="font-semibold">Heatmap</h3>
                        </div>
                        {scanData.heatmap_image_url && (
                            <img
                                src={scanData.heatmap_image_url}
                                alt="Heatmap"
                                className="w-full h-64 object-cover"
                            />
                        )}
                    </div>
                </motion.div>

                {/* Damage Breakdown Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            Damage Breakdown
                        </h2>
                        <button
                            onClick={() => setShowManualMarker(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-lg hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Manual Damage
                        </button>
                    </div>

                    {damages.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-white/10">
                                        <th className="text-left py-3 px-4 font-semibold text-white/90">
                                            Part
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-white/90">
                                            Type
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-white/90">
                                            Severity
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-white/90">
                                            Action
                                        </th>
                                        <th className="text-right py-3 px-4 font-semibold text-white/90">
                                            Cost
                                        </th>
                                        <th className="text-center py-3 px-4 font-semibold text-white/90">
                                            Status
                                        </th>
                                        <th className="text-center py-3 px-4 font-semibold text-white/90">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {damages.map((damage, index) => {
                                        const isPreliminary = damage.status === 'preliminary' || !damage.status;
                                        const displaySeverity = damage.final_severity || damage.preliminary_severity || damage.severity || 50;
                                        const displayPart = damage.part_name || damage.part || 'Unknown';
                                        const displayType = damage.damage_type || damage.type || 'Unknown';
                                        const displayAction = damage.action || 'Repair';
                                        const displayCost = damage.cost || damage.preliminary_cost || 0;

                                        return (
                                            <tr key={damage.id || index} className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4 text-white/90">{displayPart}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-3 py-1 bg-white/10 text-white/90 border border-white/20 rounded-full text-sm font-medium">
                                                        {displayType}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${displaySeverity > 70
                                                                    ? 'bg-red-400'
                                                                    : displaySeverity > 40
                                                                        ? 'bg-yellow-400'
                                                                        : 'bg-green-400'
                                                                    }`}
                                                                style={{ width: `${displaySeverity}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium text-white/90">
                                                            {displaySeverity}/100
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-3 py-1 bg-white/10 text-white/90 border border-white/20 rounded-full text-sm font-medium"
                                                    >
                                                        {displayAction}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-white/90">
                                                    ₹{displayCost.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isPreliminary ? (
                                                        <span className="px-3 py-1 bg-white/5 text-white/60 border border-white/10 rounded-full text-xs font-medium flex items-center justify-center gap-1">
                                                            <AlertCircle size={12} />
                                                            Preliminary
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-white/10 text-white/90 border border-white/20 rounded-full text-xs font-medium flex items-center justify-center gap-1">
                                                            <CheckCircle size={12} />
                                                            Verified
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {isPreliminary && (
                                                            <button
                                                                onClick={() => handleRefine(damage)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white/90 border border-white/20 rounded-lg hover:bg-white/15 hover:border-white/30 transition text-sm font-medium"
                                                            >
                                                                <Camera size={14} />
                                                                Refine
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteDamage(damage)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-white/70 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white/90 hover:border-white/20 transition text-sm font-medium"
                                                            title="Delete this damage"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                        {damage.confidence && (
                                                            <span className="text-xs text-white/50 block">
                                                                Confidence: {damage.confidence}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-white/50 text-center py-8">No damage detected</p>
                    )}
                </motion.div>

                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white/90 mb-1">
                                Total Estimated Cost
                            </h3>
                            <div className="flex items-center gap-2">
                                <DollarSign className="text-white" size={32} />
                                <span className="text-4xl font-bold text-white">
                                    ₹{scanData.total_cost?.toLocaleString() || '0'}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm text-white/60 mb-2">
                                {damages.length} damage{damages.length !== 1 ? 's' : ''} detected
                            </div>
                            {scanData.report_pdf_url && (
                                <a
                                    href={scanData.report_pdf_url}
                                    download
                                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all"
                                >
                                    <Download size={20} />
                                    Download PDF Report
                                </a>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div >
            {/* Refine Analysis Modal */}
            {
                showRefineModal && selectedDamage && (
                    <RefineAnalysisModal
                        damage={selectedDamage}
                        onClose={() => setShowRefineModal(false)}
                        onRefineComplete={handleRefineComplete}
                    />
                )
            }

            {/* Manual Damage Marker */}
            {
                showManualMarker && scanData.original_image_url && (
                    <ManualDamageMarker
                        imageUrl={scanData.original_image_url}
                        onAddDamage={handleAddManualDamage}
                        onClose={() => setShowManualMarker(false)}
                    />
                )
            }
        </div >
    );
}
