import type { Metadata } from "next";
import { SpriteSheetWidget } from "../components/sprite-sheet-widget";

export const metadata: Metadata = {
  title: "Sprite Sheet Lab",
  description: "Interactive widget for clipping and waypoint-driven sprite animation.",
};

export default function SpriteSheetLabPage() {
  return <SpriteSheetWidget />;
}
