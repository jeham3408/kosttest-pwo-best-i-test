const jsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    productName: { type: 'string' },
    brand: { type: 'string' },
    servingSize: { type: 'string' },
    servingsPerContainer: { type: ['number', 'null'] },
    priceNok: { type: ['number', 'null'] },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          amountMg: { type: ['number', 'null'] },
          form: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['name', 'amountMg', 'form', 'confidence'],
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
    confidence: { type: 'number' },
  },
  required: [
    'productName',
    'brand',
    'servingSize',
    'servingsPerContainer',
    'priceNok',
    'ingredients',
    'warnings',
    'confidence',
  ],
}

function extractText(responseBody) {
  if (responseBody.output_text) return responseBody.output_text

  return responseBody.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((content) => content.text)
    ?.filter(Boolean)
    ?.join('\n')
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {}
  const { imageDataUrl, productName = '', brand = '', price = null, servings = null } = body

  if (!imageDataUrl?.startsWith('data:image/')) {
    return response.status(400).json({ error: 'Mangler bilde som data-URL.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(200).json({
      status: 'needs_api_key',
      message: 'OPENAI_API_KEY mangler. Innsendingen er klar, men AI-skanning er ikke aktivert.',
    })
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Les baksiden av denne PWO-boksen. Hent produktnavn, merke, porsjonsstørrelse, porsjoner per boks og alle deklarerte ingredienser med mg per full dose. Returner kun JSON som følger skjemaet. Skill mellom ren L-citrulline, citrulline malate 1:1, citrulline malate 2:1 og ukjent ratio.',
            },
            {
              type: 'input_text',
              text: `Bruk disse brukerfeltene som hint, men stol mest på bildet: produkt=${productName}, merke=${brand}, pris=${price}, porsjoner=${servings}.`,
            },
            {
              type: 'input_image',
              image_url: imageDataUrl,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'pwo_label_scan',
          schema: jsonSchema,
          strict: true,
        },
      },
    }),
  })

  const data = await openaiResponse.json()

  if (!openaiResponse.ok) {
    return response.status(openaiResponse.status).json({
      error: 'OpenAI vision request failed',
      detail: data,
    })
  }

  const text = extractText(data)

  try {
    return response.status(200).json({
      status: 'ok',
      parsed: JSON.parse(text),
    })
  } catch {
    return response.status(200).json({
      status: 'raw',
      raw: text,
    })
  }
}
