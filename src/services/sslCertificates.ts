import { SSLCertificateModel } from "@models/sslCertificate";

/**
 * The SSLCertificate service, handles all interactions with the handling of SSL certificates in the application.
 */
export default class SSLCertificateService {
	/**
	 * Get all of the saved SSL certificates.
	 *
	 * @returns Information about all of the saved SSL certificates.
	 */
	public static async getAll() {
		return (await SSLCertificateModel.find({ }).exec()).map(val => val.toObject());
	}
}