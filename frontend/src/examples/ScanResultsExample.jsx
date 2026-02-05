// Example integration of manual damage marking in Scanner/Results page

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ManualDamageMarker from '../components/ManualDamageMarker';
import DamageList from '../components/DamageList';

export default function ScanResultsExample() {
    const [damages, setDamages] = useState([
        // Example: AI-detected damage
        {
            id: 'ai_1',
            type: 'Dent',
            part: 'Front Bumper',
            is_manual: false,
            final_severity: 75,
            cost: 8500,
            action: 'Repair',
            status: 'verified'
        }
    ]);
    const [showMarkerTool, setShowMarkerTool] = useState(false);
    const [scanImage] = useState('https://example.com/car-image.jpg'); // Your scan image

    // Handle adding manual damage
    const handleAddManualDamage = (damageData) => {
        const newDamage = {
            id: `manual_${Date.now()}`,
            type: damageData.type,
            part: damageData.part,
            notes: damageData.notes,
            is_manual: true,
            detection_source: 'manual',
            status: 'preliminary',
            position: damageData.position
        };

        setDamages([...damages, newDamage]);
    };

    // Handle AI verification result
    const handleVerifyDamage = (damageId, verificationResult) => {
        setDamages(damages.map(damage => {
            if (damage.id === damageId) {
                return {
                    ...damage,
                    ...verificationResult,
                    status: 'verified',
                    final_severity: verificationResult.final_severity,
                    cost: verificationResult.cost,
                    action: verificationResult.action,
                    confidence: verificationResult.confidence,
                    severity_scores: verificationResult.severity_scores
                };
            }
            return damage;
        }));
    };

    // Handle delete manual damage
    const handleDeleteDamage = (damageId) => {
        if (confirm('Are you sure you want to delete this damage?')) {
            setDamages(damages.filter(d => d.id !== damageId));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
                        <button
                            onClick={() => setShowMarkerTool(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Add Manual Damage
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Scan Image */}
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3">Analyzed Image</h3>
                            <img
                                src={scanImage}
                                alt="Scanned car"
                                className="w-full rounded-lg shadow-md"
                            />
                        </div>

                        {/* Damage List */}
                        <div>
                            <DamageList
                                damages={damages}
                                onVerifyDamage={handleVerifyDamage}
                                onDeleteDamage={handleDeleteDamage}
                            />
                        </div>
                    </div>

                    {/* Total Cost Summary */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Total Estimated Cost</h3>
                            <p className="text-2xl font-bold text-indigo-600">
                                ₹{damages.reduce((sum, d) => sum + (d.cost || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Damage Marker Modal */}
            {showMarkerTool && (
                <ManualDamageMarker
                    imageUrl={scanImage}
                    onAddDamage={handleAddManualDamage}
                    onClose={() => setShowMarkerTool(false)}
                />
            )}
        </div>
    );
}
