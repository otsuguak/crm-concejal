import { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  // ESTADOS DEL LOGIN
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  
  // ESTADOS DEL MODAL DE REGISTRO
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [regNombre, setRegNombre] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCodigo, setRegCodigo] = useState(''); 
  const [regError, setRegError] = useState(null);
  const [regCargando, setRegCargando] = useState(false);
  
  // ESTADO DE LA NOTIFICACIÓN PREMIUM
  const [mensajeExito, setMensajeExito] = useState(false); 

  const navigate = useNavigate();

  // Función para Iniciar Sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
      setCargando(false);
    } else {
      navigate('/admin');
    }
  };

  // Función para Crear Cuenta Nueva (BLINDADA)
  const handleRegistro = async (e) => {
    e.preventDefault();
    setRegCargando(true);
    setRegError(null);

    // 1. ESCUDO (Exigimos el código de ingreso)
    if (!regNombre.trim() || !regTelefono.trim() || !regEmail.trim() || !regPassword.trim() || !regCodigo.trim()) {
      setRegError('Pilas: Todos los campos son obligatorios.');
      setRegCargando(false);
      return; 
    }

    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener mínimo 6 caracteres.');
      setRegCargando(false);
      return;
    }

    try {
      // 2. Creamos el usuario en Autenticación
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      });

      if (authError) throw authError;

      // 3. ¡EL INSERT DEFINITIVO!
      if (authData.user) {
        const { error: profileError } = await supabase.from('perfiles').insert([
          {
            id: authData.user.id,
            nombre: regNombre,
            telefono: regTelefono,
            correo: regEmail,
            codigo_ingreso: regCodigo,
            rol: 'asesor' 
          }
        ]);

        if (profileError) {
          const errorDetallado = JSON.stringify(profileError, null, 2);
          console.error("Error BD Detallado:", errorDetallado);
          alert("ERROR DE BASE DE DATOS:\n" + errorDetallado);
          throw new Error("Fallo en la inserción del perfil.");
        }
        
        // ==========================================
        // AQUÍ ESTÁ EL CAMBIO PARA EL MENSAJE BONITO
        // ==========================================
        setMensajeExito(true); 
        
        setTimeout(() => {
          setMostrarRegistro(false); 
          setRegNombre(''); setRegTelefono(''); setRegEmail(''); setRegPassword(''); setRegCodigo('');
          navigate('/admin'); 
        }, 2000); 
      }
    } catch (err) {
      setRegError('Error: ' + err.message);
    } finally {
      setRegCargando(false);
    }
  };

  return (
    <div className="login-wrapper">
      
      {/* LADO IZQUIERDO: Branding Institucional */}
      <div className="login-banner">
        <div className="login-banner-content">
          <h1 className="login-title-main">Torre de Control <br/> Territorial.</h1>
          <p className="login-subtitle">
            Sistema Integrado de Gestión y Gobernanza. 
            Administra casos, equipo y comunicación ciudadana desde un solo lugar.
          </p>
        </div>
      </div>

      {/* LADO DERECHO: Formulario de Acceso */}
      <div className="login-form-section">
        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          <p>Ingresa tus credenciales para acceder al CRM.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" placeholder="ejemplo@mosquera.gov.co" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary" disabled={cargando}>
              {cargando ? 'Verificando credenciales...' : 'Entrar al Sistema'}
            </button>
          </form>

          {/* Botón que abre el modal */}
          <div className="register-link-container">
            <p>¿Eres nuevo en el equipo? <button type="button" className="btn-link" onClick={() => setMostrarRegistro(true)}>Regístrate aquí</button></p>
          </div>
        </div>
      </div>

      {/* MODAL DE REGISTRO EMERGENTE */}
      {mostrarRegistro && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button className="btn-close-modal" onClick={() => setMostrarRegistro(false)}>✕</button>
            <h2 style={{ fontSize: '1.8rem', color: '#0A2540', marginBottom: '0.5rem', marginTop: 0 }}>Crear Cuenta</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Ingresa tus datos para unirte al CRM.</p>

            {regError && <div className="error-message">{regError}</div>}

            <form onSubmit={handleRegistro}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre Completo</label>
                <input type="text" placeholder="Ej. Cesar Leal" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Teléfono (WhatsApp)</label>
                <input type="tel" placeholder="Ej. 320 000 0000" value={regTelefono} onChange={(e) => setRegTelefono(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Correo Electrónico</label>
                <input type="email" placeholder="ejemplo@mosquera.gov.co" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Código de Ingreso (Seguridad)</label>
                <input type="text" placeholder="Ej. CONCEJAL2026" value={regCodigo} onChange={(e) => setRegCodigo(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength="6" />
              </div>

              <button type="submit" className="btn-primary" disabled={regCargando}>
                {regCargando ? 'Registrando usuario...' : 'Crear mi cuenta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          AQUÍ ESTÁ LA NOTIFICACIÓN VISUAL FLOTANTE
          ========================================= */}
      {mensajeExito && (
        <div className="toast-exito">
          ✅ ¡Cuenta creada con éxito! Ingresando a la Torre de Control...
        </div>
      )}

    </div>
  );
}