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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import { adminService } from "../services/admin.service";
import { AdminUser, Tenant } from "../types/admin.types";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export const AdminUsersPage = () => {
  useDocumentTitle("Gestão de Usuários - Admin");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "assigned">(
    "all",
  );

  // Dialog State
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, tenantsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getTenants(),
      ]);
      setUsers(usersData || []);
      setTenants(tenantsData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setErrorMessage(
        "Não foi possível carregar os dados de usuários e tenants.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssign = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedTenant(user.tenantId || "");
    setErrorMessage(null);
    setOpenAssign(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await adminService.assignTenant(selectedUser.id, {
        tenantId: selectedTenant,
      });
      setSuccessMessage(
        selectedTenant
          ? `Organização "${selectedTenant}" atribuída com sucesso ao usuário ${selectedUser.name}.`
          : `Organização desvinculada do usuário ${selectedUser.name}.`,
      );
      setOpenAssign(false);
      setSelectedUser(null);
      await loadData();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message ||
          "Erro ao atribuir organização ao usuário.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = users.filter((u) => !u.tenantId).length;
  const assignedCount = users.filter((u) => Boolean(u.tenantId)).length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.tenantId &&
        u.tenantId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "pending") return !u.tenantId;
    if (filterType === "assigned") return Boolean(u.tenantId);
    return true;
  });

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
            Gestão de Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Aprove e vincule novos usuários aos seus respectivos tenants para
            liberar o acesso ao sistema.
          </Typography>
        </Box>
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

      {/* Summary KPI Cards */}
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
              Total de Usuários
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {users.length}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            flex: 1,
            border: "1px solid #E2E8F0",
            bgcolor: pendingCount > 0 ? "warning.50" : "inherit",
          }}
        >
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="body2" color="warning.dark">
              Aguardando Aprovação (Sem Tenant)
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mt: 0.5,
                color: pendingCount > 0 ? "warning.main" : "text.primary",
              }}
            >
              {pendingCount}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 1, border: "1px solid #E2E8F0" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="body2" color="text.secondary">
              Usuários Vinculados
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {assignedCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search & Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid #E2E8F0",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Buscar por nome, e-mail ou tenant..."
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

          <ToggleButtonGroup
            value={filterType}
            exclusive
            onChange={(_, val) => val && setFilterType(val)}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="all">Todos ({users.length})</ToggleButton>
            <ToggleButton value="pending">
              Pendentes ({pendingCount})
            </ToggleButton>
            <ToggleButton value="assigned">
              Vinculados ({assignedCount})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
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
        <Table sx={{ minWidth: 680 }}>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                E-mail & Confirmação
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Função</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                Organização (Tenant)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Carregando usuários...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <PersonRoundedIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Nenhum usuário encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tente alterar os termos de busca ou o filtro aplicado.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: u.superAdmin ? "secondary.50" : "grey.100",
                          color: u.superAdmin
                            ? "secondary.main"
                            : "text.secondary",
                          p: 0.8,
                          borderRadius: "50%",
                          display: "inline-flex",
                        }}
                      >
                        {u.superAdmin ? (
                          <SupervisorAccountRoundedIcon fontSize="small" />
                        ) : (
                          <PersonRoundedIcon fontSize="small" />
                        )}
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {u.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Criado em:{" "}
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("pt-BR")
                            : "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{u.email}</Typography>
                    {u.emailVerified ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <CheckCircleRoundedIcon
                          sx={{ fontSize: 14, color: "success.main" }}
                        />
                        <Typography variant="caption" color="success.main">
                          E-mail verificado
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <WarningRoundedIcon
                          sx={{ fontSize: 14, color: "warning.main" }}
                        />
                        <Typography variant="caption" color="warning.main">
                          Pendente de verificação
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.superAdmin ? (
                      <Chip
                        label="SuperAdmin"
                        size="small"
                        color="secondary"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip label="Usuário" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    {u.tenantId ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <BusinessRoundedIcon
                          fontSize="small"
                          sx={{ color: "primary.main" }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {u.tenantId}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip
                        label="Pendente de Aprovação"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => handleOpenAssign(u)}
                      sx={{ fontWeight: 600 }}
                    >
                      {u.tenantId ? "Alterar Tenant" : "Atribuir Tenant"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Atribuir Tenant */}
      <Dialog
        open={openAssign}
        onClose={() => !submitting && setOpenAssign(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSaveAssign}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Atribuir Organização (Tenant)
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
          >
            <Box
              sx={{
                bgcolor: "grey.50",
                p: 2,
                borderRadius: 2,
                border: "1px solid #E2E8F0",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {selectedUser?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser?.email}
              </Typography>
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <FormControl fullWidth size="medium">
              <InputLabel id="tenant-select-label">Organização</InputLabel>
              <Select
                labelId="tenant-select-label"
                value={selectedTenant}
                label="Organização"
                disabled={submitting}
                onChange={(e) => setSelectedTenant(e.target.value)}
              >
                <MenuItem value="">
                  <em>Nenhuma (Deixar pendente de aprovação)</em>
                </MenuItem>
                {tenants.map((t) => (
                  <MenuItem key={t.name} value={t.name}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {tenants.length === 0 && (
              <Alert severity="warning">
                Nenhuma organização cadastrada. Crie uma organização na página
                de Tenants antes de vincular usuários.
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setOpenAssign(false)}
              disabled={submitting}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={16} />}
              sx={{ fontWeight: 600 }}
            >
              {submitting ? "Salvando..." : "Salvar Atribuição"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
