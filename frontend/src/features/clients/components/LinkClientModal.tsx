import { useState, useEffect } from "react";
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
  IconButton,
  Alert,
  Chip,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import {
  clientService,
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

const PAYMENT_METHODS = [
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "Não pago",
];

interface LinkClientModalProps {
  open: boolean;
  onClose: () => void;
  seasonId: string;
  onSuccess: () => void;
}

export const LinkClientModal = ({
  open,
  onClose,
  seasonId,
  onSuccess,
}: LinkClientModalProps) => {
  const { t } = useTranslation();
  const { activeSeason } = useSeasonStore();
  const [people, setPeople] = useState<Person[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [personId, setPersonId] = useState("");
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compInputs, setCompInputs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (open) {
      setError(null);
      setPersonId("");
      setDogs([]);
      setCompInputs({});
      Promise.all([personService.list(), photographerService.list()])
        .then(([pData, photogData]) => {
          setPeople(pData || []);
          setPhotographers(photogData || []);
        })
        .catch((err) => {
          console.error("Erro ao carregar dados auxiliares:", err);
          setError(t("clients.errorLoad"));
        });
    }
  }, [open, t]);

  const handleSave = async () => {
    if (!personId || !seasonId) return;
    try {
      setSaving(true);
      setError(null);
      await clientService.create({
        person_id: personId,
        season_id: seasonId,
        dogs,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao vincular cliente:", err);
      setError(t("clients.errorLink"));
    } finally {
      setSaving(false);
    }
  };

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

  const updateDog = (index: number, field: string, value: unknown) => {
    const newDogs = [...dogs];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setDogs(newDogs);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("linkClient.title")}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
      >
        {error && <Alert severity="error">{error}</Alert>}

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
                {p.name} {p.email ? `(${p.email})` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

        {dogs.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t("linkClient.subtitle")}
          </Typography>
        )}

        {dogs.map((dog, dIdx) => (
          <Paper
            key={dIdx}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: "#fafafa",
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t("linkClient.fields.dogName")} #{dIdx + 1}
              </Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeDog(dIdx)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label={t("linkClient.fields.dogName")}
                size="small"
                value={dog.breed}
                onChange={(e) => updateDog(dIdx, "breed", e.target.value)}
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
                label={t("clientDetails.isOwner")}
              />
            </Box>

            {dog.competitions_won > 0 && (
              <Box
                sx={{
                  p: 1.5,
                  mt: 1.5,
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

            {dog.photos.map((photo, pIdx) => (
              <Box
                key={pIdx}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  bgcolor: "#ffffff",
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
                    updatePhoto(dIdx, pIdx, "file_number", e.target.value)
                  }
                  sx={{ flex: 1, minWidth: 140 }}
                />
                <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel id={`photographer-label-${dIdx}-${pIdx}`}>
                    {t("linkClient.fields.photographer")}
                  </InputLabel>
                  <Select
                    labelId={`photographer-label-${dIdx}-${pIdx}`}
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
                  sx={{ minWidth: 180, flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                  <InputLabel id={`payment-label-${dIdx}-${pIdx}`}>
                    {t("linkClient.fields.paymentMethod")}
                  </InputLabel>
                  <Select
                    labelId={`payment-label-${dIdx}-${pIdx}`}
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
                      <InputLabel id={`currency-label-${dIdx}-${pIdx}`}>
                        {t("shared.currency")}
                      </InputLabel>
                      <Select
                        labelId={`currency-label-${dIdx}-${pIdx}`}
                        value={photo.currency || "BRL"}
                        label={t("shared.currency")}
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
          </Paper>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {t("linkClient.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!personId || saving}
        >
          {saving ? t("linkClient.linking") : t("linkClient.link")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
