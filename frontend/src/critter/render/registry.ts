/**
 * Registre des skins nommés — sépare `blobSkin` (skins.ts) des skins machine
 * (machines.ts) pour éviter un import circulaire (machines.ts dépend des
 * types déclarés dans skins.ts).
 *
 * Chaque entrée est une FABRIQUE (pas un skin directement) : les skins
 * machine referment sur un état d'animation propre à l'instance (angle de
 * raclette, vitesse de disque…), donc chaque montage doit obtenir SA PROPRE
 * fermeture plutôt que de partager une fonction unique entre plusieurs
 * critters (voir machines.ts).
 */
import { blobSkin, type Skin } from "./skins";
import {
  createScrubberSkin,
  createScrubberDrivenSkin,
  createPolisherSkin,
  createPolisherDrivenSkin,
  createBroomSkin,
  createBroomDrivenSkin,
} from "./machines";

export const SKIN_FACTORIES: Record<string, () => Skin> = {
  blob: () => blobSkin,
  // « devient la machine »
  scrubber: createScrubberSkin,
  polisher: createPolisherSkin,
  broom: createBroomSkin,
  // « conduit/pousse la machine »
  "scrubber-driven": createScrubberDrivenSkin,
  "polisher-driven": createPolisherDrivenSkin,
  "broom-driven": createBroomDrivenSkin,
};
