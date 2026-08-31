import { useState, useEffect } from "react";
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
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
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

interface ClientDetailsModalProps {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientDetailsModal = ({
  clientId,
  open,
  onClose,
  onSuccess,
}: ClientDetailsModalProps) => {
  const { t } = useTranslation();
  const { activeSeason } = useSeasonStore();
  const [client, setClient] = useState<SeasonClient | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [compInputs, setCompInputs] = useState<{ [key: number]: string }>({});

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

  useEffect(() => {
    if (open && clientId) {
      setError(null);
      setLoading(true);
      Promise.all([clientService.getById(clientId), photographerService.list()])
        .then(async ([clientData, photogList]) => {
          setClient(clientData);
          setPhotographers(photogList || []);
          if (clientData?.person_id) {
            const p = await personService.getById(clientData.person_id);
            setPerson(p);
          } else {
            setPerson(null);
          }
        })
        .catch((err) => {
          console.error("Erro ao carregar dados do cliente:", err);
          setError("Não foi possível carregar os dados do cliente.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, clientId]);

  const handleSave = async () => {
    if (!client || !clientId) return;
    try {
      setSaving(true);
      setError(null);
      await clientService.update(clientId, client);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar alterações do cliente:", err);
      setError("Erro ao salvar alterações do cliente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clientId) return;
    try {
      setDeleting(true);
      await clientService.delete(clientId);
      setDeleteConfirmOpen(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      setError("Erro ao excluir cliente.");
    } finally {
      setDeleting(false);
    }
  };

  const addDog = () => {
    if (!client) return;
    const newDogs = client.dogs ? [...client.dogs] : [];
    newDogs.unshift({
      breed: "",
      judge: "",
      is_owner: false,
      competitions_won: 0,
      won_competitions: [],
      photos: [],
    });
    setClient({ ...client, dogs: newDogs });
  };

  const updateDog = (index: number, field: string, value: unknown) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    newDogs[index] = { ...newDogs[index], [field]: value };
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">{t("clientDetails.title")}</Typography>
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            {t("clients.actions.unlink")}
          </Button>
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              {person && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "#fafafa",
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {person.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {person.email ? `E-mail: ${person.email}` : ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {person.phone
                      ? `Telefone: ${formatPhone(person.phone)}`
                      : ""}
                  </Typography>
                </Paper>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">{t("clientDetails.dogs")}</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addDog}
                >
                  {t("clientDetails.addDog")}
                </Button>
              </Box>

              {client?.dogs?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t("clientDetails.noDogs")}
                </Typography>
              )}

              {client?.dogs?.map((dog, dIdx) => (
                <Accordion key={dIdx} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        pr: 2,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {dog.breed ||
                          `${t("linkClient.fields.dogName")} #${dIdx + 1}`}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDog(dIdx);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <TextField
                        label={t("linkClient.fields.dogName")}
                        size="small"
                        value={dog.breed}
                        onChange={(e) =>
                          updateDog(dIdx, "breed", e.target.value)
                        }
                        sx={{ flex: 1, minWidth: 150 }}
                      />
                      <TextField
                        type="number"
                        label={t("linkClient.fields.competitions")}
                        size="small"
                        value={dog.competitions_won}
                        onChange={(e) =>
                          updateDog(
                            dIdx,
                            "competitions_won",
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        sx={{ width: 160 }}
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
                        {dog.won_competitions &&
                          dog.won_competitions.length > 0 && (
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
                          bgcolor: "#fafafa",
                          p: 1.5,
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                          flexWrap: "wrap",
                        }}
                      >
                        <TextField
                          size="small"
                          label={t("linkClient.fields.fileNumber")}
                          value={photo.file_number}
                          onChange={(e) =>
                            updatePhoto(
                              dIdx,
                              pIdx,
                              "file_number",
                              e.target.value,
                            )
                          }
                          sx={{ flex: 1, minWidth: 140 }}
                        />
                        <FormControl
                          size="small"
                          sx={{ minWidth: 160, flex: 1 }}
                        >
                          <InputLabel
                            id={`modal-photographer-label-${dIdx}-${pIdx}`}
                          >
                            {t("linkClient.fields.photographer")}
                          </InputLabel>
                          <Select
                            labelId={`modal-photographer-label-${dIdx}-${pIdx}`}
                            value={photo.photographer_id || ""}
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
                          sx={{ minWidth: 180, flex: 1 }}
                        />
                        <FormControl
                          size="small"
                          sx={{ minWidth: 140, flex: 1 }}
                        >
                          <InputLabel
                            id={`modal-payment-label-${dIdx}-${pIdx}`}
                          >
                            {t("linkClient.fields.paymentMethod")}
                          </InputLabel>
                          <Select
                            labelId={`modal-payment-label-${dIdx}-${pIdx}`}
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
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel
                                id={`modal-currency-label-${dIdx}-${pIdx}`}
                              >
                                Moeda
                              </InputLabel>
                              <Select
                                labelId={`modal-currency-label-${dIdx}-${pIdx}`}
                                value={photo.currency || "BRL"}
                                label="Moeda"
                                onChange={(e) =>
                                  updatePhoto(
                                    dIdx,
                                    pIdx,
                                    "currency",
                                    e.target.value,
                                  )
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
                              slotProps={{
                                htmlInput: { min: 0, step: "0.01" },
                              }}
                              value={photo.amount_paid ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updatePhoto(
                                  dIdx,
                                  pIdx,
                                  "amount_paid",
                                  isNaN(val) ? 0 : Math.max(0, val),
                                );
                              }}
                              sx={{ width: 120 }}
                            />
                          </>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removePhoto(dIdx, pIdx)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving || loading}>
            {t("shared.close")}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || loading}
          >
            {saving ? t("shared.saving") : t("profile.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>{t("shared.delete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("clients.actions.confirmUnlink")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
          >
            {t("shared.cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : t("shared.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
