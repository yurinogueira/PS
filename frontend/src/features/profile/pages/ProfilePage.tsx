import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Alert,
  Chip,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import GppMaybeRoundedIcon from "@mui/icons-material/GppMaybeRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useTranslation } from "react-i18next";

import { profileService } from "../services/profile.service";
import { authService } from "../../auth/services/auth.service";
import { useAuthStore } from "../../auth/state/auth.store";
import { ProfileData } from "../types/profile.types";
import { useDocumentTitle, PageLoadingFallback } from "../../shared";

export function ProfilePage() {
  const { t } = useTranslation();
  useDocumentTitle(t("profile.title"));
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Name form state
  const [name, setName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Resend email verification state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let isMounted = true;
    profileService
      .getProfile()
      .then((data) => {
        if (isMounted) {
          setProfileData(data);
          setName(data.user.name);
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            setUser({ ...currentUser, ...data.user });
          } else {
            setUser(data.user);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setPageError(t("profile.errorLoad"));
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
  }, [setUser, t]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess(null);
    setNameError(null);

    if (name.trim().length < 2 || name.trim().length > 100) {
      setNameError(t("profile.errorPasswordTooShort"));
      return;
    }

    try {
      setUpdatingName(true);
      const updatedUser = await profileService.updateProfile({
        name: name.trim(),
      });
      setNameSuccess(t("profile.successName"));
      if (user) {
        setUser({ ...user, name: updatedUser.name });
      }
      if (profileData) {
        setProfileData({
          ...profileData,
          user: { ...profileData.user, name: updatedUser.name },
        });
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setNameError(errorObj.response?.data?.message || t("shared.error"));
    } finally {
      setUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(t("profile.fields.currentPassword"));
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError(t("profile.errorPasswordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.errorPasswordMismatch"));
      return;
    }

    try {
      setUpdatingPassword(true);
      const res = await profileService.updatePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.message || t("profile.successPassword"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setPasswordError(errorObj.response?.data?.message || t("shared.error"));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setEmailSuccess(null);
    setEmailError(null);

    try {
      setResendingEmail(true);
      const res = await authService.resendVerification();
      setEmailSuccess(res.message || t("profile.successResendEmail"));
      setCooldown(60); // 60s cooldown
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setEmailError(
        errorObj.response?.data?.message || t("profile.errorResendEmail"),
      );
    } finally {
      setResendingEmail(false);
    }
  };

  if (loading) {
    return <PageLoadingFallback />;
  }

  const isEmailVerified = Boolean(profileData?.user?.emailVerified);

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto" }}>
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: "text.primary" }}
        >
          {t("profile.title")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {t("profile.subtitle")}
        </Typography>
      </Box>

      {pageError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {pageError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Card 1: Status de E-mail */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              p: 1,
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", mb: 2 }}
              >
                <MarkEmailReadRoundedIcon
                  sx={{ color: "primary.main", fontSize: 28 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("profile.emailStatus")}
                </Typography>
              </Stack>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isEmailVerified ? "success.50" : "warning.50",
                  border: "1px solid",
                  borderColor: isEmailVerified ? "success.200" : "warning.200",
                  mb: 2.5,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", mb: 1 }}
                >
                  {isEmailVerified ? (
                    <VerifiedUserRoundedIcon color="success" />
                  ) : (
                    <GppMaybeRoundedIcon color="warning" />
                  )}
                  <Chip
                    label={
                      isEmailVerified
                        ? t("profile.emailVerified")
                        : t("profile.emailUnverified")
                    }
                    color={isEmailVerified ? "success" : "warning"}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: isEmailVerified ? "success.900" : "warning.900",
                    fontWeight: 500,
                  }}
                >
                  {isEmailVerified
                    ? t("profile.emailVerifiedDescription")
                    : t("profile.emailUnverifiedDescription")}
                </Typography>
              </Box>

              {emailSuccess && (
                <Alert
                  severity="success"
                  onClose={() => setEmailSuccess(null)}
                  sx={{ mb: 2 }}
                >
                  {emailSuccess}
                </Alert>
              )}

              {emailError && (
                <Alert
                  severity="error"
                  onClose={() => setEmailError(null)}
                  sx={{ mb: 2 }}
                >
                  {emailError}
                </Alert>
              )}

              {!isEmailVerified && (
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  onClick={handleResendVerification}
                  disabled={resendingEmail || cooldown > 0}
                  startIcon={
                    resendingEmail ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SendRoundedIcon />
                    )
                  }
                  sx={{ fontWeight: 600 }}
                >
                  {cooldown > 0
                    ? t("profile.resendCooldown", { seconds: cooldown })
                    : resendingEmail
                      ? t("profile.sending")
                      : t("profile.resendEmailBtn")}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Dados Pessoais (Nome) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              p: 1,
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", mb: 2 }}
              >
                <PersonRoundedIcon
                  sx={{ color: "primary.main", fontSize: 28 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("profile.personalData")}
                </Typography>
              </Stack>

              {nameSuccess && (
                <Alert
                  severity="success"
                  onClose={() => setNameSuccess(null)}
                  sx={{ mb: 2 }}
                >
                  {nameSuccess}
                </Alert>
              )}

              {nameError && (
                <Alert
                  severity="error"
                  onClose={() => setNameError(null)}
                  sx={{ mb: 2 }}
                >
                  {nameError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleUpdateName} noValidate>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label={t("profile.fields.emailReadonly")}
                    value={profileData?.user?.email || ""}
                    disabled
                  />

                  <TextField
                    fullWidth
                    label={t("profile.fields.fullName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={updatingName}
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      updatingName ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveRoundedIcon />
                      )
                    }
                    disabled={updatingName || !name.trim()}
                    sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                  >
                    {updatingName
                      ? t("profile.saving")
                      : t("profile.saveChanges")}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Segurança & Alteração de Senha */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              p: 1,
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", mb: 2 }}
              >
                <LockResetRoundedIcon
                  sx={{ color: "primary.main", fontSize: 28 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("profile.changePassword")}
                </Typography>
              </Stack>

              {passwordSuccess && (
                <Alert
                  severity="success"
                  onClose={() => setPasswordSuccess(null)}
                  sx={{ mb: 2 }}
                >
                  {passwordSuccess}
                </Alert>
              )}

              {passwordError && (
                <Alert
                  severity="error"
                  onClose={() => setPasswordError(null)}
                  sx={{ mb: 2 }}
                >
                  {passwordError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleUpdatePassword} noValidate>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label={t("profile.fields.currentPassword")}
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={updatingPassword}
                    required
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowCurrentPassword((prev) => !prev)
                              }
                              edge="end"
                              size="small"
                            >
                              {showCurrentPassword ? (
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

                  <Divider />

                  <TextField
                    fullWidth
                    label={t("profile.fields.newPassword")}
                    type={showNewPassword ? "text" : "password"}
                    placeholder={t("profile.fields.newPasswordPlaceholder")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updatingPassword}
                    required
                    helperText={t("profile.fields.newPasswordHelper")}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowNewPassword((prev) => !prev)
                              }
                              edge="end"
                              size="small"
                            >
                              {showNewPassword ? (
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
                    label={t("profile.fields.confirmNewPassword")}
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updatingPassword}
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={
                      updatingPassword ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveRoundedIcon />
                      )
                    }
                    disabled={
                      updatingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                  >
                    {updatingPassword
                      ? t("profile.updating")
                      : t("profile.changePasswordBtn")}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
