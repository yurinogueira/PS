import React, { useState, useEffect, useCallback } from "react";
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
  Tooltip,
  TablePagination,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useTranslation } from "react-i18next";
import { adminService } from "../services/admin.service";
import {
  AuditLog,
  AuditLogAction,
  AuditLogEntityType,
} from "../types/admin.types";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";

export const AdminLogsPage: React.FC = () => {
  const { t } = useTranslation();
  useDocumentTitle(t("admin.logs.docTitle", "Logs de Auditoria - Admin"));

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [selectedEntity, setSelectedEntity] = useState<AuditLogEntityType | "">(
    "",
  );
  const [selectedAction, setSelectedAction] = useState<AuditLogAction | "">("");
  const [userIdSearch, setUserIdSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await adminService.getAuditLogs({
        page: page + 1,
        limit: rowsPerPage,
        entityType: selectedEntity || undefined,
        action: selectedAction || undefined,
        userId: userIdSearch.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate
          ? new Date(endDate + "T23:59:59Z").toISOString()
          : undefined,
      });

      setLogs(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
      setErrorMessage(
        t(
          "admin.logs.errorLoad",
          "Não foi possível carregar os logs de auditoria.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    selectedEntity,
    selectedAction,
    userIdSearch,
    startDate,
    endDate,
    t,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setSelectedEntity("");
    setSelectedAction("");
    setUserIdSearch("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const handleOpenDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setOpenModal(true);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
    setOpenModal(false);
  };

  const getActionColor = (
    action: AuditLogAction,
  ): "success" | "info" | "error" | "secondary" | "warning" | "default" => {
    switch (action) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "error";
      case "ROLE_CHANGE":
        return "secondary";
      case "ASSIGN_TENANT":
        return "warning";
      default:
        return "default";
    }
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
          >
            <HistoryRoundedIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t("admin.logs.title", "Logs de Auditoria")}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t(
              "admin.logs.subtitle",
              "Rastreabilidade completa e histórico imutável de todas as mutações do sistema.",
            )}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => loadData()}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {t("admin.logs.refresh", "Atualizar")}
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <CardContent sx={{ py: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              {t("admin.logs.totalRecords", "Total de Registros")}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
              {total}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <CardContent sx={{ py: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              {t("admin.logs.currentPage", "Página Atual")}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
              {page + 1} de {Math.max(1, Math.ceil(total / rowsPerPage))}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
        >
          <CardContent sx={{ py: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase" }}
            >
              {t("admin.logs.pageSize", "Itens por Página")}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
              {rowsPerPage}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t("admin.logs.entityFilter", "Entidade")}</InputLabel>
          <Select
            value={selectedEntity}
            label={t("admin.logs.entityFilter", "Entidade")}
            onChange={(e) => {
              setSelectedEntity(e.target.value as AuditLogEntityType | "");
              setPage(0);
            }}
          >
            <MenuItem value="">
              {t("admin.logs.allEntities", "Todas as Entidades")}
            </MenuItem>
            <MenuItem value="user">
              {t("admin.logs.entities.user", "Usuário")}
            </MenuItem>
            <MenuItem value="tenant">
              {t("admin.logs.entities.tenant", "Organização")}
            </MenuItem>
            <MenuItem value="season">
              {t("admin.logs.entities.season", "Temporada")}
            </MenuItem>
            <MenuItem value="photographer">
              {t("admin.logs.entities.photographer", "Fotógrafo")}
            </MenuItem>
            <MenuItem value="person">
              {t("admin.logs.entities.person", "Pessoa")}
            </MenuItem>
            <MenuItem value="client">
              {t("admin.logs.entities.client", "Cliente")}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t("admin.logs.actionFilter", "Ação")}</InputLabel>
          <Select
            value={selectedAction}
            label={t("admin.logs.actionFilter", "Ação")}
            onChange={(e) => {
              setSelectedAction(e.target.value as AuditLogAction | "");
              setPage(0);
            }}
          >
            <MenuItem value="">
              {t("admin.logs.allActions", "Todas as Ações")}
            </MenuItem>
            <MenuItem value="CREATE">
              {t("admin.logs.actions.CREATE", "CREATE (Criação)")}
            </MenuItem>
            <MenuItem value="UPDATE">
              {t("admin.logs.actions.UPDATE", "UPDATE (Edição)")}
            </MenuItem>
            <MenuItem value="DELETE">
              {t("admin.logs.actions.DELETE", "DELETE (Exclusão)")}
            </MenuItem>
            <MenuItem value="ROLE_CHANGE">
              {t("admin.logs.actions.ROLE_CHANGE", "ROLE_CHANGE (Função)")}
            </MenuItem>
            <MenuItem value="ASSIGN_TENANT">
              {t("admin.logs.actions.ASSIGN_TENANT", "ASSIGN_TENANT (Tenant)")}
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder={t("admin.logs.searchUser", "Buscar executor (ID)...")}
          value={userIdSearch}
          onChange={(e) => {
            setUserIdSearch(e.target.value);
            setPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 200, flexGrow: 1 }}
        />

        <TextField
          size="small"
          label={t("admin.logs.startDate", "Data Inicial")}
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(0);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
          label={t("admin.logs.endDate", "Data Final")}
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(0);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 140 }}
        />

        {(selectedEntity ||
          selectedAction ||
          userIdSearch ||
          startDate ||
          endDate) && (
          <Button
            size="small"
            color="inherit"
            startIcon={<FilterAltOffRoundedIcon />}
            onClick={handleClearFilters}
          >
            {t("admin.logs.clearFilters", "Limpar")}
          </Button>
        )}
      </Paper>

      {/* Messages */}
      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("admin.logs.columns.date", "Data / Hora")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("admin.logs.columns.user", "Usuário Executor")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("admin.logs.columns.action", "Ação")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("admin.logs.columns.entity", "Entidade Afetada")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("admin.logs.columns.tenant", "Organização")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  {t("admin.logs.columns.details", "Detalhes")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {t(
                        "admin.logs.loading",
                        "Carregando logs de auditoria...",
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {t(
                        "admin.logs.noLogsFound",
                        "Nenhum log de auditoria encontrado",
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {t(
                        "admin.logs.noLogsHint",
                        "Tente ajustar ou limpar os filtros de busca.",
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.userEmail || t("admin.logs.system", "Sistema")}
                      </Typography>
                      {log.userId && (
                        <Tooltip title={log.userId}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ cursor: "pointer" }}
                          >
                            ID: {log.userId.slice(0, 8)}...
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={getActionColor(log.action)}
                        sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={log.entityType}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "capitalize", fontWeight: 600 }}
                        />
                        <Tooltip title={log.entityId}>
                          <Typography variant="caption" color="text.secondary">
                            #{log.entityId.slice(0, 10)}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>

                    <TableCell>
                      {log.tenantId ? (
                        <Typography variant="body2">{log.tenantId}</Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          {t("admin.logs.globalScope", "Global")}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityRoundedIcon />}
                        onClick={() => handleOpenDetails(log)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        {t("admin.logs.viewChanges", "Ver Alterações")} (
                        {log.changes?.length || 0})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage={t("admin.logs.rowsPerPage", "Linhas por página:")}
        />
      </Paper>

      {/* Changes Details Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryRoundedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("admin.logs.modal.title", "Detalhes da Alteração")}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDetails} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {selectedLog && (
            <Box>
              {/* Meta Summary */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                  gap: 1.5,
                  p: 2,
                  mb: 2.5,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("admin.logs.modal.action", "Ação")}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedLog.action}
                      size="small"
                      color={getActionColor(selectedLog.action)}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("admin.logs.modal.entity", "Entidade")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      textTransform: "capitalize",
                      fontWeight: 600,
                    }}
                  >
                    {selectedLog.entityType} (#{selectedLog.entityId})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("admin.logs.modal.user", "Executor")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                    {selectedLog.userEmail || "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("admin.logs.modal.date", "Data / Hora")}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Diff Table */}
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                {t("admin.logs.modal.diffTitle", "Campos Alterados (Diff):")}
              </Typography>

              {!selectedLog.changes || selectedLog.changes.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  {t(
                    "admin.logs.modal.noChangesRecorded",
                    "Nenhuma modificação detalhada de campo registrada.",
                  )}
                </Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell sx={{ fontWeight: 700, width: "30%" }}>
                          {t("admin.logs.modal.field", "Campo")}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "35%" }}>
                          {t("admin.logs.modal.oldValue", "Valor Anterior")}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, width: "35%" }}>
                          {t("admin.logs.modal.newValue", "Novo Valor")}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedLog.changes.map((change, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell
                            sx={{ fontFamily: "monospace", fontWeight: 600 }}
                          >
                            {change.fieldChanged}
                          </TableCell>
                          <TableCell
                            sx={{
                              color:
                                change.oldValue === null
                                  ? "text.disabled"
                                  : "error.main",
                              fontFamily: "monospace",
                            }}
                          >
                            {formatValue(change.oldValue)}
                          </TableCell>
                          <TableCell
                            sx={{
                              color:
                                change.newValue === null
                                  ? "text.disabled"
                                  : "success.main",
                              fontFamily: "monospace",
                            }}
                          >
                            {formatValue(change.newValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDetails}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            {t("shared.close", "Fechar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
