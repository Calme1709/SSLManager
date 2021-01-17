import login from "./login";
import register from "./register";
import checkToken from "./checkToken";

import Router from "@utils/router";

export default new Router({
	login,
	register,
	checkToken
});