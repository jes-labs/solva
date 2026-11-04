export interface StellarAsset {
  code: string;
  issuer: string;
  issuerName: string;
  homeDomain: string;
  currency: string;
}

export const STELLAR_DECIMALS = 7;

export const watchedAssets: readonly StellarAsset[] = [
  {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    issuerName: "Circle",
    homeDomain: "circle.com",
    currency: "USD",
  },
  {
    code: "EURC",
    issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
    issuerName: "Circle",
    homeDomain: "circle.com",
    currency: "EUR",
  },
  {
    code: "ARST",
    issuer: "GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG",
    issuerName: "Latamex",
    homeDomain: "pubnet-sep.latamex.com",
    currency: "ARS",
  },
  {
    code: "ARS",
    issuer: "GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS",
    issuerName: "Anclap",
    homeDomain: "anclap.com",
    currency: "ARS",
  },
  {
    code: "GYEN",
    issuer: "GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB",
    issuerName: "GMO Trust",
    homeDomain: "stablecoin.z.com",
    currency: "JPY",
  },
  {
    code: "CLPX",
    issuer: "GDYSPBVZHPQTYMGSYNOHRZQNLB3ZWFVQ2F7EP7YBOLRGD42XIC3QUX5G",
    issuerName: "CLPX",
    homeDomain: "clpx.finance",
    currency: "CLP",
  },
  {
    code: "AUDD",
    issuer: "GDC7X2MXTYSAKUUGAIQ7J7RPEIM7GXSAIWFYWWH4GLNFECQVJJLB2EEU",
    issuerName: "Novatti",
    homeDomain: "audd.digital",
    currency: "AUD",
  },
];

export const horizon = {
  url: "https://horizon.stellar.org",
  asset: (asset: StellarAsset) =>
    `https://stellar.expert/explorer/public/asset/${asset.code}-${asset.issuer}`,
} as const;
