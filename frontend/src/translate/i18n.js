import i18n from "i18next";

import { messages } from "./languages";

export const SUPPORTED_LANGUAGES = ["es", "en", "pt"];
export const LANGUAGE_STORAGE_KEY = "appLanguage";

const getInitialLanguage = () => {
	try {
		const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
		if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
	} catch (_err) {
		// localStorage no disponible (modo privado, etc.): se usa el idioma por defecto.
	}
	return "es";
};

i18n.init({
	debug: false,
	defaultNS: ["translations"],
	fallbackLng: "es",
	lng: getInitialLanguage(),
	ns: ["translations"],
	resources: messages,
	interpolation: { escapeValue: false },
});

export { i18n };
