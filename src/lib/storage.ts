const LINE_USER_KEY = "pv_line_user";
const ADMIN_KEY = "pv_admin_session";

type LineUser = { lineUserId: string; displayName?: string; pictureUrl?: string };
type AdminSession = { adminUserId: string; email: string; role: string };

export const storage = {
  getLineUser: (): LineUser | null => {
    const raw = localStorage.getItem(LINE_USER_KEY);
    return raw ? (JSON.parse(raw) as LineUser) : null;
  },
  setLineUser: (u: LineUser) => localStorage.setItem(LINE_USER_KEY, JSON.stringify(u)),
  clearLineUser: () => localStorage.removeItem(LINE_USER_KEY),

  getAdminSession: (): AdminSession | null => {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  },
  setAdminSession: (s: AdminSession) => localStorage.setItem(ADMIN_KEY, JSON.stringify(s)),
  clearAdminSession: () => localStorage.removeItem(ADMIN_KEY),
};
