/*eslint-disable @typescript-eslint/no-explicit-any*/
import { Router, RequestHandler } from "express";
import { ObjectSchema } from "joi";
import ControlledError from "../controlledError";
import AuthenticationService from "../../services/authentication";

//Disable this rule as Records do not allow for circular references.
//eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface IRequestQuery {
	[key: string]: IRequestQuery | IRequestQuery[] | string[] | string;
}

export type Handler<
	ReqBody extends Record<string, any> | undefined = any,
	ReqParams extends IRequestQuery | undefined = any,
	ResBody extends Record<string, any> | void = any
> = (data: { params: ReqParams; body: ReqBody }) => Promise<ResBody> | ResBody;

export interface IRequestHandler {
	handler: Handler;
	restricted: boolean;
	validation?: ObjectSchema;
}

export type Method = "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

/**
 * A class that represents the definition of methods on an API end point.
 */
export default class MethodsDefinition {
	public methods: { [key in Method]?: IRequestHandler };

	/**
	 * Create a new MethodsDefinition.
	 *
	 * @param methods - The methods that are associated with this.
	 */
	public constructor(methods: { [key in Method]?: IRequestHandler }) {
		this.methods = methods;
	}

	/**
	 * Apply the method handlers outlined in this class to the passed router.
	 *
	 * @param expressRouter - The express router to apply the methods to.
	 * @param path - The path on which to apply those methods.
	 */
	public applyMethodsToRouter(expressRouter: Router, path: string) {
		for(const [ method, handler ] of Object.entries(this.methods) as Array<[ Method, IRequestHandler | undefined ]>) {
			if(handler === undefined) {
				continue;
			}

			expressRouter[method](
				`/${path}`,
				this.createRequestHandler(handler)
			);
		}
	}

	/**
	 * Generate a request handler from the information given by the router.
	 *
	 * @param handler - The handler contains all information about the method handler.
	 *
	 * @returns - The express RequestHandler.
	 */
	private createRequestHandler(handler: IRequestHandler): RequestHandler {
		return async (request, response, next) => {
			if(handler.restricted) {
				const authenticationResult = await AuthenticationService.validateToken(request.headers.authenticationtoken);

				if(!authenticationResult.isValid) {
					next(authenticationResult.error);

					return;
				}
			}

			if(handler.validation !== undefined) {
				const result = handler.validation.unknown(true).validate(request);

				if(result.error !== undefined) {
					next(new ControlledError(422, `Request Validation: ${result.error.details[0].message.replace(/"/g, "'")}`));

					return;
				}
			}

			try {
				//eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const handlerResponse = Promise.resolve(handler.handler({ params: request.params, body: request.body }));

				handlerResponse
					.then((data: unknown) => response.json({ success: true, data }))
					.catch(next);
			} catch (error: unknown) {
				next(error);
			}
		};
	}
}