import { createHttpChangeGateway } from '@/adapters/httpChangeGateway'
import { ChangeScreen } from '@/screens/ChangeScreen'

const gateway = createHttpChangeGateway()

function App() {
  return <ChangeScreen gateway={gateway} />
}

export default App
