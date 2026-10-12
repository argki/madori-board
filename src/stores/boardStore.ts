import { temporal } from 'zundo'
import { create } from 'zustand'
import { emptyProject, type Project } from '../types/project'

type BoardState = {
  project: Project
  setProject: (project: Project) => void
  resetProject: () => void
}

export const useBoardStore = create<BoardState>()(
  temporal(
    (set) => ({
      project: emptyProject(),
      setProject: (project) => set({ project }),
      resetProject: () => set({ project: emptyProject() }),
    }),
    {
      partialize: (state) => ({ project: state.project }),
      limit: 50,
    },
  ),
)
