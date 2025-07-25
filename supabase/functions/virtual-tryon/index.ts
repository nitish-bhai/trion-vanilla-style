import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { personImageBase64, garmentImageUrl } = await req.json()

    if (!personImageBase64 || !garmentImageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: personImageBase64 and garmentImageUrl' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Starting virtual try-on process...')

    const segmindApiKey = Deno.env.get('SEGMIND_API_KEY')
    if (!segmindApiKey) {
      throw new Error('SEGMIND_API_KEY not configured')
    }

    const response = await fetch('https://api.segmind.com/v1/try-on-diffusion', {
      method: 'POST',
      headers: {
        'x-api-key': segmindApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        person_image: personImageBase64,
        garment_image: garmentImageUrl,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Segmind API error:', response.status, errorText)
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
    return new Response(
      JSON.stringify({ 
        error: 'Virtual try-on failed', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})