import { getSupabaseClient } from "./supabase-client.js";

export function canUseTeacherTools(profile) {
  return profile?.approval_status === "approved";
}

export function assertApprovedTeacher(profile) {
  if (!canUseTeacherTools(profile)) throw new Error("Ã–ÄŸretmen hesabÄ± onaylanmadan sÄ±nÄ±f ve Ã¶dev araÃ§larÄ± kullanÄ±lamaz.");
}

export function createTeacherRepository(client = getSupabaseClient()) {
  return {
    async getTeacherProfile(userId) {
      const { data, error } = await client.from("teacher_profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data || { id: userId, approval_status: "pending" };
    },
    async listClasses() {
      const { data, error } = await client.from("classes").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
    async createClass({ name, gradeLevel }) {
      const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data, error } = await client.from("classes").insert({ name, grade_level: gradeLevel, join_code: joinCode, is_active: true }).select("*");
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    async listClassStudents(classId) {
      const { data, error } = await client.from("class_students").select("*").eq("class_id", classId);
      if (error) throw error;
      return data || [];
    },
    async listAssignments(classId) {
      const { data, error } = await client.from("assignments").select("*").eq("class_id", classId).order("due_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async createAssignment(payload) {
      const { data, error } = await client.from("assignments").insert(payload).select("*");
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    async addTeacherNote({ childId, note }) {
      const { data, error } = await client.from("teacher_notes").insert({ child_id: childId, note }).select("*");
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    async readStudentStateOnly(childId) {
      const { data, error } = await client.from("student_state").select("child_id,state,revision,updated_at").eq("child_id", childId).maybeSingle();
      if (error) throw error;
      return data;
    },
    updateStudentState() {
      throw new Error("Öğretmen öğrenci ilerlemesini değiştiremez.");
    }
  };
}
