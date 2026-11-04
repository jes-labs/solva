import { Close } from "@/components/layout/close";
import {
  CoverageCheck,
  Opening,
  Proves,
  Questions,
  Readers,
  RecordStage,
  StatSentence,
  TheRecord,
} from "@/features/home";
import { readSupplySnapshot } from "@/lib/stellar-supply";

export default async function HomePage() {
  const snapshot = await readSupplySnapshot();
  return (
    <>
      <Opening />
      <StatSentence snapshot={snapshot} />
      <TheRecord />
      <RecordStage />
      <Proves />
      <Readers />
      <CoverageCheck />
      <Questions />
      <Close />
    </>
  );
}
