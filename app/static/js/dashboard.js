/* ==========================================================================
   Dashboard JS – Enhanced KPI rendering + Chart.js theming
   - Loads comprehensive JSON data (KPIs, chart datasets, team stats)
   - Renders KPIs, tables, and enhanced charts
   - Applies modern theme-aware Chart.js styling via CSS variables
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
            cornerRadius: 8,
            displayColors: true,
            padding: 12
        },
        legend: {
            labels: {
                color: cssVar("--chart-legend-fg"),
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        }
    });

    // --- Initialize enhanced charts -----------------------------------------
    const initCharts = (data) => {
        // Weekly Pattern Chart (Bar Chart)
        const weeklyCtx = document.getElementById("weeklyChart");
        if (weeklyCtx) {
            charts.push(
                new Chart(weeklyCtx, {
                    type: "bar",
                    data: data.weeklyPattern,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: getChartTheme().tooltip
                        },
                        scales: {
                            x: {
                                ticks: { color: getChartTheme().color },
                                grid: { color: getChartTheme().borderColor, display: false }
                            },
                            y: {
                                ticks: { color: getChartTheme().color },
                                grid: { color: getChartTheme().borderColor, borderDash: [5, 5] },
                                beginAtZero: true
                            }
                        }
                    }
                })
            );
        }

        // Monthly Trend Chart (Line Chart)
        const monthlyCtx = document.getElementById("monthlyChart");
        if (monthlyCtx) {
            charts.push(
                new Chart(monthlyCtx, {
                    type: "line",
                    data: data.monthlyLeaves,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: getChartTheme().tooltip
                        },
                        scales: {
                            x: {
                                ticks: { color: getChartTheme().color },
                                grid: { color: getChartTheme().borderColor, display: false }
                            },
                            y: {
                                ticks: { color: getChartTheme().color },
                                grid: { color: getChartTheme().borderColor, borderDash: [5, 5] },
                                beginAtZero: true
                            }
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

    // --- Populate leave type cards -----------------------------------------
    const populateLeaveTypeCards = (data) => {
        const leaveTypes = ['sick_leave', 'earned_leave', 'casual_leave', 'unpaid_leave', 'floater_leave'];
        leaveTypes.forEach((type, index) => {
            const element = document.getElementById(`type-${index + 1}-numbers`);
            if (element && data.leaveTypeDetails[type]) {
                const details = data.leaveTypeDetails[type];
                element.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-primary">${details.available}</span>
                        <span class="text-muted">/</span>
                        <span class="text-warning">${details.consumed}</span>
                        <span class="text-muted">/</span>
                        <span class="text-success">${details.annual}</span>
                    </div>
                    <div class="mt-2">
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: ${details.percentage}%"></div>
                        </div>
                        <small class="text-muted">${details.percentage}% used</small>
                    </div>
                `;
            }
        });
    };

    // --- Populate recent activity table ------------------------------------
    const populateRecentActivity = (data) => {
        const tbody = document.getElementById("activityRows");
        const emptyState = document.getElementById("activityEmpty");

        if (tbody && data.recentActivity) {
            if (data.recentActivity.length === 0) {
                emptyState.style.display = "block";
                tbody.style.display = "none";
                return;
            }

            emptyState.style.display = "none";
            tbody.style.display = "table-row-group";

            tbody.innerHTML = data.recentActivity.map(activity => `
                <tr>
                    <td>
                        <div class="fw-semibold">${activity.date}</div>
                        <small class="text-muted">${activity.employee}</small>
                    </td>
                    <td>
                        <span class="badge badge-soft badge-${getStatusColor(activity.status)}">${activity.type}</span>
                    </td>
                    <td>
                        <span class="fw-bold">${activity.days} day${activity.days > 1 ? 's' : ''}</span>
                    </td>
                    <td>
                        <span class="badge badge-soft badge-${getStatusColor(activity.status)}">${activity.status}</span>
                    </td>
                    <td>
                        <div class="text-truncate" style="max-width: 200px;" title="${activity.remarks}">
                            ${activity.remarks}
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    };

    // --- Helper function for status colors ---------------------------------
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'danger';
            default: return 'info';
        }
    };

    // --- Listen to theme changes ---------------------------------------------
    window.addEventListener("lms:themechange", updateChartThemes);

    // --- Fetch and populate dashboard data ------------------------------------
    fetch("/static/data/dashboard.json")
        .then(resp => resp.json())
        .then(data => {
            // Populate KPIs
            document.querySelectorAll("[data-kpi]").forEach(el => {
                const key = el.getAttribute("data-kpi");
                if (data.kpis && data.kpis[key] !== undefined) {
                    el.textContent = data.kpis[key];
                }
            });

            // Populate leave type cards
            populateLeaveTypeCards(data);

            // Populate recent activity
            populateRecentActivity(data);

            // Initialize charts
            initCharts(data);

            // Hide loading skeletons
            document.querySelectorAll('.skeleton').forEach(skeleton => {
                skeleton.style.display = 'none';
            });

            // Show chart canvases
            document.querySelectorAll('.chart-canvas').forEach(canvas => {
                canvas.style.display = 'block';
            });
        })
        .catch(err => {
            console.error("Failed to load dashboard data:", err);
            // Show error state
            document.querySelectorAll('.skeleton').forEach(skeleton => {
                skeleton.innerHTML = '<i class="bi bi-exclamation-triangle text-warning"></i> Failed to load data';
            });
        });
})();
