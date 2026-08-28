import React from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuthStore } from "../state/auth.store";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";

export function PendingApprovalPage() {
  useDocumentTitle("Aguardando Aprovação");
  const clearAuth = useAuthStore((state) => state.clear);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    } finally {
      clearAuth();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            textAlign: "center",
            p: { xs: 2, sm: 4 },
          }}
        >
          <CardContent>
            <Box
              sx={{
                bgcolor: "warning.50",
                color: "warning.main",
                display: "inline-flex",
                p: 2,
                borderRadius: "50%",
                mb: 3,
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 40 }} />
            </Box>

            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}
            >
              Acesso Restrito
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "text.secondary", mb: 4, lineHeight: 1.6 }}
            >
              Sua conta foi criada com sucesso, mas estamos aguardando um
              administrador aprovar e vincular seu acesso à organização. Por
              favor, tente novamente mais tarde ou entre em contato com o
              suporte.
            </Typography>

            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleLogout}
              sx={{ fontWeight: 600, px: 4 }}
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
