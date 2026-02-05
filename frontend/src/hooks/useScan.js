// src/hooks/useScan.js
import { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const useScan = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const submitScan = async (file, userId, carName) => {
        setLoading(true);
        setError(null);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', userId);
            formData.append('car_name', carName);

            const response = await axios.post(`${BACKEND_URL}/analyze`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                },
            });

            setLoading(false);
            return response.data;
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.error || 'Analysis failed');
            throw err;
        }
    };

    return { submitScan, loading, error, progress };
};
