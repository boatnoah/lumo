export type Profile = {
  user_id: string;
  display_name: string;
  role: "student" | "teacher" | "pending" | string;
  avatar: string | null;
};
