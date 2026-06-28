import React, { createContext, useState, useContext, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  createMuiTheme,
  ThemeProvider as MUIThemeProvider,
} from "@material-ui/core/styles";
import { CssBaseline } from "@material-ui/core";

const ThemeContext = createContext();
const STORAGE_KEY = "techkepper-theme";

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== "light"
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const syncDateInput = (input) => {
      if (input instanceof HTMLInputElement && input.type === "date") {
        input.toggleAttribute("data-empty-date", !input.value);
      }
    };
    const syncDateInputs = (root) => {
      if (root instanceof HTMLInputElement) syncDateInput(root);
      root.querySelectorAll?.('input[type="date"]').forEach(syncDateInput);
    };
    const handleDateInput = (event) => syncDateInput(event.target);
    const observer = new MutationObserver((entries) => {
      entries.forEach((entry) =>
        entry.addedNodes.forEach((node) => syncDateInputs(node))
      );
    });

    syncDateInputs(document);
    document.addEventListener("input", handleDateInput, true);
    document.addEventListener("change", handleDateInput, true);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("input", handleDateInput, true);
      document.removeEventListener("change", handleDateInput, true);
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => setDarkMode((previous) => !previous);

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: darkMode ? "dark" : "light",
          primary: darkMode
            ? { main: "#8ee63f", dark: "#68be2c", light: "#b6f16f", contrastText: "#071105" }
            : { main: "#5faf3a", dark: "#4d9831", light: "#eaf6e3", contrastText: "#ffffff" },
          secondary: darkMode
            ? { main: "#29b6f6" }
            : { main: "#267ea5", contrastText: "#ffffff" },
          background: darkMode
            ? { default: "#071009", paper: "#101b13" }
            : { default: "#f6f8f5", paper: "#ffffff" },
          text: darkMode
            ? { primary: "#f4f8f3", secondary: "#aebaae" }
            : { primary: "#1f2a22", secondary: "#5f6b62" },
          divider: darkMode
            ? "rgba(142, 230, 63, 0.14)"
            : "rgba(40, 60, 44, 0.12)",
        },
        typography: {
          fontFamily:
            '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          h4: { fontWeight: 800 },
          h5: { fontWeight: 750 },
          h6: { fontWeight: 700 },
          button: { textTransform: "none", fontWeight: 700 },
        },
        shape: { borderRadius: 12 },
        overrides: {
          MuiCssBaseline: {
            "@global": {
              'input[type="date"][data-empty-date]::-webkit-datetime-edit': {
                opacity: 0,
              },
            },
          },
          MuiPaper: {
            rounded: { borderRadius: 16 },
          },
          MuiButton: {
            root: { borderRadius: 10 },
            containedPrimary: {
              color: darkMode ? "#071105" : "#ffffff",
            },
          },
          MuiListItem: {
            root: {
              "&.Mui-selected": {
                backgroundColor: darkMode
                  ? "rgba(142, 230, 63, 0.14)"
                  : "rgba(95, 175, 58, 0.12)",
              },
              "&.Mui-selected:hover": {
                backgroundColor: darkMode
                  ? "rgba(142, 230, 63, 0.2)"
                  : "rgba(95, 175, 58, 0.18)",
              },
            },
          },
          MuiTableCell: {
            head: { fontWeight: 800 },
          },
        },
        scrollbarStyles: {
          "&::-webkit-scrollbar": { width: 8, height: 8 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: darkMode ? "#304132" : "#bdcabb",
          },
        },
      }),
    [darkMode]
  );

  const contextValue = useMemo(
    () => ({ darkMode, toggleTheme }),
    [darkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = { children: PropTypes.node.isRequired };
export const useThemeContext = () => useContext(ThemeContext);
