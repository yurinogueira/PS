import { useState, useEffect } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { useSeasonStore } from "../../../store/seasonStore";

const PAYMENT_METHODS = [
  "Pix",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Não pago",
];

export const ClientDetailsPage = () => {
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

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, [id]);

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
          photos: [],
        } as any,
      ],
    });
  };

  const updateDog = (index: number, field: string, value: any) => {
    if (!client) return;
    const newDogs = [...client.dogs];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setClient({ ...client, dogs: newDogs });
  };

  const removeDog = (index: number) => {
    if (!client) return;
    const newDogs = [...client.dogs];
    newDogs.splice(index, 1);
    setClient({ ...client, dogs: newDogs });
  };

  const addPhoto = (dogIndex: number) => {
    if (!client) return;
    const newDogs = [...client.dogs];
    newDogs[dogIndex].photos = newDogs[dogIndex].photos || [];
    newDogs[dogIndex].photos.push({
      file_number: "",
      photographer_id: "",
      payment_method: "Pix",
      amount_paid: 0,
    } as Photo);
    setClient({ ...client, dogs: newDogs });
  };

  const updatePhoto = (
    dogIndex: number,
    photoIndex: number,
    field: string,
    value: any,
  ) => {
    if (!client) return;
    const newDogs = [...client.dogs];
    newDogs[dogIndex].photos[photoIndex] = {
      ...newDogs[dogIndex].photos[photoIndex],
      [field]: value,
    };
    setClient({ ...client, dogs: newDogs });
  };

  const removePhoto = (dogIndex: number, photoIndex: number) => {
    if (!client) return;
    const newDogs = [...client.dogs];
    newDogs[dogIndex].photos.splice(photoIndex, 1);
    setClient({ ...client, dogs: newDogs });
  };

  if (!client) return <Typography>Carregando...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate("/clients")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Detalhes do Cliente</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Excluir Cliente
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Salvar Alterações
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Dados da Pessoa</Typography>
        <Typography>Nome: {person?.name}</Typography>
        <Typography>E-mail: {person?.email}</Typography>
        <Typography>Telefone: {person?.phone}</Typography>
      </Paper>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">Cachorros</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addDog}>
          Adicionar Cachorro
        </Button>
      </Box>

      {client.dogs?.map((dog, dIdx) => (
        <Accordion key={dIdx} defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {dog.breed || "Novo Cachorro"}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                label="Raça"
                value={dog.breed}
                onChange={(e) => updateDog(dIdx, "breed", e.target.value)}
              />
              <TextField
                label="Juiz"
                value={dog.judge}
                onChange={(e) => updateDog(dIdx, "judge", e.target.value)}
              />
              <TextField
                type="number"
                label="Competições Ganhas"
                value={dog.competitions_won}
                onChange={(e) =>
                  updateDog(
                    dIdx,
                    "competitions_won",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dog.is_owner || false}
                    onChange={(e) =>
                      updateDog(dIdx, "is_owner", e.target.checked)
                    }
                  />
                }
                label="Dono?"
              />
              <IconButton color="error" onClick={() => removeDog(dIdx)}>
                <DeleteIcon />
              </IconButton>
            </Box>

            <Box
              sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}
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
                  mb: 2,
                  p: 2,
                  bgcolor: "#f9f9f9",
                  borderRadius: 1,
                }}
              >
                <TextField
                  size="small"
                  label="Número do Arquivo"
                  value={photo.file_number}
                  onChange={(e) =>
                    updatePhoto(dIdx, pIdx, "file_number", e.target.value)
                  }
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Fotógrafo</InputLabel>
                  <Select
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
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Pagamento</InputLabel>
                  <Select
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
                  value={photo.amount_paid || 0}
                  onChange={(e) =>
                    updatePhoto(
                      dIdx,
                      pIdx,
                      "amount_paid",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => removePhoto(dIdx, pIdx)}
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
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o cadastro deste cliente na
            temporada?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Excluir
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
