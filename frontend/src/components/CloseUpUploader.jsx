import React, { useState } from 'react';
import { Upload, X, Camera, Check, AlertCircle } from 'lucide-react';
import config from '../config';

export default function CloseUpUploader({ damage, onVerify, onClose }) {
    const [photos, setPhotos] = useState({
        left: null,
        center: null,
        right: null
    });
    const [previews, setPreviews] = useState({
        left: null,
        center: null,
        right: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const angles = [
        { key: 'left', label: 'Left Angle', icon: '←' },
        { key: 'center', label: 'Center View', icon: '⊙' },
        { key: 'right', label: 'Right Angle', icon: '→' }
    ];

    const handleFileChange = (angle, file) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setPhotos({ ...photos, [angle]: file });

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews({ ...previews, [angle]: reader.result });
        };
        reader.readAsDataURL(file);
        setError('');
    };

    const handleRemovePhoto = (angle) => {
        setPhotos({ ...photos, [angle]: null });
        setPreviews({ ...previews, [angle]: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all photos are uploaded
        if (!photos.left || !photos.center || !photos.right) {
            setError('Please upload all 3 photos');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('damage_id', damage.id);
            formData.append('part_name', damage.part_name || damage.part);
            formData.append('damage_type', damage.damage_type || damage.type);
            formData.append('file_left', photos.left);
            formData.append('file_center', photos.center);
            formData.append('file_right', photos.right);

            const response = await fetch(`${config.API_BASE_URL}/analyze/refine`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to analyze photos');
            }

            const result = await response.json();

            if (result.status === 'success') {
                onVerify(result);
                onClose();
            } else {
                setError(result.message || 'Analysis failed');
            }
        } catch (err) {
            setError(err.message || 'Failed to upload photos');
        } finally {
            setLoading(false);
        }
    };

    const allPhotosUploaded = photos.left && photos.center && photos.right;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between sticky top-0">
                    <div>
                        <h2 className="text-2xl font-bold">AI Verification</h2>
                        <p className="text-indigo-100 text-sm">
                            Upload 3 close-up photos from different angles
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Damage Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">Damage Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-700 font-medium">Type:</span>{' '}
                                <span className="text-blue-900">{damage.damage_type || damage.type}</span>
                            </div>
                            <div>
                                <span className="text-blue-700 font-medium">Part:</span>{' '}
                                <span className="text-blue-900">{damage.part_name || damage.part}</span>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Photo Guidelines:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Take photos in good lighting</li>
                                <li>Get close to the damage (within 6-12 inches)</li>
                                <li>Capture from left, center, and right angles</li>
                                <li>Ensure the damage is clearly visible</li>
                            </ul>
                        </div>
                    </div>

                    {/* Photo Upload Grid */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {angles.map(({ key, label, icon }) => (
                                <div key={key} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {icon} {label}
                                    </label>

                                    {!previews[key] ? (
                                        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(key, e.target.files[0])}
                                                className="hidden"
                                            />
                                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Click to upload</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 10MB)</p>
                                        </label>
                                    ) : (
                                        <div className="relative group">
                                            <img
                                                src={previews[key]}
                                                alt={`${label} preview`}
                                                className="w-full h-40 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(key)}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                <Check className="w-8 h-8 text-green-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!allPhotosUploaded || loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Verify with AI
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
