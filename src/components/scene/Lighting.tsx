import { PALETTE } from '@/lib/palette';

export function Lighting() {
  return (
    <>
      <ambientLight color="#fff0d5" intensity={0.4} />
      <hemisphereLight color="#e8e0d5" groundColor="#c0a888" intensity={0.6} />
      <directionalLight
        position={[-14, 17, 12]}
        intensity={2}
        color="#fff0d5"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.00025}
        shadow-normalBias={0.025}
        shadow-radius={5}
      />
      <directionalLight position={[14, 9, -8]} intensity={0.22} color={PALETTE.wall} />
    </>
  );
}
