import { supabase } from "../supabaseClient";

export const JobAPI = {
  async list(userId) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(userId, job) {
    const { data, error } = await supabase
      .from("jobs")
      .insert([{ ...job, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(userId, id, partial) {
    const { data, error } = await supabase
      .from("jobs")
      .update(partial)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(userId, id) {
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },
};

export const ThemeAPI = {
  async get(userId) {
    const { data, error } = await supabase
      .from("settings")
      .select("theme")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return { mode: data?.theme || "dark" };
  },

  async set(userId, mode) {
    const { data, error } = await supabase
      .from("settings")
      .upsert({ user_id: userId, theme: mode })
      .select()
      .single();

    if (error) throw error;
    return { mode: data.theme };
  },
};