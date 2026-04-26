import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { tempoMainnet, tempoRpcHttpUrl } from "./tempo-network";
import {
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  rabbyWallet,
  okxWallet,
  bitgetWallet,
} from "@rainbow-me/rainbowkit/wallets";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "lego-miners-dev";

export const wagmiConfig = getDefaultConfig({
  appName: "Lego Miners",
  appDescription: "Agent-themed GameFi command center on Base.",
  appUrl: "https://legominers.xyz",
  appIcon: "/legominers.jpg",
  projectId: walletConnectProjectId,
  chains: [tempoMainnet],
  transports: {
    [tempoMainnet.id]: http(tempoRpcHttpUrl),
  },
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        trustWallet,
        rabbyWallet,
        okxWallet,
        bitgetWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [walletConnectWallet],
    },
  ],
  ssr: true,
});
