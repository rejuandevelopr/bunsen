import { DoubleSide, FrontSide } from 'three';
import { PALETTE, type PaletteKey } from '@/lib/palette';

type LowPolyMaterialProps = {
  color: PaletteKey;
  emissive?: PaletteKey;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  doubleSided?: boolean;
  depthWrite?: boolean;
};

export function LowPolyMaterial({
  color,
  emissive,
  emissiveIntensity = 0,
  opacity = 1,
  transparent = false,
  doubleSided = false,
  depthWrite = true,
}: LowPolyMaterialProps) {
  return (
    <meshStandardMaterial
      color={PALETTE[color]}
      emissive={PALETTE[emissive ?? color]}
      emissiveIntensity={emissive ? emissiveIntensity : 0}
      flatShading
      roughness={0.9}
      metalness={0}
      opacity={opacity}
      transparent={transparent}
      side={doubleSided ? DoubleSide : FrontSide}
      depthWrite={depthWrite}
    />
  );
}
