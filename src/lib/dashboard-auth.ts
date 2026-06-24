export const dashboardAuthCookie = "seasons_dashboard_session";

export function getDashboardSessionToken() {
  return process.env.DASHBOARD_SESSION_TOKEN || "dev-dashboard-session";
}

export function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD || "seasons";
}
