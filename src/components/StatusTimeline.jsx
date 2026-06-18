import React from "react";
import { Box, Typography } from "@mui/material";

const STATUS_COLOR = {
  Applied: "var(--st-applied)",
  Interviewing: "var(--st-interviewing)",
  Offer: "var(--st-offer)",
  Rejected: "var(--st-rejected)",
};

function StatusTimeline({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <Box>
      <Typography
        sx={{
          color: "var(--muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "11px",
          display: "block",
          mb: 1.5,
        }}
      >
        Application Timeline
      </Typography>

      {history.map((entry, i) => {
        const color = STATUS_COLOR[entry.status] || "var(--primary)";
        const isLast = i === history.length - 1;

        return (
          <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, position: "relative" }}>
            {!isLast && (
              <Box
                sx={{
                  position: "absolute",
                  left: "7px",
                  top: "18px",
                  width: "2px",
                  bottom: "-4px",
                  background: "var(--card-border)",
                  zIndex: 0,
                }}
              />
            )}

            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
                mt: "3px",
                boxShadow: `0 0 0 3px ${color}33`,
                zIndex: 1,
              }}
            />

            <Box sx={{ pb: isLast ? 0 : 2.5 }}>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--fg)",
                  lineHeight: 1.3,
                }}
              >
                {entry.status}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  mt: "2px",
                }}
              >
                {entry.date}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default StatusTimeline;
