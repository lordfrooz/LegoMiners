import { TempoGameApp } from "../components/tempo-game-app";
import { TempoGameStateProvider } from "../lib/tempo-game-state";

export default function GamePage() {
  return (
    <TempoGameStateProvider>
      <TempoGameApp />
    </TempoGameStateProvider>
  );
}
