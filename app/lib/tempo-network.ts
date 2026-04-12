import { defineChain } from "viem";

const tempoChainId = Number(process.env.NEXT_PUBLIC_TEMPO_CHAIN_ID ?? 4217);
const tempoRpcUrl = process.env.NEXT_PUBLIC_TEMPO_RPC_URL ?? "https://rpc.tempo.xyz";
const tempoWsUrl = process.env.NEXT_PUBLIC_TEMPO_WS_URL ?? "wss://rpc.tempo.xyz";
const tempoExplorerUrl = process.env.NEXT_PUBLIC_TEMPO_EXPLORER_URL ?? "https://explore.tempo.xyz";

export const tempoMainnet = defineChain({
  id: tempoChainId,
  name: "Tempo Mainnet",
  nativeCurrency: {
    name: "Tempo USD",
    symbol: "USD",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [tempoRpcUrl],
      webSocket: [tempoWsUrl],
    },
    public: {
      http: [tempoRpcUrl],
      webSocket: [tempoWsUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Tempo Explorer",
      url: tempoExplorerUrl,
    },
  },
  testnet: false,
});

export const tempoRpcHttpUrl = tempoRpcUrl;
