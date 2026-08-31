import { useTranslation } from "react-i18next";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";

interface LanguageSelectorProps {
  /** "default" = outlined Select (Topbar); "auth" = compact for auth pages */
  variant?: "default" | "auth";
}

const LANGUAGES = [
  { code: "pt-BR", label: "PT-BR" },
  { code: "en-US", label: "EN-US" },
] as const;

export function LanguageSelector({
  variant = "default",
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <Tooltip title={t("language.select")}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Select
          value={
            i18n.language in { "pt-BR": 1, "en-US": 1 }
              ? i18n.language
              : "pt-BR"
          }
          onChange={handleChange}
          size="small"
          variant="outlined"
          inputProps={{ "aria-label": t("language.select") }}
          renderValue={(val) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LanguageIcon sx={{ fontSize: 16 }} />
              <span>{LANGUAGES.find((l) => l.code === val)?.label ?? val}</span>
            </Box>
          )}
          sx={{
            fontSize: "0.8rem",
            fontWeight: 600,
            minWidth: variant === "auth" ? 90 : 100,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "divider",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
            "& .MuiSelect-select": {
              py: 0.6,
              px: 1,
            },
          }}
        >
          {LANGUAGES.map((lang) => (
            <MenuItem
              key={lang.code}
              value={lang.code}
              sx={{ fontSize: "0.875rem" }}
            >
              {lang.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Tooltip>
  );
}
