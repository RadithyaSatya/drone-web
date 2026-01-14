import Header from './components/layout/Header.jsx'
import DashboardGrid from './components/layout/DashboardGrid.jsx'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <DashboardGrid />
    </div>
  )
}

export default App
