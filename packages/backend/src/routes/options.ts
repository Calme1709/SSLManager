import Joi from "joi";
import { OptionModel, Option } from "@models/options";
import { Handler, MethodsDefinition } from "@utils/router";

const postSchema = Joi.object({
	body: Joi.object({
		options: Joi.array().items(Joi.object({
			key: Joi.string().required(),
			value: Joi.string().required()
		}))
	})
});

interface IPostRequestBody {
	options: Array<{
		key: string;
		value: string;
	}>;
}

type PostHandler = Handler<IPostRequestBody, Record<string, string>>;

/**
 * The express request handler for the post method.
 *
 * @param data - The data passed with the HTTP request.
 */
const postHandler: PostHandler = async data => {
	const promises: Array<Promise<void>> = [];

	for(const option of data.body.options) {
		promises.push(OptionModel.set(option.key, option.value));
	}

	await Promise.all(promises);
};

type GetHandler = Handler<Record<string, string>, Record<string, string>, Option[]>;

/**
 * The request handler for the post method.
 *
 * @returns The values of all currently set options.
 */
const getHandler: GetHandler = async () => {
	const valuesDoc = await OptionModel.find({});

	return valuesDoc.map(value => {
		const val = value.toObject() as Option;

		return {
			key: val.key,
			value: val.value
		};
	});
};

const routes = new MethodsDefinition({
	get: {
		restricted: true,
		handler: getHandler
	},
	post: {
		restricted: true,
		validation: postSchema,
		handler: postHandler
	}
});

export default routes;