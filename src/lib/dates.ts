// ==============================================
// Datas
// ==============================================
// O app trabalha com "dias" no fuso de quem está usando, não em UTC.
// Marcar um hábito às 22h em Porto Alegre tem que cair no dia de hoje —
// em UTC já seria amanhã. Por isso nada aqui usa toISOString().

/** O dia de uma data, no formato "YYYY-MM-DD", no fuso local. */
export function dayKey(date: Date = new Date()): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** O dia anterior a uma chave "YYYY-MM-DD". Atravessa mês, ano e bissexto. */
export function previousDay(key: string): string {
  const [ano, mes, dia] = key.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() - 1);
  return dayKey(data);
}

/** As últimas N chaves de dia em ordem cronológica, terminando no dia de `from`. */
export function lastNDays(n: number, from: Date = new Date()): string[] {
  const dias: string[] = [];
  for (let atras = n - 1; atras >= 0; atras--) {
    const data = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    data.setDate(data.getDate() - atras);
    dias.push(dayKey(data));
  }
  return dias;
}
