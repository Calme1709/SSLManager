import Joi from "joi";
import { OptionModel, Option } from "@models/options";
import { Handler, MethodsDefinition } from "@utils/router";

interface IPostBody {
	options: Array<{
		key: string;
		value: string;
	}>;
}

/**
 * The express request handler for the post method.
 *
 * @param data - The data passed with the HTTP request.
 */
const postHandler: Handler<IPostBody> = async data => {
	const promises: Array<Promise<void>> = [];

	for(const option of data.body.options) {
		promises.push(OptionModel.set(option.key, option.value));
	}

	await Promise.all(promises);
};

/**
 * The request handler for the post method.
 *
 * @returns The values of all currently set options.
 */
const getHandler: Handler<Record<string, string>, Record<string, string>, Option[]> = async () => {
	const options = await OptionModel.find({});

	return options.map(value => {
		const option = value.toObject();

		return {
			key: option.key,
			value: option.value
		};
	});
};

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