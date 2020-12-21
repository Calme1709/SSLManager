import { RequestHandler } from "express";

//eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface IRequestQuery {
	[key: string]: string | string[] | IRequestQuery | IRequestQuery[];
}

export type Handler<
	ReqBody extends Record<string, any> = Record<string, string>,
	ReqParams extends IRequestQuery = IRequestQuery,
	ResBody extends Record<string, any> = Record<string, string>
> = RequestHandler<Record<string, string>, ResBody, ReqBody, ReqParams>;