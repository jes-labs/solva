import Image from "next/image";
import { cn } from "@/lib/utils";

interface PostCoverProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function PostCover({ src, alt, priority = false, sizes, className }: PostCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[3/2] overflow-hidden border border-line bg-raised",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
        className="object-cover grayscale-[0.2] contrast-[1.05]"
      />
    </div>
  );
}
