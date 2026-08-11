import test from "node:test";
import assert from "node:assert/strict";

import { SUPABASE_CONFIG } from "../js/account-config.js";
import { createPomaSupabaseClient } from "../js/supabase-client.js";

test("custom Supabase client supports gt for active membership lookups", async () => {
  const calls = [];
  const client = createPomaSupabaseClient(SUPABASE_CONFIG, async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => "null"
    };
  });

  const now = "2026-08-11T06:50:00.000Z";
  const result = await client
    .from("subscriptions")
    .select("id,ends_at,status")
    .eq("user_id", "user-1")
    .eq("status", "active")
    .gt("ends_at", now)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  assert.equal(result.error, null);
  assert.match(calls[0].url, /user_id=eq\.user-1/);
  assert.match(calls[0].url, /status=eq\.active/);
  assert.match(calls[0].url, /ends_at=gt\.2026-08-11T06%3A50%3A00\.000Z/);
});

test("custom Supabase client supports in filters used by refund admin lookups", async () => {
  const calls = [];
  const client = createPomaSupabaseClient(SUPABASE_CONFIG, async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => "[]"
    };
  });

  const result = await client
    .from("refund_requests")
    .select("id,reviewed_at")
    .in("id", ["refund-1", "refund-2"]);

  assert.equal(result.error, null);
  assert.match(calls[0].url, /id=in\.\(refund-1,refund-2\)/);
});
