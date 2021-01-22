import { promises as dns } from "dns";
import os from "os";
import request from "./request";


/**
 * Get the machines IP address, relative to a remote machine.
 *
 * @param relativeTo - The IP or hostname of the remote machine, if this is an internal ip this returns the host's internal IP address, if
 * 	it is not or is undefined this returns the host's public IP address.
 *
 * @returns The host machines IP address.
 */
export default async (relativeTo?: string) => {
	if(relativeTo !== undefined) {
		const ipRegex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

		//TODO: Get the actual IP from DNS not just the first.
		const relativeToIp = ipRegex.test(relativeTo) ? relativeTo : (await dns.resolve4(relativeTo))[0];

		const internalRegexes: RegExp[] = [
			/^(10)\.(.*)\.(.*)\.(.*)$/,
			/^(172)\.(1[6-9]|2[0-9]|3[0-1])\.(.*)\.(.*)$/,
			/^(192)\.(168)\.(.*)\.(.*)$/
		];

		if(internalRegexes.some(regex => regex.test(relativeToIp))) {
			return (Object.values(os.networkInterfaces())
				.reduce((acc, cur) => acc?.concat(...cur!), [])!
				.filter(inter => inter.family === "IPv4" && !inter.internal))[0].address;
		}
	}

	return request("https", "https://bot.whatismyipaddress.com/");
};