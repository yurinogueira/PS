import React from "react";
import { TablePagination, TablePaginationProps } from "@mui/material";
import { useTranslation } from "react-i18next";

export type AppTablePaginationProps = Omit<
  TablePaginationProps,
  "labelRowsPerPage" | "labelDisplayedRows"
> & {
  labelRowsPerPage?: React.ReactNode;
  labelDisplayedRows?: TablePaginationProps["labelDisplayedRows"];
};

export const AppTablePagination: React.FC<AppTablePaginationProps> = ({
  rowsPerPageOptions = [10, 25, 50],
  rowsPerPage = 10,
  component = "div",
  sx,
  ...rest
}) => {
  const { t } = useTranslation();

  return (
    <TablePagination
      component={component}
      rowsPerPageOptions={rowsPerPageOptions}
      rowsPerPage={rowsPerPage}
      labelRowsPerPage={rest.labelRowsPerPage ?? t("tables.rowsPerPage")}
      labelDisplayedRows={
        rest.labelDisplayedRows ??
        (({ from, to, count }) =>
          t("tables.displayedRows", {
            from,
            to,
            count: count !== -1 ? count : `>${to}`,
          }))
      }
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        "& .MuiTablePagination-toolbar": {
          flexWrap: "wrap",
          justifyContent: { xs: "center", sm: "space-between" },
          gap: 1,
          py: 1,
          px: { xs: 1, sm: 2 },
        },
        "& .MuiTablePagination-actions": {
          ml: { xs: 0, sm: 2 },
        },
        ...sx,
      }}
      {...rest}
    />
  );
};
