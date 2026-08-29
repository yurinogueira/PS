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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  clientService,
  SeasonClient,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
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
    setClient({
      ...client,
      dogs: [
        ...(client.dogs || []),
        {
          breed: "",
          judge: "",
          is_owner: false,
          competitions_won: 0,
          won_competitions: [],
          photos: [],
        },
      ],
    });
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
    photos.push({
      file_number: "",
      photographer_id: "",
      payment_method: "Pix",
      amount_paid: 0,
    });
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setClient({ ...client, dogs: newDogs });
  };

  const updatePhoto = (
    dogIndex: number,
    photoIndex: number,
    field: string,
    value: unknown,
  ) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    const photos = [...(newDogs[dogIndex].photos || [])];
    photos[photoIndex] = {
      ...photos[photoIndex],
      [field]: value,
    };
    newDogs[dogIndex] = { ...newDogs[dogIndex], photos };
    setClient({ ...client, dogs: newDogs });
  };

  const removePhoto = (dogIndex: number, photoIndex: number) => {
    if (!client) return;
    const newDogs = [...(client.dogs || [])];
    const photos = [...(newDogs[dogIndex].photos || [])];
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
          <Typography variant="h6">Detalhes do Cliente</Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Excluir Cliente
          </Button>
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {person && (
                <Paper sx={{ p: 2.5, bgcolor: "#f8f9fa" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Dados da Pessoa
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Nome
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {person.name || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        E-mail
                      </Typography>
                      <Typography variant="body2">
                        {person.email || "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Telefone
                      </Typography>
                      <Typography variant="body2">
                        {formatPhone(person.phone) || "-"}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

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

              {(!client?.dogs || client.dogs.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  Nenhum cachorro cadastrado.
                </Typography>
              )}

              {client?.dogs?.map((dog, dIdx) => (
                <Accordion key={dIdx} defaultExpanded sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {dog.breed || `Cachorro #${dIdx + 1}`}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <TextField
                        label="Raça"
                        size="small"
                        value={dog.breed}
                        onChange={(e) =>
                          updateDog(dIdx, "breed", e.target.value)
                        }
                        sx={{ flex: 1, minWidth: 150 }}
                      />
                      <TextField
                        label="Juiz"
                        size="small"
                        value={dog.judge}
                        onChange={(e) =>
                          updateDog(dIdx, "judge", e.target.value)
                        }
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
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeDog(dIdx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
                          Competições Vencidas (
                          {dog.won_competitions?.length || 0})
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
                      <Typography variant="subtitle2">Fotos</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addPhoto(dIdx)}
                      >
                        Adicionar Foto
                      </Button>
                    </Box>

                    {dog.photos?.map((photo, pIdx) => (
                      <Box
                        key={pIdx}
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          bgcolor: "#f9f9f9",
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
                          <InputLabel id={`modal-photog-label-${dIdx}-${pIdx}`}>
                            Fotógrafo
                          </InputLabel>
                          <Select
                            labelId={`modal-photog-label-${dIdx}-${pIdx}`}
                            value={photo.photographer_id || ""}
                            label="Fotógrafo"
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
                        <FormControl
                          size="small"
                          sx={{ minWidth: 140, flex: 1 }}
                        >
                          <InputLabel
                            id={`modal-payment-label-${dIdx}-${pIdx}`}
                          >
                            Pagamento
                          </InputLabel>
                          <Select
                            labelId={`modal-payment-label-${dIdx}-${pIdx}`}
                            value={photo.payment_method || "Pix"}
                            label="Pagamento"
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
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving || loading}>
            Fechar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || loading}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o cadastro deste cliente na
            temporada?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
