import { useEffect, useState, type FormEvent } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { formatMm, mmToPx, pxToMm } from '../../lib/scale'

const MIN_SIZE_PX = 1
const MIN_SIZE_MM = 1

type PlanSizedObject = {
  width: number
  height: number
  objectHeight: number
  label?: string
}

type ElevationSizedObject = {
  width: number
  height: number
  label?: string
}

type DimensionPanelProps =
  | {
      mode: 'plan'
      object: PlanSizedObject | null
      mmPerPixel: number | undefined
      hidden?: boolean
      showLabelField?: boolean
      onChangeSize: (size: {
        width: number
        height: number
        objectHeight: number
      }) => void
      onChangeLabel?: (label: string) => void
    }
  | {
      mode: 'elevation'
      object: ElevationSizedObject | null
      mmPerPixel: number | undefined
      hidden?: boolean
      showLabelField?: boolean
      onChangeSize: (size: { width: number; height: number }) => void
      onChangeLabel?: (label: string) => void
    }

export function DimensionPanel(props: DimensionPanelProps) {
  const {
    mode,
    object,
    mmPerPixel,
    hidden = false,
    showLabelField = false,
    onChangeLabel,
  } = props
  const [widthText, setWidthText] = useState('')
  const [depthText, setDepthText] = useState('')
  const [heightText, setHeightText] = useState('')
  const [labelText, setLabelText] = useState('')

  useEffect(() => {
    if (!object || mmPerPixel === undefined) {
      setWidthText('')
      setDepthText('')
      setHeightText('')
      return
    }
    setWidthText(formatMm(pxToMm(object.width, mmPerPixel)))
    if (mode === 'plan') {
      setDepthText(formatMm(pxToMm(object.height, mmPerPixel)))
      setHeightText(formatMm(pxToMm(object.objectHeight, mmPerPixel)))
    } else {
      setHeightText(formatMm(pxToMm(object.height, mmPerPixel)))
      setDepthText('')
    }
  }, [object, mmPerPixel, mode])

  useEffect(() => {
    setLabelText(object?.label ?? '')
  }, [object])

  if (hidden) return null

  if (!object) {
    if (mmPerPixel === undefined) {
      return (
        <Alert variant="warning" className="mb-0 py-2 small">
          先にツールバーの「縮尺を校正」で、図面上の既知の長さ（ドア開口など）の両端を指定してください。
        </Alert>
      )
    }
    return null
  }

  const canEditSize = mmPerPixel !== undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (showLabelField && onChangeLabel) {
      onChangeLabel(labelText.trim())
    }
    if (!canEditSize || mmPerPixel === undefined) return
    const widthMm = Number(widthText)

    if (mode === 'plan') {
      const depthMm = Number(depthText)
      const heightMm = Number(heightText)
      if (
        !(widthMm >= MIN_SIZE_MM) ||
        !(depthMm >= MIN_SIZE_MM) ||
        !(heightMm >= MIN_SIZE_MM)
      ) {
        return
      }
      props.onChangeSize({
        width: Math.max(MIN_SIZE_PX, mmToPx(widthMm, mmPerPixel)),
        height: Math.max(MIN_SIZE_PX, mmToPx(depthMm, mmPerPixel)),
        objectHeight: Math.max(MIN_SIZE_PX, mmToPx(heightMm, mmPerPixel)),
      })
      return
    }

    const heightMm = Number(heightText)
    if (!(widthMm >= MIN_SIZE_MM) || !(heightMm >= MIN_SIZE_MM)) return
    props.onChangeSize({
      width: Math.max(MIN_SIZE_PX, mmToPx(widthMm, mmPerPixel)),
      height: Math.max(MIN_SIZE_PX, mmToPx(heightMm, mmPerPixel)),
    })
  }

  return (
    <Form
      onSubmit={onSubmit}
      className="border rounded bg-white px-3 py-2"
      aria-label="矩形の属性"
    >
      <Row className="g-2 align-items-end">
        {showLabelField ? (
          <Col xs={12} md={3}>
            <Form.Group controlId="object-label">
              <Form.Label className="small mb-1">名称</Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="例: リビング収納"
                value={labelText}
                onChange={(event) => setLabelText(event.target.value)}
                onBlur={() => onChangeLabel?.(labelText.trim())}
              />
            </Form.Group>
          </Col>
        ) : null}
        {canEditSize ? (
          <>
            <Col
              xs={12}
              sm="auto"
              className="small fw-semibold align-self-center"
            >
              寸法（mm）
            </Col>
            <Col xs={4} sm={2}>
              <Form.Group controlId="object-width-mm">
                <Form.Label className="small mb-1">幅</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  size="sm"
                  value={widthText}
                  onChange={(event) => setWidthText(event.target.value)}
                />
              </Form.Group>
            </Col>
            {mode === 'plan' ? (
              <Col xs={4} sm={2}>
                <Form.Group controlId="object-depth-mm">
                  <Form.Label className="small mb-1">奥行き</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    size="sm"
                    value={depthText}
                    onChange={(event) => setDepthText(event.target.value)}
                  />
                </Form.Group>
              </Col>
            ) : null}
            <Col xs={4} sm={2}>
              <Form.Group controlId="object-height-mm">
                <Form.Label className="small mb-1">高さ</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  size="sm"
                  value={heightText}
                  onChange={(event) => setHeightText(event.target.value)}
                />
              </Form.Group>
            </Col>
          </>
        ) : (
          <Col xs={12} md className="small text-secondary align-self-center">
            寸法（mm）は縮尺校正のあとで入力できます。
          </Col>
        )}
        <Col xs="auto">
          <Button type="submit" size="sm" variant="outline-primary">
            適用
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
