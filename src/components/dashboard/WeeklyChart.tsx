import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { statsApi, WeeklyData } from "@/lib/db";
import { useLocale } from "@/contexts/LocaleContext";

export function WeeklyChart() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<WeeklyData[]>([]);

  useEffect(() => {
    statsApi.weeklyChart().then(setData).catch(() => {});
  }, []);

  // O histórico chega como "2026-09-22"; o rótulo do eixo ("seg") depende do
  // idioma, então é a tela que traduz. O meio-dia evita que o fuso jogue a
  // data para o dia anterior na hora de descobrir o dia da semana.
  const comRotulo = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        day: new Date(`${d.date}T12:00:00`).toLocaleDateString(
          locale === "pt" ? "pt-BR" : "en-US",
          { weekday: "short" }
        ),
      })),
    [data, locale]
  );

  // O histórico agora sempre volta com os sete dias, então "sem dados" virou
  // "a semana inteira zerada" — um gráfico reto no zero não informa nada.
  const semDados = comRotulo.every((d) => d.tasks === 0 && d.habits === 0);

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "150ms" }}>
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{t("chartTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("chartSubtitle")}</p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-widget-tasks" />
          <span className="text-xs text-muted-foreground">{t("chartTasks")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-widget-habits" />
          <span className="text-xs text-muted-foreground">{t("chartHabits")}</span>
        </div>
      </div>

      {semDados ? (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
          {t("chartNoData")}
        </div>
      ) : (
        <div className="h-[180px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={comRotulo}>
              <defs>
                <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="tasks" stroke="hsl(173, 80%, 40%)" strokeWidth={2} fill="url(#taskGradient)" />
              <Area type="monotone" dataKey="habits" stroke="hsl(262, 83%, 58%)" strokeWidth={2} fill="url(#habitGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
