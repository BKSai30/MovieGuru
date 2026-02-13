
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Saved from './pages/Saved';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChangeProfilePicture from './pages/ChangeProfilePicture';
import Reviews from './pages/Reviews';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <div className="min-h-screen bg-background text-text selection:bg-primary selection:text-white flex flex-col pb-16">
                        <Navbar />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route
                                path="/"
                                element={
                                    <PrivateRoute>
                                        <Home />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/saved"
                                element={
                                    <PrivateRoute>
                                        <Saved />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/reviews"
                                element={
                                    <PrivateRoute>
                                        <Reviews />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/change-profile-picture"
                                element={
                                    <PrivateRoute>
                                        <ChangeProfilePicture />
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                        <Footer />
                    </div>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
