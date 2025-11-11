import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Trash2, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import brapiService from "@/services/api/brapiService";

interface Stock {
  id: string;
  name: string;
  symbol: string;
  previousPrice: number;
  currentPrice: number;
  lpa: number;
  growthRate: number;
  pl?: number;
  pbv?: number;
  dy?: number;
  roe?: number;
}

const StockAllocationTable = () => {
  const [totalInvestment, setTotalInvestment] = useState(1500);
  const [selicRate, setSelicRate] = useState(10.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([
    { 
      id: "1", 
      name: "Itaú Unibanco", 
      symbol: "ITUB4",
      previousPrice: 28.45, 
      currentPrice: 28.50, 
      lpa: 3.2, 
      growthRate: 5,
      pl: 8.9,
      pbv: 1.7,
      dy: 5.5,
      roe: 21
    },
    { 
      id: "2", 
      name: "Bradesco", 
      symbol: "BBDC4",
      previousPrice: 15.80, 
      currentPrice: 15.90, 
      lpa: 2.1, 
      growthRate: 4,
      pl: 7.5,
      pbv: 1.2,
      dy: 6.0,
      roe: 18
    },
    { 
      id: "3", 
      name: "WEG", 
      symbol: "WEGE3",
      previousPrice: 42.50, 
      currentPrice: 43.50, 
      lpa: 3.9, 
      growthRate: 6,
      pl: 11.2,
      pbv: 2.5,
      dy: 3.5,
      roe: 23
    },
    { 
      id: "4", 
      name: "Vale", 
      symbol: "VALE3",
      previousPrice: 53.00, 
      currentPrice: 54.00, 
      lpa: 7.9, 
      growthRate: 5,
      pl: 6.8,
      pbv: 0.9,
      dy: 7.5,
      roe: 15
    },
    { 
      id: "5", 
      name: "CSN Mineração", 
      symbol: "CMIN3",
      previousPrice: 5.50, 
      currentPrice: 5.58, 
      lpa: 0.45, 
      growthRate: 8,
      pl: 12.39,
      pbv: 3.03,
      dy: 8.0,
      roe: 24.5
    },
  ]);

  const calculateVariation = (stock: Stock) => {
    return ((stock.currentPrice / stock.previousPrice) - 1) * 100;
  };

  const calculateInverseWeight = (variation: number) => {
    return 1 / (1 + variation / 100);
  };

  const calculateIntrinsicValue = (stock: Stock) => {
    if (!stock.lpa || !stock.growthRate || !selicRate) return 0;
    return stock.lpa * (8.5 + 2 * stock.growthRate) * (4.4 / selicRate);
  };

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

  /**
   * Busca dados de todas as ações da API
   */
  const refreshAllStocks = async () => {
    setLoading(true);
    setError(null);

    try {
      const symbols = stocks.map(s => s.symbol);
      console.log(`[App] Buscando dados de ${symbols.length} ações...`);
      
      const stocksData = await brapiService.getMultipleStocks(symbols);

      const updatedStocks = stocks.map(stock => {
        const apiData = stocksData.find(s => s.symbol === stock.symbol);
        
        if (apiData) {
          return {
            ...stock,
            previousPrice: stock.currentPrice,
            currentPrice: apiData.currentPrice,
            lpa: apiData.lpa,
            growthRate: apiData.growthRate,
            pl: apiData.pl,
            pbv: apiData.pbv,
            dy: apiData.dy,
            roe: apiData.roe,
          };
        }
        
        return stock;
      });

      setStocks(updatedStocks);
      toast.success("Dados atualizados com sucesso!");
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao buscar dados';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Erro ao atualizar ações:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buscar dados ao montar o componente
   */
  useEffect(() => {
    refreshAllStocks();
  }, []);

  /**
   * Atualizar dados a cada 5 minutos
   */
  useEffect(() => {
    const interval = setInterval(refreshAllStocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [stocks]);

  const addStock = () => {
    const newId = (Math.max(...stocks.map(s => parseInt(s.id)), 0) + 1).toString();
    setStocks([...stocks, {
      id: newId,
      name: `Ação ${newId}`,
      symbol: `STOCK${newId}`,
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
      "Símbolo": a.symbol,
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
      "P/L": a.pl?.toFixed(2) || "N/A",
      "P/VPA": a.pbv?.toFixed(2) || "N/A",
      "Div. Yield (%)": a.dy?.toFixed(2) || "N/A",
      "ROE (%)": a.roe?.toFixed(2) || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alocação");

    XLSX.utils.sheet_add_aoa(ws, [["Valor Total a Investir (R$)", totalInvestment]], { origin: "A1" });

    const colWidths = [
      { wch: 15 }, // Ação
      { wch: 10 }, // Símbolo
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
      { wch: 10 }, // P/L
      { wch: 10 }, // P/VPA
      { wch: 15 }, // Div. Yield
      { wch: 10 }, // ROE
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `alocacao_acoes_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold">Calculadora de Alocação de Ações</CardTitle>
          <CardDescription>
            Calcule automaticamente a alocação ideal baseada na performance das ações com dados em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Configuração */}
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

          {/* Mensagem de Erro */}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
              <p className="font-semibold">Erro ao buscar dados:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              onClick={refreshAllStocks} 
              disabled={loading}
              variant="outline" 
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
            <Button onClick={addStock} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Ação
            </Button>
            <Button onClick={exportToExcel} className="gap-2 bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>

          {/* Tabela de Alocação */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Ação</TableHead>
                  <TableHead className="font-semibold">Símbolo</TableHead>
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
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={allocation.symbol}
                        onChange={(e) => updateStock(allocation.id, "symbol", e.target.value)}
                        className="w-20 uppercase"
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

          {/* Total Alocado */}
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Total Alocado:</span>
            <span className="text-2xl font-bold text-primary">
              R$ {allocations.reduce((sum, a) => sum + a.investmentValue, 0).toFixed(2)}
            </span>
          </div>

          {/* Informações de Cache */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            <p>Cache: {brapiService.getCacheSize()} item(s) | Última atualização: {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAllocationTable;
