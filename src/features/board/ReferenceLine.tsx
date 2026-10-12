import { Circle, Line } from 'react-konva'
import type { Point } from '../../lib/scale'

type ReferenceLineProps = {
  a: Point
  b?: Point | null
  draft?: boolean
}

export function ReferenceLine({ a, b, draft = false }: ReferenceLineProps) {
  const stroke = draft ? '#fd7e14' : '#198754'
  const fill = draft ? 'rgba(253, 126, 20, 0.35)' : 'rgba(25, 135, 84, 0.35)'
  const points = b ? [a.x, a.y, b.x, b.y] : [a.x, a.y, a.x, a.y]

  return (
    <>
      {b ? (
        <Line
          points={points}
          stroke={stroke}
          strokeWidth={2}
          strokeScaleEnabled={false}
          dash={draft ? [8, 6] : undefined}
          listening={false}
        />
      ) : null}
      <Circle
        x={a.x}
        y={a.y}
        radius={5}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeScaleEnabled={false}
        listening={false}
      />
      {b ? (
        <Circle
          x={b.x}
          y={b.y}
          radius={5}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          strokeScaleEnabled={false}
          listening={false}
        />
      ) : null}
    </>
  )
}
