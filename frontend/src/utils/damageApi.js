// API helper functions for damage management

import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

/**
 * Verify a manual damage with AI using 3 close-up photos
 */
export async function verifyDamageWithAI(damageId, partName, damageType, photos) {
    const formData = new FormData();
    formData.append('damage_id', damageId);
    formData.append('part_name', partName);
    formData.append('damage_type', damageType);
    formData.append('file_left', photos.left);
    formData.append('file_center', photos.center);
    formData.append('file_right', photos.right);

    const response = await fetch(`${API_BASE_URL}/analyze/refine`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to verify damage');
    }

    return await response.json();
}

/**
 * Create a manual damage record
 */
export async function createManualDamage(scanId, damageData) {
    // This would integrate with your Supabase client
    // For now, return a mock response
    return {
        id: `manual_${Date.now()}`,
        scan_id: scanId,
        ...damageData,
        is_manual: true,
        detection_source: 'manual',
        status: 'preliminary',
        created_at: new Date().toISOString()
    };
}

/**
 * Update damage record with AI verification results
 */
export async function updateDamageWithVerification(damageId, verificationResult) {
    // This would update the Supabase record
    // For now, return merged data
    return {
        damage_id: damageId,
        ...verificationResult,
        status: 'verified',
        updated_at: new Date().toISOString()
    };
}
