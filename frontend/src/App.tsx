
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { NovelsPage } from './pages/NovelsPage'
import { NovelDetailsPage } from './pages/NovelDetailsPage'
import { ChapterReaderPage } from './pages/ChapterReaderPage'
import { AppRoutes } from './routes'

function App() {
  return (
    <Routes>
      <Route path={AppRoutes.LOGIN} element={<LoginPage/>} />
      <Route path={AppRoutes.DASHBOARD} element={<div>Welcome to Dashboard</div>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path={AppRoutes.VIEW.NOVELS} element={<NovelsPage />} />
      <Route path={AppRoutes.VIEW.NOVEL_DETAILS} element={<NovelDetailsPage/>}/>
      <Route path={AppRoutes.VIEW.CHAPTER} element={<ChapterReaderPage/>}/>
    </Routes>
  )
}

export default App
