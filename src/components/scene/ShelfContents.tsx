'use client';

import { useEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Object3D, type Vector3Tuple } from 'three';
import { Flask } from '@/components/models/LabAssets';
import { LowPolyMaterial } from '@/components/models/LowPolyMaterial';
import type { PaletteKey } from '@/lib/palette';
import {
  SURFACE_GAP,
  shelfContainedZ,
  shelfTopY,
  shelfX,
} from '@/lib/spatial';

const FLASK_SOURCE_WIDTH = 10;
const FLASK_SOURCE_DEPTH = 10;

type ShelfRootProps = {
  position: Vector3Tuple;
  bookcaseScale: number;
};

const FLASK_ROWS = [
  [
    { x: -0.64, scale: 0.027, color: 'accent2', rotation: -0.18 },
    { x: 0.48, scale: 0.03, color: 'glass', rotation: 0.12 },
  ],
  [
    { x: -0.45, scale: 0.032, color: 'accent1', rotation: 0.2 },
    { x: 0.62, scale: 0.026, color: 'accent2', rotation: -0.1 },
  ],
  [
    { x: -0.62, scale: 0.028, color: 'glass', rotation: -0.08 },
    { x: 0.38, scale: 0.031, color: 'accent1', rotation: 0.18 },
  ],
  [
    { x: -0.38, scale: 0.025, color: 'accent2', rotation: 0.14 },
    { x: 0.58, scale: 0.029, color: 'glass', rotation: -0.16 },
  ],
] as const satisfies ReadonlyArray<ReadonlyArray<{
  x: number;
  scale: number;
  color: PaletteKey;
  rotation: number;
}>>;

export function ChemistryShelfFlasks({ position, bookcaseScale }: ShelfRootProps) {
  const placements = useMemo(
    () =>
      FLASK_ROWS.flatMap((row, rowIndex) =>
        row.map((flask, columnIndex) => ({
          key: `${rowIndex}-${columnIndex}`,
          row: rowIndex,
          color: flask.color,
          scale: flask.scale,
          rotation: flask.rotation,
          position: [
            shelfX(position[0], bookcaseScale, flask.x, FLASK_SOURCE_WIDTH * flask.scale),
            shelfTopY(position[1], bookcaseScale, rowIndex) + SURFACE_GAP,
            shelfContainedZ(
              position[2],
              bookcaseScale,
              FLASK_SOURCE_DEPTH * flask.scale,
              0.07 + columnIndex * 0.018,
            ),
          ] as Vector3Tuple,
        })),
      ),
    [bookcaseScale, position],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    FLASK_ROWS.forEach((_, row) => {
      const top = shelfTopY(position[1], bookcaseScale, row);
      const rowProps = placements.filter((placement) => placement.row === row);
      console.info(
        `[Bunsen:shelf-audit] chemistry row=${row + 1} boardTop=${top.toFixed(4)} propBottoms=${rowProps.map((prop) => prop.position[1].toFixed(4)).join(',')} depthInside=${rowProps.every((prop) => prop.position[2] < position[2] + 0.125 * bookcaseScale)}`,
      );
    });
  }, [bookcaseScale, placements, position]);

  return placements.map((placement) => (
    <Flask
      key={placement.key}
      position={placement.position}
      rotation={[0, placement.rotation, 0]}
      scale={placement.scale}
      liquidColor={placement.color}
    />
  ));
}

type StudyBookcase = {
  position: Vector3Tuple;
  scale: number;
};

type BookPlacement = {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scaleY: number;
  color: 'accent1' | 'accent2';
  shelfId: string;
  boardTop: number;
  bottom: number;
};

const BOOK_WIDTH = 0.14;
const BOOK_HEIGHT = 0.42;
const BOOK_DEPTH = 0.32;
const BOOK_SCALE_X = 0.9;
const BOOK_SCALE_Z = 0.82;
const BOOK_X_POSITIONS = [-0.82, -0.42, -0.04, 0.36, 0.76] as const;

export function StudyShelfBooks({ bookcases }: { bookcases: StudyBookcase[] }) {
  const tealRef = useRef<InstancedMesh>(null);
  const pinkRef = useRef<InstancedMesh>(null);
  const placements = useMemo(() => {
    const output: BookPlacement[] = [];
    bookcases.forEach((bookcase, bookcaseIndex) => {
      for (let row = 0; row < 4; row += 1) {
        const boardTop = shelfTopY(bookcase.position[1], bookcase.scale, row);
        BOOK_X_POSITIONS.forEach((normalizedX, column) => {
          const scaleY = 0.78 + ((column + row) % 3) * 0.1;
          const rotation = column === 4 ? (row % 2 ? 0.11 : -0.12) : 0;
          const projectedHeight =
            BOOK_HEIGHT * scaleY * Math.abs(Math.cos(rotation)) +
            BOOK_WIDTH * BOOK_SCALE_X * Math.abs(Math.sin(rotation));
          const y = boardTop + projectedHeight * 0.5 + SURFACE_GAP;
          output.push({
            x: shelfX(
              bookcase.position[0],
              bookcase.scale,
              normalizedX,
              BOOK_WIDTH * BOOK_SCALE_X,
            ),
            y,
            z: shelfContainedZ(
              bookcase.position[2],
              bookcase.scale,
              BOOK_DEPTH * BOOK_SCALE_Z,
              0.055 + (column % 2) * 0.015,
            ),
            rotation,
            scaleY,
            color: (column + row + bookcaseIndex) % 3 === 0 ? 'accent2' : 'accent1',
            shelfId: `${bookcaseIndex + 1}-${row + 1}`,
            boardTop,
            bottom: y - projectedHeight * 0.5,
          });
        });
      }
    });
    return output;
  }, [bookcases]);

  useEffect(() => {
    const dummy = new Object3D();
    let tealIndex = 0;
    let pinkIndex = 0;
    placements.forEach((placement) => {
      dummy.position.set(placement.x, placement.y, placement.z);
      dummy.rotation.set(0, 0, placement.rotation);
      dummy.scale.set(BOOK_SCALE_X, placement.scaleY, BOOK_SCALE_Z);
      dummy.updateMatrix();
      if (placement.color === 'accent2') pinkRef.current?.setMatrixAt(pinkIndex++, dummy.matrix);
      else tealRef.current?.setMatrixAt(tealIndex++, dummy.matrix);
    });
    if (tealRef.current) tealRef.current.instanceMatrix.needsUpdate = true;
    if (pinkRef.current) pinkRef.current.instanceMatrix.needsUpdate = true;

    if (process.env.NODE_ENV === 'development') {
      const shelfIds = Array.from(new Set(placements.map((placement) => placement.shelfId)));
      shelfIds.forEach((shelfId) => {
        const props = placements.filter((placement) => placement.shelfId === shelfId);
        console.info(
          `[Bunsen:shelf-audit] study shelf=${shelfId} boardTop=${props[0].boardTop.toFixed(4)} propBottoms=${props.map((prop) => prop.bottom.toFixed(4)).join(',')}`,
        );
      });
    }
  }, [placements]);

  const pinkCount = placements.filter((placement) => placement.color === 'accent2').length;
  const tealCount = placements.length - pinkCount;

  return (
    <>
      <instancedMesh ref={tealRef} args={[undefined, undefined, tealCount]} castShadow>
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        <LowPolyMaterial color="accent1" />
      </instancedMesh>
      <instancedMesh ref={pinkRef} args={[undefined, undefined, pinkCount]} castShadow>
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        <LowPolyMaterial color="accent2" />
      </instancedMesh>
    </>
  );
}
