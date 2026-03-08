import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SERVICE_CATEGORIES = [
  "Carpenter",
  "Electrician",
  "Tailor",
  "Plumber",
  "Painter",
  "Mechanic",
  "House Maid",
  "Mehendi Artist",
  "Cobbler",
  "Washerman",
  "Iron Man",
  "AC Repair",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, mime_type } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a home service problem classifier. Given an image of a household or personal problem, identify the most relevant service category from this list:
${SERVICE_CATEGORIES.join(", ")}

Rules:
- Analyze the image carefully for visual clues about the problem.
- If you see water damage, leaking pipes, taps, toilets → Plumber
- If you see broken furniture, wood damage, cabinets → Carpenter
- If you see electrical wires, switches, outlets, sparks → Electrician
- If you see wall cracks, peeling paint, stains on walls → Painter
- If you see torn clothes, stitching issues → Tailor
- If you see vehicle parts, engine, tires → Mechanic
- If you see dirty rooms, messy spaces → House Maid
- If you see shoe damage → Cobbler
- If you see AC units, cooling issues → AC Repair
- If you see clothes needing washing/ironing → Washerman or Iron Man
- If you see mehendi/henna related → Mehendi Artist

You MUST respond using the suggest_service tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime_type || "image/jpeg"};base64,${image_base64}`,
                },
              },
              {
                type: "text",
                text: "What service category does this problem need? Analyze the image and classify it.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_service",
              description: "Suggest a service category based on the analyzed image",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: SERVICE_CATEGORIES,
                    description: "The detected service category",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0 to 1",
                  },
                  description: {
                    type: "string",
                    description: "Brief description of what was detected in the image (max 100 chars)",
                  },
                },
                required: ["category", "confidence", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_service" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(
      JSON.stringify({ error: "Could not determine service category from image" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
