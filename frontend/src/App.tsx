import { createHttpChangeGateway } from '@/adapters/httpChangeGateway'
import { CashRegisterScreen } from '@/screens/CashRegisterScreen'

const gateway = createHttpChangeGateway()

function App() {
  return <CashRegisterScreen gateway={gateway} />
}

export default App
