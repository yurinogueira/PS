import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import {
  clientService,
  SeasonClient,
  Photo,
  CURRENCIES,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { formatPhone } from "../../../utils/phone";

const PAYMENT_METHODS = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Não pago",
];

export const ClientDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeSeason } = useSeasonStore();

  const [client, setClient] = useState<SeasonClient | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    if (!id) return;
    try {
      const c = await clientService.getById(id);
      setClient(c);
      if (c && c.person_id) {
        const p = await personService.getById(c.person_id);
        setPerson(p);
      }
      const ph = await photographerService.list();
      setPhotographers(ph || []);
    } catch (e) {
      console.error(e);
      navigate("/clients");
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!client || !id) return;
    try {
      await clientService.update(id, client);
      setSnackbar({
        open: true,
        message: "Cliente atualizado com sucesso!",
        severity: "success",
      });
      load();
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: "Erro ao salvar alterações do cliente.",
        severity: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      await clientService.delete(id);
      navigate("/clients");
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: "Erro ao excluir cliente.",
        severity: "error",
      });
    }
  };

  const [compInputs, setCompInputs] = useState<{ [key: number]: string }>({});

  const addDog = () => {
    if (!client) return;
    setClient({
      ...client,
      dogs: [
        {
          breed: "",
          judge: "",
          is_owner: false,
          competitions_won: 0,
          won_competitions: [],
          photos: [],
        },
        ...(client.dogs || []),
      ],
    });
  };

  const updateDog = (index: number, field: string, value: unknown) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setClient({ ...client, dogs: newDogs });
  };

  const handleAddCompetitionToDog = (dogIndex: number) => {
    const text = (compInputs[dogIndex] || "").trim();
    if (!text || !client) return;
    const newDogs = [...(client.dogs || [])];
    const currentWon = newDogs[dogIndex].won_competitions || [];
    newDogs[dogIndex] = {
      ...newDogs[dogIndex],
      won_competitions: [...currentWon, text],
    };
    setClient({ ...client, dogs: newDogs });
    setCompInputs({ ...compInputs, [dogIndex]: "" });
  };

  const handleRemoveCompetitionFromDog = (
    dogIndex: number,
    compIndex: number,
  ) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    const currentWon = (newDogs[dogIndex].won_competitions || []).filter(
      (_, i) => i !== compIndex,
    );
    newDogs[dogIndex] = {
      ...newDogs[dogIndex],
      won_competitions: currentWon,
    };
    setClient({ ...client, dogs: newDogs });
  };

  const removeDog = (index: number) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    newDogs.splice(index, 1);
    setClient({ ...client, dogs: newDogs });
  };

  const addPhoto = (dogIndex: number) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
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
    setClient({ ...client, dogs: newDogs });
  };

  const updatePhoto = (
    dogIndex: number,
    photoIndex: number,
    fieldOrObj: string | Partial<Photo>,
    value?: unknown,
  ) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
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
    setClient({ ...client, dogs: newDogs });
  };

  const removePhoto = (dogIndex: number, photoIndex: number) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    const photos = [...newDogs[dogIndex].photos];
    photos.splice(photoIndex, 1);
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setClient({ ...client, dogs: newDogs });
  };

  if (!client)
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t("shared.loading")}</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/clients")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">{t("clientDetails.title")}</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t("clients.actions.unlink")}
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {t("profile.saveChanges")}
          </Button>
        </Box>
      </Box>

      {person && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados da Pessoa
          </Typography>
          <Typography variant="body1">
            <strong>Nome:</strong> {person.name}
          </Typography>
          <Typography variant="body1">
            <strong>E-mail:</strong> {person.email || "-"}
          </Typography>
          <Typography variant="body1">
            <strong>Telefone:</strong> {formatPhone(person.phone) || "-"}
          </Typography>
        </Paper>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">{t("clientDetails.dogs")}</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addDog}>
          {t("clientDetails.addDog")}
        </Button>
      </Box>

      {client.dogs?.map((dog, dIdx) => (
        <Accordion key={dIdx} defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                pr: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {dog.breed || `${t("linkClient.fields.dogName")} #${dIdx + 1}`}
              </Typography>
              <IconButton
                color="error"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDog(dIdx);
                }}
                title="Excluir Cachorro"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                label={t("linkClient.fields.dogName")}
                value={dog.breed}
                onChange={(e) => updateDog(dIdx, "breed", e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
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
                sx={{ width: 180 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(dog.is_owner)}
                    onChange={(e) =>
                      updateDog(dIdx, "is_owner", e.target.checked)
                    }
                  />
                }
                label="Dono?"
              />
            </Box>

            {dog.competitions_won > 0 && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 2,
                  bgcolor: "#f8fafc",
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
                mb: 2,
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
                  mb: 1.5,
                  alignItems: "center",
                  flexWrap: "wrap",
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "#fcfcfc",
                  border: "1px solid #f0f0f0",
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
                    value={photo.photographer_id || ""}
                    label={t("linkClient.fields.photographer")}
                    onChange={(e) =>
                      updatePhoto(dIdx, pIdx, "photographer_id", e.target.value)
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
                    value={photo.payment_method || "Pix"}
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
                      <InputLabel required>Moeda</InputLabel>
                      <Select
                        value={photo.currency || "BRL"}
                        label="Moeda *"
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
                  title="Excluir Foto"
                  sx={{ ml: { xs: "auto", sm: 0 } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Modal Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t("shared.delete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("clients.actions.confirmUnlink")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t("shared.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            {t("shared.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
