import { useEffect, useState, type FormEvent } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { formatMm, mmToPx, pxToMm } from '../../lib/scale'
import type { BoardObject } from '../../types/project'

const MIN_SIZE_PX = 20

type DimensionPanelProps = {
  object: BoardObject | null
  mmPerPixel: number | undefined
  /** 縮尺校正中は寸法 UI を出さず、校正の案内と混線しないようにする */
  hidden?: boolean
  onChangeSize: (size: { width: number; height: number }) => void
}

export function DimensionPanel({
  object,
  mmPerPixel,
  hidden = false,
  onChangeSize,
}: DimensionPanelProps) {
  const [widthText, setWidthText] = useState('')
  const [heightText, setHeightText] = useState('')

  useEffect(() => {
    if (!object || mmPerPixel === undefined) {
      setWidthText('')
      setHeightText('')
      return
    }
    setWidthText(formatMm(pxToMm(object.width, mmPerPixel)))
    setHeightText(formatMm(pxToMm(object.height, mmPerPixel)))
  }, [object, mmPerPixel])

  if (hidden) return null

  if (mmPerPixel === undefined) {
    return (
      <Alert variant="warning" className="mb-0 py-2 small">
        先にツールバーの「縮尺を校正」で、図面上の既知の長さ（ドア開口など）の両端を指定してください。
      </Alert>
    )
  }

  if (!object) return null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const widthMm = Number(widthText)
    const heightMm = Number(heightText)
    if (!(widthMm > 0) || !(heightMm > 0)) return
    onChangeSize({
      width: Math.max(MIN_SIZE_PX, mmToPx(widthMm, mmPerPixel)),
      height: Math.max(MIN_SIZE_PX, mmToPx(heightMm, mmPerPixel)),
    })
  }

  return (
    <Form
      onSubmit={onSubmit}
      className="border rounded bg-white px-3 py-2"
      aria-label="矩形の寸法"
    >
      <Row className="g-2 align-items-end">
        <Col xs={12} sm="auto" className="small fw-semibold align-self-center">
          寸法（mm）
        </Col>
        <Col xs={6} sm={3}>
          <Form.Group controlId="object-width-mm">
            <Form.Label className="small mb-1">幅</Form.Label>
            <Form.Control
              type="number"
              min={0.1}
              step="any"
              inputMode="decimal"
              size="sm"
              value={widthText}
              onChange={(event) => setWidthText(event.target.value)}
            />
          </Form.Group>
        </Col>
        <Col xs={6} sm={3}>
          <Form.Group controlId="object-height-mm">
            <Form.Label className="small mb-1">高さ</Form.Label>
            <Form.Control
              type="number"
              min={0.1}
              step="any"
              inputMode="decimal"
              size="sm"
              value={heightText}
              onChange={(event) => setHeightText(event.target.value)}
            />
          </Form.Group>
        </Col>
        <Col xs="auto">
          <Button type="submit" size="sm" variant="outline-primary">
            適用
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
