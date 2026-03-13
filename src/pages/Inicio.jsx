import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function Inicio() {
  const [noticias, setNoticias] = useState([]);
  const [tiposSolicitud, setTiposSolicitud] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null); 
  const [cargando, setCargando] = useState(false);

  // Estados Formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    async function cargarPortal() {
      const { data: n } = await supabase.from('noticias').select('*').order('id', { ascending: false });
      setNoticias(n || []);
      const { data: t } = await supabase.from('tipos_solicitud').select('*');
      setTiposSolicitud(t || []);
      if (t?.length > 0) setTipoId(t[0].id);
    }
    cargarPortal();
  }, []);

// --- FUNCIÓN GANADORA PARA INSTAGRAM ---
const obtenerUrlEmbebida = (url) => {
  if (!url) return null;
  // ... lógica de youtube igual ...
  if (url.includes('instagram.com')) {
    const match = url.match(/(?:https?:\/\/www\.)?instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/);
    const id = match ? match[1] : null;
    // USAMOS /embed/ SIN 'captioned' para que sea más limpio
    return id ? `https://www.instagram.com/p/${id}/embed/` : url;
  }
  return url;
};

  const enviarRadicado = async (e) => {
    e.preventDefault(); 
    setCargando(true);
    const tipo = tiposSolicitud.find(t => t.id === parseInt(tipoId));
    const fechaLim = new Date();
    fechaLim.setDate(fechaLim.getDate() + (tipo?.dias_respuesta || 5));

    const { error } = await supabase.from('casos').insert([{
      ciudadano_nombre: nombre, ciudadano_telefono: telefono,
      ciudadano_correo: correo, tipo_solicitud_id: tipoId,
      descripcion_caso: descripcion, fecha_limite: fechaLim.toISOString()
    }]);

    if (!error) {
      alert("✅ ¡Radicado con éxito! El equipo del #5 está en marcha.");
      setNombre(''); setTelefono(''); setCorreo(''); setDescripcion('');
    }
    setCargando(false);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#fff', color: '#1a1a1a' }}>
      
      <style>{`
        .card-gestion { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .card-gestion:hover { transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,51,102,0.15) !important; }
        .btn-primario { transition: 0.3s; }
        .btn-primario:hover { transform: scale(1.05); background-color: #c20510 !important; }
      `}</style>

      {/* NAVBAR PRO */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#E30613', color: '#fff', padding: '5px 12px', borderRadius: '5px', fontWeight: '900', fontSize: '1.5rem' }}>CR</div>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#003366' }}>CONCEJAL #5</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none', color: '#003366', fontWeight: 'bold', fontSize: '0.9rem', border: '2px solid #003366', padding: '8px 18px', borderRadius: '25px' }}>
          🔐 INGRESO EQUIPO
        </Link>
      </nav>

      {/* HERO SECTION - EFECTO "5" GIGANTE */}
      <header style={{ background: 'linear-gradient(135deg, #003366 0%, #001a33 100%)', color: 'white', padding: '100px 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', fontSize: '20rem', color: 'rgba(255,255,255,0.05)', fontWeight: '900', userSelect: 'none' }}>5</div>
        <h1 style={{ fontSize: '3.8rem', marginBottom: '10px', fontWeight: '900', letterSpacing: '-1px', position: 'relative' }}>EL CAMBIO SIGUE</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '40px', opacity: 0.9, position: 'relative' }}>Gestión real, resultados para la gente. <b>Vota Cambio Radical #5</b></p>
        <a href="#radicar" className="btn-primario" style={{ backgroundColor: '#E30613', color: 'white', padding: '18px 45px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(227, 6, 19, 0.4)', position: 'relative' }}>RADICAR SOLICITUD AQUÍ</a>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 5%' }}>
        
        {/* SECCIÓN GESTIÓN EN TERRITORIO */}
        <section id="gestion" style={{ marginBottom: '100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.8rem', color: '#003366', fontWeight: '800' }}>📢 GESTIÓN EN TERRITORIO</h2>
            <div style={{ width: '60px', height: '5px', backgroundColor: '#E30613', margin: '15px auto' }}></div>
            <p style={{ color: '#666' }}>Transformando nuestra comunidad con hechos, no palabras.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
            {noticias.map(n => (
              <div key={n.id} className="card-gestion" style={{ borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backgroundColor: '#fff', border: '1px solid #eee' }}>
                <div style={{ position: 'relative' }}>
                  <img src={n.imagen_1_despues} style={{ width: '100%', height: '240px', objectFit: 'cover' }} alt="Logro" />
                  <span style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#28a745', color: 'white', padding: '5px 15px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>LOGRO ALCANZADO</span>
                </div>
                <div style={{ padding: '30px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#003366', fontSize: '1.4rem', fontWeight: '800' }}>{n.titulo}</h3>
                  <button 
                    onClick={() => setNoticiaSeleccionada(n)}
                    style={{ background: 'none', border: 'none', color: '#E30613', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
                  >
                    VER RESEÑA COMPLETA →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VENTANILLA CIUDADANA CON ESTADÍSTICAS */}
        <section id="radicar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '60px', borderRadius: '40px', border: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: '2.8rem', color: '#003366', fontWeight: '800', lineHeight: 1.1 }}>VENTANILLA <br/><span style={{color: '#E30613'}}>CIUDADANA</span></h2>
            <p style={{ fontSize: '1.1rem', color: '#444', lineHeight: '1.6', margin: '25px 0' }}>
              ¿Tienes una petición, queja o una idea para mejorar nuestro municipio? Mi equipo jurídico y técnico revisará tu caso personalmente.
            </p>
            <div style={{ display: 'flex', gap: '25px', marginTop: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', color: '#E30613', fontWeight: '900' }}>100%</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>TRANSPARENTE</div>
                </div>
                <div style={{ width: '1px', backgroundColor: '#cbd5e1' }}></div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', color: '#E30613', fontWeight: '900' }}>24/7</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>DISPONIBLE</div>
                </div>
            </div>
          </div>

          <form onSubmit={enviarRadicado} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <input type="text" placeholder="Nombre completo" value={nombre} onChange={e=>setNombre(e.target.value)} required style={inputStyle} />
            <div style={{ display: 'flex', gap: '15px' }}>
                <input type="tel" placeholder="WhatsApp" value={telefono} onChange={e=>setTelefono(e.target.value)} required style={{...inputStyle, flex: 1}} />
                <input type="email" placeholder="Correo" value={correo} onChange={e=>setCorreo(e.target.value)} required style={{...inputStyle, flex: 1}} />
            </div>
            <select value={tipoId} onChange={e=>setTipoId(e.target.value)} style={inputStyle}>
                {tiposSolicitud.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <textarea placeholder="Describe tu caso detalladamente..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required style={{...inputStyle, height: '120px'}} />
            <button type="submit" disabled={cargando} style={{ width: '100%', padding: '18px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>
                {cargando ? 'PROCESANDO RADICADO...' : 'ENVIAR RADICADO AL #5'}
            </button>
          </form>
        </section>

      </div>

      {/* MODAL DE RESEÑA ELITE (INSTAGRAM FIX) */}
      {noticiaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,34,68,0.98)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '950px', borderRadius: '35px', maxHeight: '92vh', overflowY: 'auto', position: 'relative', padding: '50px' }}>
            <button onClick={() => setNoticiaSeleccionada(null)} style={{ position: 'absolute', top: '30px', right: '30px', border: 'none', background: '#f1f5f9', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold' }}>✕</button>
            
            <h2 style={{ fontSize: '2.6rem', color: '#003366', fontWeight: '900', marginBottom: '25px', paddingRight: '50px' }}>{noticiaSeleccionada.titulo}</h2>
            
            {/* --- SECCIÓN DE VIDEO CON RE-ENMARCADO FINAL (MODO CINEMA) --- */}
            {noticiaSeleccionada.video_url && noticiaSeleccionada.video_url.includes('instagram') ? (
              <div style={{ 
                marginBottom: '40px', 
                display: 'flex', 
                justifyContent: 'center', 
                backgroundColor: '#000', 
                borderRadius: '35px', 
                overflow: 'hidden', // La ventana que recorta
                boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                maxWidth: '420px', 
                height: '580px', // Altura de la ventana visible
                margin: '0 auto 40px auto',
                border: '4px solid #003366' // Borde elegante del partido
              }}>
                <div style={{ 
                  position: 'relative', 
                  width: '100%',
                  height: '950px', // Contenido estirado para que sobre por arriba y abajo
                  marginTop: '-80px', // Escondemos el header de IG
                }}>
                  <iframe 
                   width="100%" 
                   height="100%" 
                   src={obtenerUrlEmbebida(noticiaSeleccionada.video_url)} 
                   frameBorder="0" 
                   scrolling="no"
                   allowTransparency="true"
                     // Re-activamos los permisos de interacción y video
                   allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                   style={{ 
                   border: 'none',
                   // Quitamos el pointerEvents: 'none' que lo mató
                   cursor: 'pointer' 
                   }}
                  ></iframe>
                </div>
              </div>
            ) : (
              // VISTA PARA YOUTUBE O NADA (IDEM AL ANTERIOR)
              noticiaSeleccionada.video_url && (
                <div style={{ marginBottom: '40px', borderRadius: '25px', overflow: 'hidden', backgroundColor: '#000', height: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                  <iframe width="100%" height="100%" src={obtenerUrlEmbebida(noticiaSeleccionada.video_url)} frameBorder="0" allowFullScreen style={{ border: 'none' }}></iframe>
                </div>
              )
            )}

            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#444', marginBottom: '50px', whiteSpace: 'pre-wrap' }}>{noticiaSeleccionada.descripcion}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#E30613', display: 'block', marginBottom: '15px' }}>🔴 REGISTRO: EL ANTES</span>
                <img src={noticiaSeleccionada.imagen_1_antes} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#28a745', display: 'block', marginBottom: '15px' }}>🟢 GESTIÓN: EL DESPUÉS</span>
                <img src={noticiaSeleccionada.imagen_1_despues} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
              </div>
            </div>

            <footer style={{ marginTop: '60px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '30px', color: '#003366', fontWeight: 'bold' }}>
               CAMBIO RADICAL #5 - HECHOS PARA EL CAMBIO
            </footer>
          </div>
        </div>
      )}

      {/* FOOTER POLÍTICO */}
      <footer style={{ backgroundColor: '#001a33', color: 'white', padding: '60px 5%', textAlign: 'center' }}>
        <p style={{ fontWeight: '900', fontSize: '1.5rem', marginBottom: '10px' }}>CAMBIO RADICAL #5</p>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Publicidad política pagada. Mosquera, Cundinamarca © 2026</p>
      </footer>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '15px 20px', marginBottom: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' };