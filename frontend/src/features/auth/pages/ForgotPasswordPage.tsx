import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Link,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { useTranslation } from "react-i18next";
import { AuthHeroBanner } from "../components/AuthHeroBanner";
import { authService } from "../services/auth.service";
import { useDocumentTitle } from "../../shared";
import { brandColors } from "../../../styles/theme";
import { LanguageSelector } from "../../../components/LanguageSelector";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("auth.forgotPassword.title"));

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg(t("auth.forgotPassword.errorDefault"));
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword({ email: email.trim() });
      setSuccessMsg(
        res.message ||
          t("auth.forgotPassword.successMessage", { email: email.trim() }),
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        errorObj.response?.data?.message ||
          t("auth.forgotPassword.errorDefault"),
      );
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
      {/* Visual Left Banner (Desktop) */}
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
            maxWidth: 440,
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
                />
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

            <Box sx={{ mb: 3.5 }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
              >
                {t("auth.forgotPassword.title")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("auth.forgotPassword.subtitle")}
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
                {errorMsg}
              </Alert>
            )}

            {successMsg ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <CheckCircleOutlineRoundedIcon
                  sx={{ fontSize: 48, color: "success.main", mb: 2 }}
                />
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {t("auth.forgotPassword.successTitle")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 3 }}
                >
                  {successMsg}
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  fullWidth
                  startIcon={<ArrowBackRoundedIcon />}
                >
                  {t("auth.forgotPassword.backToLogin")}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label={t("auth.forgotPassword.email")}
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

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.4,
                      fontSize: "0.95rem",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
                    ) : (
                      t("auth.forgotPassword.submit")
                    )}
                  </Button>
                </Stack>
              </Box>
            )}

            {!successMsg && (
              <Box sx={{ mt: 3.5, textAlign: "center" }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "primary.main",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  <ArrowBackRoundedIcon fontSize="small" />
                  {t("auth.forgotPassword.backToLogin")}
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
