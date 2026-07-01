import type { AppRole } from "./roles"

/**
 * Named permissions. Extend this union as gating points are identified.
 *
 * Future usage examples:
 *   hasPermission(role, "create_deal")     → hide "Create new deal" CTA
 *   hasPermission(role, "edit_deal_panel") → switch Deal details panel layout
 *   hasPermission(role, "view_all_columns") → show/hide Deals table columns
 */
export type Permission =
  | "create_deal"       // Show "Create new deal" CTA
  | "edit_deal_panel"   // Show editable Deal details side panel
  | "view_all_columns"  // Show all Deals table columns (vs. read-only subset)
  | "edit_deal_fields"  // Allow editing fields in Deal info section

export function hasPermission(role: AppRole, _permission: Permission): boolean {
  if (role === "editor") return true
  // readonly role: no write permissions
  return false
}
