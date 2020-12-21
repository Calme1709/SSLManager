import { getModelForClass, prop } from "@typegoose/typegoose";

/**
 * A User in the database.
 */
export class User {
	@prop({ unique: true })
	public username!: string;

	@prop()
	public password!: string;
}

export const UserModel = getModelForClass(User);