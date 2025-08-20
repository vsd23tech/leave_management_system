/* ==========================================================================
   Dashboard JS – KPI rendering + Chart.js theming
   - Loads JSON data (KPIs, chart datasets)
   - Renders KPIs, tables
   - Applies theme-aware Chart.js styling via CSS variables
   - Listens to 'lms:themechange' to update chart colors dynamically
   ========================================================================== */

(function () {
    const charts = [];

    // --- Read CSS variable ---------------------------------------------------
    const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    // --- Build Chart.js default options from CSS vars ------------------------
    const getChartTheme = () => ({
        color: cssVar("--chart-axis"),
        borderColor: cssVar("--chart-grid"),
        tooltip: {
            backgroundColor: cssVar("--chart-tooltip-bg"),
            titleColor: cssVar("--chart-tooltip-fg"),
            bodyColor: cssVar("--chart-tooltip-fg"),
        },
        legend: {
            labels: { color: cssVar("--chart-legend-fg") }
        }
    });

    // --- Initialize charts ---------------------------------------------------
    const initCharts = (data) => {
        const ctx1 = document.getElementById("chartLeaveTypes");
        if (ctx1) {
            charts.push(
                new Chart(ctx1, {
                    type: "pie",
                    data: data.leaveTypes,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: getChartTheme().legend,
                            tooltip: getChartTheme().tooltip,
                        }
                    }
                })
            );
        }

        const ctx2 = document.getElementById("chartMonthlyLeaves");
        if (ctx2) {
            charts.push(
                new Chart(ctx2, {
                    type: "line",
                    data: data.monthlyLeaves,
                    options: {
                        responsive: true,
                        scales: {
                            x: {
                                ticks: { color: getChartTheme().color },
                                grid: { color: getChartTheme().borderColor }
                            },
                            y: {
                                ticks: { color: getChartTheme().color },
                                grid: { color: getChartTheme().borderColor }
                            }
                        },
                        plugins: {
                            legend: getChartTheme().legend,
                            tooltip: getChartTheme().tooltip
                        }
                    }
                })
            );
        }
    };

    // --- Update chart theme dynamically --------------------------------------
    const updateChartThemes = () => {
        charts.forEach(chart => {
            const theme = getChartTheme();
            if (chart.options.scales) {
                for (const axis in chart.options.scales) {
                    chart.options.scales[axis].ticks.color = theme.color;
                    chart.options.scales[axis].grid.color = theme.borderColor;
                }
            }
            if (chart.options.plugins?.legend) {
                chart.options.plugins.legend.labels.color = theme.legend.labels.color;
            }
            if (chart.options.plugins?.tooltip) {
                chart.options.plugins.tooltip.backgroundColor = theme.tooltip.backgroundColor;
                chart.options.plugins.tooltip.titleColor = theme.tooltip.titleColor;
                chart.options.plugins.tooltip.bodyColor = theme.tooltip.bodyColor;
            }
            chart.update();
        });
    };

    // --- Listen to theme changes ---------------------------------------------
    window.addEventListener("lms:themechange", updateChartThemes);

    // --- Fetch dashboard data ------------------------------------------------
    fetch("/static/data/dashboard.json")
        .then(resp => resp.json())
        .then(data => {
            // Example: render KPIs
            document.querySelectorAll("[data-kpi]").forEach(el => {
                const key = el.getAttribute("data-kpi");
                if (data.kpis && data.kpis[key] !== undefined) {
                    el.textContent = data.kpis[key];
                }
            });

            // Initialize charts
            initCharts(data);
        })
        .catch(err => console.error("Failed to load dashboard data:", err));
})();
