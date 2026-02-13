import './App.css'
import Navbar from './components/navbar/Navbar.jsx'
import MainBody from './components/mainBody/MainBody.jsx'  
import Footer from './components/footer/footer.jsx'

function App() {
  return (
    <div className='app-wrapper'>
      <Navbar />
      <main className="content-area">
        <MainBody />
      </main>
      <Footer />
    </div>
  )
}

export default App;