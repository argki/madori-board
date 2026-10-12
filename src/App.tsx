import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Stack from 'react-bootstrap/Stack'
import { useStore } from 'zustand'
import { BoardPlaceholder } from './features/board/BoardPlaceholder'
import { useBoardStore } from './stores/boardStore'

function App() {
  const undo = useStore(useBoardStore.temporal, (s) => s.undo)
  const redo = useStore(useBoardStore.temporal, (s) => s.redo)
  const pastStates = useStore(useBoardStore.temporal, (s) => s.pastStates)
  const futureStates = useStore(useBoardStore.temporal, (s) => s.futureStates)

  return (
    <div className="vh-100 d-flex flex-column">
      <Navbar bg="dark" data-bs-theme="dark" className="px-3">
        <Navbar.Brand href="#home">madori-board</Navbar.Brand>
        <Stack direction="horizontal" gap={2} className="ms-auto flex-wrap">
          <ButtonGroup size="sm">
            <Button
              variant="outline-light"
              disabled={pastStates.length === 0}
              onClick={() => undo()}
            >
              戻る
            </Button>
            <Button
              variant="outline-light"
              disabled={futureStates.length === 0}
              onClick={() => redo()}
            >
              進む
            </Button>
          </ButtonGroup>
          <Button size="sm" variant="outline-light" disabled>
            背景の間取り図を設定
          </Button>
          <Button size="sm" variant="outline-light" disabled>
            保存した間取りデータを開く
          </Button>
          <Button size="sm" variant="primary" disabled>
            間取りデータをダウンロード
          </Button>
        </Stack>
      </Navbar>

      <Container
        fluid
        className="flex-grow-1 d-flex flex-column py-3 overflow-hidden"
      >
        <BoardPlaceholder />
      </Container>
    </div>
  )
}

export default App
