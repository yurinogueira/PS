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
import { useTranslation } from "react-i18next";
import {
  clientService,
  SeasonClient,
  Dog,
  Photo,
  CURRENCIES,
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
  const { t } = useTranslation();
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

  const updateDog = (
    index: number,
    field: string,
    value: string | number | boolean,
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
      currency: "BRL",
      amount_paid: 0,
    });
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setDogs(newDogs);
  };

  const updatePhoto = (
    dogIndex: number,
    photoIndex: number,
    fieldOrObj: string | Partial<Photo>,
    value?: unknown,
  ) => {
    const newDogs = [...dogs];
    const photos = [...newDogs[dogIndex].photos];
    if (typeof fieldOrObj === "string") {
      photos[photoIndex] = {
        ...photos[photoIndex],
        [fieldOrObj]: value,
      };
    } else {
      photos[photoIndex] = {
        ...photos[photoIndex],
        ...fieldOrObj,
      };
    }
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setDogs(newDogs);
  };

  const removePhoto = (dogIndex: number, photoIndex: number) => {
    const newDogs = [...dogs];
    const photos = [...newDogs[dogIndex].photos];
    photos.splice(photoIndex, 1);
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setDogs(newDogs);
  };

  const getPersonName = (pId: string) => {
    const p = people.find((item) => item.id === pId);
    return p ? p.name : t("clients.unknownPerson");
  };

  const handleExportPdfReport = async () => {
    if (!activeSeason) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportClientsPdf(activeSeason.id);
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

  const handleExportClientsCsvReport = async () => {
    if (!activeSeason) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportClientsCsv(activeSeason.id);
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

  const handleExportUnpaidClientsCsvReport = async () => {
    if (!activeSeason) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportUnpaidClientsCsv(activeSeason.id);
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

  const handleExportPaidClientsCsvReport = async () => {
    if (!activeSeason) return;
    setReportMenuAnchor(null);
    setExportingReport(true);
    try {
      const res = await reportService.exportPaidClientsCsv(activeSeason.id);
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

  if (!activeSeason) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">{t("dashboard.noSeason")}</Typography>
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
          {t("clients.title")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={
              exportingReport ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AssessmentIcon />
              )
            }
            endIcon={<ExpandMoreIcon />}
            onClick={(e) => setReportMenuAnchor(e.currentTarget)}
            disabled={exportingReport}
            sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
          >
            {exportingReport
              ? t("clients.reports.generating")
              : t("clients.reports.reportsButton")}
          </Button>

          <Menu
            anchorEl={reportMenuAnchor}
            open={Boolean(reportMenuAnchor)}
            onClose={() => setReportMenuAnchor(null)}
            slotProps={{
              paper: {
                elevation: 3,
                sx: { minWidth: 240, borderRadius: 2, mt: 1 },
              },
            }}
          >
            <MenuItem onClick={handleExportPdfReport}>
              <ListItemIcon>
                <PictureAsPdfIcon fontSize="small" color="error" />
              </ListItemIcon>
              {t("clients.reports.exportPdf")}
            </MenuItem>
            <MenuItem onClick={handleExportClientsCsvReport}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" color="primary" />
              </ListItemIcon>
              {t("clients.reports.exportClientsCsv")}
            </MenuItem>
            <MenuItem onClick={handleExportPaidClientsCsvReport}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" color="success" />
              </ListItemIcon>
              {t("clients.reports.exportPaidCsv")}
            </MenuItem>
            <MenuItem onClick={handleExportUnpaidClientsCsvReport}>
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" color="warning" />
              </ListItemIcon>
              {t("clients.reports.exportUnpaidCsv")}
            </MenuItem>
          </Menu>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
          >
            {t("clients.add")}
          </Button>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table sx={{ minWidth: 550 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("clients.columns.name")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("clientDetails.dogs")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("clients.columns.photos")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {t("clients.columns.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t("clients.noData")}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => {
                const totalPhotos = (c.dogs || []).reduce(
                  (acc, d) => acc + (d.photos?.length || 0),
                  0,
                );
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>{getPersonName(c.person_id)}</TableCell>
                    <TableCell>{c.dogs?.length || 0}</TableCell>
                    <TableCell>{totalPhotos}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        {t("clients.actions.details")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Criar Cliente */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("linkClient.title")}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
        >
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="select-person-label">
              {t("linkClient.fields.person")}
            </InputLabel>
            <Select
              labelId="select-person-label"
              value={personId}
              label={t("linkClient.fields.person")}
              onChange={(e) => setPersonId(e.target.value)}
            >
              {people.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6">{t("clientDetails.dogs")}</Typography>
          {dogs.map((dog, dIdx) => (
            <Paper
              key={dIdx}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                bgcolor: "#fafafa",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  size="small"
                  label={t("linkClient.fields.dogName")}
                  value={dog.breed}
                  onChange={(e) => updateDog(dIdx, "breed", e.target.value)}
                  sx={{ flex: { xs: "1 1 100%", sm: 2 } }}
                />
                <TextField
                  size="small"
                  type="number"
                  label={t("linkClient.fields.competitions")}
                  value={dog.competitions_won}
                  onChange={(e) =>
                    updateDog(
                      dIdx,
                      "competitions_won",
                      parseInt(e.target.value, 10) || 0,
                    )
                  }
                  sx={{ flex: { xs: "1 1 100%", sm: 1.5 } }}
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
                  label={t("linkClient.fields.isOwnerOptional")}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeDog(dIdx)}
                  title={t("clientDetails.confirmDeleteDog.confirm")}
                  sx={{ ml: { xs: "auto", sm: 0 } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              {dog.competitions_won > 0 && (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "#ffffff",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <EmojiEventsIcon fontSize="inherit" color="warning" />
                    {t("linkClient.fields.competitions")} (
                    {dog.won_competitions?.length || 0})
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={t("linkClient.fields.addCompetition")}
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
                      {t("shared.add")}
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
                }}
              >
                <Typography variant="subtitle2">
                  {t("clientDetails.photos")}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addPhoto(dIdx)}
                >
                  {t("clientDetails.addPhoto")}
                </Button>
              </Box>

              {dog.photos?.map((photo, pIdx) => (
                <Box
                  key={pIdx}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    size="small"
                    label={t("linkClient.fields.fileNumber")}
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
                    <InputLabel required>
                      {t("linkClient.fields.photographer")}
                    </InputLabel>
                    <Select
                      value={photo.photographer_id}
                      label={t("linkClient.fields.photographer")}
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
                        label={t("linkClient.fields.judges")}
                        placeholder={
                          photo.judges?.length
                            ? ""
                            : activeSeason?.judges?.length
                              ? t("linkClient.fields.judgesPlaceholder")
                              : t("linkClient.fields.noJudgesEvent")
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
                    <InputLabel required>
                      {t("linkClient.fields.paymentMethod")}
                    </InputLabel>
                    <Select
                      value={photo.payment_method}
                      label={t("linkClient.fields.paymentMethod")}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        if (newMethod === "Não pago") {
                          updatePhoto(dIdx, pIdx, {
                            payment_method: newMethod,
                            amount_paid: 0,
                          });
                        } else {
                          updatePhoto(dIdx, pIdx, {
                            payment_method: newMethod,
                            currency: photo.currency || "BRL",
                          });
                        }
                      }}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {photo.payment_method !== "Não pago" && (
                    <>
                      <FormControl
                        size="small"
                        required
                        sx={{
                          flex: { xs: "1 1 100%", sm: "1 1 140px" },
                          minWidth: "120px",
                        }}
                      >
                        <InputLabel required>{t("shared.currency")}</InputLabel>
                        <Select
                          value={photo.currency || "BRL"}
                          label={`${t("shared.currency")} *`}
                          onChange={(e) =>
                            updatePhoto(dIdx, pIdx, "currency", e.target.value)
                          }
                        >
                          {CURRENCIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        type="number"
                        label={t("linkClient.fields.amountPaid")}
                        slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                        value={
                          photo.amount_paid === undefined ||
                          photo.amount_paid === null
                            ? ""
                            : photo.amount_paid
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updatePhoto(
                            dIdx,
                            pIdx,
                            "amount_paid",
                            isNaN(val) ? 0 : Math.max(0, val),
                          );
                        }}
                        sx={{
                          flex: { xs: "1 1 100%", sm: "1 1 150px" },
                          minWidth: "140px",
                        }}
                      />
                    </>
                  )}
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => removePhoto(dIdx, pIdx)}
                    title={t("clientDetails.confirmDeletePhoto.confirm")}
                    sx={{ ml: { xs: "auto", sm: 0 } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          ))}
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addDog}>
            {t("clientDetails.addDog")}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("shared.cancel")}</Button>
          <Button onClick={handleSave} variant="contained" disabled={!personId}>
            {t("profile.saveChanges")}
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
