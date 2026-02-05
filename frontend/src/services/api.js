import { supabase } from '../supabase'
import axios from 'axios'

const BACKEND_URL = 'http://127.0.0.1:8000'

/**
 * Upload image to Supabase, send to Python backend for analysis, and save results
 * @param {File} file - Image file to analyze
 * @returns {Promise<Object>} Analysis results with cost and damage grade
 */
export async function uploadAndAnalyze(file) {
    try {
        // Step 1: Generate unique filename
        const timestamp = Date.now()
        const fileName = `scan_${timestamp}_${file.name}`

        console.log('📤 Uploading to Supabase Storage...')

        // Step 2: Upload file to Supabase Storage 'scans' bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log('✅ Upload successful:', uploadData.path)

        // Step 3: Get public URL of uploaded file
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName)

        const publicUrl = urlData.publicUrl
        console.log('🔗 Public URL:', publicUrl)

        // Step 4: Send to Python backend for AI analysis
        console.log('🧠 Sending to AI backend for analysis...')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('car_make', 'Generic') // You can add UI fields for this later
        formData.append('car_model', 'Unknown')

        const { data: analysisData } = await axios.post(
            `${BACKEND_URL}/analyze`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        )

        console.log('✅ Analysis complete:', analysisData)

        // Step 5: Calculate damage grade based on cost
        const totalCost = analysisData.total_estimate || 0
        let damageGrade = 'Minor'

        if (totalCost > 2000) {
            damageGrade = 'Severe'
        } else if (totalCost > 1000) {
            damageGrade = 'Moderate'
        }

        // Step 6: Save to Supabase 'claims' table
        console.log('💾 Saving to database...')

        const claimData = {
            image_url: publicUrl,
            total_cost: totalCost,
            damage_grade: damageGrade,
            breakdown: analysisData.breakdown,
            vehicle_info: analysisData.vehicle_info,
            created_at: new Date().toISOString()
        }

        const { data: claimRecord, error: claimError } = await supabase
            .from('claims')
            .insert([claimData])
            .select()

        if (claimError) {
            console.warn('⚠️ Database save failed:', claimError.message)
            // Continue anyway - analysis was successful
        } else {
            console.log('✅ Saved to database:', claimRecord)
        }

        // Step 7: Return combined result
        return {
            success: true,
            imageUrl: publicUrl,
            analyzed_image_url: analysisData.analyzed_image_url,  // AI annotated image with bounding boxes
            damages: analysisData.damages || [],  // New individual damages array
            total_estimate: analysisData.total_estimate || totalCost,
            currency: analysisData.currency || 'USD',
            damageGrade: damageGrade,
            breakdown: analysisData.breakdown,  // Keep for backward compatibility
            vehicleInfo: analysisData.vehicle_info,
            claimId: claimRecord?.[0]?.id
        }

    } catch (error) {
        console.error('❌ Error:', error)

        // Check if it's an image quality error from backend
        if (error.response?.data?.error === 'Image Quality Issue') {
            throw new Error(`Image Quality Issue: ${error.response.data.details}`)
        }

        throw new Error(error.message || 'Analysis failed')
    }
}

/**
 * Add a new car to the garage with documents
 * @param {Object} carData - Car information and files
 * @returns {Promise<Object>} Created car record
 */
export async function addNewCar(carData) {
    try {
        const { modelName, registrationNumber, carPhoto, insuranceDoc, rcDoc } = carData

        console.log('🚗 Adding new car to garage...')

        // Upload car photo
        let carPhotoUrl = null
        if (carPhoto) {
            const photoFileName = `car_${Date.now()}_${carPhoto.name}`
            const { data: photoData, error: photoError } = await supabase.storage
                .from('images')
                .upload(photoFileName, carPhoto)

            if (photoError) throw new Error(`Photo upload failed: ${photoError.message}`)

            const { data: photoUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(photoFileName)

            carPhotoUrl = photoUrlData.publicUrl
        }

        // Upload insurance document
        let insuranceUrl = null
        if (insuranceDoc) {
            const insuranceFileName = `insurance_${Date.now()}_${insuranceDoc.name}`
            const { data: insuranceData, error: insuranceError } = await supabase.storage
                .from('images')
                .upload(insuranceFileName, insuranceDoc)

            if (insuranceError) throw new Error(`Insurance upload failed: ${insuranceError.message}`)

            const { data: insuranceUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(insuranceFileName)

            insuranceUrl = insuranceUrlData.publicUrl
        }

        // Upload RC document
        let rcUrl = null
        if (rcDoc) {
            const rcFileName = `rc_${Date.now()}_${rcDoc.name}`
            const { data: rcData, error: rcError } = await supabase.storage
                .from('images')
                .upload(rcFileName, rcDoc)

            if (rcError) throw new Error(`RC upload failed: ${rcError.message}`)

            const { data: rcUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(rcFileName)

            rcUrl = rcUrlData.publicUrl
        }

        // Save to cars table
        const { data: carRecord, error: carError } = await supabase
            .from('cars')
            .insert([{
                model_name: modelName,
                reg_number: registrationNumber,
                car_photo_url: carPhotoUrl,
                insurance_doc_url: insuranceUrl,
                rc_doc_url: rcUrl,
                created_at: new Date().toISOString()
            }])
            .select()

        if (carError) {
            throw new Error(`Database save failed: ${carError.message}`)
        }

        console.log('✅ Car added successfully:', carRecord[0])
        return carRecord[0]

    } catch (error) {
        console.error('❌ Error adding car:', error)
        throw new Error(error.message || 'Failed to add car')
    }
}

/**
 * Get all cars from the garage
 * @returns {Promise<Array>} List of cars
 */
export async function getMyCars() {
    try {
        console.log('🚗 Fetching cars from garage...')

        const { data: cars, error } = await supabase
            .from('cars')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Fetch failed: ${error.message}`)
        }

        console.log(`✅ Found ${cars.length} cars`)
        return cars

    } catch (error) {
        console.error('❌ Error fetching cars:', error)
        throw new Error(error.message || 'Failed to fetch cars')
    }
}
