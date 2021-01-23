import { prop, getModelForClass } from "@typegoose/typegoose";

/**
 * A connection to a remote Plesk instance.
 */
export class PleskConnection {
	@prop({ unique: true })
	public hostname!: string;

	@prop()
	public friendlyName!: string;

	@prop()
	public login!: string;

	@prop()
	public apiKey!: string;

	@prop()
	public sessionInfo!: {
		cookie: string;
		expiration: number;
	};

	@prop()
	public useHttps!: boolean;
}

export const PleskConnectionModel = getModelForClass(PleskConnection);