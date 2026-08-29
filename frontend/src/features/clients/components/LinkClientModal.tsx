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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { clientService, Dog } from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";

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
          setError("Erro ao carregar lista de pessoas e fotógrafos.");
        });
    }
  }, [open]);

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
      setError("Erro ao vincular cliente. Tente novamente.");
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
      amount_paid: 0,
    });
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setDogs(newDogs);
  };

  const updatePhoto = (
    dogIndex: number,
    photoIndex: number,
    field: string,
    value: unknown,
  ) => {
    const newDogs = [...dogs];
    const photos = [...newDogs[dogIndex].photos];
    photos[photoIndex] = {
      ...photos[photoIndex],
      [field]: value,
    };
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
      <DialogTitle>Vincular Cliente na Temporada</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="select-person-label">Selecione a Pessoa</InputLabel>
          <Select
            labelId="select-person-label"
            value={personId}
            label="Selecione a Pessoa"
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
          <Typography variant="h6">Cachorros</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addDog}
          >
            Adicionar Cachorro
          </Button>
        </Box>

        {dogs.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Nenhum cachorro adicionado. Clique no botão acima para adicionar.
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
                Cachorro #{dIdx + 1}
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
                label="Raça"
                size="small"
                value={dog.breed}
                onChange={(e) => updateDog(dIdx, "breed", e.target.value)}
                sx={{ flex: 1, minWidth: 150 }}
              />
              <TextField
                label="Juiz"
                size="small"
                value={dog.judge}
                onChange={(e) => updateDog(dIdx, "judge", e.target.value)}
                sx={{ flex: 1, minWidth: 150 }}
              />
              <TextField
                type="number"
                label="Competições Ganhas"
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
              <Typography variant="subtitle2">Fotos</Typography>
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
                  label="Número do Arquivo"
                  value={photo.file_number}
                  onChange={(e) =>
                    updatePhoto(dIdx, pIdx, "file_number", e.target.value)
                  }
                  sx={{ flex: 1, minWidth: 140 }}
                />
                <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel id={`photographer-label-${dIdx}-${pIdx}`}>
                    Fotógrafo
                  </InputLabel>
                  <Select
                    labelId={`photographer-label-${dIdx}-${pIdx}`}
                    value={photo.photographer_id || ""}
                    label="Fotógrafo"
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
                <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                  <InputLabel id={`payment-label-${dIdx}-${pIdx}`}>
                    Pagamento
                  </InputLabel>
                  <Select
                    labelId={`payment-label-${dIdx}-${pIdx}`}
                    value={photo.payment_method || "Pix"}
                    label="Pagamento"
                    onChange={(e) =>
                      updatePhoto(dIdx, pIdx, "payment_method", e.target.value)
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
                  label="Valor Pago"
                  value={photo.amount_paid ?? 0}
                  onChange={(e) =>
                    updatePhoto(
                      dIdx,
                      pIdx,
                      "amount_paid",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  sx={{ width: 120 }}
                />
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
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!personId || saving}
        >
          {saving ? "Salvando..." : "Salvar Cadastro"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
