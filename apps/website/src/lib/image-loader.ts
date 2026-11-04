const SIZED = /^(\/images\/archive\/.+)-(400|800|1600)\.webp$/;
const WIDTHS = [400, 800, 1600] as const;

interface LoaderInput {
  src: string;
  width: number;
}

export default function imageLoader({ src, width }: LoaderInput): string {
  const match = SIZED.exec(src);
  if (!match) return src;
  const target = WIDTHS.find((candidate) => candidate >= width) ?? 1600;
  return `${match[1]}-${target}.webp`;
}
