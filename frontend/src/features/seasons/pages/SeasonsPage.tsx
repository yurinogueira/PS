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
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import { seasonService, Season } from "../../../services/api/season.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";

export const SeasonsPage = () => {
  const { activeSeason, setActiveSeason } = useSeasonStore();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>(
    [],
  );
  const [judges, setJudges] = useState<string[]>([]);
  const [judgeInput, setJudgeInput] = useState("");

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
      console.error("Erro ao carregar eventos:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setSelectedPhotographers([]);
    setJudges([]);
    setJudgeInput("");
    setOpen(true);
  };

  const handleOpenEdit = (s: Season) => {
    setEditingId(s.id);
    setName(s.name);
    setSelectedPhotographers(s.photographer_ids || []);
    setJudges(s.judges || []);
    setJudgeInput("");
    setOpen(true);
  };

  const handleAddJudge = () => {
    const trimmed = judgeInput.trim();
    if (trimmed && !judges.includes(trimmed)) {
      setJudges([...judges, trimmed]);
      setJudgeInput("");
    }
  };

  const handleRemoveJudge = (judgeToRemove: string) => {
    setJudges(judges.filter((j) => j !== judgeToRemove));
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await seasonService.update(editingId, {
          name,
          photographer_ids: selectedPhotographers,
          judges,
        });
      } else {
        await seasonService.create({
          name,
          photographer_ids: selectedPhotographers,
          judges,
        });
      }
      setOpen(false);
      setEditingId(null);
      setName("");
      setSelectedPhotographers([]);
      setJudges([]);
      setJudgeInput("");
      await load();
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
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
      if (activeSeason?.id === deletingSeason.id) {
        const remaining = seasons.filter((s) => s.id !== deletingSeason.id);
        setActiveSeason(remaining.length > 0 ? remaining[0] : null);
      }
      setDeleteConfirmOpen(false);
      setDeletingSeason(null);
      await load();
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", sm: "2rem" },
            fontWeight: 700,
          }}
        >
          Eventos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
        >
          Novo Evento
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #E2E8F0",
          borderRadius: 2,
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nome do Evento</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fotógrafos</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Juízes</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhum evento cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              seasons.map((s) => {
                const associatedPhotogs = s.photographer_ids?.length || 0;
                const associatedJudges = s.judges?.length || 0;
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell>
                      {associatedPhotogs}{" "}
                      {associatedPhotogs === 1 ? "associado" : "associados"}
                    </TableCell>
                    <TableCell>
                      {associatedJudges > 0 ? (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {s.judges?.slice(0, 3).map((j) => (
                            <Chip
                              key={j}
                              label={j}
                              size="small"
                              variant="outlined"
                              icon={<GavelRoundedIcon fontSize="small" />}
                            />
                          ))}
                          {associatedJudges > 3 && (
                            <Chip
                              label={`+${associatedJudges - 3}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Nenhum juiz cadastrado
                        </Typography>
                      )}
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

      {/* Modal Criar / Editar Evento */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingId ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            pt: 2,
          }}
        >
          <TextField
            label="Nome do Evento"
            placeholder="Ex: 2026 - Dog Nikity"
            fullWidth
            required
            autoFocus
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
                      size="small"
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

          {/* Seção de Cadastro de Juízes do Evento */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <GavelRoundedIcon fontSize="small" color="primary" />
              Lista de Juízes do Evento
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
              <TextField
                label="Nome do Juiz"
                placeholder="Ex: Tamas Jakkel, Dr. Roberto Carlos..."
                size="small"
                fullWidth
                value={judgeInput}
                onChange={(e) => setJudgeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddJudge();
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddJudge}
                disabled={!judgeInput.trim()}
                sx={{ whiteSpace: "nowrap", px: 2 }}
              >
                Adicionar
              </Button>
            </Box>
            {judges.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {judges.map((j) => (
                  <Chip
                    key={j}
                    label={j}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={() => handleRemoveJudge(j)}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Nenhum juiz adicionado a este evento ainda. Digite o nome e
                clique em Adicionar.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o evento{" "}
            <strong>{deletingSeason?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1.5 }}>
            Atenção: Ao excluir este evento, todas as entidades e registros
            vinculados a ele (como vínculos de clientes, cães e fotos
            participantes) serão removidos permanentemente em cascata.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
