import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Saved from './pages/Saved';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background text-text selection:bg-primary selection:text-white">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/saved" element={<Saved />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
