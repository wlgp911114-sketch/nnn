import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Admin from './pages/Admin';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <div className="min-h-screen bg-black text-white font-sans">
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/admin/*" element={<Admin />} />
              </Routes>
            </Layout>
            <Toaster position="top-center" richColors />
          </div>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
