'use client';

import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.82} intensity={0.24} mipmapBlur />
      <Vignette eskil={false} offset={0.3} darkness={0.12} />
    </EffectComposer>
  );
}
