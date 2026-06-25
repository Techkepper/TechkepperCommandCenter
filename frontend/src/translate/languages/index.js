import { messages as spanishMessages } from "./es";
import { messages as englishMessages } from "./en";
import { messages as portugueseMessages } from "./pt";

const messages = {
	...spanishMessages,
	...englishMessages,
	...portugueseMessages,
};

export { messages };
