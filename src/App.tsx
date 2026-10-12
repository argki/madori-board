import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Alert from 'react-bootstrap/Alert'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Stack from 'react-bootstrap/Stack'
import { useStore } from 'zustand'
import { IconToolbarButton } from './components/IconToolbarButton'
import { BoardStage } from './features/board/BoardStage'
import { DimensionPanel } from './features/board/DimensionPanel'
import { ScaleCalibrationModal } from './features/board/ScaleCalibrationModal'
import {
  ScaleObjectPolicyModal,
  type ScaleObjectPolicy,
} from './features/board/ScaleObjectPolicyModal'
import { ElevationEditorModal } from './features/elevation/ElevationEditorModal'
import {
  downloadProjectFile,
  PROJECT_FILE_ACCEPT,
  ProjectFileError,
  readProjectFile,
} from './lib/projectFile'
import { encodeImageFileAsDataUrl } from './lib/encodeImageFile'
import { createScaleCalibration, distancePx, type Point } from './lib/scale'
import { useBoardStore } from './stores/boardStore'
import type { ScaleCalibration } from './types/project'

function App() {
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)
  const navbarRef = useRef<HTMLElement | null>(null)
  const undo = useStore(useBoardStore.temporal, (s) => s.undo)
  const redo = useStore(useBoardStore.temporal, (s) => s.redo)
  const pastStates = useStore(useBoardStore.temporal, (s) => s.pastStates)
  const futureStates = useStore(useBoardStore.temporal, (s) => s.futureStates)
  const project = useBoardStore((s) => s.project)
  const setProject = useBoardStore((s) => s.setProject)
  const setBackground = useBoardStore((s) => s.setBackground)
  const applyScale = useBoardStore((s) => s.applyScale)
  const addObject = useBoardStore((s) => s.addObject)
  const addElevationObject = useBoardStore((s) => s.addElevationObject)
  const selectedId = useBoardStore((s) => s.selectedId)
  const selectedElevationObjectId = useBoardStore(
    (s) => s.selectedElevationObjectId,
  )
  const removeObject = useBoardStore((s) => s.removeObject)
  const removeElevationObject = useBoardStore((s) => s.removeElevationObject)
  const selectObject = useBoardStore((s) => s.selectObject)
  const updateObject = useBoardStore((s) => s.updateObject)
  const elevationBoardId = useBoardStore((s) => s.elevationBoardId)
  const openElevation = useBoardStore((s) => s.openElevation)
  const closeElevation = useBoardStore((s) => s.closeElevation)
  const elevationOpen = elevationBoardId !== null

  const [calibrating, setCalibrating] = useState(false)
  const [draftPoints, setDraftPoints] = useState<Point[]>([])
  const [scaleModalOpen, setScaleModalOpen] = useState(false)
  const [pendingScale, setPendingScale] = useState<ScaleCalibration | null>(
    null,
  )

  const selectedPlanObject =
    project.objects.find((object) => object.id === selectedId) ?? null

  const resetCalibrationDraft = () => {
    setCalibrating(false)
    setDraftPoints([])
    setScaleModalOpen(false)
    setPendingScale(null)
  }

  const startCalibration = () => {
    selectObject(null)
    setDraftPoints([])
    setScaleModalOpen(false)
    setCalibrating(true)
  }

  const onCalibrationClick = (point: Point) => {
    if (!calibrating || scaleModalOpen) return
    if (draftPoints.length === 0) {
      setDraftPoints([point])
      return
    }
    if (draftPoints.length === 1) {
      setDraftPoints([draftPoints[0], point])
      setScaleModalOpen(true)
    }
  }

  const onConfirmScale = (lengthMm: number) => {
    const a = draftPoints[0]
    const b = draftPoints[1]
    if (!a || !b) return
    const next = createScaleCalibration(a, b, lengthMm)
    if (!next) {
      window.alert('基準線の長さが短すぎるか、実寸が不正です')
      return
    }
    const hasObjects = project.objects.length > 0
    const hasPreviousScale =
      project.scale?.mmPerPixel !== undefined && project.scale.mmPerPixel > 0
    if (hasObjects && hasPreviousScale) {
      setPendingScale(next)
      setScaleModalOpen(false)
      setCalibrating(false)
      setDraftPoints([])
      return
    }
    applyScale(next, 'followDrawing')
    resetCalibrationDraft()
  }

  const onChooseScaleObjectPolicy = (policy: ScaleObjectPolicy) => {
    if (!pendingScale) return
    applyScale(pendingScale, policy)
    resetCalibrationDraft()
  }

  const onBackgroundSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const encoded = await encodeImageFileAsDataUrl(file)
      setBackground({ name: encoded.name, dataUrl: encoded.dataUrl })
    } catch (error) {
      console.error(error)
      window.alert('背景の間取り図を読み込めませんでした')
    }
  }

  const onProjectSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const next = await readProjectFile(file)
      setProject(next)
      resetCalibrationDraft()
      useBoardStore.temporal.getState().clear()
    } catch (error) {
      console.error(error)
      const message =
        error instanceof ProjectFileError
          ? error.message
          : '間取りデータを読み込めませんでした'
      window.alert(message)
    }
  }

  const onDownloadProject = () => {
    const baseName = project.background?.name?.replace(/\.[^.]+$/, '')
    const filename = baseName
      ? `${baseName}.madori.json`
      : 'madori-board.madori.json'
    downloadProjectFile(project, filename)
  }

  const onOpenElevation = (objectId: string) => {
    resetCalibrationDraft()
    openElevation(objectId)
  }

  const onCloseElevation = () => {
    closeElevation()
  }

  useEffect(() => {
    const element = navbarRef.current
    if (!element) return
    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--app-navbar-height',
        `${element.getBoundingClientRect().height}px`,
      )
    }
    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const pixelLength =
    draftPoints.length === 2 ? distancePx(draftPoints[0], draftPoints[1]) : 0

  return (
    <div className="vh-100 d-flex flex-column">
      <Navbar
        ref={navbarRef}
        bg="dark"
        data-bs-theme="dark"
        className="px-3 app-navbar"
      >
        <Navbar.Brand href="#home">madori-board</Navbar.Brand>
        <Stack direction="horizontal" gap={2} className="ms-auto flex-wrap">
          <ButtonGroup size="sm">
            <IconToolbarButton
              label="戻る"
              iconClassName="bi bi-arrow-counterclockwise"
              disabled={pastStates.length === 0}
              onClick={() => undo()}
            />
            <IconToolbarButton
              label="進む"
              iconClassName="bi bi-arrow-clockwise"
              disabled={futureStates.length === 0}
              onClick={() => redo()}
            />
          </ButtonGroup>
          <IconToolbarButton
            label="背景の間取り図を設定"
            iconClassName="bi bi-image"
            disabled={elevationOpen}
            onClick={() => backgroundInputRef.current?.click()}
          />
          <IconToolbarButton
            label="縮尺を校正"
            iconClassName="bi bi-rulers"
            variant={calibrating ? 'primary' : 'outline-light'}
            disabled={elevationOpen}
            onClick={() => {
              if (calibrating) {
                resetCalibrationDraft()
              } else {
                startCalibration()
              }
            }}
          />
          <IconToolbarButton
            label={elevationOpen ? '立面に矩形を追加' : '矩形を追加'}
            iconClassName="bi bi-bounding-box"
            disabled={calibrating}
            onClick={() => {
              if (elevationOpen) {
                addElevationObject()
                return
              }
              addObject()
            }}
          />
          <IconToolbarButton
            label={elevationOpen ? '立面の矩形を削除' : '矩形を削除'}
            iconClassName="bi bi-trash"
            disabled={
              calibrating ||
              (elevationOpen ? !selectedElevationObjectId : !selectedId)
            }
            onClick={() => {
              if (elevationOpen) {
                if (selectedElevationObjectId) {
                  removeElevationObject(selectedElevationObjectId)
                }
                return
              }
              if (selectedId) removeObject(selectedId)
            }}
          />
          <IconToolbarButton
            label={elevationOpen ? '平面に戻る' : '立面を編集'}
            iconClassName={
              elevationOpen ? 'bi bi-arrow-left-square' : 'bi bi-front'
            }
            disabled={calibrating || (!elevationOpen && !selectedId)}
            onClick={() => {
              if (elevationOpen) {
                onCloseElevation()
                return
              }
              if (selectedId) onOpenElevation(selectedId)
            }}
          />
          <IconToolbarButton
            label="保存した間取りデータを開く"
            iconClassName="bi bi-folder2-open"
            onClick={() => projectInputRef.current?.click()}
          />
          <IconToolbarButton
            label="間取りデータをダウンロード"
            iconClassName="bi bi-download"
            variant="primary"
            onClick={onDownloadProject}
          />
        </Stack>
      </Navbar>

      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        className="d-none"
        onChange={onBackgroundSelected}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept={PROJECT_FILE_ACCEPT}
        className="d-none"
        onChange={onProjectSelected}
      />

      <Container
        fluid
        className="flex-grow-1 d-flex flex-column py-3 overflow-hidden gap-2"
      >
        {calibrating ? (
          <Alert variant="info" className="mb-0 py-2 small flex-shrink-0">
            {draftPoints.length === 0
              ? '実寸が分かる区間の一端を指定してください（例: ドア開口の左端）。2 点目は水平・垂直にスナップします。ピンチまたは右上のボタンで拡大、ドラッグで移動できます。「縮尺を校正」をもう一度押すと中止します。'
              : draftPoints.length === 1
                ? '同じ区間のもう一方の端を指定してください。ポインタは水平または垂直に張り付きます。'
                : '選んだ 2 点のあいだの実寸（mm）を入力してください。'}
          </Alert>
        ) : null}

        <div className="board-workspace flex-grow-1 d-flex flex-column">
          <BoardStage
            calibrating={calibrating}
            draftPoints={draftPoints}
            onCalibrationClick={onCalibrationClick}
          />
          <div className="dimension-overlay">
            <DimensionPanel
              mode="plan"
              object={selectedPlanObject}
              mmPerPixel={project.scale?.mmPerPixel}
              hidden={calibrating}
              showLabelField
              onChangeSize={(size) => {
                if (!selectedId) return
                updateObject(selectedId, size)
              }}
              onChangeLabel={(label) => {
                if (!selectedId) return
                updateObject(selectedId, { label: label || undefined })
              }}
            />
          </div>
        </div>
      </Container>

      <ScaleCalibrationModal
        show={scaleModalOpen}
        pixelLength={pixelLength}
        initialLengthMm={project.scale?.reference?.lengthMm}
        onCancel={resetCalibrationDraft}
        onConfirm={onConfirmScale}
      />

      <ScaleObjectPolicyModal
        show={pendingScale !== null}
        objectCount={project.objects.length}
        onCancel={resetCalibrationDraft}
        onChoose={onChooseScaleObjectPolicy}
      />

      <ElevationEditorModal
        show={elevationBoardId !== null}
        onHide={onCloseElevation}
      />
    </div>
  )
}

export default App
