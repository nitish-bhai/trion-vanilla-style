import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to convert image URL to base64
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64;
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { personImageBase64, garmentImageUrl, category = "Upper body" } = await req.json()

    if (!personImageBase64 || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: personImageBase64 and garmentImageUrl' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Starting virtual try-on process...')
    console.log('Garment image URL:', garmentImageUrl)

    const segmindApiKey = Deno.env.get('SEGMIND_API_KEY')
    if (!segmindApiKey) {
      throw new Error('SEGMIND_API_KEY not configured')
    }

    // Convert garment image URL to base64
    console.log('Converting garment image to base64...')
    const garmentImageBase64 = await urlToBase64(garmentImageUrl)
    console.log('Garment image converted successfully')

    const requestBody = {
      model_image: personImageBase64,
      cloth_image: garmentImageBase64,
      category: category,
      num_inference_steps: 25,
      guidance_scale: 2,
      seed: Math.floor(Math.random() * 999999999),
      base64: true
    }

    console.log('Making request to Segmind API...')
    const response = await fetch('https://api.segmind.com/v1/try-on-diffusion', {
      method: 'POST',
      headers: {
        'x-api-key': segmindApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Segmind API error:', response.status, errorText)
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please wait a few minutes before trying again.',
            details: 'Segmind API allows 1 request per 5 minutes'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('Virtual try-on successful')

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: result.image || result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Virtual try-on error:', error)
    
    // More specific error messages
    let errorMessage = 'Virtual try-on failed'
    if (error.message.includes('fetch image')) {
      errorMessage = 'Failed to load product image'
    } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please wait a few minutes.'
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