import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  Tooltip,
  Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useTranslation } from "react-i18next";
import {
  clientService,
  SeasonClient,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import { reportService } from "../../../services/api/report.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { useTenantStore } from "../../../store/tenantStore";
import { LinkClientModal } from "../../clients/components/LinkClientModal";
import { ClientDetailsModal } from "../../clients/components/ClientDetailsModal";
import { formatPhone, maskPhone } from "../../../utils/phone";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeSeason } = useSeasonStore();
  const { tenantStatus } = useTenantStore();

  const isWriteBlocked = Boolean(
    tenantStatus?.isUnpaid || tenantStatus?.isTrialExpired,
  );

  const isReportsBlocked = Boolean(
    tenantStatus?.isUnpaid ||
    tenantStatus?.isTrialExpired ||
    tenantStatus?.clientLimitExceeded,
  );

  const getWriteBlockedReason = () => {
    if (tenantStatus?.isUnpaid) {
      return t("shared.tenantBanner.unpaidShort");
    }
    if (tenantStatus?.isTrialExpired) {
      return t("shared.tenantBanner.trialExpiredShort");
    }
    return "";
  };

  const getReportsBlockedReason = () => {
    if (tenantStatus?.isUnpaid) {
      return t("shared.tenantBanner.unpaidShort");
    }
    if (tenantStatus?.isTrialExpired) {
      return t("shared.tenantBanner.trialExpiredShort");
    }
    if (tenantStatus?.clientLimitExceeded) {
      return t("shared.tenantBanner.clientLimitExceededShort");
    }
    return "";
  };

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<SeasonClient[]>([]);
  const [allSeasonClients, setAllSeasonClients] = useState<SeasonClient[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [userToggledOverview, setUserToggledOverview] = useState(false);
  const [showOverview, setShowOverview] = useState<boolean>(() => {
    return tenantStatus ? !tenantStatus.settings?.hideOverviewByDefault : true;
  });

  useEffect(() => {
    if (tenantStatus && !userToggledOverview) {
      setShowOverview(!tenantStatus.settings?.hideOverviewByDefault);
    }
  }, [tenantStatus, userToggledOverview]);

  // Modals state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Quick New Person Dialog
  const [newPersonOpen, setNewPersonOpen] = useState(false);
  const [newPersonForm, setNewPersonForm] = useState({
    name: "",
    email: "",
    alternative_email: "",
    phone: "",
  });

  // Report Export Menu & Snackbar state
  const [reportMenuAnchor, setReportMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [exportingReport, setExportingReport] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const seasonId = activeSeason?.id;

  const handleExportClientsPdf = async () => {
    if (!seasonId) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportClientsPdf(seasonId);
      setSnackbar({
        open: true,
        message: res.message || t("clients.reports.pdfProcessing"),
        severity: "success",
      });
    } catch (err: unknown) {
      console.error("Erro ao solicitar relatório PDF:", err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj.response?.data?.message || t("clients.reports.pdfError"),
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportClientsCsv = async () => {
    if (!seasonId) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportClientsCsv(seasonId);
      setSnackbar({
        open: true,
        message: res.message || t("clients.reports.csvProcessing"),
        severity: "success",
      });
    } catch (err: unknown) {
      console.error("Erro ao solicitar relatório CSV de clientes:", err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj.response?.data?.message || t("clients.reports.csvError"),
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportPaidClientsCsv = async () => {
    if (!seasonId) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportPaidClientsCsv(seasonId);
      setSnackbar({
        open: true,
        message: res.message || t("clients.reports.paidProcessing"),
        severity: "success",
      });
    } catch (err: unknown) {
      console.error("Erro ao exportar CSV de clientes pagos:", err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj.response?.data?.message || t("clients.reports.paidError"),
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportUnpaidClientsCsv = async () => {
    if (!seasonId) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportUnpaidClientsCsv(seasonId);
      setSnackbar({
        open: true,
        message: res.message || t("clients.reports.unpaidProcessing"),
        severity: "success",
      });
    } catch (err: unknown) {
      console.error("Erro ao exportar CSV de não pagos:", err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj.response?.data?.message || t("clients.reports.unpaidError"),
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);
    try {
      const [paginatedRes, allRes, peopleRes] = await Promise.all([
        clientService.list({
          season_id: seasonId,
          search: debouncedSearch || undefined,
          page: page + 1,
          limit: rowsPerPage,
        }),
        clientService.list({
          season_id: seasonId,
          limit: 1000,
        }),
        personService.list(),
      ]);

      setClients(paginatedRes?.data || []);
      setTotal(paginatedRes?.total || 0);
      setAllSeasonClients(allRes?.data || []);
      setPeople(peopleRes || []);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [seasonId, debouncedSearch, page, rowsPerPage]);

  useEffect(() => {
    if (seasonId) {
      loadData();
    } else {
      setClients([]);
      setAllSeasonClients([]);
      setTotal(0);
      personService.list().then((res) => setPeople(res || []));
    }
  }, [seasonId, loadData]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setDetailsModalOpen(true);
  };

  const getPerson = (personId: string) => {
    return people.find((p) => p.id === personId);
  };

  // Quick Create Person
  const handleSaveNewPerson = async () => {
    if (!newPersonForm.name.trim()) return;
    try {
      const created = await personService.create({
        name: newPersonForm.name.trim(),
        email: newPersonForm.email.trim(),
        alternative_email: newPersonForm.alternative_email.trim(),
        phone: newPersonForm.phone.trim(),
      });
      setNewPersonOpen(false);
      setNewPersonForm({
        name: "",
        email: "",
        alternative_email: "",
        phone: "",
      });
      await loadData();
      if (created?.id) {
        navigate(`/people/${created.id}`);
      }
    } catch (err) {
      console.error("Erro ao criar nova pessoa:", err);
    }
  };

  // Aggregate Metrics for Active Season
  const metrics = useMemo(() => {
    let totalDogs = 0;
    let totalPhotos = 0;
    let totalRevenueBRL = 0;
    let totalRevenueUSD = 0;

    allSeasonClients.forEach((c) => {
      const dogs = c.dogs || [];
      totalDogs += dogs.length;
      dogs.forEach((d) => {
        const photos = d.photos || [];
        totalPhotos += photos.length;
        photos.forEach((p) => {
          if (p.payment_method !== "Não pago" && p.amount_paid) {
            if (p.currency === "USD") {
              totalRevenueUSD += p.amount_paid;
            } else {
              totalRevenueBRL += p.amount_paid;
            }
          }
        });
      });
    });

    return {
      totalPeople: people.length,
      activeSeasonClients: allSeasonClients.length,
      totalDogs,
      totalPhotos,
      totalRevenueBRL,
      totalRevenueUSD,
    };
  }, [people.length, allSeasonClients]);

  return (
    <Box sx={{ maxWidth: 1600, margin: "0 auto", width: "100%" }}>
      {/* Top Header Row with Compact Overview Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "text.primary" }}
          >
            {t("dashboard.eventPanel")}
          </Typography>
          {activeSeason ? (
            <Chip
              icon={<EventNoteRoundedIcon style={{ color: "#0284c7" }} />}
              label={activeSeason.name}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Chip
              label={t("dashboard.noActiveSeason")}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip
            title={
              showOverview
                ? t("dashboard.overviewToggle.hideTooltip")
                : t("dashboard.overviewToggle.showTooltip")
            }
          >
            <Button
              size="small"
              variant={showOverview ? "outlined" : "contained"}
              startIcon={
                showOverview ? (
                  <VisibilityOffRoundedIcon />
                ) : (
                  <VisibilityRoundedIcon />
                )
              }
              onClick={() => {
                setShowOverview((prev) => !prev);
                setUserToggledOverview(true);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 1.5,
              }}
            >
              {showOverview
                ? t("dashboard.overviewToggle.hide")
                : t("dashboard.overviewToggle.show")}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Section (Welcome Header & Metrics Cards) */}
      <Collapse in={showOverview} timeout="auto" unmountOnExit={false}>
        {/* Top Welcome & Season Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "white",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  letterSpacing: "-0.5px",
                  color: "#ffffff",
                }}
              >
                {t("dashboard.title")}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "grey.300",
                  mt: 0.5,
                  fontSize: { xs: "0.85rem", sm: "1rem" },
                }}
              >
                {activeSeason
                  ? t("dashboard.activeSeasonSubtitle", {
                      name: activeSeason.name,
                    })
                  : t("dashboard.subtitle")}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
                width: { xs: "100%", md: "auto" },
              }}
            >
              {activeSeason ? (
                <Chip
                  icon={<EventNoteRoundedIcon style={{ color: "#38bdf8" }} />}
                  label={t("dashboard.eventLabel", {
                    name: activeSeason.name,
                  })}
                  sx={{
                    bgcolor: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    py: 2.2,
                    px: 1,
                    borderRadius: 2,
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                />
              ) : (
                <Chip
                  label={t("dashboard.noActiveSeason")}
                  sx={{
                    bgcolor: "warning.main",
                    color: "warning.contrastText",
                    fontWeight: 700,
                  }}
                />
              )}
              <Tooltip
                title={isReportsBlocked ? getReportsBlockedReason() : ""}
              >
                <span>
                  <Button
                    variant="outlined"
                    startIcon={
                      exportingReport ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <AssessmentIcon />
                      )
                    }
                    endIcon={<ExpandMoreIcon />}
                    onClick={(e) => setReportMenuAnchor(e.currentTarget)}
                    disabled={exportingReport || isReportsBlocked}
                    sx={{
                      borderColor: "rgba(255,255,255,0.4)",
                      color: "white",
                      "&:hover": {
                        borderColor: "white",
                        bgcolor: "rgba(255,255,255,0.08)",
                      },
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {exportingReport
                      ? t("dashboard.generating")
                      : t("dashboard.reportsButton")}
                  </Button>
                </span>
              </Tooltip>
              <Menu
                anchorEl={reportMenuAnchor}
                open={Boolean(reportMenuAnchor)}
                onClose={() => setReportMenuAnchor(null)}
              >
                <MenuItem onClick={handleExportClientsPdf}>
                  <ListItemIcon>
                    <PictureAsPdfIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  {t("clients.reports.exportPdf")}
                </MenuItem>
                <MenuItem onClick={handleExportClientsCsv}>
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  {t("clients.reports.exportClientsCsv")}
                </MenuItem>
                <MenuItem onClick={handleExportPaidClientsCsv}>
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  {t("clients.reports.exportPaidCsv")}
                </MenuItem>
                <MenuItem onClick={handleExportUnpaidClientsCsv}>
                  <ListItemIcon>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  {t("clients.reports.exportUnpaidCsv")}
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Paper>

        {/* Metrics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: "uppercase" }}
                    >
                      {t("dashboard.kpi.totalClients")}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}
                    >
                      {metrics.totalPeople}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metrics.activeSeasonClients}{" "}
                      {t("dashboard.kpiDescriptions.inThisEvent")}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "primary.light",
                      color: "primary.main",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <PeopleAltRoundedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: "uppercase" }}
                    >
                      {t("dashboard.kpi.dogs")}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}
                    >
                      {metrics.totalDogs}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard.kpiDescriptions.registeredInActiveSeason")}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "#e0e7ff",
                      color: "#4f46e5",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <PetsRoundedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: "uppercase" }}
                    >
                      {t("dashboard.kpi.totalPhotos")}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}
                    >
                      {metrics.totalPhotos}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard.kpiDescriptions.totalInThisEvent")}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "#ecfdf5",
                      color: "#059669",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <PhotoCameraRoundedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: "uppercase" }}
                    >
                      {t("dashboard.kpi.totalRevenue")}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.25,
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: "success.main",
                          whiteSpace: "nowrap",
                        }}
                      >
                        R$ {metrics.totalRevenueBRL.toFixed(2)}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color: "success.main",
                          whiteSpace: "nowrap",
                        }}
                      >
                        $ {metrics.totalRevenueUSD.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard.kpiDescriptions.paidPhotos")}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "#fef3c7",
                      color: "#d97706",
                      width: 48,
                      height: 48,
                    }}
                  >
                    <AttachMoneyRoundedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Collapse>

      {/* Event Warning if None Active */}
      {!activeSeason ? (
        <Alert
          severity="info"
          icon={<EventNoteRoundedIcon fontSize="inherit" />}
          sx={{
            p: 2.5,
            borderRadius: 2,
            alignItems: "center",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t("dashboard.noSeason")}
          </Typography>
          <Typography variant="body2">
            {t("dashboard.noSeasonDescription")}
          </Typography>
        </Alert>
      ) : (
        /* People & Clients Table Section */
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {/* Table Toolbar */}
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ width: { xs: "100%", md: "auto" } }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t("clients.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("dashboard.tableHint")}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
                width: { xs: "100%", md: "auto" },
              }}
            >
              <TextField
                size="small"
                placeholder={t("dashboard.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 280, md: 340 },
                  flex: { xs: "1 1 100%", sm: "0 0 auto" },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  width: { xs: "100%", sm: "auto" },
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                }}
              >
                <Tooltip title={isWriteBlocked ? getWriteBlockedReason() : ""}>
                  <span style={{ width: "100%" }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => setLinkModalOpen(true)}
                      disabled={!activeSeason || isWriteBlocked}
                      sx={{
                        bgcolor: "primary.main",
                        "&:hover": { bgcolor: "primary.dark" },
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2,
                        whiteSpace: "nowrap",
                        minHeight: 40,
                      }}
                    >
                      {t("dashboard.actions.addClient")}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title={isWriteBlocked ? getWriteBlockedReason() : ""}>
                  <span style={{ width: "100%" }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PersonAddAlt1Icon />}
                      onClick={() => setNewPersonOpen(true)}
                      disabled={isWriteBlocked}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2,
                        whiteSpace: "nowrap",
                        minHeight: 40,
                      }}
                    >
                      {t("dashboard.actions.addPerson")}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Table Content */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
              <CircularProgress />
            </Box>
          ) : total === 0 ? (
            <Box
              sx={{
                py: 8,
                px: 3,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <PeopleOutlineRoundedIcon
                sx={{ fontSize: 48, color: "text.secondary" }}
              />
              {debouncedSearch ? (
                <>
                  <Typography variant="h6" color="text.secondary">
                    {t("dashboard.noClientsFound")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard.noClientsFoundDescription", {
                      term: debouncedSearch,
                    })}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t("dashboard.noClientsLinked")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 420 }}
                  >
                    {t("dashboard.noClientsDescription")}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setLinkModalOpen(true)}
                    sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
                  >
                    {t("dashboard.actions.linkFirstClient")}
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <>
              {/* Desktop Table View (>= 900px) */}
              <TableContainer
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  display: { xs: "none", md: "block" },
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t("clients.columns.name")}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t("shared.contact")}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t("clientDetails.dogs")}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t("clientDetails.photos")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t("clients.columns.actions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client) => {
                      const person = getPerson(client.person_id);
                      const dogs = client.dogs || [];
                      const totalPhotos = dogs.reduce(
                        (acc, d) => acc + (d.photos?.length || 0),
                        0,
                      );

                      return (
                        <TableRow
                          key={client.id}
                          hover
                          sx={{
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                          }}
                          onClick={() => {
                            if (client.person_id) {
                              navigate(`/people/${client.person_id}`);
                            } else {
                              handleOpenDetails(client.id);
                            }
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "primary.main",
                                  width: 36,
                                  height: 36,
                                  fontSize: "0.9rem",
                                  fontWeight: 700,
                                }}
                              >
                                {person?.name
                                  ? person.name.charAt(0).toUpperCase()
                                  : "P"}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    color: "text.primary",
                                  }}
                                >
                                  {person?.name || t("clients.unknownPerson")}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {person?.email || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {person?.phone
                                ? formatPhone(person.phone)
                                : t("dashboard.noPhone")}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {dogs.length === 0 ? (
                              <Chip
                                label={t("dashboard.noDogs")}
                                size="small"
                                variant="outlined"
                                sx={{ color: "text.secondary" }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <Chip
                                  icon={
                                    <PetsRoundedIcon style={{ fontSize: 14 }} />
                                  }
                                  label={t("dashboard.dogCount", {
                                    count: dogs.length,
                                  })}
                                  size="small"
                                  color="primary"
                                  sx={{ fontWeight: 600 }}
                                />
                                {dogs.slice(0, 2).map((d, i) => (
                                  <Chip
                                    key={i}
                                    label={d.breed || t("dashboard.noBreed")}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: "0.75rem" }}
                                  />
                                ))}
                                {dogs.length > 2 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {t("dashboard.moreDogs", {
                                      count: dogs.length - 2,
                                    })}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={
                                <PhotoCameraRoundedIcon
                                  style={{ fontSize: 14 }}
                                />
                              }
                              label={t("dashboard.photoCount", {
                                count: totalPhotos,
                              })}
                              size="small"
                              color={totalPhotos > 0 ? "success" : "default"}
                              variant={totalPhotos > 0 ? "filled" : "outlined"}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 1,
                              }}
                            >
                              <Button
                                variant="contained"
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (client.person_id) {
                                    navigate(`/people/${client.person_id}`);
                                  }
                                }}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                  fontWeight: 600,
                                }}
                              >
                                {t("dashboard.actions.dogsAndPhotos")}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditRoundedIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(client.id);
                                }}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                }}
                              >
                                {t("dashboard.actions.editData")}
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile & Tablet Responsive Cards View (< 900px) */}
              <Box
                sx={{
                  display: { xs: "flex", md: "none" },
                  flexDirection: "column",
                  gap: 2,
                  p: { xs: 1.5, sm: 2 },
                }}
              >
                {clients.map((client) => {
                  const person = getPerson(client.person_id);
                  const dogs = client.dogs || [];
                  const totalPhotos = dogs.reduce(
                    (acc, d) => acc + (d.photos?.length || 0),
                    0,
                  );

                  return (
                    <Paper
                      key={client.id}
                      elevation={0}
                      onClick={() => {
                        if (client.person_id) {
                          navigate(`/people/${client.person_id}`);
                        } else {
                          handleOpenDetails(client.id);
                        }
                      }}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      {/* Card Header: Avatar, Name & ID */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 44,
                            height: 44,
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {person?.name
                            ? person.name.charAt(0).toUpperCase()
                            : "P"}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: "text.primary",
                              lineHeight: 1.3,
                              wordBreak: "break-word",
                            }}
                          >
                            {person?.name || t("clients.unknownPerson")}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Contact Info */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: { xs: 0.5, sm: 2 },
                          mb: 1.5,
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600, display: "block" }}
                          >
                            {t("people.fields.email")}:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.primary",
                              wordBreak: "break-all",
                            }}
                          >
                            {person?.email || "-"}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600, display: "block" }}
                          >
                            {t("people.fields.phone")}:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.primary" }}
                          >
                            {person?.phone
                              ? formatPhone(person.phone)
                              : t("dashboard.noPhone")}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Dogs and Photos Badges */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        {/* Dogs */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            {t("clientDetails.dogs")}:
                          </Typography>
                          {dogs.length === 0 ? (
                            <Chip
                              label={t("dashboard.noDogs")}
                              size="small"
                              variant="outlined"
                              sx={{ color: "text.secondary" }}
                            />
                          ) : (
                            <>
                              <Chip
                                icon={
                                  <PetsRoundedIcon style={{ fontSize: 14 }} />
                                }
                                label={t("dashboard.dogCount", {
                                  count: dogs.length,
                                })}
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 600 }}
                              />
                              {dogs.slice(0, 2).map((d, i) => (
                                <Chip
                                  key={i}
                                  label={d.breed || t("dashboard.noBreed")}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              ))}
                              {dogs.length > 2 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {t("dashboard.moreDogs", {
                                    count: dogs.length - 2,
                                  })}
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>

                        {/* Photos */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            {t("clientDetails.photos")}:
                          </Typography>
                          <Chip
                            icon={
                              <PhotoCameraRoundedIcon
                                style={{ fontSize: 14 }}
                              />
                            }
                            label={t("dashboard.photoCount", {
                              count: totalPhotos,
                            })}
                            size="small"
                            color={totalPhotos > 0 ? "success" : "default"}
                            variant={totalPhotos > 0 ? "filled" : "outlined"}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 1,
                          pt: 1.5,
                          borderTop: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          size="medium"
                          endIcon={<ArrowForwardIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (client.person_id) {
                              navigate(`/people/${client.person_id}`);
                            }
                          }}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            minHeight: 42,
                          }}
                        >
                          {t("dashboard.actions.dogsAndPhotos")}
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          size="medium"
                          startIcon={<EditRoundedIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(client.id);
                          }}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            minHeight: 42,
                          }}
                        >
                          {t("dashboard.actions.editData")}
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage={t("dashboard.rowsPerPage")}
                labelDisplayedRows={({ from, to, count }) =>
                  t("dashboard.displayedRows", {
                    from,
                    to,
                    count: count !== -1 ? count : `>${to}`,
                  })
                }
                sx={{
                  borderTop: "1px solid",
                  borderColor: "divider",
                  "& .MuiTablePagination-toolbar": {
                    flexWrap: "wrap",
                    justifyContent: { xs: "center", sm: "space-between" },
                    gap: 1,
                    py: 1,
                    px: { xs: 1, sm: 2 },
                  },
                  "& .MuiTablePagination-actions": {
                    ml: { xs: 0, sm: 2 },
                  },
                }}
              />
            </>
          )}
        </Paper>
      )}

      {/* Modais */}
      {activeSeason && (
        <LinkClientModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          seasonId={activeSeason.id}
          onSuccess={loadData}
        />
      )}

      <ClientDetailsModal
        clientId={selectedClientId}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedClientId(null);
        }}
        onSuccess={loadData}
      />

      {/* Modal: Quick Create Person */}
      <Dialog
        open={newPersonOpen}
        onClose={() => setNewPersonOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("dashboard.quickPerson.title")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label={t("people.fields.name")}
            fullWidth
            required
            autoFocus
            value={newPersonForm.name}
            onChange={(e) =>
              setNewPersonForm({ ...newPersonForm, name: e.target.value })
            }
          />
          <TextField
            label={t("people.fields.email")}
            fullWidth
            type="email"
            value={newPersonForm.email}
            onChange={(e) =>
              setNewPersonForm({ ...newPersonForm, email: e.target.value })
            }
          />
          <TextField
            label={t("people.fields.alternativeEmail")}
            fullWidth
            type="email"
            value={newPersonForm.alternative_email}
            onChange={(e) =>
              setNewPersonForm({
                ...newPersonForm,
                alternative_email: e.target.value,
              })
            }
          />
          <TextField
            label={t("people.fields.phone")}
            fullWidth
            value={newPersonForm.phone}
            onChange={(e) =>
              setNewPersonForm({
                ...newPersonForm,
                phone: maskPhone(e.target.value),
              })
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setNewPersonOpen(false)}
            sx={{ textTransform: "none" }}
          >
            {t("people.cancel")}
          </Button>
          <Button
            onClick={handleSaveNewPerson}
            variant="contained"
            disabled={!newPersonForm.name.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {t("dashboard.quickPerson.submit")}
          </Button>
        </DialogActions>
      </Dialog>

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
