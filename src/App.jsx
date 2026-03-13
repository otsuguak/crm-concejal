import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La ruta principal (Cuando entran a la página normal) */}
        <Route path="/" element={<Inicio />} />
        
        {/* La ruta del candado */}
        <Route path="/login" element={<Login />} />
        
        {/* La ruta de la oficina privada */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;

