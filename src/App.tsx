import { useRef, type ChangeEvent } from 'react'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Stack from 'react-bootstrap/Stack'
import { useStore } from 'zustand'
import { IconToolbarButton } from './components/IconToolbarButton'
import { BoardStage } from './features/board/BoardStage'
import { readFileAsDataUrl } from './lib/readFileAsDataUrl'
import { useBoardStore } from './stores/boardStore'

function App() {
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const undo = useStore(useBoardStore.temporal, (s) => s.undo)
  const redo = useStore(useBoardStore.temporal, (s) => s.redo)
  const pastStates = useStore(useBoardStore.temporal, (s) => s.pastStates)
  const futureStates = useStore(useBoardStore.temporal, (s) => s.futureStates)
  const setBackground = useBoardStore((s) => s.setBackground)
  const addObject = useBoardStore((s) => s.addObject)
  const selectedId = useBoardStore((s) => s.selectedId)
  const removeObject = useBoardStore((s) => s.removeObject)

  const onBackgroundSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setBackground({ name: file.name, dataUrl })
    } catch (error) {
      console.error(error)
      window.alert('背景の間取り図を読み込めませんでした')
    }
  }

  return (
    <div className="vh-100 d-flex flex-column">
      <Navbar bg="dark" data-bs-theme="dark" className="px-3">
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
            onClick={() => backgroundInputRef.current?.click()}
          />
          <IconToolbarButton
            label="矩形を追加"
            iconClassName="bi bi-bounding-box"
            onClick={() => addObject()}
          />
          <IconToolbarButton
            label="矩形を削除"
            iconClassName="bi bi-trash"
            disabled={!selectedId}
            onClick={() => {
              if (selectedId) removeObject(selectedId)
            }}
          />
          <IconToolbarButton
            label="保存した間取りデータを開く"
            iconClassName="bi bi-folder2-open"
            disabled
          />
          <IconToolbarButton
            label="間取りデータをダウンロード"
            iconClassName="bi bi-download"
            variant="primary"
            disabled
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

      <Container
        fluid
        className="flex-grow-1 d-flex flex-column py-3 overflow-hidden"
      >
        <BoardStage />
      </Container>
    </div>
  )
}

export default App
