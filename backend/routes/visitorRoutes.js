const express = require("express");
const visitorController = require("../controllers/visitorController");
const router = express.Router();

// Visitor registration
router.post("/register", visitorController.registerVisitor);

// Visitor approval/rejection via token
router.get("/decision/:token", visitorController.visitorDecision);

// Polling status for frontend
router.get("/status/:id", visitorController.getVisitorStatus);

// Expire visitor manually (timer)
router.put("/:id/expire", visitorController.expireVisitor);



// Get all visitors
router.get("/", visitorController.getAllVisitors);

// Get single visitor by ID
router.get("/:id", visitorController.getVisitorById);

module.exports = router;
