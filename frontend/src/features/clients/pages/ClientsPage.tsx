import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Menu,
  ListItemIcon,
  Snackbar,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  clientService,
  SeasonClient,
  Dog,
  Photo,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { reportService } from "../../../services/api/report.service";
import { useSeasonStore } from "../../../store/seasonStore";

const PAYMENT_METHODS = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Não pago",
];

export const ClientsPage = () => {
  const navigate = useNavigate();
  const { activeSeason } = useSeasonStore();
  const [clients, setClients] = useState<SeasonClient[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);

  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [dogs, setDogs] = useState<Omit<Dog, "id">[]>([]);

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

  const load = useCallback(async () => {
    if (!activeSeason) return;
    const [cRes, pData, photogData] = await Promise.all([
      clientService.list({ season_id: activeSeason.id, limit: 100 }),
      personService.list(),
      photographerService.list(),
    ]);
    setClients(cRes?.data || []);
    setPeople(pData || []);
    setPhotographers(photogData || []);
  }, [activeSeason]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!activeSeason) return;
    await clientService.create({
      person_id: personId,
      season_id: activeSeason.id,
      dogs: dogs as Dog[],
    });
    setOpen(false);
    setPersonId("");
    setDogs([]);
    load();
  };

  const [compInputs, setCompInputs] = useState<{ [key: number]: string }>({});

  const addDog = () => {
    setDogs([
      {
        breed: "",
        judge: "",
        is_owner: false,
        competitions_won: 0,
        won_competitions: [],
        photos: [],
      },
      ...dogs,
    ]);
  };

  const handleAddCompetitionToDog = (dogIndex: number) => {
    const text = (compInputs[dogIndex] || "").trim();
    if (!text) return;
    const newDogs = [...dogs];
    const currentWon = newDogs[dogIndex].won_competitions || [];
    newDogs[dogIndex] = {
      ...newDogs[dogIndex],
      won_competitions: [...currentWon, text],
    };
    setDogs(newDogs);
    setCompInputs({ ...compInputs, [dogIndex]: "" });
  };

  const handleRemoveCompetitionFromDog = (
    dogIndex: number,
    compIndex: number,
  ) => {
    const newDogs = [...dogs];
    const currentWon = (newDogs[dogIndex].won_competitions || []).filter(
      (_, i) => i !== compIndex,
    );
    newDogs[dogIndex] = {
      ...newDogs[dogIndex],
      won_competitions: currentWon,
    };
    setDogs(newDogs);
  };

  const updateDog = <K extends keyof Dog>(
    index: number,
    field: K,
    value: Dog[K],
  ) => {
    const newDogs = [...dogs];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setDogs(newDogs);
  };

  const removeDog = (index: number) => {
    const newDogs = [...dogs];
    newDogs.splice(index, 1);
    setDogs(newDogs);
  };

  const addPhoto = (dogIndex: number) => {
    const newDogs = [...dogs];
    const photos = newDogs[dogIndex].photos
      ? [...newDogs[dogIndex].photos]
      : [];
    photos.unshift({
      file_number: "",
      photographer_id: "",
      payment_method: "Pix",
      amount_paid: 0,
    } as Photo);
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setDogs(newDogs);
  };

  const updatePhoto = <K extends keyof Photo>(
    dogIndex: number,
    photoIndex: number,
    field: K,
    value: Photo[K],
  ) => {
    const newDogs = [...dogs];
    newDogs[dogIndex].photos[photoIndex] = {
      ...newDogs[dogIndex].photos[photoIndex],
      [field]: value,
    };
    setDogs(newDogs);
  };

  const removePhoto = (dogIndex: number, photoIndex: number) => {
    const newDogs = [...dogs];
    newDogs[dogIndex].photos.splice(photoIndex, 1);
    setDogs(newDogs);
  };

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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj?.response?.data?.message ||
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj?.response?.data?.message ||
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj?.response?.data?.message ||
          "Erro ao solicitar exportação do relatório.",
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportPaidClientsCsv = async () => {
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const resp = await reportService.exportPaidClientsCsv(activeSeason?.id);
      setSnackbar({
        open: true,
        message:
          resp?.message ||
          "Processamento do relatório iniciado! O link do arquivo será enviado para o seu e-mail cadastrado.",
        severity: "success",
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSnackbar({
        open: true,
        message:
          errorObj?.response?.data?.message ||
          "Erro ao solicitar exportação do relatório de clientes pagos.",
        severity: "error",
      });
    } finally {
      setExportingReport(false);
    }
  };

  if (!activeSeason) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <Typography>Selecione um Evento no topo.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", sm: "2rem" },
            fontWeight: 700,
          }}
        >
          Clientes do Evento Atual
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            width: { xs: "100%", sm: "auto" },
          }}
        >
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
            sx={{ flex: { xs: 1, sm: "initial" }, whiteSpace: "nowrap" }}
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
            <MenuItem onClick={handleExportPaidClientsCsv}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              Exportar Pagos (.csv)
            </MenuItem>
            <MenuItem onClick={handleExportUnpaidClientsCsv}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              Exportar Não Pagos (.csv)
            </MenuItem>
          </Menu>

          <Button
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{ flex: { xs: 1, sm: "initial" }, whiteSpace: "nowrap" }}
          >
            Vincular Cliente
          </Button>
        </Box>
      </Box>

      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
          borderRadius: 2,
        }}
        elevation={0}
      >
        <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Pessoa</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cachorros</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total de Fotos</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c) => {
                const person = people.find((p) => p.id === c.person_id);
                const totalPhotos =
                  c.dogs?.reduce(
                    (acc, dog) => acc + (dog.photos?.length || 0),
                    0,
                  ) || 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell>{person?.name || "Desconhecido"}</TableCell>
                    <TableCell>{c.dogs?.length || 0}</TableCell>
                    <TableCell>{totalPhotos}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Vincular Cliente no Evento</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
        >
          <FormControl fullWidth required>
            <InputLabel required>Selecione a Pessoa</InputLabel>
            <Select
              value={personId}
              label="Selecione a Pessoa *"
              onChange={(e) => setPersonId(e.target.value)}
            >
              {people.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Cachorros
          </Typography>
          {dogs.map((dog, dIdx) => (
            <Paper
              key={dIdx}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                bgcolor: "#fafafa",
                border: "1px solid #E2E8F0",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <TextField
                  label="Raça (Opcional)"
                  value={dog.breed}
                  onChange={(e) => updateDog(dIdx, "breed", e.target.value)}
                  sx={{
                    flex: { xs: "1 1 100%", sm: "1 1 200px" },
                    minWidth: "160px",
                  }}
                />
                <TextField
                  type="number"
                  label="Competições Ganhas"
                  required
                  value={dog.competitions_won}
                  onChange={(e) =>
                    updateDog(
                      dIdx,
                      "competitions_won",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  sx={{
                    flex: { xs: "1 1 100%", sm: "1 1 180px" },
                    minWidth: "160px",
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dog.is_owner}
                      onChange={(e) =>
                        updateDog(dIdx, "is_owner", e.target.checked)
                      }
                    />
                  }
                  label="Dono do Cachorro (Opcional)"
                  sx={{ minWidth: "200px" }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeDog(dIdx)}
                  title="Excluir Cachorro"
                  sx={{ ml: "auto" }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              {dog.competitions_won > 0 && (
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: "#ffffff",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <EmojiEventsIcon fontSize="small" color="warning" />
                    Competições Vencidas ({dog.won_competitions?.length || 0})
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Nome da competição vencida..."
                      value={compInputs[dIdx] || ""}
                      onChange={(e) =>
                        setCompInputs({
                          ...compInputs,
                          [dIdx]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCompetitionToDog(dIdx);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddCompetitionToDog(dIdx)}
                      disabled={!(compInputs[dIdx] || "").trim()}
                      startIcon={<AddIcon />}
                      sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                    >
                      Adicionar
                    </Button>
                  </Box>
                  {dog.won_competitions && dog.won_competitions.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        mt: 0.5,
                      }}
                    >
                      {dog.won_competitions.map((compName, cIdx) => (
                        <Chip
                          key={cIdx}
                          label={compName}
                          size="small"
                          onDelete={() =>
                            handleRemoveCompetitionFromDog(dIdx, cIdx)
                          }
                          color="primary"
                          variant="outlined"
                          sx={{
                            borderRadius: 1.5,
                            bgcolor: "background.paper",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Fotos
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addPhoto(dIdx)}
                >
                  Adicionar Foto
                </Button>
              </Box>

              {dog.photos.map((photo, pIdx) => (
                <Box
                  key={pIdx}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "center",
                    p: 2,
                    bgcolor: "#ffffff",
                    borderRadius: 1.5,
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <TextField
                    size="small"
                    label="Número do Arquivo"
                    required
                    value={photo.file_number}
                    onChange={(e) =>
                      updatePhoto(dIdx, pIdx, "file_number", e.target.value)
                    }
                    sx={{
                      flex: { xs: "1 1 100%", sm: "1 1 180px" },
                      minWidth: "160px",
                    }}
                  />
                  <FormControl
                    size="small"
                    required
                    sx={{
                      flex: { xs: "1 1 100%", sm: "1 1 200px" },
                      minWidth: "180px",
                    }}
                  >
                    <InputLabel required>Fotógrafo</InputLabel>
                    <Select
                      value={photo.photographer_id}
                      label="Fotógrafo *"
                      onChange={(e) =>
                        updatePhoto(
                          dIdx,
                          pIdx,
                          "photographer_id",
                          e.target.value,
                        )
                      }
                    >
                      {photographers.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Autocomplete
                    multiple
                    size="small"
                    options={activeSeason?.judges || []}
                    value={photo.judges || []}
                    onChange={(_, val) => {
                      updatePhoto(dIdx, pIdx, "judges", val);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Juízes"
                        placeholder={
                          photo.judges?.length
                            ? ""
                            : activeSeason?.judges?.length
                              ? "Selecione juízes"
                              : "Nenhum juiz no evento"
                        }
                      />
                    )}
                    sx={{
                      flex: { xs: "1 1 100%", sm: "1 1 200px" },
                      minWidth: "180px",
                    }}
                  />
                  <FormControl
                    size="small"
                    required
                    sx={{
                      flex: { xs: "1 1 100%", sm: "1 1 180px" },
                      minWidth: "160px",
                    }}
                  >
                    <InputLabel required>Forma de Pagamento</InputLabel>
                    <Select
                      value={photo.payment_method}
                      label="Forma de Pagamento *"
                      onChange={(e) =>
                        updatePhoto(
                          dIdx,
                          pIdx,
                          "payment_method",
                          e.target.value,
                        )
                      }
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    label="Valor Pago (Opcional)"
                    value={
                      photo.amount_paid === undefined ||
                      photo.amount_paid === null
                        ? ""
                        : photo.amount_paid
                    }
                    onChange={(e) =>
                      updatePhoto(
                        dIdx,
                        pIdx,
                        "amount_paid",
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value) || 0,
                      )
                    }
                    sx={{
                      flex: { xs: "1 1 100%", sm: "1 1 150px" },
                      minWidth: "140px",
                    }}
                  />
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => removePhoto(dIdx, pIdx)}
                    title="Excluir Foto"
                    sx={{ ml: { xs: "auto", sm: 0 } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          ))}
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addDog}>
            Adicionar Cachorro
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!personId}>
            Salvar Cadastro
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
