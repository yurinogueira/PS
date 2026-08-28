import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Chip,
  OutlinedInput,
} from "@mui/material";
import { seasonService, Season } from "../../../services/api/season.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";

export const SeasonsPage = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>(
    [],
  );

  const load = async () => {
    const [sData, pData] = await Promise.all([
      seasonService.list(),
      photographerService.list(),
    ]);
    setSeasons(sData || []);
    setPhotographers(pData || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    await seasonService.create({
      name,
      photographer_ids: selectedPhotographers,
    });
    setOpen(false);
    setName("");
    setSelectedPhotographers([]);
    load();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Temporadas</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Nova Temporada
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Fotógrafos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  {s.photographer_ids?.length || 0} associados
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nova Temporada</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 2,
            minWidth: 400,
          }}
        >
          <TextField
            label="Nome"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Fotógrafos Participantes</InputLabel>
            <Select
              multiple
              value={selectedPhotographers}
              onChange={(e) =>
                setSelectedPhotographers(
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value,
                )
              }
              input={<OutlinedInput label="Fotógrafos Participantes" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={
                        photographers.find((p) => p.id === value)?.name || value
                      }
                    />
                  ))}
                </Box>
              )}
            >
              {photographers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
