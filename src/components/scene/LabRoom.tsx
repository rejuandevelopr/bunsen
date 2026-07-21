'use client';

import { ChemistryZone } from './ChemistryZone';
import { DiscoveryRoom } from './DiscoveryRoom';
import { Greenhouse } from './Greenhouse';
import { InstrumentHall } from './InstrumentHall';
import { SetDressing } from './SetDressing';
import { StudyHall } from './StudyHall';
import { WorldShell } from './WorldShell';
import { FieldNotesProps } from './FieldNotesProps';

export function LabRoom() {
  return (
    <group>
      <WorldShell />
      <StudyHall />
      <ChemistryZone />
      <Greenhouse />
      <InstrumentHall />
      <DiscoveryRoom />
      <FieldNotesProps />
      <SetDressing />
    </group>
  );
}
