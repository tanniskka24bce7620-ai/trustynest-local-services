import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHash } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashAadhaar(aadhaar: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(aadhaar);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Placeholder for real Aadhaar verification API
// Replace this with actual UIDAI / approved vendor API integration
async function callAadhaarVerificationAPI(aadhaarNumber: string): Promise<{ verified: boolean; error?: string }> {
  // TODO: Replace with real Aadhaar verification API call
  // Example: const response = await fetch('https://aadhaar-api-vendor.com/verify', { ... });
  //
  // For now, this validates format only.
  // In production, integrate with a UIDAI-approved KYC vendor.
  const digits = aadhaarNumber.replace(/\D/g, "");
  if (digits.length !== 12) {
    return { verified: false, error: "Invalid Aadhaar number format" };
  }

  // Simulate API call - REPLACE WITH REAL API IN PRODUCTION
  // The real API would verify the number against UIDAI database
  return { verified: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Create client with user's JWT for auth verification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // 2. Parse and validate input
    const body = await req.json();
    const aadhaarNumber = (body.aadhaar_number || "").replace(/\D/g, "");

    if (aadhaarNumber.length !== 12) {
      return jsonResponse({ error: "Aadhaar number must be exactly 12 digits" }, 400);
    }

    // 3. Create service role client for privileged operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Check if user is already verified
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("aadhaar_verified, aadhaar_hash")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return jsonResponse({ error: "Failed to fetch profile" }, 500);
    }

    if (!profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (profile.aadhaar_verified) {
      return jsonResponse({ error: "Already verified" }, 400);
    }

    // 5. Hash the aadhaar number
    const aadhaarHash = await hashAadhaar(aadhaarNumber);

    // 6. Check for duplicate aadhaar usage
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("user_id")
      .eq("aadhaar_hash", aadhaarHash)
      .maybeSingle();

    if (existingProfile) {
      return jsonResponse({ error: "This Aadhaar number is already linked to another account" }, 409);
    }

    // 7. Call Aadhaar verification API
    const verificationResult = await callAadhaarVerificationAPI(aadhaarNumber);

    if (!verificationResult.verified) {
      return jsonResponse(
        { error: verificationResult.error || "Aadhaar verification failed" },
        400
      );
    }

    // 8. Update profile with service role (bypasses trigger restriction)
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        aadhaar_verified: true,
        aadhaar_verified_at: new Date().toISOString(),
        aadhaar_hash: aadhaarHash,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return jsonResponse({ error: "Failed to update verification status" }, 500);
    }

    return jsonResponse({ success: true, message: "Aadhaar verified successfully" });
  } catch (err) {
    console.error("Verify aadhaar error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
