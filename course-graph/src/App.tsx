import { Routes, Route } from 'react-router-dom'
import GraphPage from './pages/GraphPage'
import CoursePage from './pages/CoursePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GraphPage />} />
      <Route path="/course/:courseId" element={<CoursePage />} />
    </Routes>
  )
}

export default App