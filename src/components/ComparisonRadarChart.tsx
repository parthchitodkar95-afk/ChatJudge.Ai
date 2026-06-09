import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { PersonAnalysis } from "../types";

interface ComparisonRadarChartProps {
  persons: PersonAnalysis[];
  colorMap: { [key: string]: string };
  theme?: "dark" | "light";
}

export default function ComparisonRadarChart({ persons, colorMap, theme = "dark" }: ComparisonRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || persons.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const isLightMode = theme === "light";
    const angleLinesColor = isLightMode ? "#cbd5e1" : "#2a2a2a";
    const gridColor = isLightMode ? "#e2e8f0" : "#1d1d1d";
    const labelColor = isLightMode ? "#475569" : "#9ca3af";
    const legendColor = isLightMode ? "#0f172a" : "#f3f4f6";
    const tooltipBg = isLightMode ? "#f8fafc" : "#161616";
    const tooltipBorder = isLightMode ? "#cbd5e1" : "#2a2a2a";
    const tooltipTextColor = isLightMode ? "#0f172a" : "#ffffff";

    const labels = ["Toxicity", "Ego", "Attitude", "Love", "Hate", "Humor", "Coldness", "Dominance"];
    const traits = ["toxicity", "ego", "attitude", "love", "hate", "humor", "coldness", "dominance"] as const;

    const datasets = persons.map((p) => {
      const color = colorMap[p.name] || "#FF4444";
      const data = traits.map((t) => p.scores[t]);
      return {
        label: p.name,
        data,
        backgroundColor: `${color}15`, // ultra transparent
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: "radar",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: legendColor,
              font: {
                family: "Space Grotesk",
                size: 12,
                weight: "bold",
              },
              padding: 15,
            },
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: tooltipTextColor,
            bodyColor: tooltipTextColor,
            titleFont: { family: "Space Grotesk", size: 13, weight: "bold" },
            bodyFont: { family: "Inter", size: 12 },
            borderColor: tooltipBorder,
            borderWidth: 1,
            displayColors: true,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.raw}%`,
            },
          },
        },
        scales: {
          r: {
            angleLines: {
              color: angleLinesColor,
            },
            grid: {
              color: gridColor,
            },
            pointLabels: {
              color: labelColor,
              font: {
                family: "Space Grotesk",
                size: 11,
                weight: "bold",
              },
            },
            ticks: {
              backdropColor: "transparent",
              color: isLightMode ? "#64748b" : "#4b5563",
              font: {
                family: "Inter",
                size: 9,
              },
              stepSize: 20,
            },
            min: 0,
            max: 100,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [persons, colorMap]);

  return (
    <div className="w-full h-80 md:h-96 relative">
      <canvas ref={canvasRef} id="comparison-radar-chart" />
    </div>
  );
}
