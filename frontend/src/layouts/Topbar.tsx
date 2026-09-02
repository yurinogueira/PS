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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../features/auth/state/auth.store";
import { useSeasonStore } from "../store/seasonStore";
import { seasonService, Season } from "../services/api/season.service";
import { LanguageSelector } from "../components/LanguageSelector";

interface TopbarProps {
  onDrawerToggle: () => void;
}

export function Topbar({ onDrawerToggle }: TopbarProps) {
  const { t } = useTranslation();
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
        if (seasonList.length > 0) {
          const currentActive = useSeasonStore.getState().activeSeason;
          if (!currentActive) {
            setActiveSeason(seasonList[0]);
          } else {
            // Keep active season updated with latest judges
            const found = seasonList.find((x) => x.id === currentActive.id);
            if (found) {
              setActiveSeason(found);
            } else {
              setActiveSeason(seasonList[0]);
            }
          }
        } else {
          setActiveSeason(null);
        }
      })
      .catch(() => {
        setSeasons([]);
        setActiveSeason(null);
      });
  }, [setActiveSeason]);

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
    if (id === "__manage_seasons__") {
      navigate("/seasons");
      return;
    }
    const s = seasons.find((x) => x.id === id);
    if (s) {
      setActiveSeason(s);
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
          aria-label={t("layout.openMenu")}
          edge="start"
          onClick={(e) => {
            (e.currentTarget as HTMLElement)?.blur();
            onDrawerToggle();
          }}
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
            {t("layout.adminPanel")}
          </Typography>
        </Box>

        <Box
          sx={{
            minWidth: { xs: 140, sm: 190, md: 230 },
            maxWidth: { xs: 180, sm: 270 },
            mr: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <FormControl fullWidth size="small">
            <InputLabel id="active-season-select-label" shrink>
              {t("layout.activeSeason")}
            </InputLabel>
            <Select
              labelId="active-season-select-label"
              value={activeSeason?.id || ""}
              label={t("layout.activeSeason")}
              notched
              displayEmpty
              renderValue={(selected) => {
                if (!selected || seasons.length === 0) {
                  return (
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: "text.secondary",
                        fontStyle: "italic",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <EventNoteRoundedIcon
                        sx={{ fontSize: { xs: 14, sm: 16 } }}
                      />
                      {t("layout.noSeason")}
                    </Typography>
                  );
                }
                const current = seasons.find((s) => s.id === selected);
                return current ? current.name : selected;
              }}
              onChange={(e) => handleChangeSeason(e.target.value)}
              sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
            >
              {seasons.length === 0
                ? [
                    <MenuItem
                      key="empty"
                      value=""
                      disabled
                      sx={{
                        fontStyle: "italic",
                        color: "text.secondary",
                        fontSize: "0.875rem",
                      }}
                    >
                      {t("layout.noSeasonsRegistered")}
                    </MenuItem>,
                    <Divider key="div-empty" sx={{ my: 0.5 }} />,
                    <MenuItem
                      key="create"
                      value="__manage_seasons__"
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AddRoundedIcon fontSize="small" />
                      {t("layout.createSeason")}
                    </MenuItem>,
                  ]
                : [
                    ...seasons.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    )),
                    <Divider key="div-seasons" sx={{ my: 0.5 }} />,
                    <MenuItem
                      key="manage"
                      value="__manage_seasons__"
                      sx={{
                        color: "primary.main",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AddRoundedIcon fontSize="small" />
                      {t("layout.manageSeasons")}
                    </MenuItem>,
                  ]}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mr: { xs: 1, sm: 2 } }}>
          <LanguageSelector />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="body2"
            sx={{ display: { xs: "none", sm: "block" }, fontWeight: 500 }}
          >
            {user?.name || t("layout.user")}
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
              {t("layout.myProfile")}
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              {t("layout.logout")}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
