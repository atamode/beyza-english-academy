export const PAYMENT_INSTRUCTIONS = Object.freeze({
  bankName: "Garanti Bankası",
  accountHolder: "Nurettin Ata Çetinkayalı",
  iban: "TR280006200129200006643010"
});

export function hasPaymentInstructions(config = PAYMENT_INSTRUCTIONS) {
  return Boolean(config.bankName && config.accountHolder && config.iban);
}
