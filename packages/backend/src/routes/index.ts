import { Router as expressRouter } from "express";

import authentication from "./authentication";
import options from "./options";

const router = expressRouter();

router.use("/authentication", authentication);
router.use("/options", options);

export default router;