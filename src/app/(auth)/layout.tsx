export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
      <div className="hidden w-1/2 bg-primary lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md space-y-4 px-8 text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight">JurisBot</h2>
          <p className="text-lg opacity-90">
            Automatize o atendimento jurídico do seu escritório via WhatsApp com
            inteligência artificial.
          </p>
          <ul className="space-y-2 text-sm opacity-80">
            <li>Atendimento 24/7 com IA multi-modelo</li>
            <li>Qualificação automática de leads</li>
            <li>Consulta de processos em tempo real</li>
            <li>Dashboard completo com métricas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
