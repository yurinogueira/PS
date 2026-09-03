import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  InputAdornment,
  TablePagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PetsIcon from "@mui/icons-material/Pets";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { useTranslation } from "react-i18next";
import { personService, Person } from "../../../services/api/person.service";
import { maskPhone, formatPhone } from "../../../utils/phone";

export const PeoplePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [form, setForm] = useState({
    name: "",
    email: "",
    alternative_email: "",
    phone: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

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

  const filteredPeople = people.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const emailMatch = p.email?.toLowerCase().includes(query);
    const altEmailMatch = p.alternative_email?.toLowerCase().includes(query);
    const phoneFormatted = formatPhone(p.phone).toLowerCase();
    const phoneRaw = (p.phone || "").toLowerCase();
    const phoneMatch =
      phoneFormatted.includes(query) || phoneRaw.includes(query);
    return nameMatch || emailMatch || altEmailMatch || phoneMatch;
  });

  const paginatedPeople = filteredPeople.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const load = async () => {
    try {
      const data = await personService.list();
      setPeople(data || []);
    } catch (err) {
      console.error("Erro ao carregar pessoas:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ name: "", email: "", alternative_email: "", phone: "" });
    setOpen(true);
  };

  const handleOpenEdit = (person: Person) => {
    setEditingId(person.id);
    setForm({
      name: person.name || "",
      email: person.email || "",
      alternative_email: person.alternative_email || "",
      phone: maskPhone(person.phone) || "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await personService.update(editingId, form);
      } else {
        await personService.create(form);
      }
      setOpen(false);
      setEditingId(null);
      setForm({ name: "", email: "", alternative_email: "", phone: "" });
      await load();
    } catch (err) {
      console.error("Erro ao salvar pessoa:", err);
    }
  };

  const handleOpenDelete = (person: Person) => {
    setDeletingPerson(person);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPerson) return;
    try {
      await personService.delete(deletingPerson.id);
      setDeleteConfirmOpen(false);
      setDeletingPerson(null);
      await load();
    } catch (err) {
      console.error("Erro ao excluir pessoa:", err);
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
          {t("people.title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ width: { xs: "100%", sm: "auto" }, whiteSpace: "nowrap" }}
        >
          {t("people.add")}
        </Button>
      </Box>

      {/* Barra de Busca Padronizada */}
      <Box sx={{ mb: 2.5, maxWidth: { xs: "100%", sm: 400 } }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t("people.search")}
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
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("people.fields.name")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("people.fields.email")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("people.fields.alternativeEmail")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("people.fields.phone")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {t("shared.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPeople.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {people.length === 0
                      ? t("people.noData")
                      : t("tables.noResults")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPeople.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onClick={() => navigate(`/people/${p.id}`)}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell>{p.email || "-"}</TableCell>
                  <TableCell>{p.alternative_email || "-"}</TableCell>
                  <TableCell>{formatPhone(p.phone) || "-"}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t("dashboard.actions.dogsAndPhotos")}>
                      <IconButton
                        color="secondary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/people/${p.id}`);
                        }}
                        sx={{ mr: 1 }}
                      >
                        <PetsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("people.edit")}>
                      <IconButton
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
                    <Tooltip title={t("people.delete")}>
                      <IconButton
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
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filteredPeople.length}
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
          {editingId ? t("people.edit") : t("people.add")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <TextField
            label={t("people.fields.name")}
            fullWidth
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label={t("people.fields.emailOptional")}
            fullWidth
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label={t("people.fields.alternativeEmailOptional")}
            fullWidth
            type="email"
            value={form.alternative_email}
            onChange={(e) =>
              setForm({ ...form, alternative_email: e.target.value })
            }
          />
          <TextField
            label={t("people.fields.phone")}
            fullWidth
            placeholder="(21) 99999-9999"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: maskPhone(e.target.value) })
            }
            slotProps={{
              htmlInput: { maxLength: 15 },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("people.cancel")}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.name.trim()}
          >
            {t("people.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>{t("people.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("people.confirmDelete")} <strong>{deletingPerson?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t("people.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            {t("people.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
