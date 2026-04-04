import { useState } from 'react'
import DomesticPage from './pages/domestic'
import OverseasPage from './pages/overseas'
import './App.css'

type TravelType = 'domestic' | 'overseas'

function App() {
  const [travelType, setTravelType] = useState<TravelType>('domestic')

  return (
    <>
      <nav>
        <button
          onClick={() => setTravelType('domestic')}
          aria-pressed={travelType === 'domestic'}
        >
          国内旅行
        </button>
        <button
          onClick={() => setTravelType('overseas')}
          aria-pressed={travelType === 'overseas'}
        >
          海外旅行
        </button>
      </nav>

      {travelType === 'domestic' ? <DomesticPage /> : <OverseasPage />}
    </>
  )
}

export default App
