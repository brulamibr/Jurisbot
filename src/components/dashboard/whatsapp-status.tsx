"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Wifi, WifiOff, QrCode, Loader2 } from "lucide-react";

interface WhatsappInstance {
  id: string;
  name: string;
  phone: string | null;
  status: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }
> = {
  CONNECTED: { label: "Conectado", variant: "default", icon: Wifi },
  DISCONNECTED: { label: "Desconectado", variant: "outline", icon: WifiOff },
  CONNECTING: { label: "Conectando...", variant: "secondary", icon: Loader2 },
  QR_READY: { label: "QR Code Pronto", variant: "secondary", icon: QrCode },
};

export function WhatsappStatus({
  instances,
  isLoading,
}: {
  instances: WhatsappInstance[];
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-4 w-4" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : instances.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
            <WifiOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Nenhuma instância configurada
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {instances.map((instance) => {
              const config = statusConfig[instance.status] ?? statusConfig.DISCONNECTED;
              const StatusIcon = config.icon;

              return (
                <div
                  key={instance.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={`h-4 w-4 ${
                        instance.status === "CONNECTED"
                          ? "text-success"
                          : instance.status === "CONNECTING"
                            ? "animate-spin text-muted-foreground"
                            : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{instance.name}</p>
                      {instance.phone && (
                        <p className="text-xs text-muted-foreground">
                          {instance.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
