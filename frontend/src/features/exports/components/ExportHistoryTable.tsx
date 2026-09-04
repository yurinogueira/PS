import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import { useTranslation } from "react-i18next";
import {
  ReportJob,
  ReportHistoryResponse,
  reportService,
} from "../../../services/api/report.service";

import { AppTablePagination } from "../../../components/AppTablePagination";

interface ExportHistoryTableProps {
  seasonId?: string;
  refreshTrigger?: number;
}

export const formatDuration = (ms?: number): string => {
  if (ms === undefined || ms === null || ms < 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export const ExportHistoryTable: React.FC<ExportHistoryTableProps> = ({
  seasonId,
  refreshTrigger,
}) => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<ReportJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(
    async (isPolling = false) => {
      if (!isPolling) setLoading(true);
      try {
        const res = await reportService.listHistory({
          page: page + 1,
          limit,
          season_id: seasonId || undefined,
        });
        const payload =
          (res as unknown as { data?: ReportHistoryResponse })?.data || res;
        setJobs(payload?.jobs || []);
        setTotal(payload?.total ?? 0);
      } catch (err) {
        console.error("Erro ao carregar histórico de exportações:", err);
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [page, limit, seasonId],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  // Polling every 5 seconds if there are jobs in pending or processing state
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (j) => j.status === "pending" || j.status === "processing",
    );

    if (hasActiveJobs) {
      pollingRef.current = setInterval(() => {
        fetchJobs(true);
      }, 5000);
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobs, fetchJobs]);

  const handleDownload = async (job: ReportJob) => {
    if (!job.file_path) return;
    setDownloadingId(job.id);
    try {
      const blob = await reportService.downloadReport(job.file_path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const isPdf =
        job.type === "clients_pdf" ||
        job.type === "dynamic_payment" ||
        job.file_path.endsWith(".pdf");
      const fallbackExt = isPdf ? "pdf" : "csv";
      const filename =
        job.file_path.split("/").pop() || `export_${job.id}.${fallbackExt}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar relatório:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "clients_csv":
        return t("exports.table.types.clients_csv");
      case "paid_clients_csv":
        return t("exports.table.types.paid_clients_csv");
      case "unpaid_clients_csv":
        return t("exports.table.types.unpaid_clients_csv");
      case "clients_pdf":
        return t("exports.table.types.clients_pdf");
      case "dynamic_payment":
        return t("exports.table.types.dynamic_payment");
      default:
        return type;
    }
  };

  const getStatusChip = (status: string, errorMsg?: string) => {
    switch (status) {
      case "completed":
        return (
          <Chip
            size="small"
            color="success"
            variant="filled"
            label={t("exports.table.statusLabels.completed")}
            sx={{ fontWeight: 600 }}
          />
        );
      case "processing":
        return (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            icon={<CircularProgress size={12} color="inherit" />}
            label={t("exports.table.statusLabels.processing")}
            sx={{ fontWeight: 600 }}
          />
        );
      case "pending":
        return (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            icon={<HourglassEmptyRoundedIcon fontSize="small" />}
            label={t("exports.table.statusLabels.pending")}
            sx={{ fontWeight: 600 }}
          />
        );
      case "failed":
        return (
          <Tooltip title={errorMsg || "Erro no processamento"}>
            <Chip
              size="small"
              color="error"
              variant="filled"
              icon={<ErrorOutlineRoundedIcon fontSize="small" />}
              label={t("exports.table.statusLabels.failed")}
              sx={{ fontWeight: 600 }}
            />
          </Tooltip>
        );
      default:
        return <Chip size="small" label={status} />;
    }
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2 }}>
      <CardHeader
        sx={{
          borderBottom: "1px solid #E2E8F0",
          px: 2.5,
          py: 2,
        }}
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryRoundedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("exports.history")}
            </Typography>
          </Box>
        }
        action={
          <Tooltip title={t("exports.refreshHistory")}>
            <IconButton
              onClick={() => fetchJobs(false)}
              disabled={loading}
              size="small"
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.type")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.season")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.requestedBy")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.requestedAt")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.completedAt")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.duration")}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {t("exports.table.status")}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {t("exports.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {t("exports.table.empty")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const requester =
                    job.requested_by?.user_name ||
                    job.user_name ||
                    job.requested_by?.user_email ||
                    job.user_email ||
                    "-";
                  return (
                    <TableRow key={job.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {getReportTypeLabel(job.type)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={job.season_name || "Todos os Eventos"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{requester}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(job.created_at)}</TableCell>
                      <TableCell>{formatDate(job.completed_at)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {formatDuration(job.duration_ms)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(job.status, job.error)}
                      </TableCell>
                      <TableCell align="center">
                        {job.status === "completed" && job.file_path && (
                          <Tooltip title={t("exports.table.downloadTooltip")}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownload(job)}
                                disabled={downloadingId === job.id}
                              >
                                {downloadingId === job.id ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <DownloadRoundedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {job.status === "failed" && job.error && (
                          <Tooltip
                            title={t("exports.table.errorTooltip", {
                              error: job.error,
                            })}
                          >
                            <IconButton size="small" color="error">
                              <ErrorOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <AppTablePagination
          count={total}
          rowsPerPage={limit}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </CardContent>
    </Card>
  );
};
