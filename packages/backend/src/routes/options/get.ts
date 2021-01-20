import { OptionModel } from "@models/options";
import { Handler } from "@utils/router";

/**
 * The request handler for the post method.
 *
 * @returns The values of all currently set options.
 */
const handler: Handler<Record<string, string>, Record<string, string>, Record<string, string>> = async () => {
	const options = await OptionModel.find({});

	return options.reduce((accumulator: Record<string, string>, value) => {
		const option = value.toObject();

		return {
			...accumulator,
			[option.key]: option.value
		};
	}, {});
};

export default handler;