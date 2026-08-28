import { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/state/auth.store";
import { useSeasonStore } from "../store/seasonStore";
import { seasonService, Season } from "../services/api/season.service";

interface TopbarProps {
  onDrawerToggle: () => void;
}

export function Topbar({ onDrawerToggle }: TopbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const navigate = useNavigate();
  const { user, clear } = useAuthStore();
  const { activeSeason, setActiveSeason } = useSeasonStore();

  useEffect(() => {
    seasonService
      .list()
      .then((data) => {
        const seasonList = data || [];
        setSeasons(seasonList);
        if (seasonList.length > 0 && !activeSeason) {
          setActiveSeason({ id: seasonList[0].id, name: seasonList[0].name });
        }
      })
      .catch(() => {
        setSeasons([]);
      });
  }, [activeSeason, setActiveSeason]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    clear();
    navigate("/login");
  };

  const handleChangeSeason = (id: string) => {
    const s = seasons.find((x) => x.id === id);
    if (s) {
      setActiveSeason({ id: s.id, name: s.name });
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid #E2E8F0",
        color: "text.primary",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Painel Administrativo
          </Typography>
        </Box>

        <Box sx={{ minWidth: 200, mr: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Temporada Ativa</InputLabel>
            <Select
              value={activeSeason?.id || ""}
              label="Temporada Ativa"
              onChange={(e) => handleChangeSeason(e.target.value)}
            >
              {(seasons || []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="body2"
            sx={{ display: { xs: "none", sm: "block" }, fontWeight: 500 }}
          >
            {user?.name || "Usuário"}
          </Typography>
          <IconButton onClick={handleMenu} size="small" sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {user?.name?.charAt(0).toUpperCase() || <AccountCircleIcon />}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.1))",
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                handleClose();
                navigate("/profile");
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
