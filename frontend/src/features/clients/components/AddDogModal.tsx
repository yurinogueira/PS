import { useState, useEffect, useMemo } from "react";
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
  FormHelperText,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
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
import { useSeasonStore } from "../../../store/seasonStore";
import { formatPhone } from "../../../utils/phone";

const PAYMENT_METHODS = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Não pago",
];

const createEmptyDog = (): Dog => ({
  breed: "",
  judge: "",
  is_owner: false,
  competitions_won: 0,
  won_competitions: [],
  photos: [],
});

export interface AddDogModalProps {
  clientId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDogModal = ({
  clientId,
  open,
  onClose,
  onSuccess,
}: AddDogModalProps) => {
  const { t } = useTranslation();
  const { activeSeason } = useSeasonStore();

  const [client, setClient] = useState<SeasonClient | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);

  const eventPhotographers = useMemo(() => {
    if (!activeSeason?.photographer_ids?.length) return [];
    const idSet = new Set(activeSeason.photographer_ids);
    return photographers.filter((p) => idSet.has(p.id));
  }, [photographers, activeSeason]);
  const [dog, setDog] = useState<Dog>(createEmptyDog());
  const [compInput, setCompInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && clientId) {
      setError(null);
      setDog(createEmptyDog());
      setCompInput("");
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
          console.error("Erro ao carregar dados para adicionar cachorro:", err);
          setError(t("clientDetails.errorLoad"));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, clientId, t]);

  const updateDogField = (field: keyof Dog, value: unknown) => {
    setDog((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCompetition = () => {
    const text = compInput.trim();
    if (!text) return;
    const currentWon = dog.won_competitions || [];
    setDog((prev) => ({
      ...prev,
      won_competitions: [...currentWon, text],
    }));
    setCompInput("");
  };

  const handleRemoveCompetition = (compIndex: number) => {
    const currentWon = (dog.won_competitions || []).filter(
      (_, i) => i !== compIndex,
    );
    setDog((prev) => ({
      ...prev,
      won_competitions: currentWon,
    }));
  };

  const addPhoto = () => {
    const photos = dog.photos ? [...dog.photos] : [];
    photos.unshift({
      file_number: "",
      photographer_id: eventPhotographers[0]?.id || "",
      payment_method: "Pix",
      currency: "BRL",
      amount_paid: 0,
    });
    setDog((prev) => ({ ...prev, photos }));
  };

  const updatePhoto = (
    photoIndex: number,
    fieldOrObj: string | Partial<Photo>,
    value?: unknown,
  ) => {
    const photos = [...dog.photos];
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
    setDog((prev) => ({ ...prev, photos }));
  };

  const removePhoto = (photoIndex: number) => {
    const photos = [...dog.photos];
    photos.splice(photoIndex, 1);
    setDog((prev) => ({ ...prev, photos }));
  };

  const handleSave = async () => {
    if (!client || !clientId) return;
    try {
      setSaving(true);
      setError(null);
      const existingDogs = client.dogs || [];
      const updatedDogs = [dog, ...existingDogs];
      await clientService.update(clientId, {
        ...client,
        dogs: updatedDogs,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar novo cachorro:", err);
      setError(t("clientDetails.addDogModal.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t("clientDetails.addDogModal.title")}
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
            {/* Identificação da Pessoa */}
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
                {person.email && (
                  <Typography variant="body2" color="text.secondary">
                    {t("clientDetails.email")} {person.email}
                  </Typography>
                )}
                {person.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {t("clientDetails.phone")} {formatPhone(person.phone)}
                  </Typography>
                )}
              </Paper>
            )}

            {/* Formulário do Cachorro */}
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
            >
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label={t("linkClient.fields.dogName")}
                  size="small"
                  value={dog.breed}
                  onChange={(e) => updateDogField("breed", e.target.value)}
                  sx={{ flex: 1, minWidth: 150 }}
                  autoFocus
                />
                <TextField
                  type="number"
                  label={t("linkClient.fields.competitions")}
                  size="small"
                  value={dog.competitions_won}
                  onChange={(e) =>
                    updateDogField(
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
                        updateDogField("is_owner", e.target.checked)
                      }
                    />
                  }
                  label={t("clientDetails.isOwner")}
                />
              </Box>

              {/* Competições Vencidas Detalhadas */}
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
                      value={compInput}
                      onChange={(e) => setCompInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCompetition();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAddCompetition}
                      disabled={!compInput.trim()}
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
                          onDelete={() => handleRemoveCompetition(cIdx)}
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

              {/* Seção de Fotos */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t("clientDetails.photos")}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addPhoto}
                  variant="outlined"
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  {t("clientDetails.addDogModal.addPhoto")}
                </Button>
              </Box>

              {dog.photos?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t("clientDetails.noPhotos")}
                </Typography>
              )}

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
                      updatePhoto(pIdx, "file_number", e.target.value)
                    }
                    sx={{ flex: 1, minWidth: 140 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                    <InputLabel id={`adddog-photographer-label-${pIdx}`}>
                      {t("linkClient.fields.photographer")}
                    </InputLabel>
                    <Select
                      labelId={`adddog-photographer-label-${pIdx}`}
                      value={photo.photographer_id || ""}
                      label={t("linkClient.fields.photographer")}
                      onChange={(e) =>
                        updatePhoto(pIdx, "photographer_id", e.target.value)
                      }
                    >
                      <MenuItem value="">
                        <em>{t("linkClient.fields.noneInformed")}</em>
                      </MenuItem>
                      {eventPhotographers.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {eventPhotographers.length === 0 && (
                      <FormHelperText>
                        {t("linkClient.fields.noPhotographersEventHelper")}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <Autocomplete
                    multiple
                    size="small"
                    options={activeSeason?.judges || []}
                    value={photo.judges || []}
                    onChange={(_, val) => {
                      updatePhoto(pIdx, "judges", val);
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
                  <Autocomplete
                    multiple
                    freeSolo
                    size="small"
                    options={dog.won_competitions || []}
                    value={photo.competitions || []}
                    onChange={(_, val) => {
                      updatePhoto(pIdx, "competitions", val as string[]);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("linkClient.fields.photoCompetitions")}
                        placeholder={
                          photo.competitions?.length
                            ? ""
                            : dog.won_competitions?.length
                              ? t("linkClient.fields.competitionsPlaceholder")
                              : t("linkClient.fields.noCompetitionsDog")
                        }
                      />
                    )}
                    sx={{ minWidth: 180, flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                    <InputLabel id={`adddog-payment-label-${pIdx}`}>
                      {t("linkClient.fields.paymentMethod")}
                    </InputLabel>
                    <Select
                      labelId={`adddog-payment-label-${pIdx}`}
                      value={photo.payment_method || "Pix"}
                      label={t("linkClient.fields.paymentMethod")}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        if (newMethod === "Não pago") {
                          updatePhoto(pIdx, {
                            payment_method: newMethod,
                            amount_paid: 0,
                          });
                        } else {
                          updatePhoto(pIdx, {
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
                        <InputLabel id={`adddog-currency-label-${pIdx}`}>
                          {t("shared.currency")}
                        </InputLabel>
                        <Select
                          labelId={`adddog-currency-label-${pIdx}`}
                          value={photo.currency || "BRL"}
                          label={t("shared.currency")}
                          onChange={(e) =>
                            updatePhoto(pIdx, "currency", e.target.value)
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
                    onClick={() => removePhoto(pIdx)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving || loading}>
          {t("clientDetails.addDogModal.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
          sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
        >
          {saving
            ? t("clientDetails.addDogModal.saving")
            : t("clientDetails.addDogModal.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
