import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to convert base64 to blob
function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}

// Helper function to convert array buffer to base64 (handles large images)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process 8KB at a time
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Helper function to convert image URL to blob
async function urlToBlob(url: string): Promise<Blob> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error converting URL to blob:', error);
    throw error;
  }
}

// Helper function to poll task status
async function pollTaskStatus(taskId: string, apiKey: string, maxAttempts = 60): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://platform.fitroom.app/api/tryon/v2/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Task status (attempt ${attempt + 1}):`, result.status, `Progress: ${result.progress}%`);

    if (result.status === 'COMPLETED') {
      return result;
    }

    if (result.status === 'FAILED') {
      throw new Error(result.error || 'Try-on task failed');
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Try-on task timed out');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { personImageBase64, garmentImageUrl, upperGarmentBase64, lowerGarmentBase64, category = "upper", provider = "fitroom" } = await req.json()

    // Validate inputs based on category
    if (!personImageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: personImageBase64' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (category === 'Full body' && (!upperGarmentBase64 || !lowerGarmentBase64)) {
      return new Response(
        JSON.stringify({ error: 'Full body try-on requires both upperGarmentBase64 and lowerGarmentBase64' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (category !== 'Full body' && !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: garmentImageUrl' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Starting virtual try-on process...')
    console.log('Provider:', provider)
    console.log('Category:', category)

    // Handle Nano Banana provider (Lovable AI)
    if (provider === 'nano_banana') {
      console.log('Using Nano Banana (Lovable AI) for virtual try-on...')
      
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
      if (!lovableApiKey) {
        throw new Error('LOVABLE_API_KEY not configured')
      }

      // Prepare the prompt based on category
      let prompt = ''
      if (category === 'Full body' && upperGarmentBase64 && lowerGarmentBase64) {
        prompt = 'Apply both the upper body garment and lower body garment shown in the additional images to the person in the first image. Make it look natural and realistic, maintaining proper fit and proportions.'
      } else if (category === 'Upper body') {
        prompt = 'Apply the upper body garment shown in the second image to the person in the first image. Make it look natural and realistic, maintaining proper fit and proportions.'
      } else if (category === 'Lower body') {
        prompt = 'Apply the lower body garment shown in the second image to the person in the first image. Make it look natural and realistic, maintaining proper fit and proportions.'
      } else {
        prompt = 'Apply the clothing item shown in the second image to the person in the first image. Make it look natural and realistic, maintaining proper fit and proportions.'
      }

      // Prepare content array with images
      const content: any[] = [
        { type: 'text', text: prompt },
        { 
          type: 'image_url', 
          image_url: { url: `data:image/jpeg;base64,${personImageBase64}` } 
        }
      ]

      // Add garment images
      if (category === 'Full body' && upperGarmentBase64 && lowerGarmentBase64) {
        content.push({ 
          type: 'image_url', 
          image_url: { url: `data:image/jpeg;base64,${upperGarmentBase64}` } 
        })
        content.push({ 
          type: 'image_url', 
          image_url: { url: `data:image/jpeg;base64,${lowerGarmentBase64}` } 
        })
      } else if (garmentImageUrl) {
        // Fetch garment image and convert to base64
        const garmentBlob = await urlToBlob(garmentImageUrl)
        const garmentArrayBuffer = await garmentBlob.arrayBuffer()
        const garmentBase64 = arrayBufferToBase64(garmentArrayBuffer)
        content.push({ 
          type: 'image_url', 
          image_url: { url: `data:image/jpeg;base64,${garmentBase64}` } 
        })
      }

      // Call Lovable AI Gateway
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: content
            }
          ],
          modalities: ['image', 'text']
        }),
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('Lovable AI error:', aiResponse.status, errorText)
        
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Please wait a moment before trying again.',
              details: 'Lovable AI rate limit reached'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
          )
        }

        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: 'Insufficient credits. Please add credits to your Lovable AI workspace.',
              details: errorText
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
          )
        }
        
        throw new Error(`Lovable AI request failed: ${aiResponse.status}`)
      }

      const aiResult = await aiResponse.json()
      const generatedImage = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url

      if (!generatedImage) {
        throw new Error('No image generated by Lovable AI')
      }

      console.log('Nano Banana virtual try-on successful')

      return new Response(
        JSON.stringify({ 
          success: true, 
          image: generatedImage 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle Fitroom provider (existing logic)
    // First try to get API key from environment (for backward compatibility)
    let fitroomApiKey = Deno.env.get('FITROOM_API_KEY')
    
    // If not in environment, fetch from database
    if (!fitroomApiKey) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration not found')
      }

      const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/site_settings?setting_key=eq.fitroom_api_key&select=setting_value`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      })

      const settings = await settingsResponse.json()
      if (settings && settings.length > 0) {
        fitroomApiKey = settings[0].setting_value
      }
    }
    
    if (!fitroomApiKey) {
      throw new Error('FITROOM_API_KEY not configured. Please set it in Admin Settings.')
    }

    // Handle Full Body with separate upper and lower garments
    if (category === 'Full body' && upperGarmentBase64 && lowerGarmentBase64) {
      console.log('Processing full body try-on with separate garments...')
      
      // Step 1: Apply upper body garment
      console.log('Step 1: Applying upper body garment...')
      const modelBlob = base64ToBlob(personImageBase64)
      const upperClothBlob = base64ToBlob(upperGarmentBase64)

      const upperFormData = new FormData()
      upperFormData.append('model_image', modelBlob, 'model.jpg')
      upperFormData.append('cloth_image', upperClothBlob, 'upper.jpg')
      upperFormData.append('cloth_type', 'upper')
      upperFormData.append('hd_mode', 'false')

      const upperResponse = await fetch('https://platform.fitroom.app/api/tryon/v2/tasks', {
        method: 'POST',
        headers: { 'X-API-KEY': fitroomApiKey },
        body: upperFormData,
      })

      if (!upperResponse.ok) {
        const errorText = await upperResponse.text()
        console.error('Upper body API error:', upperResponse.status, errorText)
        throw new Error(`Upper body try-on failed: ${upperResponse.status}`)
      }

      const upperResult = await upperResponse.json()
      console.log('Upper body task created:', upperResult.task_id)

      const upperCompleted = await pollTaskStatus(upperResult.task_id, fitroomApiKey)
      console.log('Upper body try-on completed')

      // Download upper body result
      const upperImageResponse = await fetch(upperCompleted.download_signed_url)
      if (!upperImageResponse.ok) {
        throw new Error('Failed to download upper body result')
      }
      const upperImageBlob = await upperImageResponse.blob()
      
      // Step 2: Apply lower body garment to the result from step 1
      console.log('Step 2: Applying lower body garment...')
      const lowerClothBlob = base64ToBlob(lowerGarmentBase64)

      const lowerFormData = new FormData()
      lowerFormData.append('model_image', upperImageBlob, 'model_with_upper.jpg')
      lowerFormData.append('cloth_image', lowerClothBlob, 'lower.jpg')
      lowerFormData.append('cloth_type', 'lower')
      lowerFormData.append('hd_mode', 'false')

      const lowerResponse = await fetch('https://platform.fitroom.app/api/tryon/v2/tasks', {
        method: 'POST',
        headers: { 'X-API-KEY': fitroomApiKey },
        body: lowerFormData,
      })

      if (!lowerResponse.ok) {
        const errorText = await lowerResponse.text()
        console.error('Lower body API error:', lowerResponse.status, errorText)
        throw new Error(`Lower body try-on failed: ${lowerResponse.status}`)
      }

      const lowerResult = await lowerResponse.json()
      console.log('Lower body task created:', lowerResult.task_id)

      const lowerCompleted = await pollTaskStatus(lowerResult.task_id, fitroomApiKey)
      console.log('Lower body try-on completed')

      // Download final result
      const finalImageResponse = await fetch(lowerCompleted.download_signed_url)
      if (!finalImageResponse.ok) {
        throw new Error('Failed to download final result')
      }

      const finalImageBlob = await finalImageResponse.blob()
      const finalArrayBuffer = await finalImageBlob.arrayBuffer()
      const finalBase64 = arrayBufferToBase64(finalArrayBuffer)
      const finalBase64Image = `data:image/png;base64,${finalBase64}`

      console.log('Full body virtual try-on successful')

      return new Response(
        JSON.stringify({ 
          success: true, 
          image: finalBase64Image 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle single garment try-on (Upper body or Lower body)
    console.log('Converting images to blobs...')
    const modelBlob = base64ToBlob(personImageBase64)
    const clothBlob = await urlToBlob(garmentImageUrl)
    console.log('Images converted successfully')

    // Map category to cloth_type
    const clothTypeMap: { [key: string]: string } = {
      'upper': 'upper',
      'Upper body': 'upper',
      'lower': 'lower',
      'Lower body': 'lower',
      'full': 'full_set',
      'Full body': 'full_set',
      'Dress': 'full_set', // Map Dress to full_set for backwards compatibility
    }
    const clothType = clothTypeMap[category] || 'upper'
    console.log(`Category: ${category}, Cloth type: ${clothType}`)

    // Create FormData for the request
    const formData = new FormData()
    formData.append('model_image', modelBlob, 'model.jpg')
    formData.append('cloth_image', clothBlob, 'cloth.jpg')
    formData.append('cloth_type', clothType)
    formData.append('hd_mode', 'false') // Use false for faster processing

    console.log('Creating try-on task with Fit Room API...')
    const createResponse = await fetch('https://platform.fitroom.app/api/tryon/v2/tasks', {
      method: 'POST',
      headers: {
        'X-API-KEY': fitroomApiKey,
      },
      body: formData,
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Fit Room API error:', createResponse.status, errorText)
      
      if (createResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please wait a moment before trying again.',
            details: 'Fit Room API allows 60 requests per minute'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }

      if (createResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient credits. Please upgrade your Fit Room plan.',
            details: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        )
      }
      
      throw new Error(`API request failed: ${createResponse.status} ${errorText}`)
    }

    const createResult = await createResponse.json()
    console.log('Task created:', createResult.task_id)

    // Poll for task completion
    console.log('Polling for task completion...')
    const completedTask = await pollTaskStatus(createResult.task_id, fitroomApiKey)
    console.log('Task completed successfully')

    // Download the result image and convert to base64
    console.log('Downloading result image...')
    const imageResponse = await fetch(completedTask.download_signed_url)
    if (!imageResponse.ok) {
      throw new Error('Failed to download result image')
    }

    const imageBlob = await imageResponse.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)
    const base64Image = `data:image/png;base64,${base64}`

    console.log('Virtual try-on successful')

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: base64Image 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Virtual try-on error:', error)
    
    // More specific error messages
    let errorMessage = 'Virtual try-on failed'
    if (error.message.includes('fetch image') || error.message.includes('download')) {
      errorMessage = 'Failed to load or download images'
    } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment.'
    } else if (error.message.includes('timed out')) {
      errorMessage = 'Try-on processing timed out. Please try again.'
    } else if (error.message.includes('FITROOM_API_KEY')) {
      errorMessage = 'API key not configured. Please contact support.'
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})