// Runs before paint to set the theme, so there is no flash of the wrong colors.
// It reads a saved choice, then falls back to the OS preference, default dark.
// Kept as a string so it can be injected with next/script beforeInteractive.
export const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("solva-theme");
    var theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;
