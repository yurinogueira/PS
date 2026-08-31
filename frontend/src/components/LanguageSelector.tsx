import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import { BrazilFlag } from "./flags/BrazilFlag";
import { USAFlag } from "./flags/USAFlag";

interface LanguageSelectorProps {
  /** "default" = outlined Select (Topbar); "auth" = compact for auth pages */
  variant?: "default" | "auth";
}

interface LanguageOption {
  code: "pt-BR" | "en-US";
  label: string;
  flag: ReactNode;
}

const LANGUAGES: readonly LanguageOption[] = [
  { code: "pt-BR", label: "PT-BR", flag: <BrazilFlag /> },
  { code: "en-US", label: "EN-US", flag: <USAFlag /> },
] as const;

export function LanguageSelector({
  variant = "default",
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  const currentLanguageCode =
    i18n.language in { "pt-BR": 1, "en-US": 1 } ? i18n.language : "pt-BR";

  return (
    <Tooltip title={t("language.select")}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Select
          value={currentLanguageCode}
          onChange={handleChange}
          size="small"
          variant="outlined"
          inputProps={{ "aria-label": t("language.select") }}
          renderValue={(val) => {
            const selected =
              LANGUAGES.find((l) => l.code === val) ?? LANGUAGES[0];
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {selected.flag}
                <span>{selected.label}</span>
              </Box>
            );
          }}
          sx={{
            fontSize: "0.8rem",
            fontWeight: 600,
            minWidth: variant === "auth" ? 100 : 110,
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
              sx={{
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {lang.flag}
              <span>{lang.label}</span>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Tooltip>
  );
}
