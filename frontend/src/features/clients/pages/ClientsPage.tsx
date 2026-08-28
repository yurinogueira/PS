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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
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

export const ClientsPage = () => {
  const { activeSeason } = useSeasonStore();
  const [clients, setClients] = useState<SeasonClient[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);

  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [dogs, setDogs] = useState<Omit<Dog, "id">[]>([]);

  const load = async () => {
    if (!activeSeason) return;
    const [cData, pData, photogData] = await Promise.all([
      clientService.list(),
      personService.list(),
      photographerService.list(),
    ]);
    setClients(
      (cData || []).filter((c: any) => c.season_id === activeSeason.id),
    );
    setPeople(pData || []);
    setPhotographers(photogData || []);
  };

  useEffect(() => {
    load();
  }, [activeSeason]);

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

  const addDog = () => {
    setDogs([
      ...dogs,
      {
        breed: "",
        judge: "",
        is_owner: false,
        competitions_won: 0,
        photos: [],
      },
    ]);
  };

  const updateDog = (index: number, field: string, value: any) => {
    const newDogs = [...dogs];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setDogs(newDogs);
  };

  const addPhoto = (dogIndex: number) => {
    const newDogs = [...dogs];
    newDogs[dogIndex].photos.push({
      file_number: "",
      photographer_id: "",
      payment_method: "Pix",
      amount_paid: 0,
    } as Photo);
    setDogs(newDogs);
  };

  const updatePhoto = (
    dogIndex: number,
    photoIndex: number,
    field: string,
    value: any,
  ) => {
    const newDogs = [...dogs];
    newDogs[dogIndex].photos[photoIndex] = {
      ...newDogs[dogIndex].photos[photoIndex],
      [field]: value,
    };
    setDogs(newDogs);
  };

  if (!activeSeason)
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Selecione uma Temporada no topo.</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Clientes da Temporada Atual</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Vincular Cliente
        </Button>
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pessoa</TableCell>
                <TableCell>Cachorros</TableCell>
                <TableCell>Total de Fotos</TableCell>
                <TableCell align="right">Ações</TableCell>
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
                        onClick={() =>
                          (window.location.href = `/clients/${c.id}`)
                        }
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
        <DialogTitle>Vincular Cliente na Temporada</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
        >
          <FormControl fullWidth>
            <InputLabel>Selecione a Pessoa</InputLabel>
            <Select
              value={personId}
              label="Selecione a Pessoa"
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
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
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
                      parseInt(e.target.value),
                    )
                  }
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
                  label="Dono?"
                />
              </Box>

              <Typography variant="subtitle2">Fotos</Typography>
              {dog.photos.map((photo, pIdx) => (
                <Box
                  key={pIdx}
                  sx={{ display: "flex", gap: 2, alignItems: "center" }}
                >
                  <TextField
                    size="small"
                    label="Número do Arquivo"
                    value={photo.file_number}
                    onChange={(e) =>
                      updatePhoto(dIdx, pIdx, "file_number", e.target.value)
                    }
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Fotógrafo</InputLabel>
                    <Select
                      value={photo.photographer_id}
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
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Pagamento</InputLabel>
                    <Select
                      value={photo.payment_method}
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
                    value={photo.amount_paid}
                    onChange={(e) =>
                      updatePhoto(
                        dIdx,
                        pIdx,
                        "amount_paid",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addPhoto(dIdx)}
              >
                Adicionar Foto
              </Button>
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
    </Box>
  );
};
