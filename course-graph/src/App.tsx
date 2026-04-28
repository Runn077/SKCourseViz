import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import GraphPage from './pages/GraphPage'
import CoursePage from './pages/CoursePage'

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<GraphPage />} />
                <Route path="/course/:courseId" element={<CoursePage />} />
                <Route path="/heatmap" element={<div style={{ color: 'white', padding: '32px' }}>Heatmap coming soon</div>} />
                <Route path="/list" element={<div style={{ color: 'white', padding: '32px' }}>List coming soon</div>} />
            </Routes>
        </Layout>
    )
}

export default App