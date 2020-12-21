import { Router as expressRouter } from "express";

import loginHandlers from "./login";
import register from "./register";
import checkToken from "./checkToken";

const router = expressRouter();

router.post("/login", ...loginHandlers.post);
router.post("/register", ...register.post);
router.post("/checkToken", ...checkToken.post);

export default router;