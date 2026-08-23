/**
 * Authentication and Session Management Service
 * Handles user login state, Clerk token resolution, and demo authentication profiles.
 */

export const DEMO_USERS = [
  {
    id: "user_enterprise_cfo",
    name: "Vikram Malhotra",
    email: "cfo@acmeenterprises.com",
    role: "Finance Director",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    organization: "Acme Global Industries",
  },
  {
    id: "user_collections_lead",
    name: "Neha Sharma",
    email: "neha.s@fincollect.in",
    role: "Senior Collections Manager",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    organization: "FinCollect Solutions",
  },
  {
    id: "user_audit_officer",
    name: "Rahul Verma",
    email: "rahul.v@fintechcorp.com",
    role: "Compliance & Risk Lead",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    organization: "FinTech Compliance Corp",
  }
];

export const getActiveUserSession = () => {
  const stored = localStorage.getItem("active_user_session");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEMO_USERS[0];
    }
  }
  return DEMO_USERS[0];
};

export const switchUserSession = (user) => {
  localStorage.setItem("active_user_session", JSON.stringify(user));
  window.dispatchEvent(new Event("user-session-changed"));
};
