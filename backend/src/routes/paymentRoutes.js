const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/razorpay/create-order", paymentController.createRazorpayOrder);
router.post("/razorpay/verify", paymentController.verifyPayment);
router.get("/razorpay/:id", paymentController.getPayment);

module.exports = router;
