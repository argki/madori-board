import { temporal } from 'zundo'
import { create } from 'zustand'
import { resizeKeepingMm } from '../lib/scale'
import {
  DEFAULT_OBJECT_HEIGHT,
  emptyProject,
  type BoardObject,
  type ElevationObject,
  type ElevationScene,
  type Project,
  type ScaleCalibration,
} from '../types/project'

const DEFAULT_OBJECT_WIDTH = 120
const DEFAULT_OBJECT_DEPTH = 80
/** 選択中の矩形から追加するときの位置オフセット（px） */
const DUPLICATE_OFFSET_PX = 24

export type BackgroundImage = {
  name: string
  dataUrl: string
}

type ScaleObjectPolicy = 'keepMm' | 'followDrawing'

type BoardState = {
  project: Project
  /** UI 専用。履歴には含めない */
  selectedId: string | null
  /**
   * 立面編集中の平面オブジェクト id。
   * Undo 履歴に含め、平面／立面をまたぐ戻る・進むでモーダル開閉と連動させる。
   */
  elevationBoardId: string | null
  /** UI 専用。履歴には含めない */
  selectedElevationObjectId: string | null
  setProject: (project: Project) => void
  resetProject: () => void
  setBackground: (background: BackgroundImage) => void
  clearBackground: () => void
  setScale: (scale: ScaleCalibration | undefined) => void
  /** 縮尺を適用。keepMm のときは既存矩形の mm 寸法を保つようピクセルを換算する */
  applyScale: (scale: ScaleCalibration, policy?: ScaleObjectPolicy) => void
  addObject: (placement?: { x: number; y: number }) => void
  updateObject: (id: string, patch: Partial<BoardObject>) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null) => void
  openElevation: (boardObjectId: string) => void
  closeElevation: () => void
  addElevationObject: (placement?: { x: number; y: number }) => void
  updateElevationObject: (id: string, patch: Partial<ElevationObject>) => void
  removeElevationObject: (id: string) => void
  selectElevationObject: (id: string | null) => void
}

function createBoardObject(placement?: { x: number; y: number }): BoardObject {
  return {
    id: crypto.randomUUID(),
    x: placement?.x ?? 80,
    y: placement?.y ?? 80,
    width: DEFAULT_OBJECT_WIDTH,
    height: DEFAULT_OBJECT_DEPTH,
    objectHeight: DEFAULT_OBJECT_HEIGHT,
    rotation: 0,
    elevation: { objects: [] },
  }
}

/** 立面枠（親の幅×高さ）の内側に収まる矩形を作る */
function createElevationObjectInFrame(frame: {
  width: number
  height: number
}): ElevationObject {
  const frameW = Math.max(1, frame.width)
  const frameH = Math.max(1, frame.height)
  const inset = Math.min(12, frameW * 0.08, frameH * 0.08)
  const maxW = Math.max(1, frameW - inset * 2)
  const maxH = Math.max(1, frameH - inset * 2)
  const width = Math.min(DEFAULT_OBJECT_WIDTH, maxW)
  const height = Math.min(DEFAULT_OBJECT_HEIGHT, maxH)
  return {
    id: crypto.randomUUID(),
    x: (frameW - width) / 2,
    y: (frameH - height) / 2,
    width,
    height,
  }
}

function mapBoardObject(
  project: Project,
  boardObjectId: string,
  mapElevation: (scene: ElevationScene) => ElevationScene,
): Project {
  return {
    ...project,
    objects: project.objects.map((object) =>
      object.id === boardObjectId
        ? { ...object, elevation: mapElevation(object.elevation) }
        : object,
    ),
  }
}

export const useBoardStore = create<BoardState>()(
  temporal(
    (set, get) => ({
      project: emptyProject(),
      selectedId: null,
      elevationBoardId: null,
      selectedElevationObjectId: null,
      setProject: (project) =>
        set({
          project,
          selectedId: null,
          elevationBoardId: null,
          selectedElevationObjectId: null,
        }),
      resetProject: () =>
        set({
          project: emptyProject(),
          selectedId: null,
          elevationBoardId: null,
          selectedElevationObjectId: null,
        }),
      setBackground: (background) =>
        set((state) => ({
          project: { ...state.project, background },
        })),
      clearBackground: () =>
        set((state) => ({
          project: { ...state.project, background: undefined },
        })),
      setScale: (scale) =>
        set((state) => ({
          project: { ...state.project, scale },
        })),
      applyScale: (scale, policy = 'followDrawing') =>
        set((state) => {
          const previousMmPerPixel = state.project.scale?.mmPerPixel
          const objects =
            policy === 'keepMm' &&
            previousMmPerPixel !== undefined &&
            previousMmPerPixel > 0
              ? state.project.objects.map((object) => ({
                  ...object,
                  ...resizeKeepingMm(
                    object,
                    previousMmPerPixel,
                    scale.mmPerPixel,
                  ),
                }))
              : state.project.objects
          return {
            project: {
              ...state.project,
              scale,
              objects,
            },
          }
        }),
      addObject: (placement) =>
        set((state) => {
          const selected = state.selectedId
            ? state.project.objects.find(
                (object) => object.id === state.selectedId,
              )
            : undefined
          const object = selected
            ? {
                ...createBoardObject({
                  x: placement?.x ?? selected.x + DUPLICATE_OFFSET_PX,
                  y: placement?.y ?? selected.y + DUPLICATE_OFFSET_PX,
                }),
                width: selected.width,
                height: selected.height,
                objectHeight: selected.objectHeight,
                rotation: selected.rotation,
                label: selected.label,
              }
            : createBoardObject(placement)
          return {
            selectedId: object.id,
            project: {
              ...state.project,
              objects: [...state.project.objects, object],
            },
          }
        }),
      updateObject: (id, patch) =>
        set((state) => ({
          project: {
            ...state.project,
            objects: state.project.objects.map((object) =>
              object.id === id ? { ...object, ...patch } : object,
            ),
          },
        })),
      removeObject: (id) =>
        set((state) => {
          const closingElevation = state.elevationBoardId === id
          return {
            selectedId: state.selectedId === id ? null : state.selectedId,
            elevationBoardId: closingElevation ? null : state.elevationBoardId,
            selectedElevationObjectId: closingElevation
              ? null
              : state.selectedElevationObjectId,
            project: {
              ...state.project,
              objects: state.project.objects.filter(
                (object) => object.id !== id,
              ),
            },
          }
        }),
      selectObject: (id) => set({ selectedId: id }),
      openElevation: (boardObjectId) => {
        const exists = get().project.objects.some(
          (object) => object.id === boardObjectId,
        )
        if (!exists) return
        if (get().elevationBoardId === boardObjectId) return
        set({
          elevationBoardId: boardObjectId,
          selectedId: boardObjectId,
          selectedElevationObjectId: null,
        })
      },
      closeElevation: () => {
        if (get().elevationBoardId === null) return
        set({
          elevationBoardId: null,
          selectedElevationObjectId: null,
        })
      },
      addElevationObject: (placement) => {
        const state = get()
        const boardObjectId = state.elevationBoardId
        if (!boardObjectId) return
        const boardObject = state.project.objects.find(
          (object) => object.id === boardObjectId,
        )
        if (!boardObject) return
        const frame = {
          width: boardObject.width,
          height: boardObject.objectHeight,
        }
        const selected = state.selectedElevationObjectId
          ? boardObject.elevation.objects.find(
              (object) => object.id === state.selectedElevationObjectId,
            )
          : undefined
        let object: ElevationObject
        if (selected) {
          const width = selected.width
          const height = selected.height
          const rawX = placement?.x ?? selected.x + DUPLICATE_OFFSET_PX
          const rawY = placement?.y ?? selected.y + DUPLICATE_OFFSET_PX
          object = {
            id: crypto.randomUUID(),
            width,
            height,
            x: Math.max(0, Math.min(rawX, Math.max(0, frame.width - width))),
            y: Math.max(0, Math.min(rawY, Math.max(0, frame.height - height))),
            label: selected.label,
          }
        } else {
          const base = createElevationObjectInFrame(frame)
          object = placement
            ? { ...base, x: placement.x, y: placement.y }
            : base
        }
        set({
          selectedElevationObjectId: object.id,
          project: mapBoardObject(state.project, boardObjectId, (scene) => ({
            ...scene,
            objects: [...scene.objects, object],
          })),
        })
      },
      updateElevationObject: (id, patch) => {
        const boardObjectId = get().elevationBoardId
        if (!boardObjectId) return
        set((state) => ({
          project: mapBoardObject(state.project, boardObjectId, (scene) => ({
            ...scene,
            objects: scene.objects.map((object) =>
              object.id === id ? { ...object, ...patch } : object,
            ),
          })),
        }))
      },
      removeElevationObject: (id) => {
        const boardObjectId = get().elevationBoardId
        if (!boardObjectId) return
        set((state) => ({
          selectedElevationObjectId:
            state.selectedElevationObjectId === id
              ? null
              : state.selectedElevationObjectId,
          project: mapBoardObject(state.project, boardObjectId, (scene) => ({
            ...scene,
            objects: scene.objects.filter((object) => object.id !== id),
          })),
        }))
      },
      selectElevationObject: (id) => set({ selectedElevationObjectId: id }),
    }),
    {
      partialize: (state) => ({
        project: state.project,
        elevationBoardId: state.elevationBoardId,
      }),
      limit: 50,
    },
  ),
)
