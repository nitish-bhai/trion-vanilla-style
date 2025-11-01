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
    const { personImageBase64, garmentImageUrl, category = "upper" } = await req.json()

    if (!personImageBase64 || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: personImageBase64 and garmentImageUrl' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Starting Fit Room virtual try-on process...')
    console.log('Garment image URL:', garmentImageUrl)

    const fitroomApiKey = Deno.env.get('FITROOM_API_KEY')
    if (!fitroomApiKey) {
      throw new Error('FITROOM_API_KEY not configured')
    }

    // Convert images to blobs
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
    }
    const clothType = clothTypeMap[category] || 'upper'

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