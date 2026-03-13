import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function Inicio() {
  const [noticias, setNoticias] = useState([]);
  const [tiposSolicitud, setTiposSolicitud] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null); // Para la reseña completa
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

  const enviarRadicado = async (e) => {
    e.preventDefault(); setCargando(true);
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
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#fff' }}>
      
      {/* ESTILOS DE MOVIMIENTO (CSS INTERNO) */}
      <style>{`
        .card-gestion { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .card-gestion:hover { transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,51,102,0.15) !important; }
        .btn-primario { transition: 0.3s; }
        .btn-primario:hover { transform: scale(1.05); background-color: #c20510 !important; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#fff', boxShadow: '0 2px 15px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#E30613', color: '#fff', padding: '8px 15px', borderRadius: '8px', fontWeight: '900', fontSize: '1.4rem' }}>5</div>
          <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#003366', letterSpacing: '-0.5px' }}>CAMBIO RADICAL</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none', color: '#003366', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '1px', border: '2px solid #003366', padding: '10px 20px', borderRadius: '50px' }}>ACCESO EQUIPO</Link>
      </nav>

      {/* HERO IMPACTANTE */}
      <header style={{ background: 'linear-gradient(rgba(0,51,102,0.9), rgba(0,51,102,0.9)), url("https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1500&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', padding: '120px 5%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '20px', lineHeight: 1 }}>EL GRAN CAMBIO <br/><span style={{color: '#E30613'}}>CON EL #5</span></h1>
        <p style={{ fontSize: '1.4rem', maxWidth: '700px', margin: '0 auto 40px', opacity: 0.9 }}>Transformando el territorio con gestión real y transparencia absoluta.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#radicar" className="btn-primario" style={{ backgroundColor: '#E30613', color: 'white', padding: '18px 40px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(227,6,19,0.3)' }}>RADICAR SOLICITUD</a>
          <a href="#gestion" style={{ backgroundColor: 'transparent', color: 'white', padding: '18px 40px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', border: '2px solid white' }}>VER MI GESTIÓN</a>
        </div>
      </header>

      {/* SECCIÓN DE GESTIÓN CON MOVIMIENTO */}
      <section id="gestion" style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ color: '#E30613', fontWeight: 'bold', letterSpacing: '2px' }}>RESULTADOS REALES</span>
          <h2 style={{ fontSize: '2.8rem', color: '#003366', fontWeight: '900', marginTop: '10px' }}>Gestión en Movimiento</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
          {noticias.map(n => (
            <div key={n.id} className="card-gestion" style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative', height: '240px' }}>
                <img src={n.imagen_1_despues} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#28a745', color: 'white', padding: '5px 15px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>LOGRO ALCANZADO</div>
              </div>
              <div style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#003366', marginBottom: '15px', fontWeight: '800' }}>{n.titulo}</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', height: '75px', overflow: 'hidden' }}>{n.descripcion}</p>
                <button 
                  onClick={() => setNoticiaSeleccionada(n)}
                  style={{ marginTop: '20px', background: 'none', border: 'none', color: '#E30613', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
                >
                  VER RESEÑA COMPLETA →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULARIO VENTANILLA */}
      <section id="radicar" style={{ backgroundColor: '#003366', padding: '100px 5%', color: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' }}>
          <div>
            <h2 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1 }}>Ventanilla <br/><span style={{color: '#E30613'}}>del Ciudadano</span></h2>
            <p style={{ fontSize: '1.2rem', margin: '30px 0', opacity: 0.8 }}>No estás solo. Cuéntanos tu problema, adjunta tu necesidad y mi equipo de trabajo le dará seguimiento prioritario.</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '15px', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>#5</div>
                <div style={{ fontSize: '0.8rem' }}>EN EL TARJETÓN</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '15px', flex: 1 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900' }}>24h</div>
                <div style={{ fontSize: '0.8rem' }}>RESPUESTA INICIAL</div>
              </div>
            </div>
          </div>
          <form onSubmit={enviarRadicado} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '30px' }}>
             <input type="text" placeholder="Tu Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required style={inStyle} />
             <input type="tel" placeholder="WhatsApp" value={telefono} onChange={e=>setTelefono(e.target.value)} required style={inStyle} />
             <select value={tipoId} onChange={e=>setTipoId(e.target.value)} style={inStyle}>
                {tiposSolicitud.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
             </select>
             <textarea placeholder="Describe tu situación..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required style={{...inStyle, height: '100px'}} />
             <button type="submit" disabled={cargando} style={{ width: '100%', padding: '18px', backgroundColor: '#E30613', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer' }}>
                {cargando ? 'ENVIANDO...' : 'RADICAR AHORA'}
             </button>
          </form>
        </div>
      </section>

      {/* MODAL DE RESEÑA COMPLETA (VENTANA EMERGENTE) */}
      {noticiaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,51,102,0.95)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '900px', borderRadius: '30px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '40px' }}>
            <button onClick={() => setNoticiaSeleccionada(null)} style={{ position: 'absolute', top: '30px', right: '30px', border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            
            <h2 style={{ fontSize: '2.5rem', color: '#003366', fontWeight: '900', marginBottom: '20px' }}>{noticiaSeleccionada.titulo}</h2>
            
            {/* Si hay video, lo mostramos primero */}
            {noticiaSeleccionada.video_url && (
              <div style={{ marginBottom: '30px', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#000', height: '400px' }}>
                <iframe 
                  width="100%" height="100%" 
                  src={noticiaSeleccionada.video_url.replace('watch?v=', 'embed/')} 
                  frameBorder="0" allowFullScreen
                ></iframe>
              </div>
            )}

            <p style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#475569', marginBottom: '40px' }}>{noticiaSeleccionada.descripcion}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <span style={{ fontWeight: 'bold', color: '#E30613' }}>🔴 EL ANTES:</span>
                <img src={noticiaSeleccionada.imagen_1_antes} style={{ width: '100%', borderRadius: '15px', marginTop: '10px' }} />
              </div>
              <div>
                <span style={{ fontWeight: 'bold', color: '#28a745' }}>🟢 EL DESPUÉS:</span>
                <img src={noticiaSeleccionada.imagen_1_despues} style={{ width: '100%', borderRadius: '15px', marginTop: '10px' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
        <b>CONCEJAL #5 - CAMBIO RADICAL</b> | Mosquera, Cundinamarca © 2026
      </footer>

    </div>
  );
}

const inStyle = { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };