import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  Chip,
} from "@mui/material";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MoneyOffRoundedIcon from "@mui/icons-material/MoneyOffRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useTranslation } from "react-i18next";
import { useSeasonStore } from "../../../store/seasonStore";
import { useTenantStore } from "../../../store/tenantStore";
import {
  reportService,
  DynamicPaymentParams,
} from "../../../services/api/report.service";
import { DynamicExportDialog } from "../components/DynamicExportDialog";
import { ExportHistoryTable } from "../components/ExportHistoryTable";

export const ExportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { activeSeason } = useSeasonStore();
  const { tenantStatus } = useTenantStore();

  const selectedSeasonId = activeSeason?.id || "";
  const currentSeason = activeSeason;

  const [dynamicDialogOpen, setDynamicDialogOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const isReportsBlocked = Boolean(
    tenantStatus?.isUnpaid ||
    tenantStatus?.paymentStatus === "unpaid" ||
    tenantStatus?.isTrialExpired ||
    tenantStatus?.clientLimitExceeded,
  );

  const handleExportClientsPdfAsync = async () => {
    setLoadingAction("pdf_async");
    try {
      const res = await reportService.exportClientsPdf(
        selectedSeasonId || undefined,
      );
      setSnackbar({
        open: true,
        message: res.message || t("exports.messages.successStarted"),
        severity: "success",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("exports.messages.downloadFailed");
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadClientsPdfDirect = async () => {
    setLoadingAction("pdf_direct");
    try {
      const blob = await reportService.downloadClientsPdfDirect(
        selectedSeasonId || undefined,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_consolidado_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: t("exports.messages.pdfDownloaded"),
        severity: "success",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("exports.messages.downloadFailed");
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportClientsCsv = async () => {
    setLoadingAction("clients_csv");
    try {
      const res = await reportService.exportClientsCsv(
        selectedSeasonId || undefined,
      );
      setSnackbar({
        open: true,
        message: res.message || t("exports.messages.successStarted"),
        severity: "success",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("exports.messages.downloadFailed");
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportPaidClientsCsv = async () => {
    setLoadingAction("paid_csv");
    try {
      const res = await reportService.exportPaidClientsCsv(
        selectedSeasonId || undefined,
      );
      setSnackbar({
        open: true,
        message: res.message || t("exports.messages.successStarted"),
        severity: "success",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("exports.messages.downloadFailed");
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportUnpaidClientsCsv = async () => {
    setLoadingAction("unpaid_csv");
    try {
      const res = await reportService.exportUnpaidClientsCsv(
        selectedSeasonId || undefined,
      );
      setSnackbar({
        open: true,
        message: res.message || t("exports.messages.successStarted"),
        severity: "success",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("exports.messages.downloadFailed");
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDynamicExportSubmit = async (params: DynamicPaymentParams) => {
    const res = await reportService.exportDynamicPayment(params);
    setSnackbar({
      open: true,
      message: res.message || t("exports.messages.successStarted"),
      severity: "success",
    });
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
          >
            <AssessmentRoundedIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t("exports.title")}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t("exports.subtitle")}
          </Typography>
        </Box>

        {/* Active Event Indicator (Controlled globally by top bar) */}
        <Box>
          {activeSeason ? (
            <Chip
              icon={<EventNoteRoundedIcon />}
              label={`${t("exports.activeEvent")}: ${activeSeason.name}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, py: 2.2, px: 1, borderRadius: 2 }}
            />
          ) : (
            <Chip
              label={t("exports.allEvents")}
              variant="outlined"
              sx={{ fontWeight: 500, py: 2.2, px: 1, borderRadius: 2 }}
            />
          )}
        </Box>
      </Box>

      {/* Available Export Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t("exports.availableReports")}
        </Typography>

        <Grid container spacing={2}>
          {/* Card 1: PDF Consolidado */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <PictureAsPdfRoundedIcon color="error" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t("exports.cards.clientsPdf.title")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t("exports.cards.clientsPdf.description")}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={
                    loadingAction === "pdf_direct" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadRoundedIcon />
                    )
                  }
                  onClick={handleDownloadClientsPdfDirect}
                  disabled={Boolean(loadingAction) || isReportsBlocked}
                >
                  {t("exports.cards.clientsPdf.actionDirect")}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  startIcon={
                    loadingAction === "pdf_async" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <SendRoundedIcon />
                    )
                  }
                  onClick={handleExportClientsPdfAsync}
                  disabled={Boolean(loadingAction) || isReportsBlocked}
                >
                  {t("exports.cards.clientsPdf.actionAsync")}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Card 2: Geral Clientes CSV */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <TableChartRoundedIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t("exports.cards.clientsCsv.title")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t("exports.cards.clientsCsv.description")}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={
                    loadingAction === "clients_csv" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadRoundedIcon />
                    )
                  }
                  onClick={handleExportClientsCsv}
                  disabled={Boolean(loadingAction) || isReportsBlocked}
                >
                  {t("exports.cards.clientsCsv.action")}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Card 3: Clientes Pagos CSV */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <CheckCircleRoundedIcon color="success" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t("exports.cards.paidClientsCsv.title")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t("exports.cards.paidClientsCsv.description")}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={
                    loadingAction === "paid_csv" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadRoundedIcon />
                    )
                  }
                  onClick={handleExportPaidClientsCsv}
                  disabled={Boolean(loadingAction) || isReportsBlocked}
                >
                  {t("exports.cards.paidClientsCsv.action")}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Card 4: Clientes Não Pagos CSV */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <MoneyOffRoundedIcon color="warning" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t("exports.cards.unpaidClientsCsv.title")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t("exports.cards.unpaidClientsCsv.description")}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={
                    loadingAction === "unpaid_csv" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadRoundedIcon />
                    )
                  }
                  onClick={handleExportUnpaidClientsCsv}
                  disabled={Boolean(loadingAction) || isReportsBlocked}
                >
                  {t("exports.cards.unpaidClientsCsv.action")}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Card 5: Dinâmico por Pagamento */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <TuneRoundedIcon color="secondary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t("exports.cards.dynamicPayment.title")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t("exports.cards.dynamicPayment.description")}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<TuneRoundedIcon />}
                  onClick={() => setDynamicDialogOpen(true)}
                  disabled={Boolean(loadingAction) || isReportsBlocked}
                >
                  {t("exports.cards.dynamicPayment.action")}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* History Table */}
      <Box sx={{ mb: 4 }}>
        <ExportHistoryTable
          seasonId={selectedSeasonId || undefined}
          refreshTrigger={refreshTrigger}
        />
      </Box>

      {/* Dynamic Export Dialog */}
      <DynamicExportDialog
        open={dynamicDialogOpen}
        onClose={() => setDynamicDialogOpen(false)}
        onExport={handleDynamicExportSubmit}
        seasonId={selectedSeasonId || undefined}
        seasonName={currentSeason?.name}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
