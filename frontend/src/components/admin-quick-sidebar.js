/**
 * Admin Quick Sidebar - Retired / Cleaned Up
 * Fast-switching between panels is integrated natively into the top navigation pill and user dropdown,
 * avoiding obstructive floating cards, text-overflow bugs, and shortcut clashes.
 */
export function renderAdminQuickSidebar() {
  const container = document.getElementById('admin-sidebar-container');
  if (container) {
    container.remove();
  }
  localStorage.removeItem('toolrent_admin_rail_pinned');
}

export default renderAdminQuickSidebar;
