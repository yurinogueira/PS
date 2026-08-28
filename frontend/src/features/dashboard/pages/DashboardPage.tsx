import { Box, Typography } from "@mui/material";

export const DashboardPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Visão Geral</Typography>
      <Typography variant="body1">
        Bem-vindo ao Photo Storage (PS). 
        Utilize o menu lateral para gerenciar temporadas, fotógrafos, pessoas e fotos de competições de cães.
      </Typography>
    </Box>
  );
};
