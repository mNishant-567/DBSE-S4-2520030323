import { Router } from "express";
import Joi from "joi";
import asyncHandler from "../middleware/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createStaffUser, login, me, registerPatient } from "../controllers/authController.js";

const router = Router();
const password = Joi.string().min(10).max(128).required();

router.post("/register", validate(Joi.object({
  name: Joi.string().trim().min(1).max(160).required(),
  email: Joi.string().email().max(254).required(),
  password,
  dob: Joi.date().iso().max("now").allow(null),
  gender: Joi.string().max(40).allow(null, ""),
  phone: Joi.string().max(40).allow(null, ""),
  address: Joi.string().max(1000).allow(null, "")
}).required()), asyncHandler(registerPatient));

router.post("/login", validate(Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().required()
}).required()), asyncHandler(login));

router.get("/me", authenticate, asyncHandler(me));

router.post("/staff", authenticate, authorize("admin"), validate(Joi.object({
  name: Joi.string().trim().min(1).max(160).required(),
  email: Joi.string().email().max(254).required(),
  password,
  specialization: Joi.string().max(160).allow(null, ""),
  phone: Joi.string().max(40).allow(null, "")
}).required()), asyncHandler(createStaffUser));

export default router;