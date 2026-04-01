import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function Inicio() {
  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null); 
  const [cargando, setCargando] = useState(false);

  const [config, setConfig] = useState({
    listaPQRSF: [], listaSubcategorias: [],
    textos: { 
      tituloHero: 'EL CAMBIO SIGUE', descHero: 'Gestión real, resultados para la gente. Vota Cambio Radical #5', 
      tituloForm: 'VENTANILLA CIUDADANA', descForm: '¿Tienes una petición, queja o una idea para mejorar nuestro municipio? Mi equipo jurídico y técnico revisará tu caso personalmente.', 
      tituloNoticias: 'GESTIÓN EN TERRITORIO', descNoticias: 'Transformando nuestra comunidad con hechos, no palabras.',
      tituloRedes: '📱 ¡Conéctate con el Cambio!', descRedes: 'Únete a nuestra comunidad digital. Entérate en tiempo real de nuestros proyectos, debates y resultados en el municipio. ¡Tu voz también cuenta en nuestras redes!'
    },
    redes: { facebook: '', instagram: '', tiktok: '' }
  });

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [tipoPQRSF, setTipoPQRSF] = useState('');
  const [subcategoria, setSubcategoria] = useState(''); 
  const [descripcion, setDescripcion] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function cargarPortal() {
      const { data: dataConfig, error: errorConfig } = await supabase.from('configuracion').select('*').eq('id', 1).single();

      if (dataConfig && !errorConfig) {
        setConfig({
          listaPQRSF: dataConfig.lista_pqrsf || [], listaSubcategorias: dataConfig.lista_subcategorias || [],
          textos: {
            tituloHero: dataConfig.titulo_hero || 'EL CAMBIO SIGUE', descHero: dataConfig.descripcion_hero || 'Gestión real, resultados para la gente. Vota Cambio Radical #5',
            tituloForm: dataConfig.titulo_formulario || 'VENTANILLA CIUDADANA', descForm: dataConfig.descripcion_formulario || '¿Tienes una petición, queja o una idea para mejorar nuestro municipio? Mi equipo jurídico y técnico revisará tu caso personalmente.',
            tituloNoticias: dataConfig.titulo_noticias || 'GESTIÓN EN TERRITORIO', descNoticias: dataConfig.descripcion_noticias_seccion || 'Transformando nuestra comunidad con hechos, no palabras.',
            tituloRedes: dataConfig.titulo_redes || '📱 ¡Conéctate con el Cambio!', descRedes: dataConfig.descripcion_redes || 'Únete a nuestra comunidad digital. Entérate en tiempo real de nuestros proyectos, debates y resultados en el municipio. ¡Tu voz también cuenta en nuestras redes!'
          },
          redes: { facebook: dataConfig.url_facebook || '', instagram: dataConfig.url_instagram || '', tiktok: dataConfig.url_tiktok || '' }
        });
        
        if (dataConfig.lista_pqrsf?.length > 0) setTipoPQRSF(dataConfig.lista_pqrsf[0]);
        if (dataConfig.lista_subcategorias?.length > 0) setSubcategoria(dataConfig.lista_subcategorias[0]);
      }

      const { data: n } = await supabase.from('noticias').select('*').eq('visible', true).order('id', { ascending: false });
      setNoticias(n || []);
    }
    cargarPortal();
  }, []);

  const obtenerUrlEmbebida = (url) => {
    if (!url) return null;
    if (url.includes('instagram.com')) {
      const match = url.match(/(?:https?:\/\/www\.)?instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/);
      const id = match ? match[1] : null;
      return id ? `https://www.instagram.com/p/${id}/embed/` : url;
    }
    return url;
  };

  const enviarRadicado = async (e) => {
    e.preventDefault(); setCargando(true);
    const fechaLim = new Date(); fechaLim.setDate(fechaLim.getDate() + 5); 

    const { error } = await supabase.from('casos').insert([{
      ciudadano_nombre: nombre, ciudadano_telefono: telefono, ciudadano_correo: correo, 
      asunto_principal: tipoPQRSF, subcategoria: subcategoria, descripcion_caso: descripcion, 
      fecha_limite: fechaLim.toISOString(), estado: 'ABIERTO' 
    }]);

    if (!error) {
      setToastMsg("✅ ¡Radicado con éxito! El equipo del #5 está en marcha.");
      setNombre(''); setTelefono(''); setCorreo(''); setDescripcion('');
      if (config.listaPQRSF.length > 0) setTipoPQRSF(config.listaPQRSF[0]);
      if (config.listaSubcategorias.length > 0) setSubcategoria(config.listaSubcategorias[0]);
      setTimeout(() => { setToastMsg(''); }, 4000);
    } else { alert("Error: " + error.message); }
    setCargando(false);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#fff', color: '#1a1a1a', overflowX: 'hidden' }}>
      
      {toastMsg && ( <div className="toast-exito" style={{ zIndex: 9999 }}>{toastMsg}</div> )}

      {/* 🔥 ESTILOS MÁGICOS: RESPONSIVE DESIGN (MÓVILES) 🔥 */}
      <style>{`
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        
        .hero-title { font-size: clamp(2.2rem, 5vw, 4.5rem) !important; color: #ffffff !important; font-weight: 900; line-height: 1.1; margin-bottom: 20px; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .hero-subtitle { font-size: clamp(1rem, 2vw, 1.5rem) !important; color: #e2e8f0 !important; margin-bottom: 40px; line-height: 1.5; font-weight: 400; max-width: 800px; margin-left: auto; margin-right: auto; }

        .card-gestion { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .card-gestion:hover { transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,51,102,0.15) !important; }
        .btn-primario { transition: 0.3s; }
        .btn-primario:hover { transform: scale(1.05); background-color: #c20510 !important; }
        .input-hover:focus { border-color: #003366 !important; box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1) !important; }
        
        .btn-social { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px 35px; border-radius: 50px; color: white !important; font-weight: 800; text-decoration: none; font-size: 1.1rem; min-width: 150px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .btn-social:hover { transform: translateY(-8px); color: white !important; }
        .btn-social.fb { background: #1877F2; box-shadow: 0 10px 20px rgba(24, 119, 242, 0.3); }
        .btn-social.ig { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); box-shadow: 0 10px 20px rgba(220, 39, 67, 0.3); }
        .btn-social.tk { background: #000000; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3); border: 2px solid #222; }
        .btn-social.tk:hover { box-shadow: -4px 4px 0 #00f2fe, 4px -4px 0 #fe0979; border-color: transparent; }

        /* AJUSTES ESPECÍFICOS PARA CELULARES QUE ARREGLAN EL FORMULARIO */
        @media (max-width: 768px) {
          .nav-container { flex-direction: column; gap: 15px; padding: 20px !important; text-align: center; }
          .form-grid { grid-template-columns: 1fr !important; gap: 0px !important; } /* 🔥 Hace que queden uno debajo del otro */
          .hero-header { padding: 80px 20px !important; }
          .section-padding { padding: 40px 20px !important; }
          .title-responsive { font-size: 2.2rem !important; text-align: center; }
          .radicar-container { grid-template-columns: 1fr !important; padding: 30px 20px !important; text-align: center; }
          .form-padding { padding: 25px 15px !important; }
          .stat-mobile-box { justify-content: center !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#E30613', color: '#fff', padding: '5px 12px', borderRadius: '5px', fontWeight: '900', fontSize: '1.5rem' }}>CR</div>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#003366' }}>CONCEJAL #5 Mosquera</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none', color: '#003366', fontWeight: 'bold', fontSize: '0.9rem', border: '2px solid #003366', padding: '8px 18px', borderRadius: '25px', transition: '0.3s' }}>
          🔐 INGRESO EQUIPO
        </Link>
      </nav>

      {/* HERO SECTION BLINDADA */}
      <header className="hero-header" style={{ background: 'linear-gradient(135deg, #003366 0%, #001a33 100%)', padding: '120px 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', fontSize: '20rem', color: 'rgba(255,255,255,0.05)', fontWeight: '900', userSelect: 'none', pointerEvents: 'none' }}>5</div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="hero-title">{config.textos.tituloHero}</h1>
          <p className="hero-subtitle">{config.textos.descHero}</p>
          <a href="#radicar" className="btn-primario" style={{ backgroundColor: '#E30613', color: '#ffffff', padding: '18px 45px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(227, 6, 19, 0.4)', display: 'inline-block' }}>RADICAR SOLICITUD AQUÍ</a>
        </div>
      </header>

      <div className="section-padding" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 5%' }}>
        
        {/* SECCIÓN NOTICIAS Y LOGROS */}
        <section id="gestion" style={{ marginBottom: '100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="title-responsive" style={{ fontSize: '2.8rem', color: '#003366', fontWeight: '800', lineHeight: '1.2' }}>📢 {config.textos.tituloNoticias}</h2>
            <div style={{ width: '60px', height: '5px', backgroundColor: '#E30613', margin: '15px auto' }}></div>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>{config.textos.descNoticias}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '40px' }}>
            {noticias.map(n => (
              <div key={n.id} className="card-gestion" style={{ borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', backgroundColor: '#fff', border: '1px solid #eee' }}>
                <div style={{ position: 'relative' }}>
                  <img src={n.imagen_1_despues} style={{ width: '100%', height: '240px', objectFit: 'cover' }} alt="Logro" />
                  <span style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#28a745', color: 'white', padding: '5px 15px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold' }}>LOGRO ALCANZADO</span>
                </div>
                <div style={{ padding: '30px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#003366', fontSize: '1.4rem', fontWeight: '800' }}>{n.titulo}</h3>
                  <button onClick={() => setNoticiaSeleccionada(n)} style={{ background: 'none', border: 'none', color: '#E30613', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}>VER RESEÑA COMPLETA →</button>
                </div>
              </div>
            ))}
            {noticias.length === 0 && ( <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>Pronto publicaremos nuestros logros territoriales.</p> )}
          </div>
        </section>

        {/* TARJETA: REDES SOCIALES */}
        {(config.redes.facebook || config.redes.instagram || config.redes.tiktok) && (
          <section style={{ marginBottom: '100px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '40px', padding: '60px 5%', color: 'white', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(227, 6, 19, 0.1)', borderRadius: '50%' }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 className="title-responsive" style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 15px 0', color: 'white', lineHeight: '1.2' }}>{config.textos.tituloRedes}</h2>
              <p style={{ fontSize: '1.15rem', color: '#cbd5e1', margin: '0 auto 40px auto', maxWidth: '650px', lineHeight: '1.6' }}>{config.textos.descRedes}</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {config.redes.facebook && <a href={config.redes.facebook} target="_blank" rel="noopener noreferrer" className="btn-social fb">📘 Facebook</a>}
                {config.redes.instagram && <a href={config.redes.instagram} target="_blank" rel="noopener noreferrer" className="btn-social ig">📸 Instagram</a>}
                {config.redes.tiktok && <a href={config.redes.tiktok} target="_blank" rel="noopener noreferrer" className="btn-social tk">🎵 TikTok</a>}
              </div>
            </div>
          </section>
        )}

        {/* VENTANILLA CIUDADANA RESPONSIVE */}
        <section id="radicar" className="radicar-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '40px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '50px 5%', borderRadius: '40px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div>
            <h2 className="title-responsive" style={{ fontSize: '2.8rem', color: '#003366', fontWeight: '900', lineHeight: 1.1, textTransform: 'uppercase' }}>
              {config.textos.tituloForm.split(' ')[0]} <br/>
              <span style={{color: '#E30613'}}>{config.textos.tituloForm.substring(config.textos.tituloForm.indexOf(' ') + 1)}</span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: '1.6', margin: '25px 0' }}>{config.textos.descForm}</p>
            <div className="stat-mobile-box" style={{ display: 'flex', gap: '25px', marginTop: '40px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.8rem', color: '#E30613', fontWeight: '900' }}>100%</div><div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>TRANSPARENTE</div></div>
                <div style={{ width: '1px', backgroundColor: '#cbd5e1' }}></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.8rem', color: '#E30613', fontWeight: '900' }}>24/7</div><div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>DISPONIBLE</div></div>
            </div>
          </div>

          <form onSubmit={enviarRadicado} className="form-padding" style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px' }}>Nombre completo</label>
              <input type="text" placeholder="Ej. Carlos Mendoza" value={nombre} onChange={e=>setNombre(e.target.value)} required className="input-hover" style={inputStyle} />
            </div>
            
            {/* GRID QUE SE ROMPE EN MÓVILES PERFECTAMENTE */}
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>WhatsApp</label><input type="tel" placeholder="300 000 0000" value={telefono} onChange={e=>setTelefono(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0}} /></div>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Correo</label><input type="email" placeholder="ejemplo@correo.com" value={correo} onChange={e=>setCorreo(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0}} /></div>
            </div>
            
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Solicitud</label><select value={tipoPQRSF} onChange={e=>setTipoPQRSF(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0, cursor: 'pointer', appearance: 'auto'}}>{config.listaPQRSF.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Categoría</label><select value={subcategoria} onChange={e=>setSubcategoria(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0, cursor: 'pointer', appearance: 'auto'}}>{config.listaSubcategorias.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            
            <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Detalles del caso</label><textarea placeholder="Describe tu caso detalladamente..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required className="input-hover" style={{...inputStyle, height: '120px', resize: 'none'}} /></div>
            
            <button type="submit" disabled={cargando} style={{ width: '100%', padding: '18px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 10px rgba(0, 51, 102, 0.2)', marginTop: '10px' }}>{cargando ? 'PROCESANDO RADICADO...' : 'ENVIAR RADICADO AL #5'}</button>
          </form>
        </section>

      </div>

      {/* MODAL DE RESEÑA ELITE */}
      {noticiaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,34,68,0.98)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '950px', borderRadius: '35px', maxHeight: '92vh', overflowY: 'auto', position: 'relative', padding: '50px 20px' }}>
            <button onClick={() => setNoticiaSeleccionada(null)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', zIndex: 10 }}>✕</button>
            <h2 className="title-responsive" style={{ fontSize: '2.6rem', color: '#003366', fontWeight: '900', marginBottom: '25px', paddingRight: '50px', textAlign: 'center' }}>{noticiaSeleccionada.titulo}</h2>
            {noticiaSeleccionada.video_url && noticiaSeleccionada.video_url.includes('instagram') ? (
              <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center', backgroundColor: '#000', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', maxWidth: '420px', height: '580px', margin: '0 auto 40px auto', border: '4px solid #003366' }}>
                <div style={{ position: 'relative', width: '100%', height: '950px', marginTop: '-80px' }}><iframe width="100%" height="100%" src={obtenerUrlEmbebida(noticiaSeleccionada.video_url)} frameBorder="0" scrolling="no" allowTransparency="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" style={{ border: 'none', cursor: 'pointer' }}></iframe></div>
              </div>
            ) : (
              noticiaSeleccionada.video_url && ( <div style={{ marginBottom: '40px', borderRadius: '25px', overflow: 'hidden', backgroundColor: '#000', height: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}><iframe width="100%" height="100%" src={obtenerUrlEmbebida(noticiaSeleccionada.video_url)} frameBorder="0" allowFullScreen style={{ border: 'none' }}></iframe></div> )
            )}
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#444', marginBottom: '50px', whiteSpace: 'pre-wrap', padding: '0 20px' }}>{noticiaSeleccionada.descripcion}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', padding: '0 20px' }}>
              <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 'bold', color: '#E30613', display: 'block', marginBottom: '15px' }}>🔴 REGISTRO: EL ANTES</span><img src={noticiaSeleccionada.imagen_1_antes} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} /></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 'bold', color: '#28a745', display: 'block', marginBottom: '15px' }}>🟢 GESTIÓN: EL DESPUÉS</span><img src={noticiaSeleccionada.imagen_1_despues} style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} /></div>
            </div>
            <footer style={{ marginTop: '60px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '30px', color: '#003366', fontWeight: 'bold' }}>CAMBIO RADICAL #5 - HECHOS PARA EL CAMBIO</footer>
          </div>
        </div>
      )}

      <footer style={{ backgroundColor: '#001a33', color: 'white', padding: '60px 5%', textAlign: 'center' }}>
        <p style={{ fontWeight: '900', fontSize: '1.5rem', marginBottom: '10px' }}>CAMBIO RADICAL #5</p>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Publicidad política pagada. Mosquera, Cundinamarca © 2026</p>
      </footer>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '15px 20px', marginBottom: '0px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' };