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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PetsIcon from "@mui/icons-material/Pets";
import { useTranslation } from "react-i18next";
import { personService, Person } from "../../../services/api/person.service";
import { maskPhone, formatPhone } from "../../../utils/phone";

export const PeoplePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    alternative_email: "",
    phone: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

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
          <TableHead>
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
            {people.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t("people.noData")}
                </TableCell>
              </TableRow>
            ) : (
              people.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.alternative_email || "-"}</TableCell>
                  <TableCell>{formatPhone(p.phone) || "-"}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t("dashboard.actions.dogsAndPhotos")}>
                      <IconButton
                        color="secondary"
                        size="small"
                        onClick={() => navigate(`/people/${p.id}`)}
                        sx={{ mr: 1 }}
                      >
                        <PetsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("people.edit")}>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenEdit(p)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("people.delete")}>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleOpenDelete(p)}
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
