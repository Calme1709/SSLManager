import { Router as createExpressRouter, RequestHandler } from "express";
import { Handler, Method, IRequestHandler } from "./methodsDefinition";
import SubRoutesDefinition from "./subRouteDefinition";
import {
	authentication as authenticationMiddleware,
	requestValidator as requestValidatorMiddleware
} from "@middleware";

export { default as SubRoutesDefinition } from "./subRouteDefinition";
export { default as MethodsDefinition, Handler } from "./methodsDefinition";

/**
 * Create an Express request handler from a handler function.
 *
 * @param handler - The handler to function.
 *
 * @returns The express request handler.
 */
const createRequestHandler = (handler: Handler): RequestHandler => (request, response, next) => {
	try {
		const handlerResponse = Promise.resolve(handler({ params: request.params, body: request.body }));

		handlerResponse
			.then((data: unknown) => {
				response.json({ success: true, data });
			})
			.catch(next);
	} catch (error: unknown) {
		next(error);
	}
};

/**
 * Create an express router from a route declaration object.
 *
 * @param routes - The route declaration object.
 *
 * @returns The express router.
 */
const createRouter = (routes: SubRoutesDefinition) => {
	const router = createExpressRouter();

	for(const [ path, definition ] of Object.entries(routes.routes)) {
		if(definition.type === "Methods") {
			for(const [ method, handler ] of Object.entries(definition.methods) as Array<[ Method, IRequestHandler | undefined ]>) {
				if(handler === undefined) {
					continue;
				}

				const validators = handler.validation === undefined
					? []
					: [ requestValidatorMiddleware(handler.validation) ];

				router[method](
					path,
					...(handler.restricted ? [ authenticationMiddleware ] : []),
					...validators,
					createRequestHandler(handler.handler)
				);
			}
		} else {
			router.use(path, createRouter(definition));
		}
	}

	return router;
};

export default createRouter;