# Integração de API - ShareWiseSheets

## 📚 O Que Foi Implementado

Sua ferramenta agora possui integração completa com a **Brapi (Brasil API)** para buscar dados de cotação e fundamentos em tempo real!

### ✅ Funcionalidades Adicionadas

1. **Busca Automática de Dados** - Ao abrir a aplicação, os dados das ações são buscados automaticamente
2. **Atualização Periódica** - Dados são atualizados a cada 5 minutos
3. **Cache Inteligente** - Evita requisições desnecessárias
4. **Botão de Atualizar** - Atualize os dados manualmente quando quiser
5. **Tratamento de Erros** - Mensagens claras em caso de falha
6. **Dados Fundamentalistas** - P/L, P/VPA, Dividend Yield, ROE, etc.

---

## 📁 Estrutura de Arquivos Criados

```
src/
├── services/
│   ├── api/
│   │   ├── types.ts                 # Tipos TypeScript
│   │   └── brapiService.ts          # Serviço da API Brapi
│   └── cache/
│       └── cacheService.ts          # Sistema de cache
├── hooks/
│   └── useStockData.ts              # Hook React customizado
└── components/
    └── StockAllocationTable.tsx     # Componente atualizado
```

---

## 🚀 Como Usar

### 1. Instalar Dependências

As dependências já foram instaladas, mas se precisar:

```bash
npm install axios dotenv
```

### 2. Configurar Variáveis de Ambiente

Arquivo `.env` já foi criado com as configurações padrão:

```env
VITE_BRAPI_KEY=
VITE_API_TIMEOUT=10000
VITE_CACHE_DURATION=300000
```

### 3. Executar o Projeto

```bash
npm run dev
```

A aplicação irá:
- ✅ Buscar dados das 5 ações padrão (ITUB4, BBDC4, WEGE3, VALE3, CMIN3)
- ✅ Atualizar automaticamente a cada 5 minutos
- ✅ Permitir atualização manual com o botão "Atualizar Dados"

---

## 📊 Dados Buscados da API

Para cada ação, a API retorna:

| Campo | Descrição |
| :--- | :--- |
| **symbol** | Símbolo da ação (ex: ITUB4) |
| **name** | Nome da empresa |
| **price** | Preço atual |
| **priceClose** | Preço de fechamento anterior |
| **pl** | Preço/Lucro |
| **pbv** | Preço/Valor Patrimonial |
| **dy** | Dividend Yield |
| **roe** | Retorno sobre Patrimônio |
| **roic** | Retorno sobre Capital Investido |
| **netMargin** | Margem Líquida |

---

## 🔧 Personalizar Ações

Para adicionar suas próprias ações, edite o array `stocks` em `StockAllocationTable.tsx`:

```typescript
const [stocks, setStocks] = useState<Stock[]>([
  { 
    id: "1", 
    name: "Itaú Unibanco", 
    symbol: "ITUB4",  // Mude o símbolo aqui
    previousPrice: 28.45, 
    currentPrice: 28.50, 
    lpa: 3.2, 
    growthRate: 5,
  },
  // Adicione mais ações aqui
]);
```

---

## 🔄 Fluxo de Atualização

```
1. Componente monta
   ↓
2. useEffect chama refreshAllStocks()
   ↓
3. brapiService.getMultipleStocks() busca dados
   ↓
4. Cache verifica se dados existem
   ↓
5. Se não existem, faz requisição à API
   ↓
6. Armazena em cache por 5 minutos
   ↓
7. Atualiza estado do componente
   ↓
8. Intervalo de 5 minutos dispara nova atualização
```

---

## 💾 Sistema de Cache

O cache funciona automaticamente:

- **Duração**: 5 minutos (300.000 ms)
- **Benefício**: Evita requisições desnecessárias
- **Limpeza**: Automática quando expira

Para limpar o cache manualmente:

```typescript
import brapiService from '@/services/api/brapiService';

brapiService.clearCache();
```

---

## ⚠️ Tratamento de Erros

Se houver erro ao buscar dados:

1. Uma mensagem de erro aparece na tela
2. Um toast notifica o usuário
3. Os dados anteriores são mantidos
4. A aplicação continua funcionando

Exemplos de erros tratados:
- Ação não encontrada
- Timeout na requisição
- Erro de conexão
- Resposta inválida da API

---

## 📱 Exemplos de Uso

### Buscar uma ação manualmente

```typescript
import brapiService from '@/services/api/brapiService';

const data = await brapiService.getStockData('ITUB4');
console.log(`${data.name}: R$ ${data.currentPrice}`);
```

### Buscar múltiplas ações

```typescript
const symbols = ['ITUB4', 'BBDC4', 'WEGE3'];
const stocks = await brapiService.getMultipleStocks(symbols);

stocks.forEach(stock => {
  console.log(`${stock.symbol}: R$ ${stock.currentPrice}`);
});
```

### Usar o hook customizado

```typescript
import { useStockData } from '@/hooks/useStockData';

function MyComponent() {
  const { data, loading, error, fetchStock } = useStockData();

  const handleFetch = async () => {
    await fetchStock('ITUB4');
  };

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error.message}</p>}
      {data && <p>{data.name}: R$ {data.currentPrice}</p>}
      <button onClick={handleFetch}>Buscar</button>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### "Erro ao buscar dados"

**Causa**: Problema de conexão com a API Brapi

**Solução**:
1. Verifique sua conexão de internet
2. Verifique se o símbolo da ação está correto
3. Tente novamente em alguns segundos

### "Ação não encontrada"

**Causa**: Símbolo da ação incorreto

**Solução**:
1. Verifique o símbolo no Fundamentus ou B3
2. Certifique-se de incluir o número (ex: ITUB4, não ITUB)

### Cache não está atualizando

**Causa**: Cache ainda válido

**Solução**:
1. Espere 5 minutos para o cache expirar
2. Ou clique em "Atualizar Dados" para forçar

---

## 📈 Próximas Melhorias Sugeridas

1. **Integração com Banco de Dados** - Salvar histórico de alocações
2. **Gráficos de Histórico** - Visualizar variação ao longo do tempo
3. **Alertas de Preço** - Notificar quando preço atinge limite
4. **Múltiplas Carteiras** - Gerenciar várias carteiras
5. **Análise de Risco** - Calcular desvio padrão e correlação
6. **Exportação Automática** - Agendar exportação diária

---

## 📚 Recursos

- **Brapi Docs**: https://brapi.dev/docs
- **Axios**: https://axios-http.com/
- **React Hooks**: https://react.dev/reference/react/hooks

---

## ✅ Checklist

- [x] Instalar dependências (axios, dotenv)
- [x] Criar arquivo `.env`
- [x] Implementar tipos TypeScript
- [x] Criar serviço de cache
- [x] Criar serviço Brapi
- [x] Criar hook `useStockData`
- [x] Atualizar componente principal
- [x] Implementar tratamento de erros
- [x] Adicionar atualização automática
- [x] Criar documentação

---

## 🎉 Tudo Pronto!

Sua ferramenta agora está completamente integrada com a API Brapi. Você pode:

✅ Buscar dados em tempo real  
✅ Atualizar automaticamente a cada 5 minutos  
✅ Adicionar/remover ações  
✅ Exportar para Excel com dados atualizados  
✅ Calcular alocação dinâmica baseada em performance real  

Boa sorte com seus investimentos! 🚀
