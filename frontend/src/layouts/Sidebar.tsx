import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CollectionsIcon from "@mui/icons-material/Collections";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../features/auth/state/auth.store";

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  drawerWidth: number;
}

export function Sidebar({
  mobileOpen,
  onDrawerToggle,
  drawerWidth,
}: SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const menuItems = [
    {
      text: t("layout.nav.overview"),
      icon: <DashboardRoundedIcon />,
      path: "/dashboard",
    },
    {
      text: t("layout.nav.seasons"),
      icon: <EventNoteRoundedIcon />,
      path: "/seasons",
    },
    {
      text: t("layout.nav.photographers"),
      icon: <CameraAltRoundedIcon />,
      path: "/photographers",
    },
    {
      text: t("layout.nav.people"),
      icon: <PeopleAltRoundedIcon />,
      path: "/people",
    },
    {
      text: t("layout.nav.clientsPhotos"),
      icon: <CollectionsIcon />,
      path: "/clients",
    },
    {
      text: t("layout.nav.exports"),
      icon: <AssessmentRoundedIcon />,
      path: "/exports",
    },
  ];

  const adminMenuItems = [
    {
      text: t("layout.nav.organizations"),
      icon: <BusinessRoundedIcon />,
      path: "/admin/tenants",
    },
    {
      text: t("layout.nav.usersAccess"),
      icon: <SupervisorAccountRoundedIcon />,
      path: "/admin/users",
    },
  ];

  const handleNavigation = (path: string) => {
    if (mobileOpen) {
      onDrawerToggle();
    }
    navigate(path);
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          px: 3,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: "primary.main",
            letterSpacing: "-0.5px",
          }}
        >
          Photo Storage
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 2, flex: 1, overflowY: "auto" }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                  "&:hover:not(.Mui-selected)": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? "inherit" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontWeight: isActive ? 600 : 500,
                        fontSize: "0.95rem",
                      }}
                    >
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {user?.superAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: "0.8px",
              }}
            >
              {t("layout.admin")}
            </Typography>
            {adminMenuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <ListItem
                  key={item.path}
                  disablePadding
                  sx={{ mt: 0.5, mb: 0.5 }}
                >
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      "&.Mui-selected": {
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        "&:hover": {
                          bgcolor: "secondary.dark",
                        },
                        "& .MuiListItemIcon-root": {
                          color: "secondary.contrastText",
                        },
                      },
                      "&:hover:not(.Mui-selected)": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isActive ? "inherit" : "text.secondary",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: "0.95rem",
                          }}
                        >
                          {item.text}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
          disableRestoreFocus: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid #E2E8F0",
            bgcolor: "background.paper",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid #E2E8F0",
            bgcolor: "background.paper",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
