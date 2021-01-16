/*eslint-disable @typescript-eslint/no-explicit-any*/
import { Schema } from "joi";

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
	validation?: Schema;
}

export type Method = "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

/**
 * A class that represents the definition of methods on an API end point.
 */
export default class MethodsDefinition {
	public type: "Methods" = "Methods";

	public methods: { [key in Method]?: IRequestHandler };

	/**
	 * Create a new MethodsDefinition.
	 *
	 * @param methods - The methods that are associated with this.
	 */
	public constructor(methods: { [key in Method]?: IRequestHandler }) {
		this.methods = methods;
	}
}