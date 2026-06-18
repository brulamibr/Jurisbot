"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadArea {
  area: string;
  count: number;
}

const areaColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-muted-foreground",
];

export function LeadsByArea({
  data,
  isLoading,
}: {
  data: LeadArea[];
  isLoading?: boolean;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Área</CardTitle>
        <CardDescription>Distribuição por área jurídica</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum lead classificado por área ainda.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Os dados aparecerão conforme leads forem qualificados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, i) => (
              <div key={item.area}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.area}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${areaColors[i % areaColors.length]}`}
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
