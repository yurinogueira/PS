import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuthStore } from "../features/auth/state/auth.store";
import { useTenantStore } from "../store/tenantStore";
import { TenantStatusBanner } from "../features/shared";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerWidth = 280;

  const { user } = useAuthStore();
  const { fetchTenantStatus } = useTenantStore();

  useEffect(() => {
    if (user?.tenantId) {
      fetchTenantStatus();
    }
  }, [user?.tenantId, fetchTenantStatus]);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        drawerWidth={drawerWidth}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          maxWidth: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <Topbar onDrawerToggle={handleDrawerToggle} />

        <Box
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2.5, md: 3 },
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <TenantStatusBanner />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
