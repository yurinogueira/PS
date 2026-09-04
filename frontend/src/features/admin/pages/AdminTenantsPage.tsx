import { useState, useEffect, useCallback } from "react";
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
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useTranslation } from "react-i18next";
import { adminService } from "../services/admin.service";
import { Tenant } from "../types/admin.types";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export const AdminTenantsPage = () => {
  const { t } = useTranslation();
  useDocumentTitle(t("admin.tenants.docTitle"));

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
  const [createHideOverviewByDefault, setCreateHideOverviewByDefault] =
    useState(false);

  // Plan Edit Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState<"free" | "standard">("free");

  // Payment Status Edit Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<"paid" | "unpaid">(
    "paid",
  );

  // Settings Edit Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [newHideOverviewByDefault, setNewHideOverviewByDefault] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getTenants();
      setTenants(data || []);
    } catch (err) {
      console.error("Erro ao carregar tenants:", err);
      setErrorMessage(t("admin.tenants.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleOpenCreate = () => {
    setTenantName("");
    setCreatePlan("free");
    setCreatePaymentStatus("paid");
    setCreateHideOverviewByDefault(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setOpenCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tenantName.trim();
    if (!clean) return;

    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      setErrorMessage(t("admin.tenants.invalidName"));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await adminService.createTenant({
        name: clean,
        plan: createPlan,
        paymentStatus: createPaymentStatus,
        hideOverviewByDefault: createHideOverviewByDefault,
      });
      setSuccessMessage(t("admin.tenants.successCreate"));
      setOpenCreate(false);
      setTenantName("");
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message || t("admin.tenants.errorCreate"),
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
        t("admin.tenants.planUpdated", { name: selectedTenant.name }),
      );
      setPlanModalOpen(false);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message || t("admin.tenants.errorLoad"),
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
        t("admin.tenants.paymentUpdated", { name: selectedTenant.name }),
      );
      setPaymentModalOpen(false);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message || t("admin.tenants.errorLoad"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSettingsModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setNewHideOverviewByDefault(
      Boolean(tenant.settings?.hideOverviewByDefault),
    );
    setSettingsModalOpen(true);
  };

  const handleUpdateSettings = async () => {
    if (!selectedTenant) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await adminService.updateTenantSettings(selectedTenant.name, {
        hideOverviewByDefault: newHideOverviewByDefault,
      });
      setSuccessMessage(
        t("admin.tenants.settingsUpdated", { name: selectedTenant.name }),
      );
      setSettingsModalOpen(false);
      await loadTenants();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        error.response?.data?.message || t("admin.tenants.errorSettings"),
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
    <Box sx={{ width: "100%" }}>
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
            {t("admin.tenants.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("admin.tenants.subtitle")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}
        >
          {t("admin.tenants.add")}
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
              {t("admin.tenants.totalTenants")}
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
          placeholder={t("admin.tenants.searchPlaceholder")}
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
                {t("admin.tenants.columns.name")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("admin.tenants.columns.plan")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("admin.tenants.columns.payment")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("admin.tenants.visibilityOverview")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("admin.tenants.columns.trial")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {t("admin.tenants.creationDate")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "right" }}>
                {t("admin.tenants.columns.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {t("admin.tenants.loading")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <BusinessRoundedIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {t("admin.tenants.noData")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? t("admin.tenants.searchRefine")
                      : t("admin.tenants.emptyCreateFirst")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tItem) => {
                const isFree = (tItem.plan || "free") === "free";
                const isPaid = (tItem.paymentStatus || "paid") === "paid";
                const isHiddenByDefault = Boolean(
                  tItem.settings?.hideOverviewByDefault,
                );
                const expiresAt = tItem.planExpiresAt
                  ? new Date(tItem.planExpiresAt)
                  : null;
                const isExpired =
                  isFree && expiresAt && expiresAt.getTime() < now;

                return (
                  <TableRow key={tItem.name} hover>
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
                          {tItem.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          isFree
                            ? t("admin.tenants.plans.free")
                            : t("admin.tenants.plans.standard")
                        }
                        size="small"
                        color={isFree ? "default" : "primary"}
                        variant={isFree ? "outlined" : "filled"}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          isPaid
                            ? t("admin.tenants.payment.paid")
                            : t("admin.tenants.payment.unpaid")
                        }
                        size="small"
                        color={isPaid ? "success" : "error"}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          isHiddenByDefault
                            ? t("admin.tenants.hiddenByDefault")
                            : t("admin.tenants.expandedByDefault")
                        }
                        size="small"
                        color={isHiddenByDefault ? "default" : "info"}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {isFree
                          ? expiresAt
                            ? `${expiresAt.toLocaleDateString("pt-BR")} ${isExpired ? `(${t("admin.tenants.trial.expired")})` : ""}`
                            : "14 dias (Trial)"
                          : t("admin.tenants.noExpiration")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tItem.createdAt
                          ? new Date(tItem.createdAt).toLocaleDateString(
                              "pt-BR",
                            )
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
                        <Tooltip title={t("admin.tenants.actions.settings")}>
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => handleOpenSettingsModal(tItem)}
                          >
                            <SettingsRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("admin.tenants.actions.changePlan")}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenPlanModal(tItem)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={t("admin.tenants.actions.changePayment")}
                        >
                          <IconButton
                            size="small"
                            color={isPaid ? "default" : "error"}
                            onClick={() => handleOpenPaymentModal(tItem)}
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
            {t("admin.tenants.createModal.title")}
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
          >
            <Alert
              icon={<InfoOutlinedIcon fontSize="inherit" />}
              severity="info"
            >
              {t("admin.tenants.uniqueKeyWarning")}
            </Alert>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              label={t("admin.tenants.createModal.name")}
              placeholder="ex: studio-fotografico"
              fullWidth
              required
              autoFocus
              disabled={submitting}
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value.toLowerCase())}
              helperText={t("admin.tenants.nameHelper")}
            />

            <FormControl fullWidth size="small">
              <InputLabel>
                {t("admin.tenants.createModal.initialPlan")}
              </InputLabel>
              <Select
                value={createPlan}
                label={t("admin.tenants.createModal.initialPlan")}
                onChange={(e) =>
                  setCreatePlan(e.target.value as "free" | "standard")
                }
                disabled={submitting}
              >
                <MenuItem value="free">
                  {t("admin.tenants.createModal.freePlan")}
                </MenuItem>
                <MenuItem value="standard">
                  {t("admin.tenants.createModal.standardPlan")}
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>
                {t("admin.tenants.createModal.paymentStatus")}
              </InputLabel>
              <Select
                value={createPaymentStatus}
                label={t("admin.tenants.createModal.paymentStatus")}
                onChange={(e) =>
                  setCreatePaymentStatus(e.target.value as "paid" | "unpaid")
                }
                disabled={submitting}
              >
                <MenuItem value="paid">
                  {t("admin.tenants.createModal.paid")}
                </MenuItem>
                <MenuItem value="unpaid">
                  {t("admin.tenants.createModal.unpaid")}
                </MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={createHideOverviewByDefault}
                  onChange={(e) =>
                    setCreateHideOverviewByDefault(e.target.checked)
                  }
                  disabled={submitting}
                />
              }
              label={t("admin.tenants.createModal.hideOverview")}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setOpenCreate(false)}
              disabled={submitting}
              color="inherit"
            >
              {t("admin.tenants.createModal.cancel")}
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
              {submitting
                ? t("admin.tenants.createModal.creating")
                : t("admin.tenants.createModal.create")}
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
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("admin.tenants.planModal.title")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("admin.tenants.planModal.organization")}
            <strong>{selectedTenant?.name}</strong>
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>{t("admin.tenants.planModal.plan")}</InputLabel>
            <Select
              value={newPlan}
              label={t("admin.tenants.planModal.plan")}
              onChange={(e) =>
                setNewPlan(e.target.value as "free" | "standard")
              }
              disabled={submitting}
            >
              <MenuItem value="free">
                {t("admin.tenants.planModal.freeRestart")}
              </MenuItem>
              <MenuItem value="standard">
                {t("admin.tenants.planModal.standard")}
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setPlanModalOpen(false)}
            disabled={submitting}
            color="inherit"
          >
            {t("admin.tenants.planModal.cancel")}
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
            {submitting
              ? t("admin.tenants.planModal.saving")
              : t("admin.tenants.planModal.save")}
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
          {t("admin.tenants.paymentModal.title")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("admin.tenants.paymentModal.organization")}
            <strong>{selectedTenant?.name}</strong>
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>{t("admin.tenants.paymentModal.status")}</InputLabel>
            <Select
              value={newPaymentStatus}
              label={t("admin.tenants.paymentModal.status")}
              onChange={(e) =>
                setNewPaymentStatus(e.target.value as "paid" | "unpaid")
              }
              disabled={submitting}
            >
              <MenuItem value="paid">
                {t("admin.tenants.paymentModal.paidStatus")}
              </MenuItem>
              <MenuItem value="unpaid">
                {t("admin.tenants.paymentModal.unpaidStatus")}
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
            {t("admin.tenants.paymentModal.cancel")}
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
            {submitting
              ? t("admin.tenants.paymentModal.saving")
              : t("admin.tenants.paymentModal.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Alterar Configurações */}
      <Dialog
        open={settingsModalOpen}
        onClose={() => !submitting && setSettingsModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("admin.tenants.settingsModal.title")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("admin.tenants.settingsModal.organization")}
            <strong>{selectedTenant?.name}</strong>
          </Typography>

          <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
            {t("admin.tenants.settingsModal.info")}
          </Alert>

          <FormControlLabel
            control={
              <Switch
                checked={newHideOverviewByDefault}
                onChange={(e) => setNewHideOverviewByDefault(e.target.checked)}
                disabled={submitting}
              />
            }
            label={t("admin.tenants.settingsModal.hideOverview")}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setSettingsModalOpen(false)}
            disabled={submitting}
            color="inherit"
          >
            {t("admin.tenants.settingsModal.cancel")}
          </Button>
          <Button
            onClick={handleUpdateSettings}
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} />
              ) : (
                <SettingsRoundedIcon />
              )
            }
            sx={{ fontWeight: 600 }}
          >
            {submitting
              ? t("admin.tenants.settingsModal.saving")
              : t("admin.tenants.settingsModal.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
