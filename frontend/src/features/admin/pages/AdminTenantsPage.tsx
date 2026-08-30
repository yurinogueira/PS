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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import { adminService } from "../services/admin.service";
import { Tenant } from "../types/admin.types";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export const AdminTenantsPage = () => {
  useDocumentTitle("Gestão de Tenants - Admin");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal
  const [openCreate, setOpenCreate] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [createPlan, setCreatePlan] = useState<"free" | "standard">("free");
  const [createPaymentStatus, setCreatePaymentStatus] = useState<
    "paid" | "unpaid"
  >("paid");

  // Plan Edit Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState<"free" | "standard">("free");

  // Payment Status Edit Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<"paid" | "unpaid">(
    "paid",
  );

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
    setCreatePlan("free");
    setCreatePaymentStatus("paid");
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
      await adminService.createTenant({
        name: clean,
        plan: createPlan,
        paymentStatus: createPaymentStatus,
      });
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

  const handleOpenPlanModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setNewPlan(tenant.plan || "free");
    setPlanModalOpen(true);
  };

  const handleUpdatePlan = async () => {
    if (!selectedTenant) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await adminService.updateTenantPlan(selectedTenant.name, {
        plan: newPlan,
      });
      setSuccessMessage(
        `Plano da organização "${selectedTenant.name}" atualizado para "${newPlan === "free" ? "Gratuito (Trial)" : "Padrão"}" com sucesso.`,
      );
      setPlanModalOpen(false);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message || "Erro ao atualizar plano do tenant.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setNewPaymentStatus(tenant.paymentStatus || "paid");
    setPaymentModalOpen(true);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedTenant) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await adminService.updateTenantPaymentStatus(selectedTenant.name, {
        paymentStatus: newPaymentStatus,
      });
      setSuccessMessage(
        `Status de pagamento da organização "${selectedTenant.name}" atualizado para "${newPaymentStatus === "paid" ? "Em dia" : "Inadimplente"}".`,
      );
      setPaymentModalOpen(false);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message ||
          "Erro ao atualizar status de pagamento.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const [now] = useState(() => Date.now());

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
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Organizações
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie organizações, planos de assinatura (Gratuito/Padrão),
            expirações de trial e status financeiro.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}
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
                Nome da Organização
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plano</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pagamento</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expiração Trial</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Data de Criação</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
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
              filteredTenants.map((t) => {
                const isFree = (t.plan || "free") === "free";
                const isPaid = (t.paymentStatus || "paid") === "paid";
                const expiresAt = t.planExpiresAt
                  ? new Date(t.planExpiresAt)
                  : null;
                const isExpired =
                  isFree && expiresAt && expiresAt.getTime() < now;

                return (
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
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {t.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isFree ? "Gratuito (Trial)" : "Padrão"}
                        size="small"
                        color={isFree ? "default" : "primary"}
                        variant={isFree ? "outlined" : "filled"}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={isPaid ? "Em dia" : "Inadimplente"}
                        size="small"
                        color={isPaid ? "success" : "error"}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {isFree
                          ? expiresAt
                            ? `${expiresAt.toLocaleDateString("pt-BR")} ${isExpired ? "(Expirado)" : ""}`
                            : "14 dias (Trial)"
                          : "Sem expiração"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Alterar Plano">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenPlanModal(t)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Alterar Status de Pagamento">
                          <IconButton
                            size="small"
                            color={isPaid ? "default" : "error"}
                            onClick={() => handleOpenPaymentModal(t)}
                          >
                            <PaymentRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
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

            <FormControl fullWidth size="small">
              <InputLabel>Plano Inicial</InputLabel>
              <Select
                value={createPlan}
                label="Plano Inicial"
                onChange={(e) =>
                  setCreatePlan(e.target.value as "free" | "standard")
                }
                disabled={submitting}
              >
                <MenuItem value="free">Gratuito (Trial de 14 dias)</MenuItem>
                <MenuItem value="standard">
                  Padrão (Ilimitado / Limite 300 clientes por evento)
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Status de Pagamento</InputLabel>
              <Select
                value={createPaymentStatus}
                label="Status de Pagamento"
                onChange={(e) =>
                  setCreatePaymentStatus(e.target.value as "paid" | "unpaid")
                }
                disabled={submitting}
              >
                <MenuItem value="paid">Em dia (Pago)</MenuItem>
                <MenuItem value="unpaid">Inadimplente (Não pago)</MenuItem>
              </Select>
            </FormControl>
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

      {/* Dialog Alterar Plano */}
      <Dialog
        open={planModalOpen}
        onClose={() => !submitting && setPlanModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Alterar Plano</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Organização: <strong>{selectedTenant?.name}</strong>
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Plano</InputLabel>
            <Select
              value={newPlan}
              label="Plano"
              onChange={(e) =>
                setNewPlan(e.target.value as "free" | "standard")
              }
              disabled={submitting}
            >
              <MenuItem value="free">
                Gratuito (Reinicia trial de 14 dias)
              </MenuItem>
              <MenuItem value="standard">Padrão</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setPlanModalOpen(false)}
            disabled={submitting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdatePlan}
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={16} /> : <EditRoundedIcon />
            }
            sx={{ fontWeight: 600 }}
          >
            {submitting ? "Salvando..." : "Salvar Plano"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Alterar Status de Pagamento */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => !submitting && setPaymentModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Alterar Status de Pagamento
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Organização: <strong>{selectedTenant?.name}</strong>
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Status de Pagamento</InputLabel>
            <Select
              value={newPaymentStatus}
              label="Status de Pagamento"
              onChange={(e) =>
                setNewPaymentStatus(e.target.value as "paid" | "unpaid")
              }
              disabled={submitting}
            >
              <MenuItem value="paid">Em dia (Acesso Liberado)</MenuItem>
              <MenuItem value="unpaid">
                Inadimplente (Acesso e Escritas Bloqueados)
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setPaymentModalOpen(false)}
            disabled={submitting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdatePaymentStatus}
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} />
              ) : (
                <PaymentRoundedIcon />
              )
            }
            sx={{ fontWeight: 600 }}
          >
            {submitting ? "Salvando..." : "Salvar Status"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
