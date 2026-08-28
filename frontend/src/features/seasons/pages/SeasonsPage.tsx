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
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { seasonService, Season } from "../../../services/api/season.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";

export const SeasonsPage = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>(
    [],
  );

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);

  const load = async () => {
    try {
      const [sData, pData] = await Promise.all([
        seasonService.list(),
        photographerService.list(),
      ]);
      setSeasons(sData || []);
      setPhotographers(pData || []);
    } catch (err) {
      console.error("Erro ao carregar temporadas:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setSelectedPhotographers([]);
    setOpen(true);
  };

  const handleOpenEdit = (s: Season) => {
    setEditingId(s.id);
    setName(s.name);
    setSelectedPhotographers(s.photographer_ids || []);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await seasonService.update(editingId, {
          name,
          photographer_ids: selectedPhotographers,
        });
      } else {
        await seasonService.create({
          name,
          photographer_ids: selectedPhotographers,
        });
      }
      setOpen(false);
      setEditingId(null);
      setName("");
      setSelectedPhotographers([]);
      await load();
    } catch (err) {
      console.error("Erro ao salvar temporada:", err);
    }
  };

  const handleOpenDelete = (s: Season) => {
    setDeletingSeason(s);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSeason) return;
    try {
      await seasonService.delete(deletingSeason.id);
      setDeleteConfirmOpen(false);
      setDeletingSeason(null);
      await load();
    } catch (err) {
      console.error("Erro ao excluir temporada:", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Temporadas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
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
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhuma temporada cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              seasons.map((s) => {
                const associatedCount = s.photographer_ids?.length || 0;
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      {associatedCount}{" "}
                      {associatedCount === 1 ? "associado" : "associados"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(s)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDelete(s)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Criar / Editar */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Editar Temporada" : "Nova Temporada"}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 2,
          }}
        >
          <TextField
            label="Nome"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Fotógrafos Participantes (Opcional)</InputLabel>
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
              input={
                <OutlinedInput label="Fotógrafos Participantes (Opcional)" />
              }
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
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!name.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a temporada{" "}
            <strong>{deletingSeason?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
