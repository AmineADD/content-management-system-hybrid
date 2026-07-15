"use client";

import { useEffect, useState } from "react";
import { Box, Chip, CircularProgress, Link, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface InspectionResult {
  verdict?: string;
  coverageState?: string;
  robotsTxtState?: string;
  indexingState?: string;
  lastCrawlTime?: string;
  googleCanonical?: string;
  reportUrl?: string;
  error?: string;
}

interface IndexStatusProps {
  url: string;
}

function formatCrawlTime(value: string): string {
  if (!value) return "never crawled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `last crawl ${parsed.toLocaleDateString()}`;
}

export function IndexStatus({ url }: IndexStatusProps) {
  // Keyed by url so the answer for a previous row never shows against this one.
  const [entry, setEntry] = useState<{
    url: string;
    result: InspectionResult;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/gsc?url=${encodeURIComponent(url)}`)
      .then((response) => response.json())
      .then((result: InspectionResult) => {
        if (!cancelled) setEntry({ url, result });
      })
      .catch(() => {
        if (!cancelled) {
          setEntry({ url, result: { error: "Index check failed." } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const result = entry?.url === url ? entry.result : null;
  const isLoading = result === null;
  const indexed = result?.verdict === "PASS";
  const label = isLoading
    ? "Checking Google index…"
    : result?.error
      ? "Index status unavailable"
      : indexed
        ? "Indexed by Google"
        : `Not indexed${result?.coverageState ? ` — ${result.coverageState}` : ""}`;

  const tooltip = result?.error
    ? result.error
    : [
        result?.coverageState,
        formatCrawlTime(result?.lastCrawlTime ?? ""),
        result?.googleCanonical && result.googleCanonical !== url
          ? `Google canonical: ${result.googleCanonical}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 2 }}
    >
      <Tooltip title={isLoading ? "" : tooltip}>
        <Chip
          size="small"
          variant="outlined"
          color={isLoading || result?.error ? "default" : indexed ? "success" : "warning"}
          icon={
            isLoading ? (
              <CircularProgress size={12} sx={{ ml: 1 }} />
            ) : indexed ? (
              <CheckCircleIcon />
            ) : (
              <ErrorOutlineIcon />
            )
          }
          label={label}
        />
      </Tooltip>

      <Link
        href={url}
        target="_blank"
        rel="noreferrer"
        variant="caption"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}
      >
        {url.replace(/^https:\/\//, "")}
        <OpenInNewIcon sx={{ fontSize: 12 }} />
      </Link>

      {result?.reportUrl && (
        <Link
          href={result.reportUrl}
          target="_blank"
          rel="noreferrer"
          variant="caption"
        >
          Open in Search Console
        </Link>
      )}
    </Box>
  );
}
