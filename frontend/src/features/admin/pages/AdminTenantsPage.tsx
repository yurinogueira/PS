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
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { adminService } from "../services/admin.service";
import { Tenant } from "../types/admin.types";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export const AdminTenantsPage = () => {
  useDocumentTitle("Gestão de Tenants - Admin");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await adminService.getTenants();
      setTenants(data || []);
    } catch (err) {
      console.error("Erro ao carregar tenants:", err);
      setErrorMessage("Não foi possível carregar a lista de organizações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleOpenCreate = () => {
    setTenantName("");
    setErrorMessage(null);
    setSuccessMessage(null);
    setOpenCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tenantName.trim();
    if (!clean) return;

    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      setErrorMessage(
        "Nome de organização inválido. Use apenas letras, números, traços e underscores.",
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await adminService.createTenant({ name: clean });
      setSuccessMessage(`Organização "${clean}" criada com sucesso.`);
      setOpenCreate(false);
      setTenantName("");
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message ||
          "Erro ao criar organização. Verifique se o nome já está em uso.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Organizações
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie e provisione as organizações para isolamento multi-tenant
            da plataforma.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ fontWeight: 600 }}
        >
          Nova Organização
        </Button>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage(null)}
          sx={{ mb: 3 }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage(null)}
          sx={{ mb: 3 }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Card elevation={0} sx={{ flex: 1, border: "1px solid #E2E8F0" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="body2" color="text.secondary">
              Total de Organizações
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {tenants.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid #E2E8F0",
          borderRadius: 2,
        }}
      >
        <TextField
          placeholder="Buscar organização por nome..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Paper>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #E2E8F0", borderRadius: 2 }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>
                Nome da Organização
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Data de Criação</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Carregando organizações...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                  <BusinessRoundedIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Nenhuma organização encontrada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? "Tente refinar seu termo de busca."
                      : "Clique em 'Nova Organização' para criar o primeiro tenant."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((t) => (
                <TableRow key={t.name} hover>
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: "primary.50",
                          color: "primary.main",
                          p: 0.8,
                          borderRadius: 1,
                          display: "inline-flex",
                        }}
                      >
                        <BusinessRoundedIcon fontSize="small" />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString("pt-BR")
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Ativo (Imutável)"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Criar Tenant */}
      <Dialog
        open={openCreate}
        onClose={() => !submitting && setOpenCreate(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreate}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Nova Organização (Tenant)
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
          >
            <Alert
              icon={<InfoOutlinedIcon fontSize="inherit" />}
              severity="info"
            >
              O nome da organização será utilizado como chave única de
              isolamento de dados e <strong>não poderá ser editado</strong> após
              a criação.
            </Alert>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              label="Nome do Tenant / Identificador"
              placeholder="ex: studio-fotografico"
              fullWidth
              required
              autoFocus
              disabled={submitting}
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value.toLowerCase())}
              helperText="Apenas letras, números, hífens (-) e underscores (_)."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setOpenCreate(false)}
              disabled={submitting}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !tenantName.trim()}
              startIcon={
                submitting ? <CircularProgress size={16} /> : <AddIcon />
              }
              sx={{ fontWeight: 600 }}
            >
              {submitting ? "Criando..." : "Criar Organização"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
