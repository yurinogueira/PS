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
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import { useTranslation } from "react-i18next";
import { seasonService, Season } from "../../../services/api/season.service";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { useTenantStore } from "../../../store/tenantStore";

export const SeasonsPage = () => {
  const { t } = useTranslation();
  const { activeSeason, setActiveSeason } = useSeasonStore();
  const { tenantStatus } = useTenantStore();

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

  const isCreateBlocked = Boolean(
    tenantStatus?.isUnpaid ||
    tenantStatus?.isTrialExpired ||
    tenantStatus?.clientLimitExceeded,
  );

  const isWriteBlocked = Boolean(
    tenantStatus?.isUnpaid || tenantStatus?.isTrialExpired,
  );

  const getCreateBlockedReason = () => {
    if (tenantStatus?.isUnpaid) {
      return t("shared.tenantBanner.unpaidShort");
    }
    if (tenantStatus?.isTrialExpired) {
      return t("shared.tenantBanner.trialExpiredShort");
    }
    if (tenantStatus?.clientLimitExceeded) {
      return t("shared.tenantBanner.clientLimitExceededShort");
    }
    return "";
  };

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
    if (isCreateBlocked) return;
    setEditingId(null);
    setName("");
    setSelectedPhotographers([]);
    setJudges([]);
    setJudgeInput("");
    setOpen(true);
  };

  const handleOpenEdit = (s: Season) => {
    if (isWriteBlocked) return;
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
    if (isWriteBlocked) return;
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
          {t("seasons.title")}
        </Typography>
        <Tooltip title={isCreateBlocked ? getCreateBlockedReason() : ""}>
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={isCreateBlocked}
              sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
            >
              {t("seasons.add")}
            </Button>
          </span>
        </Tooltip>
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
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("seasons.fields.name")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("seasons.status")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("photographers.title")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("seasons.fields.judges")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("seasons.fields.createdAt")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {t("shared.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {t("seasons.noData")}
                </TableCell>
              </TableRow>
            ) : (
              seasons.map((s) => {
                const isActive = activeSeason?.id === s.id;
                const associatedPhotogs = s.photographer_ids?.length || 0;
                const associatedJudges = s.judges?.length || 0;
                return (
                  <TableRow
                    key={s.id}
                    hover
                    sx={{
                      bgcolor: isActive ? "rgba(2, 132, 199, 0.04)" : "inherit",
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: isActive ? "primary.main" : "grey.200",
                            color: isActive
                              ? "primary.contrastText"
                              : "text.secondary",
                            width: 36,
                            height: 36,
                          }}
                        >
                          <EventNoteRoundedIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: "text.primary" }}
                          >
                            {s.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Chip
                          icon={<CheckCircleRoundedIcon fontSize="small" />}
                          label={t("seasons.activeBadge")}
                          size="small"
                          color="success"
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={() => setActiveSeason(s)}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: 1.5,
                            borderColor: "divider",
                            py: 0.25,
                            px: 1,
                          }}
                        >
                          {t("seasons.selectActive")}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {associatedPhotogs > 0 ? (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {s.photographer_ids?.slice(0, 2).map((pid) => {
                            const photog = photographers.find(
                              (p) => p.id === pid,
                            );
                            return (
                              <Chip
                                key={pid}
                                label={photog?.name || pid}
                                size="small"
                                variant="outlined"
                                icon={
                                  <PhotoCameraRoundedIcon fontSize="small" />
                                }
                              />
                            );
                          })}
                          {associatedPhotogs > 2 && (
                            <Tooltip
                              title={s.photographer_ids
                                ?.slice(2)
                                .map(
                                  (pid) =>
                                    photographers.find((p) => p.id === pid)
                                      ?.name || pid,
                                )
                                .join(", ")}
                            >
                              <Chip
                                label={`+${associatedPhotogs - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {t("seasons.noPhotographers")}
                        </Typography>
                      )}
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
                          {t("seasons.noJudges")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString()
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          isWriteBlocked
                            ? t("seasons.blockedAction")
                            : t("seasons.edit")
                        }
                      >
                        <span>
                          <IconButton
                            aria-label={t("seasons.edit")}
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(s)}
                            disabled={isWriteBlocked}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          isWriteBlocked
                            ? t("seasons.blockedAction")
                            : t("seasons.delete")
                        }
                      >
                        <span>
                          <IconButton
                            aria-label={t("seasons.delete")}
                            color="error"
                            size="small"
                            onClick={() => handleOpenDelete(s)}
                            disabled={isWriteBlocked}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
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
        <DialogTitle>
          {editingId ? t("seasons.edit") : t("seasons.add")}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            pt: 2,
          }}
        >
          <TextField
            label={t("seasons.fields.name")}
            placeholder="Ex: 2026 - Dog Nikity"
            fullWidth
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>{t("seasons.fields.photographersOptional")}</InputLabel>
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
                <OutlinedInput
                  label={t("seasons.fields.photographersOptional")}
                />
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
              {t("seasons.fields.judgesList")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
              <TextField
                label={t("seasons.fields.judgeName")}
                placeholder={t("seasons.fields.judgesPlaceholder")}
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
                {t("seasons.fields.addJudge")}
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
                {t("seasons.fields.noJudgesDescription")}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>{t("seasons.cancel")}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!name.trim()}
          >
            {t("seasons.save")}
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
        <DialogTitle>{t("seasons.delete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("seasons.confirmDelete")}</Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1.5 }}>
            {t("seasons.cascadeWarning")}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t("seasons.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            {t("seasons.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
