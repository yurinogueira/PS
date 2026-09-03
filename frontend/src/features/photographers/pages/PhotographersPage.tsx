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
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { useTranslation } from "react-i18next";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { seasonService, Season } from "../../../services/api/season.service";

export const PhotographersPage = () => {
  const { t } = useTranslation();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPhotographer, setDeletingPhotographer] =
    useState<Photographer | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const filteredPhotographers = photographers.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const linkedSeasons = seasons.filter((s) =>
      s.photographer_ids?.includes(p.id),
    );
    const seasonMatch = linkedSeasons.some((s) =>
      s.name?.toLowerCase().includes(query),
    );
    return nameMatch || seasonMatch;
  });

  const paginatedPhotographers = filteredPhotographers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const load = async () => {
    try {
      const [pData, sData] = await Promise.all([
        photographerService.list(),
        seasonService.list(),
      ]);
      setPhotographers(pData || []);
      setSeasons(sData || []);
    } catch (err) {
      console.error("Erro ao carregar fotógrafos:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setOpen(true);
  };

  const handleOpenEdit = (p: Photographer) => {
    setEditingId(p.id);
    setName(p.name);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await photographerService.update(editingId, { name });
      } else {
        await photographerService.create({ name });
      }
      setOpen(false);
      setEditingId(null);
      setName("");
      await load();
    } catch (err) {
      console.error("Erro ao salvar fotógrafo:", err);
    }
  };

  const handleOpenDelete = (p: Photographer) => {
    setDeletingPhotographer(p);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPhotographer) return;
    try {
      await photographerService.delete(deletingPhotographer.id);
      setDeleteConfirmOpen(false);
      setDeletingPhotographer(null);
      await load();
    } catch (err) {
      console.error("Erro ao excluir fotógrafo:", err);
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
          {t("photographers.title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
        >
          {t("photographers.add")}
        </Button>
      </Box>

      {/* Barra de Busca Padronizada */}
      <Box sx={{ mb: 2.5, maxWidth: { xs: "100%", sm: 400 } }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t("photographers.search")}
          value={searchQuery}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    aria-label={t("shared.cancel")}
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
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
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("photographers.fields.name")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("photographers.fields.associatedEvents")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("photographers.fields.createdAt")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {t("shared.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPhotographers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {photographers.length === 0
                      ? t("photographers.noData")
                      : t("tables.noResults")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPhotographers.map((p) => {
                const linkedSeasons = seasons.filter((s) =>
                  s.photographer_ids?.includes(p.id),
                );
                return (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={() => handleOpenEdit(p)}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            width: 36,
                            height: 36,
                            fontSize: "0.9rem",
                            fontWeight: 700,
                          }}
                        >
                          {p.name ? (
                            p.name.charAt(0).toUpperCase()
                          ) : (
                            <PhotoCameraRoundedIcon fontSize="small" />
                          )}
                        </Avatar>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: "text.primary" }}
                        >
                          {p.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {linkedSeasons.length > 0 ? (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {linkedSeasons.slice(0, 2).map((s) => (
                            <Chip
                              key={s.id}
                              label={s.name}
                              size="small"
                              variant="outlined"
                              icon={<EventNoteRoundedIcon fontSize="small" />}
                            />
                          ))}
                          {linkedSeasons.length > 2 && (
                            <Tooltip
                              title={linkedSeasons
                                .slice(2)
                                .map((s) => s.name)
                                .join(", ")}
                            >
                              <Chip
                                label={`+${linkedSeasons.length - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {t("photographers.noEvents")}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString()
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("photographers.edit")}>
                        <IconButton
                          aria-label={t("photographers.edit")}
                          color="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(p);
                          }}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("photographers.delete")}>
                        <IconButton
                          aria-label={t("photographers.delete")}
                          color="error"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(p);
                          }}
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

        <TablePagination
          component="div"
          count={filteredPhotographers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage={t("tables.rowsPerPage")}
          labelDisplayedRows={({ from, to, count }) =>
            t("tables.displayedRows", {
              from,
              to,
              count: count !== -1 ? count : `>${to}`,
            })
          }
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            "& .MuiTablePagination-toolbar": {
              flexWrap: "wrap",
              justifyContent: { xs: "center", sm: "space-between" },
              gap: 1,
              py: 1,
              px: { xs: 1, sm: 2 },
            },
            "& .MuiTablePagination-actions": {
              ml: { xs: 0, sm: 2 },
            },
          }}
        />
      </TableContainer>

      {/* Modal Criar / Editar */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? t("photographers.edit") : t("photographers.add")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label={t("photographers.fields.name")}
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            {t("photographers.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!name.trim()}
          >
            {t("photographers.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>{t("photographers.delete")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("photographers.confirmDelete")}{" "}
            <strong>{deletingPhotographer?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t("photographers.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            {t("photographers.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
