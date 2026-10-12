import { useEffect, useState, type FormEvent } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Stack from 'react-bootstrap/Stack'
import { SCALE_PRESETS } from '../../lib/scale'

type ScaleCalibrationModalProps = {
  show: boolean
  pixelLength: number
  initialLengthMm?: number
  onCancel: () => void
  onConfirm: (lengthMm: number) => void
}

export function ScaleCalibrationModal({
  show,
  pixelLength,
  initialLengthMm,
  onCancel,
  onConfirm,
}: ScaleCalibrationModalProps) {
  const [lengthText, setLengthText] = useState('')

  useEffect(() => {
    if (!show) return
    setLengthText(
      initialLengthMm !== undefined && Number.isFinite(initialLengthMm)
        ? String(initialLengthMm)
        : '',
    )
  }, [show, initialLengthMm])

  const lengthMm = Number(lengthText)
  const canSubmit = Number.isFinite(lengthMm) && lengthMm > 0 && pixelLength > 0

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    onConfirm(lengthMm)
  }

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>基準線の実寸を入力</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-secondary mb-3">
            いま選んだ 2
            点のあいだの実寸を入力します。図面の縮尺は概算です。現地の実測を優先してください。基準はできるだけ長い区間を取ると誤差が小さくなります。
          </p>
          <p className="small mb-3">
            選んだ 2 点の距離: {pixelLength.toFixed(1)} px（図面上）
          </p>
          <Form.Group controlId="scale-length-mm" className="mb-3">
            <Form.Label>実寸（mm）</Form.Label>
            <Form.Control
              type="number"
              min={1}
              step="any"
              inputMode="decimal"
              value={lengthText}
              onChange={(event) => setLengthText(event.target.value)}
              autoFocus
              required
            />
          </Form.Group>
          <div className="mb-1 small text-secondary">目安プリセット</div>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            {SCALE_PRESETS.map((preset) => (
              <Button
                key={preset.lengthMm}
                type="button"
                size="sm"
                variant="outline-secondary"
                onClick={() => setLengthText(String(preset.lengthMm))}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="outline-secondary" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            縮尺を設定
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
