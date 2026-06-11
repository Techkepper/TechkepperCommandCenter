import i18n from "i18next";

import { messages } from "./languages";

i18n.init({
	debug: false,
	defaultNS: ["translations"],
	fallbackLng: "es",
	lng: "es",
	ns: ["translations"],
	resources: messages,
	interpolation: { escapeValue: false },
});

export { i18n };
