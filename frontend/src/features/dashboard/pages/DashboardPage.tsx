import { useState, useEffect, useMemo } from "react";
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
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EventNoteIcon from "@mui/icons-material/EventNote";
import {
  clientService,
  SeasonClient,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import { useSeasonStore } from "../../../store/seasonStore";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { activeSeason } = useSeasonStore();

  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [clients, setClients] = useState<SeasonClient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // New Person Dialog
  const [newPersonOpen, setNewPersonOpen] = useState(false);
  const [newPersonForm, setNewPersonForm] = useState({
    name: "",
    email: "",
    alternative_email: "",
    phone: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        personService.list(),
        clientService.list(),
      ]);

      setPeople(pData || []);
      if (activeSeason) {
        setClients(
          (cData || []).filter((c) => c.season_id === activeSeason.id),
        );
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSeason?.id]);

  // Handle Quick Create Person
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

  // Map Person ID -> Client Record for the season
  const clientMap = useMemo(() => {
    const map = new Map<string, SeasonClient>();
    clients.forEach((c) => {
      map.set(c.person_id, c);
    });
    return map;
  }, [clients]);

  // Aggregate Metrics for Active Season
  const metrics = useMemo(() => {
    let totalDogs = 0;
    let totalPhotos = 0;
    let totalRevenue = 0;

    clients.forEach((c) => {
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
      activeSeasonClients: clients.length,
      totalDogs,
      totalPhotos,
      totalRevenue,
    };
  }, [people.length, clients]);

  // Filtered People List
  const filteredPeople = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return people;

    return people.filter((p) => {
      const client = clientMap.get(p.id);
      const dogBreeds =
        client?.dogs?.map((d) => d.breed?.toLowerCase()).join(" ") || "";
      return (
        p.name?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone?.toLowerCase().includes(term) ||
        dogBreeds.includes(term)
      );
    });
  }, [people, searchTerm, clientMap]);

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
              sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
            >
              Visão Geral
            </Typography>
            <Typography variant="body1" sx={{ color: "grey.300", mt: 0.5 }}>
              Gerencie pessoas, cachorros cadastrados e fotos da temporada com
              praticidade.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {activeSeason ? (
              <Chip
                icon={<EventNoteIcon style={{ color: "#38bdf8" }} />}
                label={`Temporada: ${activeSeason.name}`}
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
                label="Selecione uma temporada no menu superior"
                sx={{
                  bgcolor: "warning.main",
                  color: "warning.contrastText",
                  fontWeight: 700,
                }}
              />
            )}
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => setNewPersonOpen(true)}
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
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
                    {metrics.activeSeasonClients} nesta temporada
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
                    Cadastrados na temporada ativa
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
                    Total nesta temporada
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

      {/* People Table Section */}
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
              Pessoas & Competidores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione uma pessoa para visualizar e cadastrar seus cachorros e
              fotos.
            </Typography>
          </Box>

          <TextField
            size="small"
            placeholder="Buscar por nome, e-mail, telefone ou raça..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 360 } }}
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
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nome da Pessoa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contato</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Cachorros na Temporada
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total de Fotos</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Ação
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPeople.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm
                          ? "Nenhuma pessoa encontrada para o termo pesquisado."
                          : "Nenhuma pessoa cadastrada no sistema."}
                      </Typography>
                      {!searchTerm && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setNewPersonOpen(true)}
                          sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}
                        >
                          Cadastrar Primeira Pessoa
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPeople.map((person) => {
                    const client = clientMap.get(person.id);
                    const dogs = client?.dogs || [];
                    const totalPhotos = dogs.reduce(
                      (acc, d) => acc + (d.photos?.length || 0),
                      0,
                    );

                    return (
                      <TableRow
                        key={person.id}
                        hover
                        sx={{
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onClick={() => navigate(`/people/${person.id}`)}
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
                              {person.name
                                ? person.name.charAt(0).toUpperCase()
                                : "P"}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, color: "text.primary" }}
                              >
                                {person.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID: {person.id.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {person.email || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {person.phone || "Sem telefone"}
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
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/people/${person.id}`);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            Cachorros & Fotos
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

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
              setNewPersonForm({ ...newPersonForm, phone: e.target.value })
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
    </Box>
  );
};
