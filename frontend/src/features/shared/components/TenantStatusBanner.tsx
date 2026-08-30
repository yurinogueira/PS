import { Alert, Box, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTenantStore } from "../../../store/tenantStore";

export const TenantStatusBanner = () => {
  const { tenantStatus } = useTenantStore();

  if (!tenantStatus) {
    return null;
  }

  // 1. Block: Unpaid
  if (tenantStatus.isUnpaid || tenantStatus.paymentStatus === "unpaid") {
    return (
      <Box sx={{ mb: 2.5 }}>
        <Alert
          severity="error"
          icon={<ErrorOutlineRoundedIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "error.light",
            fontWeight: 500,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Acesso suspenso por pendência de pagamento da assinatura. Entre em
            contato com o suporte para regularizar.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // 2. Block: Free Trial Expired
  if (tenantStatus.isTrialExpired) {
    return (
      <Box sx={{ mb: 2.5 }}>
        <Alert
          severity="error"
          icon={<ErrorOutlineRoundedIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "error.light",
            fontWeight: 500,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            O período de teste gratuito de 14 dias da sua organização encerrou.
            A edição de clientes e exportação de relatórios estão bloqueadas.
            Entre em contato com o suporte para assinar um plano.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // 3. Block: Client Quota Limit Exceeded (>= 300 clients in an event)
  if (tenantStatus.clientLimitExceeded) {
    return (
      <Box sx={{ mb: 2.5 }}>
        <Alert
          severity="warning"
          icon={<WarningRoundedIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "warning.light",
            fontWeight: 500,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            A sua organização excedeu o limite de clientes cadastrados no plano
            atual. A criação de novos eventos e a exportação de relatórios estão
            suspensas. Entre em contato com o suporte para regularizar.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // 4. Info: Free Trial Active
  if (tenantStatus.plan === "free" && !tenantStatus.isTrialExpired) {
    const days = tenantStatus.trialDaysRemaining;
    const daysText = days === 1 ? "resta 1 dia" : `restam ${days} dias`;
    return (
      <Box sx={{ mb: 2.5 }}>
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "info.light",
            fontWeight: 500,
          }}
        >
          <Typography variant="body2">
            Período de teste gratuito ativo: <strong>{daysText}</strong> de
            teste.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return null;
};
