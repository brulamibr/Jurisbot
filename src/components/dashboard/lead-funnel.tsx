"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ScoreData {
  score: string;
  count: number;
}

const scoreConfig: Record<string, { label: string; color: string }> = {
  COLD: { label: "Frio", color: "bg-blue-400" },
  WARM: { label: "Morno", color: "bg-amber-400" },
  HOT: { label: "Quente", color: "bg-red-500" },
  CONVERTED: { label: "Convertido", color: "bg-green-500" },
  LOST: { label: "Perdido", color: "bg-zinc-400" },
};

export function LeadFunnel({
  data,
  totalLeads,
  isLoading,
}: {
  data: ScoreData[];
  totalLeads: number;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Leads</CardTitle>
        <CardDescription>
          {totalLeads} lead{totalLeads !== 1 ? "s" : ""} no total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum lead captado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {["COLD", "WARM", "HOT", "CONVERTED", "LOST"].map((score) => {
              const item = data.find((d) => d.score === score);
              const count = item?.count ?? 0;
              const config = scoreConfig[score];
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div
                  key={score}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <div className={`h-3 w-3 rounded-full ${config.color}`} />
                  <span className="flex-1 text-sm">{config.label}</span>
                  <span className="text-sm font-medium">{count}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
