import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { transactionsApi, Transaction } from "@/lib/db";
import { useLocale } from "@/contexts/LocaleContext";

const QUANTIDADE = 6;

function dataCurta(iso: string, locale: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Coluna lateral com as últimas transações — link "ver todas" leva pra Finanças. */
export function RecentTransactionsWidget() {
  const { t, locale } = useLocale();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    transactionsApi.list().then(setTransactions).catch(() => {});
  }, []);

  const ultimas = transactions.slice(0, QUANTIDADE);

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 animate-fade-in h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{t("recentTransactionsTitle")}</h3>
        <Link to="/financas" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          {t("recentTransactionsSeeAll")} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {ultimas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("recentTransactionsEmpty")}</p>
      ) : (
        <div className="space-y-1">
          {ultimas.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-3 py-2">
              <div className={`p-2 rounded-lg shrink-0 ${transaction.type === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                {transaction.type === "income" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {dataCurta(transaction.date, locale)} • {transaction.category ?? "Outros"}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${transaction.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                {transaction.type === "income" ? "+" : "-"} {formatarReais(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
