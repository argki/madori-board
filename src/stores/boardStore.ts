import { temporal } from 'zundo'
import { create } from 'zustand'
import { emptyProject, type BoardObject, type Project } from '../types/project'

const DEFAULT_OBJECT_WIDTH = 120
const DEFAULT_OBJECT_HEIGHT = 80

export type BackgroundImage = {
  name: string
  dataUrl: string
}

type BoardState = {
  project: Project
  /** UI 専用。履歴には含めない */
  selectedId: string | null
  setProject: (project: Project) => void
  resetProject: () => void
  setBackground: (background: BackgroundImage) => void
  clearBackground: () => void
  addObject: (placement?: { x: number; y: number }) => void
  updateObject: (id: string, patch: Partial<BoardObject>) => void
  removeObject: (id: string) => void
  selectObject: (id: string | null) => void
}

function createBoardObject(placement?: { x: number; y: number }): BoardObject {
  return {
    id: crypto.randomUUID(),
    x: placement?.x ?? 80,
    y: placement?.y ?? 80,
    width: DEFAULT_OBJECT_WIDTH,
    height: DEFAULT_OBJECT_HEIGHT,
    rotation: 0,
    elevation: { objects: [] },
  }
}

export const useBoardStore = create<BoardState>()(
  temporal(
    (set) => ({
      project: emptyProject(),
      selectedId: null,
      setProject: (project) => set({ project }),
      resetProject: () => set({ project: emptyProject(), selectedId: null }),
      setBackground: (background) =>
        set((state) => ({
          project: { ...state.project, background },
        })),
      clearBackground: () =>
        set((state) => ({
          project: { ...state.project, background: undefined },
        })),
      addObject: (placement) =>
        set((state) => {
          const object = createBoardObject(placement)
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
        set((state) => ({
          selectedId: state.selectedId === id ? null : state.selectedId,
          project: {
            ...state.project,
            objects: state.project.objects.filter((object) => object.id !== id),
          },
        })),
      selectObject: (id) => set({ selectedId: id }),
    }),
    {
      partialize: (state) => ({ project: state.project }),
      limit: 50,
    },
  ),
)
