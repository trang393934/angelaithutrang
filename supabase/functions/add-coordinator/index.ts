import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Admin client to bypass RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller has coordinator or admin role
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["coordinator", "admin"]);

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Bạn không có quyền thêm Coordinator" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email from body
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email không hợp lệ" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email - paginate through all users
    let targetUserId: string | null = null;
    let page = 1;
    const perPage = 100;
    
    while (true) {
      const { data: pageData, error: pageError } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (pageError || !pageData?.users?.length) break;
      
      const match = pageData.users.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (match) {
        targetUserId = match.id;
        break;
      }
      
      if (pageData.users.length < perPage) break;
      page++;
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: `Không tìm thấy user với email: ${email}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUser = { id: targetUserId };

    // Check if already a coordinator
    const { data: existing } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", targetUser.id)
      .eq("role", "coordinator")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "User này đã là Coordinator rồi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert coordinator role
    const { error: insertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: targetUser.id, role: "coordinator" });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Lỗi thêm role: " + insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: `Đã thêm ${email} làm Coordinator thành công!` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
