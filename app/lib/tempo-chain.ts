import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { tempoMainnet, tempoRpcHttpUrl } from "./tempo-network";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "tempo-topia-dev";

export const wagmiConfig = getDefaultConfig({
  appName: "Tempo Topia",
  appDescription: "Agent-themed GameFi command center on Tempo.",
  appUrl: "https://tempo.xyz",
  appIcon: "/logo.jpg",
  projectId: walletConnectProjectId,
  chains: [tempoMainnet],
  transports: {
    [tempoMainnet.id]: http(tempoRpcHttpUrl),
  },
  ssr: true,
});
