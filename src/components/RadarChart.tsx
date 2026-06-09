import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { PersonAnalysis } from "../types";

interface RadarChartProps {
  person: PersonAnalysis;
  color: string;
  theme?: "dark" | "light";
}

export default function RadarChart({ person, color, theme = "dark" }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const isLightMode = theme === "light";
    const angleLinesColor = isLightMode ? "#cbd5e1" : "#2a2a2a";
    const gridColor = isLightMode ? "#e2e8f0" : "#1d1d1d";
    const labelColor = isLightMode ? "#475569" : "#9ca3af";
    const tooltipBg = isLightMode ? "#f8fafc" : "#161616";
    const tooltipBorder = isLightMode ? "#cbd5e1" : "#2a2a2a";
    const tooltipTextColor = isLightMode ? "#0f172a" : "#ffffff";

    // Capitalize trait names for labels
    const labels = ["Toxicity", "Ego", "Attitude", "Love", "Hate", "Humor", "Coldness", "Dominance"];
    const traits = ["toxicity", "ego", "attitude", "love", "hate", "humor", "coldness", "dominance"] as const;
    const data = traits.map((t) => person.scores[t]);

    // Create chart
    chartInstanceRef.current = new Chart(ctx, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: person.name,
            data,
            backgroundColor: `${color}25`, // 15% opacity
            borderColor: color,
            borderWidth: 2,
            pointBackgroundColor: color,
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: color,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // We render the legend custom in HTML
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: tooltipTextColor,
            bodyColor: tooltipTextColor,
            titleFont: { family: "Space Grotesk", size: 13, weight: "bold" },
            bodyFont: { family: "Inter", size: 12 },
            borderColor: tooltipBorder,
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw}%`,
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
  }, [person, color, theme]);

  return (
    <div className="w-full h-64 md:h-72 relative">
      <canvas ref={canvasRef} id={`radar-chart-${person.name.replace(/\s+/g, "-")}`} />
    </div>
  );
}
