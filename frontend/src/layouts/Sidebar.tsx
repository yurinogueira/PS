import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CollectionsIcon from "@mui/icons-material/Collections";

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  drawerWidth: number;
}

const menuItems = [
  { text: "Visão Geral", icon: <DashboardRoundedIcon />, path: "/dashboard" },
  { text: "Temporadas", icon: <EventNoteRoundedIcon />, path: "/seasons" },
  {
    text: "Fotógrafos",
    icon: <CameraAltRoundedIcon />,
    path: "/photographers",
  },
  { text: "Pessoas", icon: <PeopleAltRoundedIcon />, path: "/people" },
  { text: "Clientes e Fotos", icon: <CollectionsIcon />, path: "/clients" },
];

export function Sidebar({
  mobileOpen,
  onDrawerToggle,
  drawerWidth,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobileOpen) {
      onDrawerToggle();
    }
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

      <List sx={{ px: 2, py: 3, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
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
        ModalProps={{ keepMounted: true }}
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
