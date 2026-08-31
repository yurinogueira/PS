import { Alert, Box, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";
import { useTenantStore } from "../../../store/tenantStore";

export const TenantStatusBanner = () => {
  const { t } = useTranslation();
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
            {t("shared.tenantBanner.unpaid")}
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
            {t("shared.tenantBanner.trialExpired")}
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
            {t("shared.tenantBanner.clientLimitExceeded")}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // 4. Info: Free Trial Active
  if (tenantStatus.plan === "free" && !tenantStatus.isTrialExpired) {
    const days = tenantStatus.trialDaysRemaining;
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
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: t("shared.tenantBanner.trialActive", { count: days }),
            }}
          />
        </Alert>
      </Box>
    );
  }

  return null;
};
