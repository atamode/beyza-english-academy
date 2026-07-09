import { getSupabaseClient } from "./supabase-client.js";

export function createStudentRepository(client = getSupabaseClient()) {
  return {
    async listChildrenForAccount(userId, accountType) {
      if (accountType === "student") {
        const { data, error } = await client.from("children").select("*").eq("auth_user_id", userId).maybeSingle();
        if (error) throw error;
        return data ? [data] : [];
      }
      const { data: links, error: linkError } = await client.from("guardian_students").select("child_id").eq("guardian_id", userId);
      if (linkError) throw linkError;
      const ids = (links || []).map(x => x.child_id).filter(Boolean);
      if (!ids.length) {
        const { data: visibleChildren, error: visibleError } = await client.from("children").select("*");
        if (visibleError) return [];
        return (visibleChildren || []).filter(child => child?.is_active !== false);
      }
      const rows = [];
      for (const id of ids) {
        const { data, error } = await client.from("children").select("*").eq("id", id).maybeSingle();
        if (!error && data?.is_active !== false) rows.push(data);
      }
      return rows;
    },
    async createFamilyChild({ name, avatarKey = "sporty-poma", birthYear = null }) {
      const { data, error } = await client.rpc("create_family_child", { p_name: name, p_avatar_key: avatarKey, p_birth_year: birthYear });
      if (error) throw error;
      return data;
    },
    async linkGuardianByStudentCode({ studentCode, relationship = "guardian" }) {
      const { data, error } = await client.rpc("link_guardian_by_student_code", { p_student_code: studentCode, p_relationship: relationship });
      if (error) throw error;
      return data;
    },
    async findChildByStudentCode(studentCode) {
      const { data, error } = await client.from("children").select("*").eq("student_code", studentCode).maybeSingle();
      if (error) throw error;
      return data;
    },
    async joinClassByCode({ childId, joinCode }) {
      const { data, error } = await client.rpc("join_class_by_code", { p_child_id: childId, p_join_code: joinCode });
      if (error) throw error;
      return data;
    },
    async getStudentState(childId) {
      const { data, error } = await client.from("student_state").select("*").eq("child_id", childId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async upsertStudentState(childId, state, expectedRevision) {
      const row = { child_id: childId, schema_version: 1, state };
      let result = await client.from("student_state").update(row).eq("child_id", childId).eq("revision", expectedRevision).select("*");
      if (result.error) throw result.error;
      if (!Array.isArray(result.data) || !result.data.length) {
        const latest = await this.getStudentState(childId);
        if (!latest) {
          const created = await client.from("student_state").insert(row);
          if (created.error) throw created.error;
          return { conflict: false, row: Array.isArray(created.data) ? created.data[0] : created.data };
        }
        return { conflict: true, remote: latest };
      }
      return { conflict: false, row: result.data[0] };
    },
    async getStudentAccess(childId) {
      const { data, error } = await client.from("student_access").select("*").eq("child_id", childId).maybeSingle();
      if (error) throw error;
      return data || { access_status: "trial" };
    }
  };
}
