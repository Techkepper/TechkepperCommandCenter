import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";

import * as ApiController from "../controllers/ApiController";
import isAuthApi from "../middleware/isAuthApi";
import { createRateLimiter } from "../middleware/rateLimit";

const upload = multer(uploadConfig);
const apiSendRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120
});

const ApiRoutes = express.Router();

ApiRoutes.post(
  "/send",
  apiSendRateLimit,
  isAuthApi,
  upload.array("medias"),
  ApiController.index
);

export default ApiRoutes;
