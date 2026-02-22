import crypto from "node:crypto";

export const verifyRazorpaySignature = (
  body: string,
  signature: string | null,
  secret: string,
): boolean => {
  if (!signature) {
    console.error("No signature provided for Razorpay webhook");
    return false;
  }
  // never log such thinghs in prod pls, if you want for dev add this if wrapper
  if (process.env.NODE_ENV === "development") {
    console.log("Given signature: ", signature);
  }
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  if (process.env.NODE_ENV === "development") {
    console.log("Expected Signature:", expectedSignature);
  }

  return expectedSignature === signature;
};
