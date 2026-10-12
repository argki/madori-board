import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Modal from 'react-bootstrap/Modal'
import { IconToolbarButton } from '../../components/IconToolbarButton'
import { useBoardStore } from '../../stores/boardStore'
import { DimensionPanel } from '../board/DimensionPanel'
import { ElevationStage } from './ElevationStage'

type ElevationEditorModalProps = {
  show: boolean
  onHide: () => void
}

export function ElevationEditorModal({
  show,
  onHide,
}: ElevationEditorModalProps) {
  const project = useBoardStore((s) => s.project)
  const elevationBoardId = useBoardStore((s) => s.elevationBoardId)
  const boardObject = elevationBoardId
    ? (project.objects.find((object) => object.id === elevationBoardId) ?? null)
    : null
  const selectedElevationObjectId = useBoardStore(
    (s) => s.selectedElevationObjectId,
  )
  const addElevationObject = useBoardStore((s) => s.addElevationObject)
  const removeElevationObject = useBoardStore((s) => s.removeElevationObject)
  const updateElevationObject = useBoardStore((s) => s.updateElevationObject)

  const title = boardObject?.label?.trim() || '名称未設定の矩形'
  const selectedObject =
    boardObject?.elevation.objects.find(
      (object) => object.id === selectedElevationObjectId,
    ) ?? null

  return (
    <Modal
      show={show}
      onHide={onHide}
      enforceFocus={false}
      restoreFocus={false}
      className="elevation-modal"
      dialogClassName="elevation-modal-dialog"
      contentClassName="elevation-modal-content"
      aria-labelledby="elevation-editor-title"
    >
      <Modal.Header closeButton className="align-items-center gap-2">
        <Modal.Title id="elevation-editor-title" className="me-auto">
          立面 — {title}
        </Modal.Title>
        <ButtonGroup size="sm" className="flex-shrink-0">
          <IconToolbarButton
            label="矩形を追加"
            iconClassName="bi bi-bounding-box"
            variant="outline-secondary"
            onClick={() => addElevationObject()}
          />
          <IconToolbarButton
            label="矩形を削除"
            iconClassName="bi bi-trash"
            variant="outline-secondary"
            disabled={!selectedElevationObjectId}
            onClick={() => {
              if (selectedElevationObjectId) {
                removeElevationObject(selectedElevationObjectId)
              }
            }}
          />
        </ButtonGroup>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column gap-2 flex-grow-1 overflow-hidden p-3">
        <DimensionPanel
          mode="elevation"
          object={selectedObject}
          mmPerPixel={project.scale?.mmPerPixel}
          showLabelField
          onChangeSize={(size) => {
            if (!selectedElevationObjectId) return
            updateElevationObject(selectedElevationObjectId, size)
          }}
          onChangeLabel={(label) => {
            if (!selectedElevationObjectId) return
            updateElevationObject(selectedElevationObjectId, {
              label: label || undefined,
            })
          }}
        />
        <ElevationStage />
      </Modal.Body>
    </Modal>
  )
}
