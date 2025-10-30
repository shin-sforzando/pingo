import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StepCardProps {
  /**
   * Step title
   */
  title: string;
  /**
   * Step description text
   */
  description: string;
  /**
   * Image source path
   */
  imageSrc: string;
  /**
   * Image alt text for accessibility
   */
  imageAlt: string;
}

/**
 * Card component displaying a single step in the how-to-play guide
 * Shows title, description, and screenshot image
 */
export function StepCard({
  title,
  description,
  imageSrc,
  imageAlt,
}: StepCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground text-sm">{description}</p>
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-lg border-4 border-gray-300 shadow-xl">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            loading="lazy"
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 384px"
          />
        </div>
      </CardContent>
    </Card>
  );
}
