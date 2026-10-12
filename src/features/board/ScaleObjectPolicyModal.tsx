import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Stack from 'react-bootstrap/Stack'

export type ScaleObjectPolicy = 'keepMm' | 'followDrawing'

type ScaleObjectPolicyModalProps = {
  show: boolean
  objectCount: number
  onCancel: () => void
  onChoose: (policy: ScaleObjectPolicy) => void
}

export function ScaleObjectPolicyModal({
  show,
  objectCount,
  onCancel,
  onChoose,
}: ScaleObjectPolicyModalProps) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>既存の矩形の扱い</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">
          縮尺を更新します。ボード上の矩形が {objectCount}{' '}
          個あります。どのように扱いますか。
        </p>
        <Stack gap={2}>
          <Button
            variant="primary"
            className="text-start"
            onClick={() => onChoose('keepMm')}
          >
            <div className="fw-semibold">寸法（mm）を保つ</div>
            <div className="small fw-normal opacity-75">
              今の幅・高さの mm
              はそのままにし、図上の見た目の大きさを新しい縮尺に合わせて変えます。
            </div>
          </Button>
          <Button
            variant="outline-primary"
            className="text-start"
            onClick={() => onChoose('followDrawing')}
          >
            <div className="fw-semibold">図面の縮尺に合わせる</div>
            <div className="small fw-normal opacity-75">
              図上の見た目の大きさはそのままにし、表示される mm
              を新しい縮尺に合わせます。
            </div>
          </Button>
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="outline-secondary" onClick={onCancel}>
          キャンセル
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
