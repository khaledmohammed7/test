export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set" });
  }

  // All generateContent-compatible models, best → worst
  // Gemma models placed early as they have separate rate limits
  const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-3-4b-it",
    "gemma-3-1b-it",
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite-preview-09-2025",
    "gemini-pro-latest",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite-001",
  ];

  const body = req.body;
  if (!body || !body.contents) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const errors = [];
  let allRateLimited = true;
  for (const model of MODELS) {
    try {
      // Gemma models don't support system_instruction — prepend it as a user message instead
      const isGemma = model.startsWith("gemma");
      const payload = {
        contents: body.contents,
        generationConfig: body.generationConfig || {},
      };
      if (!isGemma) {
        payload.system_instruction = body.system_instruction;
        payload.safetySettings = body.safetySettings || [];
      } else if (body.system_instruction?.parts?.[0]?.text) {
        // Inject system prompt as first user message for Gemma
        payload.contents = [
          { role: "user", parts: [{ text: "[System] " + body.system_instruction.parts[0].text }] },
          { role: "model", parts: [{ text: "Understood." }] },
          ...body.contents,
        ];
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 429) {
        errors.push(`HTTP 429 from ${model}`);
        console.log(`⚠ ${model}: HTTP 429 (rate limited)`);
        continue;
      }

      allRateLimited = false;

      if (!response.ok) {
        const errText = await response.text();
        errors.push(`HTTP ${response.status} from ${model}: ${errText.slice(0, 300)}`);
        console.log(`⚠ ${model}: HTTP ${response.status}`);
        continue;
      }

      const result = await response.json();
      result._model_used = model;
      return res.status(200).json(result);
    } catch (e) {
      errors.push(`${model}: ${e.message}`);
      console.log(`⚠ ${model}: ${e.message}`);
    }
  }

  return res.status(502).json({ error: "All models failed", details: errors });
}
