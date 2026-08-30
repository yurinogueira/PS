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
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  clientService,
  SeasonClient,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import { reportService } from "../../../services/api/report.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { LinkClientModal } from "../../clients/components/LinkClientModal";
import { ClientDetailsModal } from "../../clients/components/ClientDetailsModal";
import { formatPhone, maskPhone } from "../../../utils/phone";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { activeSeason } = useSeasonStore();

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<SeasonClient[]>([]);
  const [allSeasonClients, setAllSeasonClients] = useState<SeasonClient[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  const handleExportClientsCsv = async () => {
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const resp = await reportService.exportClientsCsv(activeSeason?.id);
      setSnackbar({
        open: true,
        message:
          resp?.message ||
          "Processamento do relatório iniciado! O link do arquivo CSV será enviado para o seu e-mail cadastrado.",
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          "Erro ao solicitar exportação do relatório CSV.",
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportClientsPdf = async () => {
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const resp = await reportService.exportClientsPdf(activeSeason?.id);
      setSnackbar({
        open: true,
        message:
          resp?.message ||
          "Processamento do relatório em PDF iniciado! O link do arquivo será enviado para o seu e-mail cadastrado.",
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          "Erro ao solicitar exportação do relatório PDF.",
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportUnpaidClientsCsv = async () => {
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const resp = await reportService.exportUnpaidClientsCsv(activeSeason?.id);
      setSnackbar({
        open: true,
        message:
          resp?.message ||
          "Processamento do relatório iniciado! O link do arquivo será enviado para o seu e-mail cadastrado.",
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message ||
          "Erro ao solicitar exportação do relatório.",
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const seasonId = activeSeason?.id;

  const loadData = useCallback(async () => {
    if (!seasonId) return;
    try {
      setLoading(true);
      const [clientRes, allClientsRes, peopleList] = await Promise.all([
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

      const paginatedList = Array.isArray(clientRes)
        ? clientRes
        : clientRes?.data || [];
      const totalCount = Array.isArray(clientRes)
        ? clientRes.length
        : (clientRes?.total ?? paginatedList.length);

      const fullList = Array.isArray(allClientsRes)
        ? allClientsRes
        : allClientsRes?.data || [];

      setClients(paginatedList);
      setAllSeasonClients(fullList);
      setTotal(totalCount);
      setPeople(peopleList || []);
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
    let totalRevenue = 0;

    allSeasonClients.forEach((c) => {
      const dogs = c.dogs || [];
      totalDogs += dogs.length;
      dogs.forEach((d) => {
        const photos = d.photos || [];
        totalPhotos += photos.length;
        photos.forEach((p) => {
          totalRevenue += p.amount_paid || 0;
        });
      });
    });

    return {
      totalPeople: people.length,
      activeSeasonClients: allSeasonClients.length,
      totalDogs,
      totalPhotos,
      totalRevenue,
    };
  }, [people.length, allSeasonClients]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, margin: "0 auto" }}>
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
              Visão Geral
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
                ? `Clientes, cães e fotos vinculados ao evento "${activeSeason.name}".`
                : "Selecione um evento no cabeçalho para gerenciar os clientes e fotos."}
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
              <>
                <Chip
                  icon={<EventNoteRoundedIcon style={{ color: "#38bdf8" }} />}
                  label={`Evento: ${activeSeason.name}`}
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
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setLinkModalOpen(true)}
                  sx={{
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2.5,
                  }}
                >
                  Vincular Cliente
                </Button>
              </>
            ) : (
              <Chip
                label="Selecione um evento no menu superior"
                sx={{
                  bgcolor: "warning.main",
                  color: "warning.contrastText",
                  fontWeight: 700,
                }}
              />
            )}
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
              disabled={exportingReport}
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
              {exportingReport ? "Gerando..." : "Relatórios"}
            </Button>
            <Menu
              anchorEl={reportMenuAnchor}
              open={Boolean(reportMenuAnchor)}
              onClose={() => setReportMenuAnchor(null)}
            >
              <MenuItem onClick={handleExportClientsPdf}>
                <ListItemIcon>
                  <PictureAsPdfIcon fontSize="small" color="error" />
                </ListItemIcon>
                Exportar Relatório (.pdf)
              </MenuItem>
              <MenuItem onClick={handleExportClientsCsv}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                Exportar Clientes (.csv)
              </MenuItem>
              <MenuItem onClick={handleExportUnpaidClientsCsv}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                Exportar Não Pagos (.csv)
              </MenuItem>
            </Menu>

            <Button
              variant="outlined"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => setNewPersonOpen(true)}
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
              Nova Pessoa
            </Button>
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
                    Total de Pessoas
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}
                  >
                    {metrics.totalPeople}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {metrics.activeSeasonClients} neste evento
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
                    Cachorros no Evento
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}
                  >
                    {metrics.totalDogs}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cadastrados no evento ativo
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
                    Fotos Registradas
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}
                  >
                    {metrics.totalPhotos}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total neste evento
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
                    Arrecadação Total
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}
                  >
                    R$ {metrics.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fotos pagas
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
            Nenhum evento selecionado
          </Typography>
          <Typography variant="body2">
            Por favor, selecione um evento no menu superior para visualizar a
            listagem de clientes, cachorros e fotografias.
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
              p: 2.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Clientes e Competidores
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selecione uma pessoa para visualizar e cadastrar seus cachorros
                e fotos.
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Buscar por pessoa, cão ou número da foto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: "100%", sm: 380 } }}
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
                    Nenhum cliente encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum cliente corresponde ao termo pesquisado &ldquo;
                    {debouncedSearch}&rdquo;.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Nenhum cliente vinculado neste evento
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 420 }}
                  >
                    Este evento ainda não possui clientes cadastrados. Comece
                    vinculando uma pessoa e seus cães.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setLinkModalOpen(true)}
                    sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
                  >
                    Vincular Primeiro Cliente
                  </Button>
                </>
              )}
            </Box>
          ) : (
            <>
              <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Nome da Pessoa
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contato</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Cachorros no Evento
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Total de Fotos
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Ações
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
                                  {person?.name || "Desconhecido"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ID: {client.id.substring(0, 8)}...
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
                                : "Sem telefone"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {dogs.length === 0 ? (
                              <Chip
                                label="Nenhum cão"
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
                                  label={`${dogs.length} ${dogs.length === 1 ? "cão" : "cães"}`}
                                  size="small"
                                  color="primary"
                                  sx={{ fontWeight: 600 }}
                                />
                                {dogs.slice(0, 2).map((d, i) => (
                                  <Chip
                                    key={i}
                                    label={d.breed || "Sem raça"}
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
                                    +{dogs.length - 2} mais
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
                              label={`${totalPhotos} ${totalPhotos === 1 ? "foto" : "fotos"}`}
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
                                Cachorros & Fotos
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityRoundedIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(client.id);
                                }}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                }}
                              >
                                Detalhes
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
                }
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
          Cadastrar Nova Pessoa
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label="Nome Completo"
            fullWidth
            required
            autoFocus
            value={newPersonForm.name}
            onChange={(e) =>
              setNewPersonForm({ ...newPersonForm, name: e.target.value })
            }
          />
          <TextField
            label="E-mail"
            fullWidth
            type="email"
            value={newPersonForm.email}
            onChange={(e) =>
              setNewPersonForm({ ...newPersonForm, email: e.target.value })
            }
          />
          <TextField
            label="E-mail Alternativo"
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
            label="Telefone / WhatsApp"
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
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNewPerson}
            variant="contained"
            disabled={!newPersonForm.name.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Salvar e Abrir Detalhes
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
