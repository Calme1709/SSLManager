import jwt from "jsonwebtoken";

/**
 * A class that handle the generation and decoding/verification with JsonWebTokens.
 */
export default class JsonWebTokens {
	private static cache: Record<string, { secret?: string; valid?: boolean; data?: Record<string, string> } | undefined> = {};

	/**
	 * Initialize the cache.
	 */
	public static initialize() {
		setInterval(() => {
			this.cache = {};
		}, 5 * 60 * 1000);
	}

	/**
	 * Create a json web token with the passed payload.
	 *
	 * @param payload - The payload of the token.
	 * @param secret - The secret to generate the token with.
	 * @param expiry - How long until the token expires (defaults to one day).
	 *
	 * @returns The json web token.
	 */
	public static create(payload: Record<string, string>, secret: string, expiry = "1d") {
		const token = jwt.sign(payload, secret, { expiresIn: expiry });

		return token;
	}

	/**
	 * Check if a passed authentication token is valid.
	 *
	 * @param token - The token to authenticate.
	 * @param secret - The secret that was used to generate the token.
	 * @returns Whether the token is valid or not.
	 */
	public static isValid(token: string, secret: string) {
		const cacheEntry = this.cache[token];

		if(cacheEntry !== undefined && cacheEntry.secret === secret) {
			return cacheEntry.valid === true;
		}

		try {
			const data = jwt.verify(token, secret) as Record<string, string>;

			this.cache[token] = {
				secret,
				valid: true,
				data
			};

			return true;
		} catch {
			this.cache[token] = {
				secret,
				valid: false
			};

			return false;
		}
	}

	/**
	 * Decode an authentication token.
	 *
	 * @param token - The token to decode.
	 *
	 * @returns The token's payload.
	 */
	public static decode<TokenPayload extends Record<string, string>>(token: string): TokenPayload {
		const cacheEntry = this.cache[token];

		if(cacheEntry?.data !== undefined) {
			return cacheEntry.data as TokenPayload;
		}

		const data = jwt.decode(token) as Record<string, string>;

		this.cache[token] = {
			data
		};

		return data as TokenPayload;
	}
}