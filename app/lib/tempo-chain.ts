import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain, http } from "viem";

export const tempoTestnet = defineChain({
  id: 42431,
  name: "Tempo Testnet (Moderato)",
  nativeCurrency: {
    name: "Tempo USD",
    symbol: "USD",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.moderato.tempo.xyz"],
      webSocket: ["wss://rpc.moderato.tempo.xyz"],
    },
    public: {
      http: ["https://rpc.moderato.tempo.xyz"],
      webSocket: ["wss://rpc.moderato.tempo.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Tempo Explorer",
      url: "https://explore.tempo.xyz",
    },
  },
  testnet: true,
});

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "tempo-topia-dev";

export const wagmiConfig = getDefaultConfig({
  appName: "Tempo Topia",
  appDescription: "Agent-themed GameFi command center on Tempo.",
  appUrl: "https://tempo.xyz",
  appIcon: "/logo.png",
  projectId: walletConnectProjectId,
  chains: [tempoTestnet],
  transports: {
    [tempoTestnet.id]: http("https://rpc.moderato.tempo.xyz"),
  },
  ssr: true,
});
