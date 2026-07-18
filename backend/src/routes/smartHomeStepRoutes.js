const express = require("express");
const router = express.Router();
const {
  saveStep,
  getSession,
  resumeSession,
} = require("../controllers/smartHomeStepController");

// Public: save a step (creates or updates session)
router.post("/", saveStep);

// Public: find draft session by email
router.post("/resume", resumeSession);

// Public: get session by ID
router.get("/:id", getSession);

module.exports = router;