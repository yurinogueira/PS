import { Box, Typography, Stack } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ShieldCheckIcon from "@mui/icons-material/VerifiedUser";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { brandColors } from "../../../styles/theme";

export function AuthHeroBanner() {
  return (
    <Box
      sx={{
        flex: 1,
        background: brandColors.gradient,
        color: "#FFFFFF",
        p: { xs: 4, md: 6, lg: 8 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -60,
          right: -60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -80,
          left: -40,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(76,252,247,0.25) 0%, rgba(76,252,247,0) 70%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Brand Header */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", mb: 2 }}
        >
          <Box
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 2,
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <CameraAltIcon sx={{ fontSize: 32, color: "#FFFFFF" }} />
          </Box>
          <Typography
            component="div"
            variant="h5"
            sx={{ fontWeight: 800, letterSpacing: -0.5, color: "#FFFFFF" }}
          >
            PS
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            opacity: 0.9,
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.9)",
          }}
        >
          Photo Storage • Gestão de Fotos de Competição
        </Typography>
      </Box>

      {/* Main Copy */}
      <Box sx={{ position: "relative", zIndex: 1, my: 6 }}>
        <Typography
          component="div"
          variant="h3"
          sx={{
            fontWeight: 800,
            lineHeight: 1.15,
            mb: 2.5,
            fontSize: { xs: "2rem", md: "2.5rem", lg: "2.85rem" },
            color: "#FFFFFF",
          }}
        >
          O controle total do seu evento em um só lugar.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            opacity: 0.95,
            fontSize: "1.05rem",
            maxWidth: 480,
            mb: 4,
            lineHeight: 1.6,
            color: "rgba(255, 255, 255, 0.95)",
          }}
        >
          Acompanhe fotógrafos, clientes, cachorros vencedores e o histórico de
          vendas de fotos com clareza e precisão.
        </Typography>

        {/* Feature Highlights */}
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.18)",
                borderRadius: 1.5,
                p: 0.75,
                display: "flex",
                backdropFilter: "blur(4px)",
              }}
            >
              <CameraAltIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#FFFFFF" }}
            >
              Cadastro organizado de fotos por cachorro e cliente
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.18)",
                borderRadius: 1.5,
                p: 0.75,
                display: "flex",
                backdropFilter: "blur(4px)",
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#FFFFFF" }}
            >
              Controle rápido de formas de pagamento e valores recebidos
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.18)",
                borderRadius: 1.5,
                p: 0.75,
                display: "flex",
                backdropFilter: "blur(4px)",
              }}
            >
              <ShieldCheckIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#FFFFFF" }}
            >
              Filtro global por evento para organização financeira
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Footer / Trust note */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="caption"
          sx={{ opacity: 0.8, color: "rgba(255, 255, 255, 0.8)" }}
        >
          © {new Date().getFullYear()} PS. Todos os direitos reservados.
        </Typography>
      </Box>
    </Box>
  );
}
