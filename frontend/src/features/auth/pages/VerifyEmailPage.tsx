import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { useTranslation } from "react-i18next";
import { AuthHeroBanner } from "../components/AuthHeroBanner";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../state/auth.store";
import { useDocumentTitle } from "../../shared";
import { brandColors } from "../../../styles/theme";
import { LanguageSelector } from "../../../components/LanguageSelector";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("auth.verifyEmail.title"));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const hasToken = Boolean(token.trim());

  const { setUser, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(hasToken);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    hasToken ? null : t("auth.verifyEmail.tokenMissing"),
  );

  useEffect(() => {
    if (!hasToken) return;

    let isMounted = true;
    authService
      .verifyEmail({ token: token.trim() })
      .then(() => {
        if (isMounted) {
          setSuccess(true);
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            setUser({ ...currentUser, emailVerified: true });
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const errorObj = err as {
            response?: { data?: { message?: string } };
          };
          setErrorMsg(
            errorObj.response?.data?.message ||
              t("auth.verifyEmail.errorDefault"),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasToken, token, setUser, t]);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Visual Left Banner */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "0 0 50%", lg: "0 0 52%" },
        }}
      >
        <AuthHeroBanner />
      </Box>

      {/* Content Right Panel */}
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
          <CardContent sx={{ p: { xs: 1, sm: 3 }, textAlign: "center" }}>
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

            {loading && (
              <Box sx={{ py: 6 }}>
                <CircularProgress size={48} sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t("auth.verifyEmail.validating")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("auth.verifyEmail.validatingDescription")}
                </Typography>
              </Box>
            )}

            {!loading && success && (
              <Box sx={{ py: 3 }}>
                <CheckCircleOutlineRoundedIcon
                  sx={{ fontSize: 64, color: "success.main", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {t("auth.verifyEmail.successTitle")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 4 }}
                >
                  {t("auth.verifyEmail.successMessage")}
                </Typography>
                <Button
                  onClick={() =>
                    navigate(isAuthenticated ? "/dashboard" : "/login", {
                      replace: true,
                    })
                  }
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ py: 1.4, fontWeight: 600 }}
                >
                  {isAuthenticated
                    ? t("auth.verifyEmail.goToDashboard")
                    : t("auth.verifyEmail.goToLogin")}
                </Button>
              </Box>
            )}

            {!loading && !success && (
              <Box sx={{ py: 3 }}>
                <ErrorOutlineRoundedIcon
                  sx={{ fontSize: 64, color: "error.main", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {t("auth.verifyEmail.failTitle")}
                </Typography>
                {errorMsg && (
                  <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                    {errorMsg}
                  </Alert>
                )}
                <Button
                  onClick={() =>
                    navigate(isAuthenticated ? "/profile" : "/login", {
                      replace: true,
                    })
                  }
                  variant="outlined"
                  fullWidth
                  size="large"
                  sx={{ py: 1.4, fontWeight: 600 }}
                >
                  {isAuthenticated
                    ? t("auth.verifyEmail.failButton")
                    : t("auth.verifyEmail.goToLogin")}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
