import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import GraphPage from './pages/GraphPage'
import CoursePage from './pages/CoursePage'
import ListPage from './pages/ListPage'
import HeatmapPage from './pages/HeatMapPage'
import AboutPage from './pages/AboutPage'

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<GraphPage />} />
                <Route path="/course/:courseId" element={<CoursePage />} />
                <Route path="/heatmap" element={<HeatmapPage />} />
                <Route path="/list" element={<ListPage />} />
                <Route path="/about" element={<AboutPage />} />
            </Routes>
        </Layout>
    )
}

export default App