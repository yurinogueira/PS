import { Box, BoxProps } from "@mui/material";

export function BrazilFlag({ sx, ...props }: BoxProps<"svg">) {
  return (
    <Box
      component="svg"
      viewBox="0 0 640 480"
      aria-hidden="true"
      data-testid="brazil-flag"
      sx={{
        width: 18,
        height: 13,
        borderRadius: "2px",
        display: "inline-block",
        flexShrink: 0,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
        overflow: "hidden",
        verticalAlign: "middle",
        ...sx,
      }}
      {...props}
    >
      <path fill="#009b3a" d="M0 0h640v480H0z" />
      <path fill="#fedf00" d="M640 240L320 448 0 240 320 32l320 208z" />
      <circle cx="320" cy="240" r="105" fill="#002776" />
      <path
        fill="#fff"
        d="M228 274a105 105 0 0 0 185-70 106 106 0 0 1-185 70z"
      />
    </Box>
  );
}
