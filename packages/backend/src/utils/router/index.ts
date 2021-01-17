import { Router as createExpressRouter } from "express";
import MethodsDefinition from "./methodsDefinition";

export { default as MethodsDefinition, Handler } from "./methodsDefinition";

/**
 * A class that represents the definition of sub routes.
 */
export default class Router {
	public routes: Record<string, MethodsDefinition | Router>;

	/**
	 * Create a new SubRoutesDefinition.
	 *
	 * @param routes - The methods that are associated with this.
	 */
	public constructor(routes: Record<string, MethodsDefinition | Router>) {
		this.routes = routes;
	}

	/**
	 * Generate an express router from this Router object.
	 *
	 * @returns The express router.
	 */
	public generateExpressRouter() {
		const expressRouter = createExpressRouter();

		for(const [ path, definition ] of Object.entries(this.routes)) {
			if(definition instanceof MethodsDefinition) {
				definition.applyMethodsToRouter(expressRouter, path);
			} else {
				expressRouter.use(path, definition.generateExpressRouter());
			}
		}

		return expressRouter;
	}
}