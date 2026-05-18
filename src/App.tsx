import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { Layout } from './components/Layout';
import { Ask } from './pages/Ask';
import { Browse } from './pages/Browse';
import { Landing } from './pages/Landing';
import { Reveal } from './pages/Reveal';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="ask" element={<Ask />} />
            <Route path="reveal" element={<Reveal />} />
            <Route path="browse" element={<Browse />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
