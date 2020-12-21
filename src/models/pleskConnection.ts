import { prop, getModelForClass } from "@typegoose/typegoose";

/**
 * A connection to a remote Plesk instance.
 */
export class PleskConnection {
	@prop({ unique: true })
	public ipAddress!: string;

	@prop()
	public login!: string;

	@prop()
	public apiKey!: string;

	@prop()
	public cookie?: string;

	@prop()
	public cookieExpiry?: number;

	@prop()
	public useHttps!: boolean;
}

export const PleskConnectionModel = getModelForClass(PleskConnection);