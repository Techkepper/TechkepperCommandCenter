import React, { createContext, useCallback, useContext, useState } from "react";
import PropTypes from "prop-types";
import {
  i18n,
  SUPPORTED_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
} from "../../translate/i18n";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language);

  const changeLanguage = useCallback((next) => {
    if (!SUPPORTED_LANGUAGES.includes(next) || next === i18n.language) {
      return;
    }
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch (_err) {
      // localStorage no disponible (modo privado): el cambio aplica solo en sesión.
    }
    i18n.changeLanguage(next);
    setLanguage(next);
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage, supportedLanguages: SUPPORTED_LANGUAGES }}
    >
      {/* Los textos se leen con i18n.t() (sin hook que dispare re-render). Al
          cambiar el idioma remontamos el árbol con una key para que toda la
          interfaz se vuelva a renderizar al instante, sin recargar la página. */}
      <React.Fragment key={language}>{children}</React.Fragment>
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = { children: PropTypes.node.isRequired };

export const useLanguage = () => useContext(LanguageContext);
