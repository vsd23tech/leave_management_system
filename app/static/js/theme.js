/* ==========================================================================
   Theme toggle: light / dark
   - Respects system preference by default
   - Persists explicit user choice in localStorage('theme')
   - Syncs [data-theme] on <html>
   - Updates toggle button icon + labels
   - Emits 'lms:themechange' event for listeners (e.g., charts)
   ========================================================================== */

(function () {
    const STORAGE_KEY = "theme";
    const root = document.documentElement; // <html>
    const btn = document.getElementById("themeToggle");
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    // --- Utilities ----------------------------------------------------------
    const setThemeAttr = (mode) => {
        if (mode) {
            root.setAttribute("data-theme", mode);
        } else {
            root.removeAttribute("data-theme");
        }
    };

    const currentResolvedTheme = () => {
        // If explicit attribute exists, use it; otherwise resolve from media query
        const explicit = root.getAttribute("data-theme");
        if (explicit === "light" || explicit === "dark") return explicit;
        return mq.matches ? "dark" : "light";
    };

    const updateToggleUI = () => {
        if (!btn) return;
        const theme = currentResolvedTheme();
        btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
        btn.title = btn.getAttribute("aria-label");

        // If Bootstrap Icons are available, flip icon classes
        const icon = btn.querySelector("i");
        if (icon) {
            icon.classList.remove("bi-sun-fill", "bi-moon-fill");
            icon.classList.add(theme === "dark" ? "bi-sun-fill" : "bi-moon-fill");
        }
    };

    const dispatchThemeEvent = () => {
        const event = new CustomEvent("lms:themechange", { detail: { theme: currentResolvedTheme() } });
        window.dispatchEvent(event);
    };

    // --- Initialization -----------------------------------------------------
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
        // Respect explicit stored preference
        setThemeAttr(stored);
    } else {
        // No stored pref → allow system preference (no data-theme attr)
        setThemeAttr(null);
    }
    updateToggleUI();
    dispatchThemeEvent();

    // --- React to system preference changes (only when no explicit choice) ---
    mq.addEventListener("change", () => {
        const hasExplicit = localStorage.getItem(STORAGE_KEY) === "light" || localStorage.getItem(STORAGE_KEY) === "dark";
        if (!hasExplicit) {
            setThemeAttr(null); // Let CSS auto-resolve via media query
            updateToggleUI();
            dispatchThemeEvent();
        }
    });

    // --- Toggle handler -----------------------------------------------------
    if (btn) {
        btn.addEventListener("click", () => {
            const current = currentResolvedTheme();
            const next = current === "dark" ? "light" : "dark";
            setThemeAttr(next);
            localStorage.setItem(STORAGE_KEY, next);
            updateToggleUI();
            dispatchThemeEvent();
        });
    }

    // --- Optional: Allow programmatic reset to system default ----------------
    window.resetThemeToSystem = function () {
        localStorage.removeItem(STORAGE_KEY);
        setThemeAttr(null);
        updateToggleUI();
        dispatchThemeEvent();
    };
})();
