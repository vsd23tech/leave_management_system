/* ==========================================================================
   Employee Dashboard JS – Personal leave management and analytics
   - Loads employee-specific data from API endpoints
   - Renders personal KPIs
   - Handles quick actions and information display
   ========================================================================== */

(function () {
    // --- Fetch employee dashboard data --------------------------------------
    const fetchEmployeeData = async () => {
        try {
            // Fetch leave balance data
            const balanceResponse = await fetch("/employee/api/leave-balance");
            const balanceData = await balanceResponse.json();

            // Populate KPIs
            document.querySelectorAll("[data-kpi]").forEach(el => {
                const key = el.getAttribute("data-kpi");
                if (balanceData[key] !== undefined) {
                    el.textContent = balanceData[key];
                }
            });

            console.log("Employee dashboard data loaded successfully");

        } catch (err) {
            console.error("Failed to load employee dashboard data:", err);
            // Show error state in console for now
        }
    };

    // --- Initialize dashboard when DOM is ready -----------------------------
    document.addEventListener('DOMContentLoaded', fetchEmployeeData);
})();
