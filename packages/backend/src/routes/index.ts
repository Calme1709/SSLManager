import authentication from "./authentication";
import options from "./options";

import createRouter, { SubRoutesDefinition } from "@utils/router";

const routes = new SubRoutesDefinition({
	authentication,
	options
});

export default createRouter(routes);