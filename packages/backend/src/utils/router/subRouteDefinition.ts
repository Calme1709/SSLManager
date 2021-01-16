import MethodsDefinition from "./methodsDefinition";

/**
 * A class that represents the definition of sub routes.
 */
export default class SubRoutesDefinition {
	public type: "SubRoutes" = "SubRoutes";

	public routes: Record<string, MethodsDefinition | SubRoutesDefinition>;

	/**
	 * Create a new SubRoutesDefinition.
	 *
	 * @param routes - The methods that are associated with this.
	 */
	public constructor(routes: Record<string, MethodsDefinition | SubRoutesDefinition>) {
		this.routes = routes;
	}
}