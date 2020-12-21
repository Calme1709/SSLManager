import { RequestHandler } from "express";

type RequestQuery = Record<string, string | string[] | RequestQuery | RequestQuery[]>;

export type Handler<
	ReqBody extends Record<string, any> = Record<string, string>,
	ReqParams extends RequestQuery = RequestQuery,
	ResBody extends Record<string, any> = Record<string, string>
> = RequestHandler<Record<string, string>, ResBody, ReqBody, ReqParams>;