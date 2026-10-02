// ==============================================================================
// PHASE 5 AUTOMATED TEST SUITE: REGISTRATION FEES, PAYMENTS & RECONCILIATION
// Validates: Fee calculation, Security, Razorpay Signatures, Webhooks, Invoices, Refunds & Reconciliation
// ==============================================================================

import crypto from "crypto";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log("🥋 RUNNING PHASE 5 TEST SUITE: PAYMENT INTEGRATION & RECONCILIATION");
  console.log("==================================================================\n");

  const { FeeService, formatPaiseToInr, DEFAULT_FEE_CONFIG } = await import(
    "../src/server/services/fee.service.ts"
  );
  const { PaymentService } = await import(
    "../src/server/services/payment.service.ts"
  );
  const { ReconciliationService } = await import(
    "../src/server/services/reconciliation.service.ts"
  );

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: FEE CALCULATION ENGINE & IMMUTABLE SNAPSHOTS
  // ----------------------------------------------------------------------------
  console.log("💰 [TEST GROUP 1] Authoritative Fee Calculation Engine (Integer Minor Units)");

  // 1.1 Standard Athlete Fee (₹1,500 = 150000 paise)
  const stdFee = FeeService.computeStaticBreakdown({
    participantType: "ATHLETE",
    isLate: false,
  });
  assert(stdFee.baseFeePaise === 150000, `Standard athlete fee is 150000 paise (Found: ${stdFee.baseFeePaise})`);
  assert(stdFee.lateFeePaise === 0, `No late fee applied before deadline (Found: ${stdFee.lateFeePaise})`);
  assert(stdFee.totalPaise === 150000, `Total equals base fee (Found: ${stdFee.totalPaise})`);
  assert(stdFee.formattedTotal === "₹1,500", `Formatted total is ₹1,500 (Found: ${stdFee.formattedTotal})`);

  // 1.2 Late Registration Fee (₹1,500 + ₹500 = ₹2,000)
  const lateFee = FeeService.computeStaticBreakdown({
    participantType: "ATHLETE",
    isLate: true,
    lateFeePaise: 50000,
  });
  assert(lateFee.baseFeePaise === 150000, "Base fee is 150000 paise");
  assert(lateFee.lateFeePaise === 50000, `Late surcharge is 50000 paise (Found: ${lateFee.lateFeePaise})`);
  assert(lateFee.totalPaise === 200000, `Total equals 200000 paise / ₹2,000 (Found: ${lateFee.totalPaise})`);
  assert(lateFee.formattedTotal === "₹2,000", `Formatted total is ₹2,000 (Found: ${lateFee.formattedTotal})`);
  assert(lateFee.snapshot.items.length === 2, "Fee snapshot includes base and late fee items");

  // 1.3 Coach Fee (₹1,000 = 100000 paise)
  const coachFee = FeeService.computeStaticBreakdown({
    participantType: "COACH",
    isLate: false,
  });
  assert(coachFee.baseFeePaise === 100000, `Coach base fee is 100000 paise (Found: ${coachFee.baseFeePaise})`);
  assert(coachFee.totalPaise === 100000, "Coach total is 100000 paise");

  // 1.4 Currency Formatting
  const formattedCustom = formatPaiseToInr(250050);
  assert(formattedCustom.includes("2,500.5"), `Proper decimal formatting for minor units: ${formattedCustom}`);

  // 1.5 Immutable Snapshot Timestamp & Fields
  assert(lateFee.snapshot.calculatedAt !== undefined, "Snapshot contains calculation timestamp");
  assert(lateFee.snapshot.currency === "INR", "Snapshot records currency");
  assert(lateFee.snapshot.isLate === true, "Snapshot records isLate flag");

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: PAYMENT SECURITY & IDOR PROTECTION
  // ----------------------------------------------------------------------------
  console.log("\n🔐 [TEST GROUP 2] Payment Security & Authorization");

  const USER_A_ID = "usr-alpha-001";
  const USER_B_ID = "usr-bravo-002";
  const REG_A_ID = "reg-pay-test-001";

  // 2.1 Missing Authentication Rejected
  try {
    await PaymentService.createPaymentOrder({
      registrationId: REG_A_ID,
      userId: null,
    });
    assert(false, "Unauthenticated user should not be allowed to create order");
  } catch (e) {
    assert(e.message.includes("Authentication required"), `Unauthenticated order blocked: ${e.message}`);
  }

  // 2.2 Order Creation for Authorized Owner
  let orderA;
  try {
    const res = await PaymentService.createPaymentOrder({
      registrationId: REG_A_ID,
      userId: USER_A_ID,
    });
    orderA = res.order;
    assert(orderA.id !== undefined, "Authorized owner can initiate payment order");
    assert(orderA.orderNumber.startsWith("KKC26-ORD-"), `Order number follows institutional schema: ${orderA.orderNumber}`);
    assert(orderA.status === "PENDING", `New order created with PENDING status (Found: ${orderA.status})`);
    assert(orderA.amountPaise === 150000, "Order amount calculated server-side as 150000 paise");
    assert(res.checkout.providerOrderId.length > 0, "Provider order ID present");
  } catch (e) {
    assert(false, `Authorized order creation failed: ${e.message}`);
  }

  // 2.3 Duplicate Order Reuse / Idempotent Order Creation
  try {
    const resDuplicate = await PaymentService.createPaymentOrder({
      registrationId: REG_A_ID,
      userId: USER_A_ID,
    });
    assert(
      resDuplicate.order.providerOrderId === orderA.providerOrderId,
      `Double-click on PAY NOW safely reuses active pending order without creating conflicting duplicates (${resDuplicate.order.providerOrderId})`
    );
  } catch (e) {
    assert(false, `Duplicate order check failed: ${e.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: CRYPTOGRAPHIC SIGNATURE VERIFICATION
  // ----------------------------------------------------------------------------
  console.log("\n🛡️ [TEST GROUP 3] Cryptographic Payment Signature Verification");

  const testSecret = "test_razorpay_secret_key_999";
  const testOrderId = "order_test_123456";
  const testPaymentId = "pay_test_789012";

  // 3.1 Valid HMAC-SHA256 Signature Accepted
  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest("hex");

  const isSigValid = PaymentService.verifySignature(testOrderId, testPaymentId, validSignature, testSecret);
  assert(isSigValid === true, "Valid cryptographic HMAC-SHA256 signature accepted");

  // 3.2 Invalid/Forged Signature Rejected
  const isForgedSigValid = PaymentService.verifySignature(
    testOrderId,
    testPaymentId,
    "bad_forged_signature_0000000000000000000000000000000000000000000000000000000000000000",
    testSecret
  );
  assert(isForgedSigValid === false, "Forged signature properly rejected");

  // 3.3 Tampered Order ID with Signature Rejected
  const isTamperedOrderSigValid = PaymentService.verifySignature(
    "order_tampered_9999",
    testPaymentId,
    validSignature,
    testSecret
  );
  assert(isTamperedOrderSigValid === false, "Signature with mismatched order ID rejected");

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: PAYMENT LIFECYCLE (PENDING → PAID) & INVOICE GENERATION
  // ----------------------------------------------------------------------------
  console.log("\n💳 [TEST GROUP 4] Payment Lifecycle & Official Invoice Generation");

  let invoiceA;
  try {
    const verified = await PaymentService.verifyAndRecordPayment({
      registrationId: REG_A_ID,
      userId: USER_A_ID,
      paymentOrderId: orderA.id,
      providerOrderId: orderA.providerOrderId,
      providerPaymentId: `pay_test_${crypto.randomBytes(6).toString("hex")}`,
      providerSignature: "mock_sig_verified_for_test",
      paymentMethod: "UPI",
    });

    assert(verified.order.status === "PAID", "Order status transitioned to PAID");
    assert(verified.order.paidAt !== null, "Order records paid timestamp");
    assert(verified.invoice !== null, "Official invoice automatically generated");
    assert(verified.invoice.invoiceNumber.startsWith("KKC26-INV-"), `Invoice number format: ${verified.invoice.invoiceNumber}`);
    assert(verified.invoice.totalAmountPaise === orderA.amountPaise, "Invoice amount matches order amount");
    invoiceA = verified.invoice;
  } catch (e) {
    assert(false, `Payment verification and recording failed: ${e.message}`);
  }

  // 4.2 Prevent Double Payment on Already Paid Registration
  try {
    await PaymentService.createPaymentOrder({
      registrationId: REG_A_ID,
      userId: USER_A_ID,
    });
    assert(false, "Already paid registration should reject new payment order creation");
  } catch (e) {
    assert(e.message.includes("already been fully paid"), `Double payment attempt blocked: ${e.message}`);
  }

  // 4.3 Invoice Retrieval for Authorized Owner
  try {
    const retrievedInv = await PaymentService.getInvoiceByRegistrationId(REG_A_ID, USER_A_ID);
    assert(retrievedInv !== null, "Authorized owner can retrieve official invoice");
    assert(retrievedInv.invoiceNumber === invoiceA.invoiceNumber, "Retrieved invoice matches generated invoice");
  } catch (e) {
    assert(false, `Authorized invoice retrieval failed: ${e.message}`);
  }

  // 4.4 Invoice Retrieval Denied to Other User (IDOR check)
  try {
    await PaymentService.getInvoiceByRegistrationId(REG_A_ID, USER_B_ID);
    assert(false, "Unauthorized user should not access another registrant's invoice");
  } catch (e) {
    assert(
      e.message.includes("Unauthorized") || e.message.includes("permission"),
      `IDOR invoice access blocked: ${e.message}`
    );
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 5: WEBHOOK PROCESSING & IDEMPOTENCY
  // ----------------------------------------------------------------------------
  console.log("\n🔔 [TEST GROUP 5] Webhook Processing, Verification & Idempotency");

  const webhookSecret = "mock_webhook_secret_for_local_dev";
  const testEventId = `evt_test_${crypto.randomBytes(8).toString("hex")}`;

  // Create a separate registration for webhook testing
  const REG_WEBHOOK_ID = "reg-wh-test-002";
  const whOrderRes = await PaymentService.createPaymentOrder({
    registrationId: REG_WEBHOOK_ID,
    userId: USER_A_ID,
  });

  const webhookPayload = {
    event: "payment.captured",
    event_id: testEventId,
    payload: {
      payment: {
        entity: {
          id: `pay_wh_${crypto.randomBytes(6).toString("hex")}`,
          order_id: whOrderRes.order.providerOrderId,
          amount: whOrderRes.order.amountPaise,
          currency: "INR",
          method: "card",
        },
      },
    },
  };

  const rawBody = JSON.stringify(webhookPayload);
  const validWebhookSig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  // 5.1 Invalid Webhook Signature Rejected
  try {
    await PaymentService.processWebhook({
      rawBody,
      signatureHeader: "bad_signature_123456",
      eventPayload: webhookPayload,
    });
    assert(false, "Invalid webhook signature should be rejected");
  } catch (e) {
    assert(e.message.includes("Invalid webhook signature"), `Forged webhook blocked: ${e.message}`);
  }

  // 5.2 Valid Webhook Processed
  try {
    const whResult = await PaymentService.processWebhook({
      rawBody,
      signatureHeader: validWebhookSig,
      eventPayload: webhookPayload,
    });
    assert(whResult.status === "SUCCESS", `Valid webhook successfully processed (Status: ${whResult.status})`);
  } catch (e) {
    assert(false, `Webhook processing failed: ${e.message}`);
  }

  // 5.3 Duplicate Webhook Idempotency (Same Event ID)
  try {
    const dupResult = await PaymentService.processWebhook({
      rawBody,
      signatureHeader: validWebhookSig,
      eventPayload: webhookPayload,
    });
    assert(
      dupResult.status === "ALREADY_PROCESSED",
      `Duplicate webhook event is strictly idempotent without double-credit (Status: ${dupResult.status})`
    );
  } catch (e) {
    assert(false, `Idempotent webhook check failed: ${e.message}`);
  }

  // 5.4 Amount Mismatch in Webhook Rejected
  const mismatchEventId = `evt_mismatch_${crypto.randomBytes(8).toString("hex")}`;
  const REG_MISMATCH_ID = "reg-mismatch-test-003";
  const mismatchOrderRes = await PaymentService.createPaymentOrder({
    registrationId: REG_MISMATCH_ID,
    userId: USER_A_ID,
  });

  const mismatchPayload = {
    event: "payment.captured",
    event_id: mismatchEventId,
    payload: {
      payment: {
        entity: {
          id: `pay_tampered_${crypto.randomBytes(6).toString("hex")}`,
          order_id: mismatchOrderRes.order.providerOrderId,
          amount: 50000, // Tampered: expected 150000
          currency: "INR",
        },
      },
    },
  };
  const mismatchRawBody = JSON.stringify(mismatchPayload);
  const mismatchSig = crypto.createHmac("sha256", webhookSecret).update(mismatchRawBody).digest("hex");

  try {
    await PaymentService.processWebhook({
      rawBody: mismatchRawBody,
      signatureHeader: mismatchSig,
      eventPayload: mismatchPayload,
    });
    assert(false, "Amount mismatch should have been rejected");
  } catch (e) {
    assert(e.message.includes("Amount mismatch"), `Webhook amount manipulation prevented: ${e.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 6: ADMINISTRATIVE REFUNDS
  // ----------------------------------------------------------------------------
  console.log("\n↩️ [TEST GROUP 6] Administrative Refund Architecture");

  // 6.1 Partial Refund
  try {
    const partialRefund = await PaymentService.issueRefund({
      paymentOrderId: orderA.id,
      amountPaise: 50000, // ₹500 partial refund
      reason: "Category change fee adjustment",
      adminUserId: "admin-finance-001",
    });
    assert(partialRefund.status === "COMPLETED", `Partial refund completed (Status: ${partialRefund.status})`);
    assert(partialRefund.amountPaise === 50000, `Refunded 50000 paise (Found: ${partialRefund.amountPaise})`);
    assert(partialRefund.providerRefundId.startsWith("rfnd_"), "Provider refund ID recorded");

    const statusAfterPartial = await PaymentService.getPaymentStatus(REG_A_ID, USER_A_ID);
    assert(
      statusAfterPartial.paymentStatus === "PARTIALLY_REFUNDED",
      `Order status reflects partial refund: ${statusAfterPartial.paymentStatus}`
    );
  } catch (e) {
    assert(false, `Partial refund failed: ${e.message}`);
  }

  // 6.2 Full Refund
  try {
    const fullRefund = await PaymentService.issueRefund({
      paymentOrderId: orderA.id,
      amountPaise: 150000, // Full refund
      reason: "Medical withdrawal approved by tournament director",
      adminUserId: "admin-finance-001",
    });
    assert(fullRefund.status === "COMPLETED", "Full refund executed");

    const statusAfterFull = await PaymentService.getPaymentStatus(REG_A_ID, USER_A_ID);
    assert(statusAfterFull.paymentStatus === "REFUNDED", `Order status is REFUNDED: ${statusAfterFull.paymentStatus}`);
  } catch (e) {
    assert(false, `Full refund failed: ${e.message}`);
  }

  // 6.3 Over-Refund Rejected
  const REG_REFUND_ID = "reg-refund-test-004";
  const refOrderRes = await PaymentService.createPaymentOrder({
    registrationId: REG_REFUND_ID,
    userId: USER_A_ID,
  });
  await PaymentService.verifyAndRecordPayment({
    registrationId: REG_REFUND_ID,
    userId: USER_A_ID,
    paymentOrderId: refOrderRes.order.id,
    providerOrderId: refOrderRes.order.providerOrderId,
    providerPaymentId: `pay_test_${crypto.randomBytes(6).toString("hex")}`,
    providerSignature: "mock_sig_verified_for_test",
    paymentMethod: "UPI",
  });

  try {
    await PaymentService.issueRefund({
      paymentOrderId: refOrderRes.order.id,
      amountPaise: 9999999, // Exceeds original order amount
      reason: "Invalid excess refund",
      adminUserId: "admin-finance-001",
    });
    assert(false, "Excess refund should have been rejected");
  } catch (e) {
    assert(e.message.includes("Invalid refund amount"), `Excess refund blocked: ${e.message}`);
  }

  // 6.4 Refund on Already-Refunded Order Blocked
  try {
    await PaymentService.issueRefund({
      paymentOrderId: orderA.id,
      amountPaise: 10000,
      reason: "Double refund attempt",
      adminUserId: "admin-finance-001",
    });
    assert(false, "Refund on already refunded order should be blocked");
  } catch (e) {
    assert(e.message.includes("REFUNDED state"), `Duplicate refund on refunded order blocked: ${e.message}`);
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 7: FINANCIAL RECONCILIATION SUMMARY
  // ----------------------------------------------------------------------------
  console.log("\n📊 [TEST GROUP 7] Financial Reconciliation Ledger");

  try {
    const recon = await ReconciliationService.getSummary();
    assert(recon.totalPaidPaise >= 0, `Total paid calculated: ${recon.formattedPaid}`);
    assert(recon.totalPendingPaise >= 0, `Total pending calculated: ${recon.formattedPending}`);
    assert(recon.totalAmountDuePaise >= 0, `Total due calculated: ${recon.formattedAmountDue}`);
    assert(recon.ordersByStatus !== undefined, "Orders categorized by PaymentOrderStatus");
  } catch (e) {
    assert(false, `Reconciliation summary query failed: ${e.message}`);
  }

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
