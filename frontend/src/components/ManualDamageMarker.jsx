import React, { useState, useRef } from 'react';
import { X, MapPin, Check } from 'lucide-react';

export default function ManualDamageMarker({ imageUrl, onAddDamage, onClose }) {
    const [markers, setMarkers] = useState([]);
    const [currentMarker, setCurrentMarker] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const imageRef = useRef(null);

    const damageTypes = ['Dent', 'Scratch', 'Paint Chip', 'Crack', 'Other'];
    const carParts = [
        'Front Bumper', 'Rear Bumper', 'Hood', 'Roof', 'Trunk',
        'Front Left Door', 'Front Right Door', 'Rear Left Door', 'Rear Right Door',
        'Front Left Fender', 'Front Right Fender', 'Rear Left Fender', 'Rear Right Fender',
        'Front Left Quarter Panel', 'Front Right Quarter Panel',
        'Rear Left Quarter Panel', 'Rear Right Quarter Panel'
    ];

    const handleImageClick = (e) => {
        if (showForm) return; // Don't add new markers while form is open

        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newMarker = {
            id: Date.now(),
            x,
            y,
            type: '',
            part: '',
            notes: ''
        };

        setCurrentMarker(newMarker);
        setShowForm(true);
    };

    const handleSubmitDamage = (e) => {
        e.preventDefault();

        if (!currentMarker.type || !currentMarker.part) {
            alert('Please select damage type and part');
            return;
        }

        // Add marker to list
        setMarkers([...markers, currentMarker]);

        // Send to parent component
        onAddDamage({
            ...currentMarker,
            position: { x: currentMarker.x, y: currentMarker.y }
        });

        // Reset
        setCurrentMarker(null);
        setShowForm(false);
    };

    const handleCancel = () => {
        setCurrentMarker(null);
        setShowForm(false);
    };

    const handleRemoveMarker = (id) => {
        setMarkers(markers.filter(m => m.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Mark Manual Damages</h2>
                        <p className="text-blue-100 text-sm">Click on the image to mark damage locations</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row h-[calc(90vh-88px)]">
                    {/* Image Section */}
                    <div className="flex-1 p-6 overflow-auto">
                        <div className="relative inline-block">
                            <img
                                ref={imageRef}
                                src={imageUrl}
                                alt="Car"
                                className="max-w-full h-auto cursor-crosshair rounded-lg shadow-lg"
                                onClick={handleImageClick}
                            />

                            {/* Render markers */}
                            {markers.map((marker) => (
                                <div
                                    key={marker.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                    style={{
                                        left: `${marker.x}%`,
                                        top: `${marker.y}%`
                                    }}
                                >
                                    <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" fill="red" />
                                    <button
                                        onClick={() => handleRemoveMarker(marker.id)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        {marker.type} - {marker.part}
                                    </div>
                                </div>
                            ))}

                            {/* Current marker preview */}
                            {currentMarker && (
                                <div
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                    style={{
                                        left: `${currentMarker.x}%`,
                                        top: `${currentMarker.y}%`
                                    }}
                                >
                                    <MapPin className="w-8 h-8 text-yellow-500" fill="yellow" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Section */}
                    {showForm && currentMarker && (
                        <div className="w-full lg:w-96 bg-gray-50 p-6 border-l border-gray-200 overflow-auto">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Damage Details</h3>

                            <form onSubmit={handleSubmitDamage} className="space-y-4">
                                {/* Damage Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Damage Type *
                                    </label>
                                    <select
                                        value={currentMarker.type}
                                        onChange={(e) => setCurrentMarker({ ...currentMarker, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select type...</option>
                                        {damageTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Car Part */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Car Part *
                                    </label>
                                    <select
                                        value={currentMarker.part}
                                        onChange={(e) => setCurrentMarker({ ...currentMarker, part: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select part...</option>
                                        {carParts.map((part) => (
                                            <option key={part} value={part}>{part}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={currentMarker.notes}
                                        onChange={(e) => setCurrentMarker({ ...currentMarker, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        placeholder="Additional details..."
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Add Damage
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Summary */}
                    {!showForm && (
                        <div className="w-full lg:w-96 bg-gray-50 p-6 border-l border-gray-200 overflow-auto">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Marked Damages ({markers.length})
                            </h3>

                            {markers.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Click on the image to mark damages
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {markers.map((marker, index) => (
                                        <div key={marker.id} className="bg-white p-4 rounded-lg shadow">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">
                                                        {index + 1}. {marker.type}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">{marker.part}</p>
                                                    {marker.notes && (
                                                        <p className="text-xs text-gray-500 mt-1">{marker.notes}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMarker(marker.id)}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {markers.length > 0 && (
                                <button
                                    onClick={onClose}
                                    className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                                >
                                    Done ({markers.length} damages added)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
