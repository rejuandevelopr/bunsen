'use client';

import { LEARNING_MATERIALS, type LearningMaterialId } from '@/lib/quests/materials';
import { PALETTE } from '@/lib/palette';
import { useQuestStore } from '@/store/quest-store';

export function LearningMaterialPanel({ materialId }: { materialId: LearningMaterialId }) {
  const material = LEARNING_MATERIALS[materialId];
  const read = useQuestStore((state) => state.readMaterialIds.includes(materialId));
  const markMaterialRead = useQuestStore((state) => state.markMaterialRead);

  return (
    <article className="mt-5 space-y-3 border p-4" style={{ borderColor: PALETTE.furniture }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl" style={{ color: PALETTE.glass }} aria-hidden="true">⌁</span>
        <div>
          <p className="font-serif text-base" style={{ color: PALETTE.paper }}>{material.title}</p>
          <p className="text-[0.55rem] uppercase tracking-[0.16em]" style={{ color: PALETTE.accent2 }}>{material.topic}</p>
        </div>
      </div>
      {material.paragraphs.map((paragraph, index) => (
        <p key={index} className="text-xs leading-relaxed" style={{ color: PALETTE.paper }}>
          {paragraph}
        </p>
      ))}
      <button
        type="button"
        onClick={() => markMaterialRead(materialId)}
        className="mt-2 w-full border px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition hover:brightness-110"
        style={{
          borderColor: read ? PALETTE.accent1 : PALETTE.trim,
          background: read ? PALETTE.furniture : PALETTE.wood,
          color: PALETTE.paper,
        }}
      >
        {read ? '✓ Marked as read · review complete' : 'Mark as read'}
      </button>
    </article>
  );
}
