import {
  DEFAULT_OBJECT_HEIGHT,
  emptyProject,
  type BoardObject,
  type ElevationObject,
  type ElevationScene,
  type Project,
  type ScaleCalibration,
} from '../types/project'

export const PROJECT_FILE_EXTENSION = '.madori.json'
export const PROJECT_FILE_ACCEPT = '.json,application/json'

export class ProjectFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectFileError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseScale(value: unknown): ScaleCalibration | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value) || typeof value.mmPerPixel !== 'number') {
    throw new ProjectFileError('縮尺データの形式が正しくありません')
  }
  const scale: ScaleCalibration = { mmPerPixel: value.mmPerPixel }
  if (value.reference !== undefined) {
    if (!isRecord(value.reference)) {
      throw new ProjectFileError('縮尺の基準線データの形式が正しくありません')
    }
    const { x1, y1, x2, y2, lengthMm } = value.reference
    if (
      typeof x1 !== 'number' ||
      typeof y1 !== 'number' ||
      typeof x2 !== 'number' ||
      typeof y2 !== 'number' ||
      typeof lengthMm !== 'number'
    ) {
      throw new ProjectFileError('縮尺の基準線データの形式が正しくありません')
    }
    scale.reference = { x1, y1, x2, y2, lengthMm }
  }
  return scale
}

function parseBackground(
  value: unknown,
): { name: string; dataUrl: string } | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) {
    throw new ProjectFileError('背景画像データの形式が正しくありません')
  }
  if (typeof value.name !== 'string' || typeof value.dataUrl !== 'string') {
    throw new ProjectFileError('背景画像データの形式が正しくありません')
  }
  return { name: value.name, dataUrl: value.dataUrl }
}

function parseElevationObject(value: unknown): ElevationObject {
  if (!isRecord(value) || typeof value.id !== 'string') {
    throw new ProjectFileError('立面オブジェクトの形式が正しくありません')
  }
  const { x, y, width, height } = value
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    throw new ProjectFileError('立面オブジェクトの形式が正しくありません')
  }
  return {
    id: value.id,
    x,
    y,
    width,
    height,
    label: typeof value.label === 'string' ? value.label : undefined,
  }
}

function parseElevationScene(value: unknown): ElevationScene {
  if (value === undefined) {
    return { objects: [] }
  }
  if (!isRecord(value)) {
    throw new ProjectFileError('立面データの形式が正しくありません')
  }
  if (!Array.isArray(value.objects)) {
    throw new ProjectFileError('立面オブジェクト一覧の形式が正しくありません')
  }
  return {
    background: parseBackground(value.background),
    scale: parseScale(value.scale),
    objects: value.objects.map(parseElevationObject),
  }
}

function parseBoardObject(value: unknown): BoardObject {
  if (!isRecord(value) || typeof value.id !== 'string') {
    throw new ProjectFileError('平面オブジェクトの形式が正しくありません')
  }
  const { x, y, width, height } = value
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    throw new ProjectFileError('平面オブジェクトの形式が正しくありません')
  }
  return {
    id: value.id,
    x,
    y,
    width,
    height,
    objectHeight:
      typeof value.objectHeight === 'number' && value.objectHeight > 0
        ? value.objectHeight
        : DEFAULT_OBJECT_HEIGHT,
    rotation: typeof value.rotation === 'number' ? value.rotation : undefined,
    label: typeof value.label === 'string' ? value.label : undefined,
    elevation: parseElevationScene(value.elevation),
  }
}

/** JSON 文字列から Project を復元する */
export function parseProjectJson(text: string): Project {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    throw new ProjectFileError('JSON として解析できませんでした')
  }
  if (!isRecord(raw)) {
    throw new ProjectFileError('間取りデータの形式が正しくありません')
  }
  if (raw.version !== 1) {
    throw new ProjectFileError(
      `未対応のスキーマ版です（version: ${String(raw.version)}）`,
    )
  }
  if (!Array.isArray(raw.objects)) {
    throw new ProjectFileError('平面オブジェクト一覧の形式が正しくありません')
  }

  const project: Project = {
    version: 1,
    background: parseBackground(raw.background),
    scale: parseScale(raw.scale),
    objects: raw.objects.map(parseBoardObject),
  }

  if (raw.viewport !== undefined) {
    if (!isRecord(raw.viewport)) {
      throw new ProjectFileError('表示状態の形式が正しくありません')
    }
    const { scale, offsetX, offsetY } = raw.viewport
    if (
      typeof scale !== 'number' ||
      typeof offsetX !== 'number' ||
      typeof offsetY !== 'number'
    ) {
      throw new ProjectFileError('表示状態の形式が正しくありません')
    }
    project.viewport = { scale, offsetX, offsetY }
  }

  return project
}

export function serializeProject(project: Project): string {
  return `${JSON.stringify(project, null, 2)}\n`
}

export function downloadProjectFile(
  project: Project,
  filename = `madori-board${PROJECT_FILE_EXTENSION}`,
): void {
  const blob = new Blob([serializeProject(project)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function readProjectFile(file: File): Promise<Project> {
  const text = await file.text()
  return parseProjectJson(text)
}

export function createEmptyProjectFileContent(): string {
  return serializeProject(emptyProject())
}
