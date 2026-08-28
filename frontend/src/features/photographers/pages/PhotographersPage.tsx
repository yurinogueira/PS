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
} from "@mui/material";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";

export const PhotographersPage = () => {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    const data = await photographerService.list();
    setPhotographers(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    await photographerService.create({ name });
    setOpen(false);
    setName("");
    load();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Fotógrafos</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Novo Fotógrafo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {photographers.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Novo Fotógrafo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
