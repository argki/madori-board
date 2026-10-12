import { useId } from 'react'
import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

type IconToolbarButtonProps = {
  label: string
  iconClassName: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'outline-light' | 'outline-secondary' | 'primary'
}

/** アイコンのみ。ホバーで日本語ラベルを Tooltip 表示する */
export function IconToolbarButton({
  label,
  iconClassName,
  onClick,
  disabled = false,
  variant = 'outline-light',
}: IconToolbarButtonProps) {
  const tooltipId = useId()

  const button = (
    <Button
      size="sm"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      <i className={iconClassName} aria-hidden="true" />
    </Button>
  )

  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 200, hide: 0 }}
      overlay={<Tooltip id={tooltipId}>{label}</Tooltip>}
    >
      {/* disabled の Button ではポインタイベントが無いので span で受ける */}
      <span className="d-inline-block">{button}</span>
    </OverlayTrigger>
  )
}
