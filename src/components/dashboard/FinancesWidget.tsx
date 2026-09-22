import { useState, useEffect } from "react";
import { Plus, Wallet, TrendingUp, TrendingDown, CreditCard, Receipt, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { billsApi, transactionsApi, Bill, Transaction } from "@/lib/db";
import { dayKey } from "@/lib/dates";
import { useLocale } from "@/contexts/LocaleContext";

/**
 * A data da transação é guardada como "2026-09-22" para dar para somar por mês.
 * Aqui ela vira o "22/09" curto que aparece na lista. O meio-dia evita que o
 * fuso jogue a data para o dia anterior.
 */
function dataCurta(iso: string, locale: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function FinancesWidget() {
  const { t, locale } = useLocale();
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"bills" | "transactions">("bills");
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newBill, setNewBill] = useState({ name: "", amount: "", dueDate: "", category: "Serviços" });
  const [newTransaction, setNewTransaction] = useState({ description: "", amount: "", type: "expense" as "income" | "expense" });
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState({ name: "", amount: "", dueDate: "", category: "" });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState({ description: "", amount: "", type: "expense" as "income" | "expense" });

  useEffect(() => {
    billsApi.list().then(setBills).catch(() => {});
    transactionsApi.list().then(setTransactions).catch(() => {});
  }, []);

  const toggleBillPaid = async (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    try {
      await billsApi.update(id, { paid: !bill.paid });
      setBills(bills.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
    } catch {}
  };

  const deleteBill = async (id: string) => {
    try { await billsApi.delete(id); setBills(bills.filter(b => b.id !== id)); } catch {}
  };

  const deleteTransaction = async (id: string) => {
    try { await transactionsApi.delete(id); setTransactions(transactions.filter(t => t.id !== id)); } catch {}
  };

  const addBill = async () => {
    if (!newBill.name.trim() || !newBill.amount || !newBill.dueDate) return;
    try {
      const bill = await billsApi.create({ name: newBill.name, amount: parseFloat(newBill.amount), dueDate: newBill.dueDate, category: newBill.category, paid: false });
      setBills([...bills, bill]);
      setNewBill({ name: "", amount: "", dueDate: "", category: "Serviços" });
      setShowAddBill(false);
    } catch {}
  };

  const addTransaction = async () => {
    if (!newTransaction.description.trim() || !newTransaction.amount) return;
    try {
      const t = await transactionsApi.create({ description: newTransaction.description, amount: parseFloat(newTransaction.amount), type: newTransaction.type, date: dayKey() });
      setTransactions([t, ...transactions]);
      setNewTransaction({ description: "", amount: "", type: "expense" });
      setShowAddTransaction(false);
    } catch {}
  };

  const startEditingBill = (bill: Bill) => {
    setEditingBillId(bill.id);
    setEditingBill({ name: bill.name, amount: bill.amount.toString(), dueDate: bill.dueDate, category: bill.category });
  };

  const saveEditBill = async () => {
    if (!editingBill.name.trim() || !editingBill.amount || !editingBillId) return;
    try {
      await billsApi.update(editingBillId, { name: editingBill.name, amount: parseFloat(editingBill.amount), dueDate: editingBill.dueDate, category: editingBill.category });
      setBills(bills.map(b => b.id === editingBillId ? { ...b, name: editingBill.name, amount: parseFloat(editingBill.amount), dueDate: editingBill.dueDate, category: editingBill.category } : b));
      setEditingBillId(null);
    } catch {}
  };

  const cancelEditBill = () => { setEditingBillId(null); };

  const startEditingTransaction = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setEditingTransaction({ description: t.description, amount: t.amount.toString(), type: t.type });
  };

  const saveEditTransaction = async () => {
    if (!editingTransaction.description.trim() || !editingTransaction.amount || !editingTransactionId) return;
    try {
      await transactionsApi.update(editingTransactionId, { description: editingTransaction.description, amount: parseFloat(editingTransaction.amount), type: editingTransaction.type });
      setTransactions(transactions.map(t => t.id === editingTransactionId ? { ...t, description: editingTransaction.description, amount: parseFloat(editingTransaction.amount), type: editingTransaction.type } : t));
      setEditingTransactionId(null);
    } catch {}
  };

  const cancelEditTransaction = () => { setEditingTransactionId(null); };

  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const paidBills = bills.filter(b => b.paid).reduce((sum, b) => sum + b.amount, 0);
  const pendingBills = bills.filter(b => !b.paid).reduce((sum, b) => sum + b.amount, 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expensesFromTransactions = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expensesFromTransactions + paidBills;
  const balance = totalIncome - totalExpenses;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 animate-fade-in" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-widget-finance" />
            {t("financesTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("financesSubtitle")}</p>
        </div>
        <Wallet className="w-5 h-5 text-widget-finance" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t("financesIncome")}</p>
          <p className="text-sm font-semibold text-emerald-500">R$ {totalIncome.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <TrendingDown className="w-4 h-4 text-rose-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t("financesExpenses")}</p>
          <p className="text-sm font-semibold text-rose-500">R$ {totalExpenses.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <Wallet className="w-4 h-4 text-widget-finance mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t("financesBalance")}</p>
          <p className={`text-sm font-semibold ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {balance.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setActiveTab("bills")} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === "bills" ? "bg-widget-finance text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
          <Receipt className="w-4 h-4" /> {t("financesBills")}
        </button>
        <button type="button" onClick={() => setActiveTab("transactions")} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === "transactions" ? "bg-widget-finance text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
          <CreditCard className="w-4 h-4" /> {t("financesTransactions")}
        </button>
      </div>

      {/* Bills Tab */}
      {activeTab === "bills" && (
        <>
          <div className="flex items-center justify-between mb-3 p-2 bg-rose-500/10 rounded-lg">
            <span className="text-xs text-rose-500">{t("financesPending")}:</span>
            <span className="text-sm font-semibold text-rose-500">R$ {pendingBills.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          {showAddBill ? (
            <div className="space-y-2 mb-3 p-3 bg-secondary/30 rounded-lg">
              <Input placeholder="Nome da conta" value={newBill.name} onChange={(e) => setNewBill({ ...newBill, name: e.target.value })} className="bg-background/50 border-border/50 h-9" />
              <div className="flex gap-2">
                <Input placeholder="Valor" type="number" value={newBill.amount} onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })} className="bg-background/50 border-border/50 h-9" />
                <Input placeholder="Dia" type="number" min="1" max="31" value={newBill.dueDate} onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })} className="bg-background/50 border-border/50 h-9 w-20" />
              </div>
              <Select value={newBill.category} onValueChange={(v) => setNewBill({ ...newBill, category: v })}>
                <SelectTrigger className="bg-background/50 border-border/50 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Moradia">Moradia</SelectItem>
                  <SelectItem value="Serviços">Serviços</SelectItem>
                  <SelectItem value="Lazer">Lazer</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddBill(false)} variant="ghost" size="sm" className="flex-1">{t("cancel")}</Button>
                <Button onClick={addBill} size="sm" className="flex-1 bg-widget-finance hover:bg-widget-finance/90">{t("add")}</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddBill(true)} variant="ghost" size="sm" className="w-full mb-3 border border-dashed border-border hover:border-widget-finance/50">
              <Plus className="w-4 h-4 mr-2" /> {t("financesNewBill")}
            </Button>
          )}

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {bills.map((bill) => (
              <div key={bill.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${bill.paid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-secondary/50 border border-transparent hover:border-widget-finance/30'}`}>
                {editingBillId === bill.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input value={editingBill.name} onChange={(e) => setEditingBill({ ...editingBill, name: e.target.value })} className="bg-background/50 border-border/50 h-8" />
                      <Input type="number" value={editingBill.amount} onChange={(e) => setEditingBill({ ...editingBill, amount: e.target.value })} className="bg-background/50 border-border/50 h-8 w-24" />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input value={editingBill.dueDate} onChange={(e) => setEditingBill({ ...editingBill, dueDate: e.target.value })} className="bg-background/50 border-border/50 h-8 w-16" />
                      <Select value={editingBill.category} onValueChange={(v) => setEditingBill({ ...editingBill, category: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 h-8 flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Moradia">Moradia</SelectItem>
                          <SelectItem value="Serviços">Serviços</SelectItem>
                          <SelectItem value="Lazer">Lazer</SelectItem>
                          <SelectItem value="Saúde">Saúde</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <button type="button" onClick={saveEditBill} className="p-1" aria-label={t("save")}><Check className="w-4 h-4 text-emerald-500" /></button>
                      <button type="button" onClick={cancelEditBill} className="p-1" aria-label={t("cancel")}><X className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => toggleBillPaid(bill.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${bill.paid ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground hover:border-widget-finance'}`} aria-label={bill.paid ? t("financesMarkUnpaid") : t("financesMarkPaid")}>
                      {bill.paid && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${bill.paid ? 'line-through text-muted-foreground' : ''}`}>{bill.name}</p>
                      <p className="text-xs text-muted-foreground">{t("financesDay")} {bill.dueDate} • {bill.category}</p>
                    </div>
                    <span className={`text-sm font-semibold ${bill.paid ? 'text-muted-foreground' : ''}`}>R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <button type="button" onClick={() => startEditingBill(bill)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={t("financesEditBill")}><Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" /></button>
                    <button type="button" onClick={() => deleteBill(bill.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={t("financesDeleteBill")}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <>
          {showAddTransaction ? (
            <div className="space-y-2 mb-3 p-3 bg-secondary/30 rounded-lg">
              <Input placeholder="Descrição" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} className="bg-background/50 border-border/50 h-9" />
              <div className="flex gap-2">
                <Input placeholder="Valor" type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} className="bg-background/50 border-border/50 h-9" />
                <Select value={newTransaction.type} onValueChange={(v: "income" | "expense") => setNewTransaction({ ...newTransaction, type: v })}>
                  <SelectTrigger className="bg-background/50 border-border/50 h-9 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{t("financesIncomeType")}</SelectItem>
                    <SelectItem value="expense">{t("financesExpenseType")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddTransaction(false)} variant="ghost" size="sm" className="flex-1">{t("cancel")}</Button>
                <Button onClick={addTransaction} size="sm" className="flex-1 bg-widget-finance hover:bg-widget-finance/90">{t("add")}</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddTransaction(true)} variant="ghost" size="sm" className="w-full mb-3 border border-dashed border-border hover:border-widget-finance/50">
              <Plus className="w-4 h-4 mr-2" /> {t("financesNewTransaction")}
            </Button>
          )}

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 group">
                {editingTransactionId === transaction.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input value={editingTransaction.description} onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })} className="bg-background/50 border-border/50 h-8 flex-1" />
                    <Input type="number" value={editingTransaction.amount} onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })} className="bg-background/50 border-border/50 h-8 w-24" />
                    <Select value={editingTransaction.type} onValueChange={(v: "income" | "expense") => setEditingTransaction({ ...editingTransaction, type: v })}>
                      <SelectTrigger className="bg-background/50 border-border/50 h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">{t("financesIncomeType")}</SelectItem>
                        <SelectItem value="expense">{t("financesExpenseType")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={saveEditTransaction} className="p-1" aria-label={t("save")}><Check className="w-4 h-4 text-emerald-500" /></button>
                    <button type="button" onClick={cancelEditTransaction} className="p-1" aria-label={t("cancel")}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                ) : (
                  <>
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      {transaction.type === "income" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{dataCurta(transaction.date, locale)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button type="button" onClick={() => startEditingTransaction(transaction)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={t("financesEditTransaction")}><Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" /></button>
                    <button type="button" onClick={() => deleteTransaction(transaction.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={t("financesDeleteTransaction")}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
