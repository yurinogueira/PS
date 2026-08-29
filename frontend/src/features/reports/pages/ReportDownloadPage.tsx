import { useState, useEffect, useCallback } from "react";
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
import FileDownloadDoneRoundedIcon from "@mui/icons-material/FileDownloadDoneRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import { AuthHeroBanner } from "../../auth/components/AuthHeroBanner";
import { reportService } from "../../../services/api/report.service";
import { useAuthStore } from "../../auth/state/auth.store";
import { useDocumentTitle } from "../../shared";
import { brandColors } from "../../../styles/theme";

export function ReportDownloadPage() {
  useDocumentTitle("Download de Relatório");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileParam = searchParams.get("file") || "";
  const hasFile = Boolean(fileParam.trim());

  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    hasFile
      ? null
      : "Parâmetro de arquivo ausente. Utilize o link enviado para seu e-mail.",
  );

  const triggerDownload = useCallback(async () => {
    if (!hasFile) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const blob = await reportService.downloadReport(fileParam.trim());

      const fileName =
        fileParam.split("/").pop() ||
        `clientes_${Math.floor(Date.now() / 1000)}.csv`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      setDownloaded(true);
    } catch (err: unknown) {
      let message =
        "Não foi possível baixar o relatório. Verifique se o arquivo ainda existe e se você tem permissão de acesso.";
      const errorObj = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (errorObj?.response?.status === 403) {
        message = "Acesso negado: este relatório pertence a outro tenant.";
      } else if (errorObj?.response?.status === 404) {
        message = "Relatório não encontrado ou link expirado.";
      } else if (errorObj?.response?.data?.message) {
        message = errorObj.response.data.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [hasFile, fileParam]);

  useEffect(() => {
    if (isAuthenticated && hasFile && !downloaded && !loading && !errorMsg) {
      triggerDownload();
    }
  }, [
    isAuthenticated,
    hasFile,
    downloaded,
    loading,
    errorMsg,
    triggerDownload,
  ]);

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
            {/* Mobile Header / Brand */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
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

            {!isAuthenticated ? (
              <Box sx={{ py: 3 }}>
                <FileDownloadRoundedIcon
                  sx={{ fontSize: 64, color: "primary.main", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Download de Relatório
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 4 }}
                >
                  Você precisa estar conectado à sua conta para fazer o download
                  deste relatório com segurança.
                </Typography>
                <Button
                  onClick={() =>
                    navigate(
                      `/login?redirect=${encodeURIComponent(
                        `/reports/download?file=${fileParam}`,
                      )}`,
                      { replace: true },
                    )
                  }
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ py: 1.4, fontWeight: 600 }}
                >
                  Fazer Login para Baixar
                </Button>
              </Box>
            ) : loading ? (
              <Box sx={{ py: 6 }}>
                <CircularProgress size={48} sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Baixando seu relatório...
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Aguarde enquanto seu arquivo CSV é transferido com segurança.
                </Typography>
              </Box>
            ) : downloaded ? (
              <Box sx={{ py: 3 }}>
                <FileDownloadDoneRoundedIcon
                  sx={{ fontSize: 64, color: "success.main", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Download Concluído!
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 4 }}
                >
                  O relatório de clientes foi gerado e baixado no seu navegador.
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Button
                    onClick={triggerDownload}
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<FileDownloadRoundedIcon />}
                    sx={{ py: 1.4, fontWeight: 600 }}
                  >
                    Baixar Novamente
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard", { replace: true })}
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ py: 1.4, fontWeight: 600 }}
                  >
                    Ir para o Painel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ py: 3 }}>
                <ErrorOutlineRoundedIcon
                  sx={{ fontSize: 64, color: "error.main", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Falha no Download
                </Typography>
                {errorMsg && (
                  <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
                    {errorMsg}
                  </Alert>
                )}
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {hasFile && (
                    <Button
                      onClick={triggerDownload}
                      variant="contained"
                      fullWidth
                      size="large"
                      sx={{ py: 1.4, fontWeight: 600 }}
                    >
                      Tentar Novamente
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate("/dashboard", { replace: true })}
                    variant="outlined"
                    fullWidth
                    size="large"
                    sx={{ py: 1.4, fontWeight: 600 }}
                  >
                    Ir para o Painel
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
