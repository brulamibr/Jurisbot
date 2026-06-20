"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, FileText, Flame, Snowflake, ThermometerSun, XCircle, ExternalLink } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import Link from "next/link";

interface Conversation {
  contact: {
    name: string | null;
    phone: string;
    email: string | null;
    cpf: string | null;
    type: string;
    lead: {
      score: string;
      legalArea: string | null;
      problem: string | null;
      urgency: string | null;
      origin: string | null;
      tags: string[];
    } | null;
    processes: {
      id: string;
      number: string;
      subject: string | null;
      status: string | null;
      legalArea: string | null;
    }[];
  };
}

const scoreConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  COLD: { label: "Frio", icon: Snowflake, className: "text-blue-500" },
  WARM: { label: "Morno", icon: ThermometerSun, className: "text-amber-500" },
  HOT: { label: "Quente", icon: Flame, className: "text-red-500" },
  CONVERTED: { label: "Convertido", icon: FileText, className: "text-green-500" },
  LOST: { label: "Perdido", icon: XCircle, className: "text-zinc-400" },
};

const urgencyLabels: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ContactPanel({ conversation }: { conversation: Conversation }) {
  const { contact } = conversation;
  const name = contact.name ?? formatPhone(contact.phone);

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Contact Info */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 text-sm font-semibold">{name}</h3>
          <Badge variant={contact.type === "CLIENT" ? "default" : "outline"} className="mt-1">
            {contact.type === "CLIENT" ? "Cliente" : "Lead"}
          </Badge>
          <Link
            href="/contacts"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Editar contato
          </Link>
        </div>

        <Separator className="my-4" />

        {/* Contact Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            Contato
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {formatPhone(contact.phone)}
          </div>
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {contact.email}
            </div>
          )}
          {contact.cpf && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              CPF: {contact.cpf}
            </div>
          )}
        </div>

        {/* Lead Info */}
        {contact.lead && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-xs font-medium uppercase text-muted-foreground">
                Qualificação do Lead
              </h4>
              {contact.lead.score && scoreConfig[contact.lead.score] && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = scoreConfig[contact.lead!.score];
                    const Icon = config.icon;
                    return (
                      <>
                        <Icon className={`h-4 w-4 ${config.className}`} />
                        <span className="text-sm font-medium">
                          {config.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
              {contact.lead.legalArea && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Área: </span>
                  {contact.lead.legalArea}
                </div>
              )}
              {contact.lead.problem && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Problema: </span>
                  {contact.lead.problem}
                </div>
              )}
              {contact.lead.urgency && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Urgência: </span>
                  {urgencyLabels[contact.lead.urgency] ?? contact.lead.urgency}
                </div>
              )}
              {contact.lead.origin && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Origem: </span>
                  {contact.lead.origin}
                </div>
              )}
              {contact.lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contact.lead.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Processes */}
        {contact.processes.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-xs font-medium uppercase text-muted-foreground">
                Processos ({contact.processes.length})
              </h4>
              {contact.processes.map((proc) => (
                <div
                  key={proc.id}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{proc.number}</p>
                  {proc.subject && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {proc.subject}
                    </p>
                  )}
                  <div className="mt-1 flex gap-2">
                    {proc.legalArea && (
                      <Badge variant="outline" className="text-xs">
                        {proc.legalArea}
                      </Badge>
                    )}
                    {proc.status && (
                      <Badge variant="secondary" className="text-xs">
                        {proc.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
