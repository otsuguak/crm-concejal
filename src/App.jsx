import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Admin from './pages/Admin';
// 1. IMPORTA LA NUEVA PÁGINA
import Registro from './pages/Registro'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. AGREGA LA RUTA DE REGISTRO */}
        <Route path="/registro" element={<Registro />} />
        
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;

