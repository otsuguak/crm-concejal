import { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState(null); 
  
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [regNombre, setRegNombre] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCodigo, setRegCodigo] = useState(''); 
  const [regCargando, setRegCargando] = useState(false);
  const [regError, setRegError] = useState(null); 
  
  const [mensajeExito, setMensajeExito] = useState(false); 

  // 🔥 NUEVOS ESTADOS PARA RECUPERAR CONTRASEÑA 🔥
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [recuperarCargando, setRecuperarCargando] = useState(false);
  const [mensajeRecuperar, setMensajeRecuperar] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLogin(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/admin'); 
    } catch (error) {
      setErrorLogin("❌ Correo o contraseña incorrectos. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setRegCargando(true);
    setRegError(null); 

    try {
      const { data: config, error: errConfig } = await supabase.from('configuracion').select('codigo_secreto_registro, requiere_codigo').eq('id', 1).single();
      if (errConfig) throw new Error("No pudimos verificar la seguridad del servidor.");

      if (config.requiere_codigo && regCodigo !== config.codigo_secreto_registro) {
        setRegError("⛔ Código incorrecto. No haces parte del equipo gestor del Concejal.");
        setRegCargando(false);
        return; 
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({ email: regEmail, password: regPassword });

      if (authError) {
        if (authError.message.includes('already registered')) throw new Error("Este correo ya está registrado.");
        if (authError.message.includes('Password should be')) throw new Error("La contraseña es muy débil. Usa al menos 6 caracteres.");
        throw authError;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('perfiles').insert([
          { id: authData.user.id, nombre: regNombre, telefono: regTelefono, correo: regEmail, rol: 'asesor', codigo_ingreso: regCodigo }
        ]);

        if (profileError) throw new Error("Usuario creado en bóveda, pero falló el perfil: " + profileError.message);

        setMensajeExito(true);
        setTimeout(() => {
          setMensajeExito(false); setMostrarRegistro(false);
          setRegNombre(''); setRegTelefono(''); setRegEmail(''); setRegPassword(''); setRegCodigo('');
        }, 3500);
      }
    } catch (error) { setRegError(error.message); }
    setRegCargando(false);
  };

  // 🔥 FUNCIÓN PARA ENVIAR CORREO DE RECUPERACIÓN 🔥
  const handleRecuperarPassword = async (e) => {
    e.preventDefault();
    setRecuperarCargando(true);
    setMensajeRecuperar(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar);
      if (error) throw error;
      
      setMensajeRecuperar({ tipo: 'exito', texto: '✅ Te enviamos un enlace de recuperación al correo.' });
      setTimeout(() => {
        setMostrarRecuperar(false);
        setEmailRecuperar('');
        setMensajeRecuperar(null);
      }, 4000);
    } catch (error) {
      setMensajeRecuperar({ tipo: 'error', texto: '❌ Hubo un error. Verifica que el correo esté bien escrito.' });
    } finally {
      setRecuperarCargando(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      
      <style>{`
        /* 🔥 BLOQUEO ANTI DARK-MODE (LETRAS SIEMPRE OSCURAS Y FONDO BLANCO) 🔥 */
        input {
          color: #0f172a !important;
          background-color: #ffffff !important;
          color-scheme: light !important; 
        }
        input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        @media (max-width: 768px) {
          .login-container { flex-direction: column !important; }
          .login-left { padding: 40px 20px !important; min-height: 40vh; }
          .login-right { padding: 30px 15px !important; }
          .login-title { font-size: 2.2rem !important; }
        }
      `}</style>

      {mensajeExito && (
        <div className="toast-exito" style={{ position: 'fixed', top: '20px', right: '20px', background: '#10b981', color: 'white', padding: '15px 25px', borderRadius: '10px', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
          ✅ ¡Cuenta de asesor creada con éxito! Ya puedes iniciar sesión.
        </div>
      )}

      {/* MITAD IZQUIERDA */}
      <div className="login-left" style={{ flex: 1, background: '#003366', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '50px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: '#E30613', color: '#ffffff', padding: '15px 30px', borderRadius: '15px', fontWeight: '900', fontSize: '3rem', marginBottom: '20px', boxShadow: '0 10px 25px rgba(227, 6, 19, 0.4)' }}>Bienvenidos</div>
          <h1 className="login-title" style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 15px 0', lineHeight: '1.1', color: '#ffffff' }}>Portal de<br />Gestión Interna</h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '400px', lineHeight: '1.6', margin: 0 }}>Acceso exclusivo para el equipo de trabajo de Carlos Andres Pabon Gomez. Administra, gestiona y da solución a los radicados territoriales.</p>
        </div>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '500px', height: '500px', background: 'rgba(227, 6, 19, 0.1)', borderRadius: '50%' }}></div>
      </div>

      {/* MITAD DERECHA */}
      <div className="login-right" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#0f172a', margin: '0 0 5px 0', fontSize: '1.8rem' }}>Bienvenido 👋</h2>
          <p style={{ color: '#64748b', margin: '0 0 30px 0', fontSize: '0.95rem' }}>Ingresa tus credenciales para continuar.</p>

          {errorLogin && ( <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #fca5a5' }}>{errorLogin}</div> )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>Correo Electrónico</label>
              <input type="email" placeholder="admin@mosquera.gov.co" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '1rem' }} />
            </div>
            
            {/* 🔥 ENLACE DE OLVIDÉ MI CONTRASEÑA 🔥 */}
            <div style={{ textAlign: 'right', marginTop: '-10px' }}>
              <button 
                type="button" 
                onClick={() => { setMostrarRecuperar(true); setMensajeRecuperar(null); setEmailRecuperar(''); }} 
                style={{ background: 'none', border: 'none', color: '#003366', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" disabled={cargando} style={{ background: '#003366', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.2s', marginTop: '5px' }}>
              {cargando ? '⌛ Iniciando sesión...' : 'Ingresar al CRM 🚀'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>¿Eres nuevo en el equipo territorial? <br/><button onClick={() => { setMostrarRegistro(true); setRegError(null); }} style={{ background: 'transparent', border: 'none', color: '#E30613', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', marginTop: '5px' }}>Registrarme con Código de Acceso</button></p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔥 MODAL DE RECUPERACIÓN DE CONTRASEÑA 🔥 */}
      {/* ========================================================= */}
      {mostrarRecuperar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '40px', position: 'relative' }}>
            <button onClick={() => setMostrarRecuperar(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}>✕</button>
            <h2 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>Recuperar Acceso 🔐</h2>
            <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '0.9rem' }}>Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña.</p>
            
            {mensajeRecuperar && (
              <div style={{ background: mensajeRecuperar.tipo === 'exito' ? '#dcfce7' : '#fee2e2', color: mensajeRecuperar.tipo === 'exito' ? '#166534' : '#991b1b', padding: '15px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 'bold', border: `1px solid ${mensajeRecuperar.tipo === 'exito' ? '#bbf7d0' : '#fca5a5'}`, textAlign: 'center' }}>
                {mensajeRecuperar.texto}
              </div>
            )}

            <form onSubmit={handleRecuperarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Correo Registrado</label>
                <input type="email" value={emailRecuperar} onChange={(e) => setEmailRecuperar(e.target.value)} placeholder="tu-correo@ejemplo.com" required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '5px' }} />
              </div>
              <button type="submit" disabled={recuperarCargando} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '1rem' }}>
                {recuperarCargando ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE REGISTRO (MANTENIDO INTACTO) */}
      {/* ========================================================= */}
      {mostrarRegistro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setMostrarRegistro(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}>✕</button>
            <h2 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>Únete al Equipo 🤝</h2>
            <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '0.9rem' }}>Necesitas el código secreto proveído por el administrador.</p>
            {regError && ( <div style={{ background: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 'bold', border: '1px solid #fca5a5', textAlign: 'center' }}>{regError}</div> )}
            <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Nombre Completo</label><input type="text" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '5px' }} /></div>
              <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Teléfono Celular</label><input type="tel" value={regTelefono} onChange={(e) => setRegTelefono(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '5px' }} /></div>
              <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Correo Electrónico</label><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '5px' }} /></div>
              <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '10px', border: '1px solid #fecaca' }}><label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#991b1b' }}>🔐 Código Secreto de Acceso</label><input type="text" value={regCodigo} onChange={(e) => setRegCodigo(e.target.value)} placeholder="Solicítalo al Admin" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #fca5a5', boxSizing: 'border-box', marginTop: '5px', fontWeight: 'bold', color: '#991b1b' }} /></div>
              <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Crear Contraseña</label><input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength="6" placeholder="Mínimo 6 caracteres" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '5px' }} /></div>
              <button type="submit" disabled={regCargando} style={{ background: '#E30613', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>{regCargando ? 'Validando...' : 'Verificar y Crear Cuenta'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}