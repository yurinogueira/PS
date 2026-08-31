import { Box, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

export function PageLoadingFallback() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        width: "100%",
      }}
      aria-busy="true"
      aria-label={t("shared.loadingPage")}
    >
      <CircularProgress size={40} thickness={4} color="primary" />
    </Box>
  );
}
