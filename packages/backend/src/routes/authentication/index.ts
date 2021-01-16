import login from "./login";
import register from "./register";
import checkToken from "./checkToken";
import { SubRoutesDefinition } from "@utils/router";

export default new SubRoutesDefinition({
	login,
	register,
	checkToken
});