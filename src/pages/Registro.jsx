import { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      // 1. Crear el usuario en el sistema de Autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Si se creó bien, guardamos sus datos en nuestra tabla pública 'perfiles'
      if (authData.user) {
        const { error: profileError } = await supabase.from('perfiles').insert([
          {
            id: authData.user.id,
            nombre: nombre,
            telefono: telefono,
            rol: 'asesor' // Por defecto entran como asesores del Concejal
          }
        ]);

        if (profileError) throw profileError;
        
        // 3. ¡Todo listo! Lo mandamos directo al CRM
        alert('¡Cuenta creada con éxito! Bienvenido al equipo.');
        navigate('/admin');
      }
    } catch (err) {
      setError('Error al registrar: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-wrapper">
      
      {/* LADO IZQUIERDO: Branding Institucional */}
      <div className="login-banner">
        <div className="login-banner-content">
          <h1 className="login-title-main">
            Únete al <br/> Equipo #5.
          </h1>
          <p className="login-subtitle">
            Crea tu cuenta como asesor y comienza a gestionar las solicitudes ciudadanas de Mosquera con transparencia y eficiencia.
          </p>
        </div>
      </div>

      {/* LADO DERECHO: Formulario de Registro Completo */}
      <div className="login-form-section">
        <div className="login-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h2>Crear Cuenta</h2>
          <p>Ingresa tus datos para unirte al CRM.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleRegistro}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                placeholder="Ej. Cesar Leal"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                id="telefono"
                placeholder="Ej. 320 000 0000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="ejemplo@mosquera.gov.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña (Mínimo 6 caracteres)</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={cargando}
            >
              {cargando ? 'Registrando usuario...' : 'Crear mi cuenta'}
            </button>
            
            {/* Enlace de regreso al Login */}
            <div className="register-link-container">
              <p>¿Ya tienes cuenta? <Link to="/login">Inicia Sesión aquí</Link></p>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}