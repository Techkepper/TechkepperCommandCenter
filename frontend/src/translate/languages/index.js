import { messages as spanishMessages } from "./es";
import { messages as englishMessages } from "./en";
import { messages as portugueseMessages } from "./pt";

import { smartDocuments } from "./modules/smartDocuments";
import { entityDossier } from "./modules/entityDossier";
import { commercialProposals } from "./modules/commercialProposals";
import { collaborators } from "./modules/collaborators";
import { businessClients } from "./modules/businessClients";
import { core } from "./modules/core";
import { extras } from "./modules/extras";
import { misc } from "./modules/misc";

// Traducciones específicas de cada módulo de Techkepper. Cada archivo expone
// { es: {...}, en: {...}, pt: {...} } con su propio namespace y se fusiona
// (deep-merge) dentro de `translations` para no chocar con las claves base.
const moduleTranslations = [
	smartDocuments,
	entityDossier,
	commercialProposals,
	collaborators,
	businessClients,
	core,
	extras,
	misc,
];

const isPlainObject = value =>
	value && typeof value === "object" && !Array.isArray(value);

const deepMerge = (target, source) => {
	Object.keys(source || {}).forEach(key => {
		if (isPlainObject(source[key]) && isPlainObject(target[key])) {
			deepMerge(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	});
	return target;
};

const messages = {
	...spanishMessages,
	...englishMessages,
	...portugueseMessages,
};

moduleTranslations.forEach(mod => {
	Object.keys(mod || {}).forEach(lng => {
		if (!messages[lng]) messages[lng] = { translations: {} };
		if (!messages[lng].translations) messages[lng].translations = {};
		deepMerge(messages[lng].translations, mod[lng]);
	});
});

export { messages };
