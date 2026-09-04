import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { useTranslation } from "react-i18next";
import { DynamicPaymentParams } from "../../../services/api/report.service";

interface DynamicExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (params: DynamicPaymentParams) => Promise<void>;
  seasonId?: string;
  seasonName?: string;
}

const AVAILABLE_PAYMENT_METHODS = [
  "Dinheiro",
  "Pix",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Transferência",
];

export const DynamicExportDialog: React.FC<DynamicExportDialogProps> = ({
  open,
  onClose,
  onExport,
  seasonId,
  seasonName,
}) => {
  const { t } = useTranslation();
  const [paidStatus, setPaidStatus] = useState<"all" | "paid" | "unpaid">(
    "paid",
  );
  const [allMethods, setAllMethods] = useState(true);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleMethod = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  };

  const handleSelectAllMethods = () => {
    if (selectedMethods.length === AVAILABLE_PAYMENT_METHODS.length) {
      setSelectedMethods([]);
    } else {
      setSelectedMethods([...AVAILABLE_PAYMENT_METHODS]);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (paidStatus === "paid" && !allMethods && selectedMethods.length === 0) {
      setError(
        "Selecione ao menos um método de pagamento ou marque a opção para considerar todos.",
      );
      return;
    }

    setLoading(true);
    try {
      const params: DynamicPaymentParams = {
        season_id: seasonId || undefined,
        paid_status: paidStatus,
        payment_methods:
          paidStatus === "paid" && !allMethods ? selectedMethods : undefined,
      };
      await onExport(params);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Falha ao iniciar exportação dinâmica.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FilterListRoundedIcon color="primary" />
        {t("exports.dynamicDialog.title")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("exports.dynamicDialog.description")}
        </Typography>

        {seasonName && (
          <Box
            sx={{
              p: 1.5,
              mb: 2.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t("exports.table.season")}:
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {seasonName}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
            {t("exports.dynamicDialog.paidStatusLabel")}
          </FormLabel>
          <RadioGroup
            value={paidStatus}
            onChange={(e) =>
              setPaidStatus(e.target.value as "all" | "paid" | "unpaid")
            }
          >
            <FormControlLabel
              value="paid"
              control={<Radio size="small" />}
              label={t("exports.dynamicDialog.paidStatusPaid")}
            />
            <FormControlLabel
              value="unpaid"
              control={<Radio size="small" />}
              label={t("exports.dynamicDialog.paidStatusUnpaid")}
            />
            <FormControlLabel
              value="all"
              control={<Radio size="small" />}
              label={t("exports.dynamicDialog.paidStatusAll")}
            />
          </RadioGroup>
        </FormControl>

        {paidStatus === "paid" && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600 }}
              gutterBottom
            >
              {t("exports.dynamicDialog.paymentMethodsLabel")}
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={allMethods}
                  onChange={(e) => setAllMethods(e.target.checked)}
                  size="small"
                />
              }
              label={t("exports.dynamicDialog.allMethods")}
              sx={{ mb: 1 }}
            />

            {!allMethods && (
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {t("exports.dynamicDialog.methodsHint")}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleSelectAllMethods}
                  >
                    {selectedMethods.length === AVAILABLE_PAYMENT_METHODS.length
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </Button>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {AVAILABLE_PAYMENT_METHODS.map((method) => {
                    const selected = selectedMethods.includes(method);
                    return (
                      <Chip
                        key={method}
                        label={method}
                        clickable
                        color={selected ? "primary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        onClick={() => handleToggleMethod(method)}
                        size="medium"
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {t("exports.dynamicDialog.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          {loading
            ? t("exports.dynamicDialog.exporting")
            : t("exports.dynamicDialog.startExport")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
