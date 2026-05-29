import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Bayiliklerim from './pages/Bayiliklerim'
import OdemeTaleplerim from './pages/OdemeTaleplerim'
import KontorGecmisi from './pages/KontorGecmisi'
import Raporlar from './pages/Raporlar'
import Ayarlar from './pages/Ayarlar'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Bayiliklerim />} />
          <Route path="odeme-talepleri" element={<OdemeTaleplerim />} />
          <Route path="kontor-gecmisi" element={<KontorGecmisi />} />
          <Route path="raporlar" element={<Raporlar />} />
          <Route path="ayarlar" element={<Ayarlar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
