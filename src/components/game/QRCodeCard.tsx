"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export interface QRCodeCardProps {
  gameId: string;
  url: string;
  size?: number;
}

export function QRCodeCard({ gameId, url, size = 200 }: QRCodeCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center font-mono text-3xl">
          Game ID: {gameId}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={url} size={size} level="H" marginSize={4} />
        </div>
        <p className="mt-4 break-all text-center text-muted-foreground text-xs">
          {url}
        </p>
      </CardContent>
    </Card>
  );
}
