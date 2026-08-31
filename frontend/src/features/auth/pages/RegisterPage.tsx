import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useTranslation } from "react-i18next";
import { AuthHeroBanner } from "../components/AuthHeroBanner";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../state/auth.store";
import { useDocumentTitle } from "../../shared";
import { brandColors } from "../../../styles/theme";
import { LanguageSelector } from "../../../components/LanguageSelector";

export function RegisterPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("auth.register.title"));
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setErrorMsg(t("auth.register.errorDefault"));
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMsg(t("auth.register.errorDefault"));
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMsg(t("auth.register.errorDefault"));
      return;
    }

    if (
      trimmedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setErrorMsg(t("auth.register.errorDefault"));
      return;
    }

    if (password.length < 8) {
      setErrorMsg(t("auth.register.passwordTooShort"));
      return;
    }

    if (password.length > 72) {
      setErrorMsg(t("auth.register.errorDefault"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("auth.register.errorPasswordMismatch"));
      return;
    }

    try {
      setLoading(true);
      const data = await authService.register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      setUser(data.user);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const message =
        errorObj.response?.data?.message || t("auth.register.errorDefault");
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Visual Left Banner (Hidden on mobile, 50% on desktop) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "0 0 50%", lg: "0 0 52%" },
        }}
      >
        <AuthHeroBanner />
      </Box>

      {/* Form Right Panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, sm: 6, md: 8 },
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            border: { xs: "none", sm: "1px solid #E2E8F0" },
            bgcolor: { xs: "transparent", sm: "background.paper" },
            p: { xs: 0, sm: 2 },
          }}
        >
          <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
            {/* Header / Brand & Language Selector */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: { xs: "flex", md: "none" },
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: brandColors.primary,
                    borderRadius: 1.5,
                    p: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: "primary.main" }}
                >
                  PS
                </Typography>
              </Box>
              <Box sx={{ ml: "auto" }}>
                <LanguageSelector variant="auth" />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
              >
                {t("auth.register.title")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("auth.register.subtitle")}
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
                {errorMsg}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.2}>
                <TextField
                  fullWidth
                  label={t("auth.register.name")}
                  type="text"
                  placeholder="Seu Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  slotProps={{
                    htmlInput: { maxLength: 100 },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label={t("auth.register.email")}
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  slotProps={{
                    htmlInput: { maxLength: 254 },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label={t("auth.register.password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.register.passwordHelper")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  slotProps={{
                    htmlInput: { maxLength: 72 },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="alternar visibilidade da senha"
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label={t("auth.register.confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  slotProps={{
                    htmlInput: { maxLength: 72 },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.4,
                    mt: 1,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
                  ) : (
                    t("auth.register.submit")
                  )}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 3.5, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("auth.register.hasAccount")}{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {t("auth.register.login")}
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
