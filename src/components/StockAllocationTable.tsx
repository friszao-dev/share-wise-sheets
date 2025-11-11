import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Stock {
  id: string;
  name: string;
  previousPrice: number;
  currentPrice: number;
  lpa: number; // Lucro por Ação
  growthRate: number; // Taxa de crescimento esperada (%)
}

const StockAllocationTable = () => {
  const [totalInvestment, setTotalInvestment] = useState(1000);
  const [selicRate, setSelicRate] = useState(10.5); // Taxa Selic em %
  const [stocks, setStocks] = useState<Stock[]>([
    { id: "1", name: "A1", previousPrice: 10, currentPrice: 10, lpa: 0.5, growthRate: 5 },
    { id: "2", name: "A2", previousPrice: 10, currentPrice: 10, lpa: 0.5, growthRate: 5 },
    { id: "3", name: "A3", previousPrice: 10, currentPrice: 10, lpa: 0.5, growthRate: 5 },
    { id: "4", name: "A4", previousPrice: 10, currentPrice: 10, lpa: 0.5, growthRate: 5 },
    { id: "5", name: "A5", previousPrice: 10, currentPrice: 10, lpa: 0.5, growthRate: 5 },
  ]);

  const calculateVariation = (stock: Stock) => {
    return ((stock.currentPrice / stock.previousPrice) - 1) * 100;
  };

  const calculateInverseWeight = (variation: number) => {
    return 1 / (1 + variation / 100);
  };

  // Fórmula de Graham (Simples): Valor Intrínseco = LPA × (8.5 + 2g) × (4.4 / Taxa Selic)
  const calculateIntrinsicValue = (stock: Stock) => {
    if (!stock.lpa || !stock.growthRate || !selicRate) return 0;
    return stock.lpa * (8.5 + 2 * stock.growthRate) * (4.4 / selicRate);
  };

  // Margem de Segurança = (Valor Intrínseco - Preço Atual) / Valor Intrínseco × 100
  const calculateSafetyMargin = (intrinsicValue: number, currentPrice: number) => {
    if (!intrinsicValue) return 0;
    return ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
  };

  const calculateAllocations = () => {
    const variations = stocks.map(s => calculateVariation(s));
    const inverseWeights = variations.map(v => calculateInverseWeight(v));
    const totalWeight = inverseWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = inverseWeights.map(w => w / totalWeight);
    
    return stocks.map((stock, index) => {
      const intrinsicValue = calculateIntrinsicValue(stock);
      const safetyMargin = calculateSafetyMargin(intrinsicValue, stock.currentPrice);
      
      return {
        ...stock,
        variation: variations[index],
        inverseWeight: inverseWeights[index],
        normalizedWeight: normalizedWeights[index],
        investmentPercentage: normalizedWeights[index],
        investmentValue: normalizedWeights[index] * totalInvestment,
        intrinsicValue,
        safetyMargin,
      };
    });
  };

  const allocations = calculateAllocations();

  const addStock = () => {
    const newId = (Math.max(...stocks.map(s => parseInt(s.id)), 0) + 1).toString();
    setStocks([...stocks, {
      id: newId,
      name: `A${newId}`,
      previousPrice: 10,
      currentPrice: 10,
      lpa: 0.5,
      growthRate: 5,
    }]);
  };

  const removeStock = (id: string) => {
    if (stocks.length > 1) {
      setStocks(stocks.filter(s => s.id !== id));
    } else {
      toast.error("Você precisa ter pelo menos uma ação");
    }
  };

  const updateStock = (id: string, field: keyof Stock, value: string | number) => {
    setStocks(stocks.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const exportToExcel = () => {
    const data = allocations.map(a => ({
      "Ação": a.name,
      "Preço Anterior": a.previousPrice.toFixed(2),
      "Preço Atual": a.currentPrice.toFixed(2),
      "LPA": a.lpa.toFixed(2),
      "Taxa Crescimento (%)": a.growthRate.toFixed(1),
      "Valor Intrínseco (R$)": a.intrinsicValue.toFixed(2),
      "Margem Segurança (%)": a.safetyMargin.toFixed(2),
      "Variação (%)": a.variation.toFixed(2),
      "Peso (Inverso)": a.inverseWeight.toFixed(4),
      "Peso Normalizado": a.normalizedWeight.toFixed(4),
      "% do Investimento": (a.investmentPercentage * 100).toFixed(2) + "%",
      "Valor a Investir (R$)": a.investmentValue.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alocação");

    // Adicionar valor total de investimento
    XLSX.utils.sheet_add_aoa(ws, [["Valor Total a Investir (R$)", totalInvestment]], { origin: "A1" });

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 10 }, // Ação
      { wch: 15 }, // Preço Anterior
      { wch: 15 }, // Preço Atual
      { wch: 10 }, // LPA
      { wch: 18 }, // Taxa Crescimento
      { wch: 20 }, // Valor Intrínseco
      { wch: 20 }, // Margem Segurança
      { wch: 15 }, // Variação
      { wch: 15 }, // Peso Inverso
      { wch: 18 }, // Peso Normalizado
      { wch: 20 }, // % Investimento
      { wch: 22 }, // Valor a Investir
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, "alocacao_acoes.xlsx");
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold">Calculadora de Alocação de Ações</CardTitle>
          <CardDescription>
            Calcule automaticamente a alocação ideal de investimentos baseada na performance das ações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Total a Investir (R$)</label>
              <Input
                type="number"
                value={totalInvestment}
                onChange={(e) => setTotalInvestment(Number(e.target.value))}
                className="text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Taxa Selic (%)</label>
              <Input
                type="number"
                step="0.1"
                value={selicRate}
                onChange={(e) => setSelicRate(Number(e.target.value))}
                className="text-lg font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button onClick={addStock} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Ação
            </Button>
            <Button onClick={exportToExcel} className="gap-2 bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Ação</TableHead>
                  <TableHead className="font-semibold">Preço Anterior</TableHead>
                  <TableHead className="font-semibold">Preço Atual</TableHead>
                  <TableHead className="font-semibold">LPA</TableHead>
                  <TableHead className="font-semibold">Cresc. (%)</TableHead>
                  <TableHead className="font-semibold">Valor Justo</TableHead>
                  <TableHead className="font-semibold">Margem Seg. (%)</TableHead>
                  <TableHead className="font-semibold">Variação (%)</TableHead>
                  <TableHead className="font-semibold">Peso Inverso</TableHead>
                  <TableHead className="font-semibold">Peso Norm.</TableHead>
                  <TableHead className="font-semibold">% Invest.</TableHead>
                  <TableHead className="font-semibold">Valor (R$)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <Input
                        value={allocation.name}
                        onChange={(e) => updateStock(allocation.id, "name", e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={allocation.previousPrice}
                        onChange={(e) => updateStock(allocation.id, "previousPrice", Number(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={allocation.currentPrice}
                        onChange={(e) => updateStock(allocation.id, "currentPrice", Number(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={allocation.lpa}
                        onChange={(e) => updateStock(allocation.id, "lpa", Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        value={allocation.growthRate}
                        onChange={(e) => updateStock(allocation.id, "growthRate", Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-accent">
                      R$ {allocation.intrinsicValue.toFixed(2)}
                    </TableCell>
                    <TableCell className={allocation.safetyMargin >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {allocation.safetyMargin.toFixed(1)}%
                    </TableCell>
                    <TableCell className={allocation.variation >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {allocation.variation.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {allocation.inverseWeight.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {allocation.normalizedWeight.toFixed(4)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {(allocation.investmentPercentage * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      R$ {allocation.investmentValue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStock(allocation.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Total Alocado:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {allocations.reduce((sum, a) => sum + a.investmentValue, 0).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAllocationTable;
