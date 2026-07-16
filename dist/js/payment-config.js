export const PAYMENT_INSTRUCTIONS = Object.freeze({
  bankName: "",
  accountHolder: "",
  iban: ""
});

export function hasPaymentInstructions(config = PAYMENT_INSTRUCTIONS) {
  return Boolean(config.bankName && config.accountHolder && config.iban);
}
