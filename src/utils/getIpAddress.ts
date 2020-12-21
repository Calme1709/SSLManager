import os from "os";
import publicIp from "public-ip";

/**
 * Get the machines IP address, relative to a remote machine.
 *
 * @param relativeTo - The IP of the remote machine, if this is an internal ip this returns the host's internal IP address, if
 * 	it is not or is undefined this returns the host's public IP address.
 *
 * @returns The host machines IP address.
 */
export default async (relativeTo?: string) => {
	const internalRegexes: RegExp[] = [
		/^(10)\.(.*)\.(.*)\.(.*)$/,
		/^(172)\.(1[6-9]|2[0-9]|3[0-1])\.(.*)\.(.*)$/,
		/^(192)\.(168)\.(.*)\.(.*)$/
	];

	if(relativeTo !== undefined && internalRegexes.some(regex => regex.test(relativeTo))) {
		return (Object.values(os.networkInterfaces())
			.reduce((acc, cur) => acc?.concat(...cur!), [])!
			.filter(inter => inter.family === "IPv4" && !inter.internal))[0].address;
	}

	return await publicIp.v4();
};