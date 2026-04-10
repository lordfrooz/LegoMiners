import { TempoGameApp } from "./components/tempo-game-app";
import { TempoGameStateProvider } from "./lib/tempo-game-state";

export default function Home() {
  return (
    <TempoGameStateProvider>
      <TempoGameApp />
    </TempoGameStateProvider>
  );
}
