// RefineAnalysisModal.jsx
import React, { useState } from 'react';
import { X, Upload, Camera } from 'lucide-react';

export function RefineAnalysisModal({ damage, onClose, onRefineComplete }) {
    const [files, setFiles] = useState({ left: null, center: null, right: null });
    const [previews, setPreviews] = useState({ left: null, center: null, right: null });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (angle, file) => {
        if (file) {
            setFiles(prev => ({ ...prev, [angle]: file }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [angle]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        // Validate all 3 photos uploaded
        if (!files.left || !files.center || !files.right) {
            setError('Please upload all 3 photos from different angles');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('damage_id', damage.id);
            formData.append('part_name', damage.part_name);
            formData.append('damage_type', damage.damage_type);
            formData.append('file_left', files.left);
            formData.append('file_center', files.center);
            formData.append('file_right', files.right);

            const response = await fetch('http://127.0.0.1:8000/analyze/refine', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.status === 'success') {
                onRefineComplete(result);
            } else {
                setError(result.message || 'Refinement failed');
            }
        } catch (err) {
            setError('Failed to analyze photos: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Refine Damage Analysis</h2>
                        <p className="text-indigo-100 text-sm mt-1">
                            Upload 3 close-up photos from different angles for accurate assessment
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Damage Info */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <div className="flex gap-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-500">Part</p>
                            <p className="font-semibold text-gray-800">{damage.part_name}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-500">Damage Type</p>
                            <p className="font-semibold text-gray-800">{damage.damage_type}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-500">Current Severity</p>
                            <p className="font-semibold text-indigo-600">{damage.preliminary_severity || damage.final_severity}/100</p>
                        </div>
                    </div>
                </div>

                {/* Upload Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['left', 'center', 'right'].map((angle) => (
                            <div key={angle} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 capitalize">
                                    <Camera className="inline mr-1" size={16} />
                                    {angle} Angle
                                </label>

                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 transition group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(angle, e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />

                                    {previews[angle] ? (
                                        <div className="relative aspect-[4/3]">
                                            <img
                                                src={previews[angle]}
                                                alt={`${angle} angle`}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                ✓ Uploaded
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[4/3] flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-500 transition">
                                            <Upload size={40} />
                                            <p className="mt-2 text-sm font-medium">Click to upload</p>
                                            <p className="text-xs mt-1">JPG, PNG</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📸 Photography Tips:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Take photos from <strong>3 different angles</strong> (left, center, right)</li>
                            <li>• Get <strong>close to the damage</strong> - fill the entire frame</li>
                            <li>• Use good <strong>lighting</strong> - avoid shadows and glare</li>
                            <li>• Keep the camera <strong>steady</strong> for sharp images</li>
                        </ul>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-between items-center border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={uploading || !files.left || !files.center || !files.right}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold shadow-lg"
                    >
                        {uploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Analyzing...
                            </span>
                        ) : (
                            '🔍 Analyze & Refine'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
