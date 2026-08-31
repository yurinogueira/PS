import { Box, BoxProps } from "@mui/material";

export function USAFlag({ sx, ...props }: BoxProps<"svg">) {
  return (
    <Box
      component="svg"
      viewBox="0 0 640 480"
      aria-hidden="true"
      data-testid="usa-flag"
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
      {/* 13 red and white stripes */}
      <path fill="#bd3d44" d="M0 0h640v480H0z" />
      <path
        stroke="#fff"
        strokeWidth="36.92"
        d="M0 55.38h640M0 129.23h640M0 203.08h640M0 276.92h640M0 350.77h640M0 424.62h640"
      />
      {/* Blue canton */}
      <path fill="#192f5d" d="M0 0h256v258.5H0z" />
      {/* 50 Stars Grid */}
      <g fill="#fff">
        {[
          // Row 1 (6 stars)
          [21.3, 26],
          [64, 26],
          [106.7, 26],
          [149.3, 26],
          [192, 26],
          [234.7, 26],
          // Row 2 (5 stars)
          [42.7, 52],
          [85.3, 52],
          [128, 52],
          [170.7, 52],
          [213.3, 52],
          // Row 3 (6 stars)
          [21.3, 78],
          [64, 78],
          [106.7, 78],
          [149.3, 78],
          [192, 78],
          [234.7, 78],
          // Row 4 (5 stars)
          [42.7, 104],
          [85.3, 104],
          [128, 104],
          [170.7, 104],
          [213.3, 104],
          // Row 5 (6 stars)
          [21.3, 130],
          [64, 130],
          [106.7, 130],
          [149.3, 130],
          [192, 130],
          [234.7, 130],
          // Row 6 (5 stars)
          [42.7, 156],
          [85.3, 156],
          [128, 156],
          [170.7, 156],
          [213.3, 156],
          // Row 7 (6 stars)
          [21.3, 182],
          [64, 182],
          [106.7, 182],
          [149.3, 182],
          [192, 182],
          [234.7, 182],
          // Row 8 (5 stars)
          [42.7, 208],
          [85.3, 208],
          [128, 208],
          [170.7, 208],
          [213.3, 208],
          // Row 9 (6 stars)
          [21.3, 234],
          [64, 234],
          [106.7, 234],
          [149.3, 234],
          [192, 234],
          [234.7, 234],
        ].map(([cx, cy], idx) => (
          <polygon
            key={idx}
            points={`${cx},${cy - 8} ${cx + 2.4},${cy - 2.5} ${cx + 8},${cy - 2.5} ${cx + 3.6},${cy + 1.2} ${cx + 5.2},${cy + 7} ${cx},${cy + 3.2} ${cx - 5.2},${cy + 7} ${cx - 3.6},${cy + 1.2} ${cx - 8},${cy - 2.5} ${cx - 2.4},${cy - 2.5}`}
          />
        ))}
      </g>
    </Box>
  );
}
