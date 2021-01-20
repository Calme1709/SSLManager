import Joi from "joi";
import { MethodsDefinition } from "@utils/router";
import getHandler from "./get";
import postHandler from "./post";

export default new MethodsDefinition({
	get: {
		restricted: false,
		handler: getHandler
	},
	post: {
		restricted: true,
		handler: postHandler,
		validation: Joi.object({
			body: Joi.object({
				options: Joi.array().items(Joi.object({
					key: Joi.string().required(),
					value: Joi.string().required()
				}))
			})
		})
	}
});