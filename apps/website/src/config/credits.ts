export interface PictureCredit {
  title: string;
  creator?: string;
  source: string;
  sourceUrl: string;
  licence: string;
  licenceUrl: string;
}

export const pictureCredits: readonly PictureCredit[] = [
  {
    title: "A Dutch gold coin scale (Münzwaage)",
    creator: "Jan Linderman (object), Reinhard Saczewski (photograph)",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:A_Dutch_gold_coin_scale_(M%C3%BCnzwaage)_Nemat_Zadeh_Mohammad.jpg",
    licence: "public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
  },
  {
    title: "Pittsboro Merchant Business Ledger",
    source: "Wikimedia Commons",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Pittsboro_Merchant_Business_Ledger_-_DPLA_-_4cbfce8f8f08c14f851ab74af046c082_(page_258).jpg",
    licence: "public domain",
    licenceUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
  },
  {
    title: "Banknote vignette with three putti symbolizing trade and agriculture",
    creator: "Asher Brown Durand, ca. 1824 to 1837",
    source: "The Metropolitan Museum of Art",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/393925",
    licence: "CC0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    title: "Boÿers (Dutch cargo ship)",
    creator: "1647",
    source: "The Metropolitan Museum of Art",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/361527",
    licence: "CC0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
];
