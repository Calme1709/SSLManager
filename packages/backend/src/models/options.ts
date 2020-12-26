import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";

/**
 * An option stored in the database that is set by the user at runtime.
 */
export class Option {
	@prop({ unique: true })
	public key!: string;

	@prop()
	public value!: string;

	/**
	 * Set the value of an option in the database.
	 *
	 * @param this - The this value of the method, to be ignored.
	 * @param key - The key of the option to set.
	 * @param value - The value which the option should be set to.
	 */
	public static async set(this: ReturnModelType<typeof Option>, key: string, value: string) {
		if(await this.exists({ key })) {
			await this.findOneAndUpdate({ key }, { value }).exec();
		} else {
			await this.create({ key, value });
		}
	}
}

export const OptionModel = getModelForClass(Option);