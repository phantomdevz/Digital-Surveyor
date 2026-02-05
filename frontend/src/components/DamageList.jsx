import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Upload, Trash2 } from 'lucide-react';
import CloseUpUploader from './CloseUpUploader';

export default function DamageList({ damages, onVerifyDamage, onDeleteDamage }) {
    const [selectedDamage, setSelectedDamage] = useState(null);
    const [showUploader, setShowUploader] = useState(false);

    const handleVerifyClick = (damage) => {
        setSelectedDamage(damage);
        setShowUploader(true);
    };

    const handleVerificationComplete = (result) => {
        if (onVerifyDamage) {
            onVerifyDamage(selectedDamage.id, result);
        }
        setShowUploader(false);
        setSelectedDamage(null);
    };

    const getStatusBadge = (damage) => {
        if (damage.status === 'verified' || damage.confidence) {
            return (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                </span>
            );
        }

        if (damage.is_manual) {
            return (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Unverified
                </span>
            );
        }

        return (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <Shield className="w-3 h-3" />
                AI Detected
            </span>
        );
    };

    const needsVerification = (damage) => {
        const damageType = (damage.damage_type || damage.type || '').toLowerCase();
        return damage.is_manual &&
            !damage.confidence &&
            (damageType === 'dent' || damageType === 'scratch');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Detected Damages ({damages.length})
                </h3>
            </div>

            {damages.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No damages detected</p>
                    <p className="text-sm text-gray-400 mt-1">
                        AI scan complete - no issues found
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {damages.map((damage, index) => (
                        <div
                            key={damage.id || index}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {damage.damage_type || damage.type}
                                        </h4>
                                        {getStatusBadge(damage)}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {damage.part_name || damage.part}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {needsVerification(damage) && (
                                        <button
                                            onClick={() => handleVerifyClick(damage)}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Verify
                                        </button>
                                    )}
                                    {damage.is_manual && onDeleteDamage && (
                                        <button
                                            onClick={() => onDeleteDamage(damage.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete damage"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Damage Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {damage.final_severity !== undefined && (
                                    <div>
                                        <span className="text-gray-500">Severity:</span>
                                        <p className="font-medium text-gray-900">{damage.final_severity}%</p>
                                    </div>
                                )}
                                {damage.action && (
                                    <div>
                                        <span className="text-gray-500">Action:</span>
                                        <p className="font-medium text-gray-900">{damage.action}</p>
                                    </div>
                                )}
                                {damage.cost !== undefined && (
                                    <div>
                                        <span className="text-gray-500">Cost:</span>
                                        <p className="font-medium text-gray-900">₹{damage.cost.toLocaleString()}</p>
                                    </div>
                                )}
                                {damage.confidence && (
                                    <div>
                                        <span className="text-gray-500">Confidence:</span>
                                        <p className="font-medium text-gray-900 capitalize">{damage.confidence}</p>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {damage.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-600 italic">{damage.notes}</p>
                                </div>
                            )}

                            {/* Verification Info */}
                            {damage.confidence && damage.severity_scores && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">
                                        Verified with 3-angle analysis:
                                        {damage.severity_scores.map((score, i) => (
                                            <span key={i} className="ml-1 text-gray-700 font-medium">
                                                {score}%{i < damage.severity_scores.length - 1 ? ',' : ''}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Close-up Uploader Modal */}
            {showUploader && selectedDamage && (
                <CloseUpUploader
                    damage={selectedDamage}
                    onVerify={handleVerificationComplete}
                    onClose={() => {
                        setShowUploader(false);
                        setSelectedDamage(null);
                    }}
                />
            )}
        </div>
    );
}
