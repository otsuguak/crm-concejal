import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export default function Inicio() {
  const [noticias, setNoticias] = useState([]);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null); 
  const [cargando, setCargando] = useState(false);

  const [config, setConfig] = useState({
    listaPQRSF: [], listaSubcategorias: [],
    // 🔥 ESTADO DE IDENTIDAD ACTUALIZADO 🔥
    identidad: { logo: '', texto: 'CONCEJAL #5 Mosquera', fondoHero: '' },
    textos: { 
      tituloHero: 'EL CAMBIO SIGUE', descHero: 'Gestión real, resultados para la gente. Vota Cambio Radical #5', 
      tituloForm: 'VENTANILLA CIUDADANA', descForm: '¿Tienes una petición, queja o una idea para mejorar nuestro municipio? Mi equipo jurídico y técnico revisará tu caso personalmente.', 
      tituloNoticias: 'GESTIÓN EN TERRITORIO', descNoticias: 'Transformando nuestra comunidad con hechos, no palabras.',
      tituloRedes: '📱 ¡Conéctate con el Cambio!', descRedes: 'Únete a nuestra comunidad digital. Entérate en tiempo real de nuestros proyectos, debates y resultados en el municipio. ¡Tu voz también cuenta en nuestras redes!'
    },
    redes: { facebook: '', instagram: '', tiktok: '' },
    bio: { titulo: '', descripcion: '', videoUrl: '', foto1: '', foto2: '', label: '', foto2Descripcion: '' } 
  });

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [subcategoria, setSubcategoria] = useState(''); 
  const [descripcion, setDescripcion] = useState('');
  
  const [habeasData, setHabeasData] = useState(false);
  const [publicidad, setPublicidad] = useState(false);
  const [mostrarModalHabeas, setMostrarModalHabeas] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [mostrarModalBio, setMostrarModalBio] = useState(false);
  const [fotoBioExpandida, setFotoBioExpandida] = useState(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const [tiposSolicitud, setTiposSolicitud] = useState([]);
  const [tipoPQRSF, setTipoPQRSF] = useState('');

  useEffect(() => {
    async function cargarPortal() {
      const { data: dataConfig, error: errorConfig } = await supabase.from('configuracion').select('*').eq('id', 1).single();

      if (dataConfig && !errorConfig) {
        setConfig({
          listaPQRSF: dataConfig.lista_pqrsf || [], listaSubcategorias: dataConfig.lista_subcategorias || [],
          // 🔥 CARGAMOS NUEVA IDENTIDAD 🔥
          identidad: { 
            logo: dataConfig.logo_url || '', 
            texto: dataConfig.navbar_texto || 'CONCEJAL #5 Mosquera', 
            fondoHero: dataConfig.hero_fondo_url || '' 
          },
          textos: {
            tituloHero: dataConfig.titulo_hero || 'EL CAMBIO SIGUE', descHero: dataConfig.descripcion_hero || 'Gestión real, resultados para la gente. Vota Cambio Radical #5',
            tituloForm: dataConfig.titulo_formulario || 'VENTANILLA CIUDADANA', descForm: dataConfig.descripcion_formulario || '¿Tienes una petición, queja o una idea para mejorar nuestro municipio? Mi equipo jurídico y técnico revisará tu caso personalmente.',
            tituloNoticias: dataConfig.titulo_noticias || 'GESTIÓN EN TERRITORIO', descNoticias: dataConfig.descripcion_noticias_seccion || 'Transformando nuestra comunidad con hechos, no palabras.',
            tituloRedes: dataConfig.titulo_redes || '📱 ¡Conéctate con el Cambio!', descRedes: dataConfig.descripcion_redes || 'Únete a nuestra comunidad digital. Entérate en tiempo real de nuestros proyectos, debates y resultados en el municipio. ¡Tu voz también cuenta en nuestras redes!'
          },
          redes: { facebook: dataConfig.url_facebook || '', instagram: dataConfig.url_instagram || '', tiktok: dataConfig.url_tiktok || '' },
          bio: { 
            titulo: dataConfig.bio_titulo || '', descripcion: dataConfig.bio_descripcion || '', 
            videoUrl: dataConfig.bio_video_url || '', foto1: dataConfig.bio_foto_1 || '', foto2: dataConfig.bio_foto_2 || '',
            label: dataConfig.bio_label || 'PERFIL TERRITORIAL',
            foto2Descripcion: dataConfig.bio_foto_2_descripcion || '' 
          }
        });
        
        if (dataConfig.lista_subcategorias?.length > 0) setSubcategoria(dataConfig.lista_subcategorias[0]);
      }

      const { data: tipos } = await supabase.from('tipos_solicitud').select('*').order('id', { ascending: true });
      if (tipos) {
        setTiposSolicitud(tipos);
        if (tipos.length > 0) setTipoPQRSF(tipos[0].id);
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
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
      const id = match ? match[1] : null;
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    return url;
  };

  const enviarRadicado = async (e) => {
    e.preventDefault(); 
    setCargando(true);
    setErrorMsg('');

    const tipoSeleccionado = tiposSolicitud.find(t => t.id === parseInt(tipoPQRSF));
    const diasSLA = tipoSeleccionado?.dias_respuesta || 5; 
    const fechaLim = new Date(); 
    fechaLim.setDate(fechaLim.getDate() + diasSLA); 

    const { error } = await supabase.from('casos').insert([{
      ciudadano_nombre: nombre, 
      ciudadano_telefono: telefono, 
      ciudadano_correo: correo, 
      tipo_solicitud_id: parseInt(tipoPQRSF), 
      subcategoria: subcategoria, 
      descripcion_caso: descripcion, 
      fecha_limite: fechaLim.toISOString(), 
      estado: 'Abierto', 
      habeas_data: habeasData,
      recibir_publicidad: publicidad
    }]);

    if (!error) {
      setToastMsg("✅ ¡Radicado con éxito! El equipo del #5 está en marcha.");
      setNombre(''); setTelefono(''); setCorreo(''); setDescripcion(''); 
      setHabeasData(false); setPublicidad(false); 
      if (tiposSolicitud.length > 0) setTipoPQRSF(tiposSolicitud[0].id);
      if (config.listaSubcategorias.length > 0) setSubcategoria(config.listaSubcategorias[0]);
      setTimeout(() => { setToastMsg(''); }, 4000);
    } else { 
      setErrorMsg("Error: " + error.message);
      setTimeout(() => { setErrorMsg(''); }, 6000);
    }
    setCargando(false);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#fff', color: '#1a1a1a', overflowX: 'hidden' }}>
      
      {toastMsg && ( <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#10b981', color: 'white', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', animation: 'fadeIn 0.3s' }}>{toastMsg}</div> )}
      {errorMsg && ( <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#E30613', color: 'white', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 10px 25px rgba(227, 6, 19, 0.4)', animation: 'fadeIn 0.3s', maxWidth: '350px' }}>❌ {errorMsg}</div> )}

      <style>{`
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        .hero-title { font-size: clamp(2.2rem, 5vw, 4.5rem) !important; color: #ffffff !important; font-weight: 900; line-height: 1.1; margin-bottom: 20px; text-shadow: 0 4px 10px rgba(0,0,0,0.3); position: relative; zIndex: 2; }
        .hero-subtitle { font-size: clamp(1rem, 2vw, 1.5rem) !important; color: #e2e8f0 !important; margin-bottom: 40px; line-height: 1.5; font-weight: 400; max-width: 800px; margin-left: auto; margin-right: auto; position: relative; zIndex: 2; }

        .card-gestion { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
        .card-gestion:hover { transform: translateY(-15px); box-shadow: 0 20px 40px rgba(0,51,102,0.15) !important; }
        .btn-primario { transition: 0.3s; position: relative; zIndex: 2; }
        .btn-primario:hover { transform: scale(1.05); background-color: #c20510 !important; }
        .input-hover:focus { border-color: #003366 !important; box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1) !important; }
        
        .btn-social { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px 35px; border-radius: 50px; color: white !important; font-weight: 800; text-decoration: none; font-size: 1.1rem; min-width: 150px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .btn-social:hover { transform: translateY(-8px); color: white !important; }
        .btn-social.fb { background: #1877F2; box-shadow: 0 10px 20px rgba(24, 119, 242, 0.3); }
        .btn-social.ig { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); box-shadow: 0 10px 20px rgba(220, 39, 67, 0.3); }
        .btn-social.tk { background: #000000; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3); border: 2px solid #222; }
        .btn-social.tk:hover { box-shadow: -4px 4px 0 #00f2fe, 4px -4px 0 #fe0979; border-color: transparent; }

        .zoom-img { transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: zoom-in; }
        .zoom-img:hover { transform: scale(1.03); }

        .brand-modal::-webkit-scrollbar { width: 10px; }
        .brand-modal::-webkit-scrollbar-track { background: #f8fafc; }
        .brand-modal::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .brand-modal::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .img-difuminada-wrapper { position: relative; width: 100%; height: 100%; border-radius: 30px; overflow: hidden; display: inline-block; }
        .img-difuminada-wrapper::after { content: ''; position: absolute; inset: 0; box-shadow: inset 0 0 60px 30px #ffffff; border-radius: 30px; pointer-events: none; }

        input, select, textarea { color: #0f172a !important; background-color: #ffffff !important; color-scheme: light !important; }
        input::placeholder, textarea::placeholder { color: #94a3b8 !important; opacity: 1 !important; }
        .checkbox-custom { accent-color: #E30613; width: 18px; height: 18px; cursor: pointer; flex-shrink: 0; }
        .btn-menu-movil { display: none; background: none; border: none; font-size: 2rem; color: #003366; cursor: pointer; }

        @media (max-width: 768px) {
          .nav-container { padding: 15px 20px !important; }
          .nav-links { display: none !important; } 
          .btn-menu-movil { display: block !important; } 
          .form-grid { grid-template-columns: 1fr !important; gap: 0px !important; } 
          .hero-header { padding: 80px 20px !important; }
          .section-padding { padding: 40px 20px !important; }
          .title-responsive { font-size: 2.2rem !important; text-align: center; }
          .radicar-container { grid-template-columns: 1fr !important; padding: 30px 20px !important; text-align: center; }
          .form-padding { padding: 25px 15px !important; }
          .stat-mobile-box { justify-content: center !important; }
          .brand-hero-grid { grid-template-columns: 1fr !important; }
          .brand-hero-text { padding: 40px 20px !important; text-align: center; align-items: center !important; }
          .brand-hero-img { height: 400px !important; padding: 20px !important; }
          .brand-media-section { padding: 30px 20px !important; }
          .bio-tag { margin: 0 auto 20px auto !important; align-self: center !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 }}>
        
        {/* 🔥 IDENTIDAD VISUAL DINÁMICA (LOGO + TEXTO) 🔥 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {config.identidad.logo ? (
            <img src={config.identidad.logo} alt="Logo Oficial" style={{ height: '35px', maxWidth: '120px', objectFit: 'contain', borderRadius: '5px' }} />
          ) : (
            <div style={{ backgroundColor: '#E30613', color: '#fff', padding: '5px 12px', borderRadius: '5px', fontWeight: '900', fontSize: '1.5rem' }}>CR</div>
          )}
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#003366' }}>{config.identidad.texto}</span>
        </div>
        
        <button className="btn-menu-movil" onClick={() => setMenuMovilAbierto(true)}>☰</button>

        <div className="nav-links" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {config.bio.titulo && ( <button onClick={() => setMostrarModalBio(true)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.3s', cursor: 'pointer', padding: 0 }}>Conóceme</button> )}
          <a href="#gestion" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.3s' }}>Gestión</a>
          <a href="#redes" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.3s' }}>Redes Sociales</a>
          <Link to="/login" style={{ textDecoration: 'none', color: '#003366', fontWeight: 'bold', fontSize: '0.9rem', border: '2px solid #003366', padding: '8px 18px', borderRadius: '25px', transition: '0.3s', marginLeft: '10px' }}>🔐 INGRESO</Link>
        </div>
      </nav>

      {/* MENÚ MÓVIL */}
      {menuMovilAbierto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s ease-in-out' }}>
          <button onClick={() => setMenuMovilAbierto(false)} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: '#f1f5f9', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold', color: '#003366' }}>✕</button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', textAlign: 'center', width: '100%' }}>
            {config.bio.titulo && ( <button onClick={() => { setMostrarModalBio(true); setMenuMovilAbierto(false); }} style={{ background: 'transparent', border: 'none', color: '#003366', fontWeight: '900', fontSize: '2rem', cursor: 'pointer' }}>Conóceme</button> )}
            <a href="#gestion" onClick={() => setMenuMovilAbierto(false)} style={{ textDecoration: 'none', color: '#003366', fontWeight: '900', fontSize: '2rem' }}>Gestión</a>
            <a href="#redes" onClick={() => setMenuMovilAbierto(false)} style={{ textDecoration: 'none', color: '#003366', fontWeight: '900', fontSize: '2rem' }}>Redes Sociales</a>
            <a href="#radicar" onClick={() => setMenuMovilAbierto(false)} style={{ textDecoration: 'none', color: '#E30613', fontWeight: '900', fontSize: '2rem' }}>Radicar Solicitud</a>
            <div style={{ width: '50px', height: '4px', background: '#cbd5e1', margin: '10px auto' }}></div>
            <Link to="/login" onClick={() => setMenuMovilAbierto(false)} style={{ textDecoration: 'none', color: 'white', background: '#003366', fontWeight: 'bold', fontSize: '1.2rem', padding: '15px 40px', borderRadius: '30px', margin: '0 auto', display: 'inline-block' }}>🔐 INGRESO AL SISTEMA</Link>
          </div>
        </div>
      )}

      {/* 🔥 HERO SECTION CON FONDO MIMETIZADO 🔥 */}
      <header className="hero-header" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#001a33' }}>
        
        {/* Capa de la imagen de fondo: Se mimetiza con baja opacidad */}
        {config.identidad.fondoHero && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.15, backgroundImage: `url(${config.identidad.fondoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'screen' }}></div>
        )}
        
        {/* Gradiente corporativo oscuro que protege la lectura del texto */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,51,102,0.9) 0%, rgba(0,26,51,0.95) 100%)', zIndex: 1 }}></div>

        {/* Textos y contenido */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', fontSize: '20rem', color: 'rgba(255,255,255,0.05)', fontWeight: '900', userSelect: 'none', pointerEvents: 'none', zIndex: 2 }}>5</div>
        <div style={{ position: 'relative', zIndex: 3, padding: '120px 5%', textAlign: 'center' }}>
          <h1 className="hero-title">{config.textos.tituloHero}</h1>
          <p className="hero-subtitle">{config.textos.descHero}</p>
          <a href="#radicar" className="btn-primario" style={{ backgroundColor: '#E30613', color: '#ffffff', padding: '18px 45px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(227, 6, 19, 0.4)', display: 'inline-block' }}>RADICAR SOLICITUD AQUÍ</a>
        </div>
      </header>

      <div className="section-padding" style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 5%' }}>
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

        {(config.redes.facebook || config.redes.instagram || config.redes.tiktok) && (
          <section id="redes" style={{ marginBottom: '100px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '40px', padding: '60px 5%', color: 'white', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
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
            
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>WhatsApp</label><input type="tel" placeholder="300 000 0000" value={telefono} onChange={e=>setTelefono(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0}} /></div>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Correo</label><input type="email" placeholder="ejemplo@correo.com" value={correo} onChange={e=>setCorreo(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0}} /></div>
            </div>
            
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Solicitud</label><select value={tipoPQRSF} onChange={e=>setTipoPQRSF(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0, cursor: 'pointer', appearance: 'auto'}}>
                  {tiposSolicitud.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select></div>
                <div><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Categoría</label><select value={subcategoria} onChange={e=>setSubcategoria(e.target.value)} required className="input-hover" style={{...inputStyle, marginBottom: 0, cursor: 'pointer', appearance: 'auto'}}>{config.listaSubcategorias.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginLeft: '5px', display: 'block', marginBottom: '5px' }}>Detalles del caso</label>
              <textarea placeholder="Describe tu caso detalladamente..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required className="input-hover" style={{...inputStyle, height: '120px', resize: 'none'}} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={habeasData} onChange={e => setHabeasData(e.target.checked)} required className="checkbox-custom" />
                <span style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: '1.4' }}>
                  Acepto la <button type="button" onClick={() => setMostrarModalHabeas(true)} style={{ background: 'transparent', border: 'none', color: '#E30613', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>Política de Tratamiento de Datos Personales</button>. *
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={publicidad} onChange={e => setPublicidad(e.target.checked)} className="checkbox-custom" />
                <span style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: '1.4' }}>
                  Acepto recibir información sobre gestión, eventos y noticias del Concejal #5. (Opcional)
                </span>
              </label>
            </div>
            
            <button type="submit" disabled={cargando} style={{ width: '100%', padding: '18px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 10px rgba(0, 51, 102, 0.2)' }}>{cargando ? 'PROCESANDO RADICADO...' : 'ENVIAR RADICADO AL #5'}</button>
          </form>
        </section>
      </div>

      {/* MODAL HABEAS DATA */}
      {mostrarModalHabeas && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '600px', borderRadius: '24px', maxHeight: '80vh', overflowY: 'auto', position: 'relative', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setMostrarModalHabeas(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#64748b' }}>✕</button>
            <h2 style={{ fontSize: '1.8rem', color: '#003366', fontWeight: '900', margin: '0 0 20px 0' }}>Tratamiento de Datos</h2>
            <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.8', textAlign: 'justify' }}>
              <p>En cumplimiento de la Ley 1581 de 2012 (Ley de Protección de Datos Personales) y sus decretos reglamentarios, le informamos que los datos personales suministrados a través de este portal serán tratados de manera confidencial y segura.</p>
              <p><strong>Finalidad:</strong> Sus datos serán utilizados exclusivamente para: 1. Dar trámite, gestión y respuesta a su Petición, Queja, Reclamo, Sugerencia o Felicitación (PQRSF). 2. Mantener contacto con usted sobre el estado de su solicitud. 3. (Solo si usted lo autoriza explícitamente) Enviarle información sobre la gestión territorial del Concejal.</p>
              <p><strong>Derechos:</strong> Como titular de los datos, usted tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos personales en cualquier momento.</p>
            </div>
            <button onClick={() => setMostrarModalHabeas(false)} style={{ width: '100%', padding: '15px', backgroundColor: '#E30613', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '20px' }}>Cerrar y Volver</button>
          </div>
        </div>
      )}


      {/* MODAL BIOGRAFÍA PREMIUM */}
      {mostrarModalBio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 26, 51, 0.95)', zIndex: 2500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0', backdropFilter: 'blur(15px)' }}>
          <div className="brand-modal" style={{ backgroundColor: '#f8fafc', width: '100%', height: '100vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setMostrarModalBio(false)} style={{ position: 'fixed', top: '30px', right: '30px', border: 'none', background: '#E30613', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#fff', transition: '0.3s', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(227,6,19,0.4)' }}>✕</button>
            <div className="brand-hero-grid" style={{ display: 'grid', gridTemplateColumns: config.bio.foto1 ? '1fr 1fr' : '1fr', minHeight: '70vh', position: 'relative', background: '#ffffff', borderBottom: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'rgba(0, 51, 102, 0.03)', borderRadius: '50%', zIndex: 1 }}></div>
              <div className="brand-hero-text" style={{ padding: '100px 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2, alignItems: 'flex-start' }}>
                <div className="bio-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '25px', background: 'rgba(227, 6, 19, 0.1)', padding: '10px 25px', borderRadius: '30px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#E30613', borderRadius: '50%' }}></div>
                  <span style={{ color: '#E30613', letterSpacing: '2px', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase' }}>{config.bio.label || 'PERFIL TERRITORIAL'}</span>
                </div>
                <h2 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', color: '#003366', fontWeight: '900', lineHeight: '1.1', margin: '0 0 30px 0' }}>{config.bio.titulo}</h2>
                <p style={{ color: '#475569', fontSize: '1.2rem', lineHeight: '1.9', maxWidth: '650px', margin: 0, whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{config.bio.descripcion}</p>
              </div>
              {config.bio.foto1 && (
                <div className="brand-hero-img" style={{ position: 'relative', height: '100%', minHeight: '500px', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                  <div className="img-difuminada-wrapper zoom-img" onClick={() => setFotoBioExpandida(config.bio.foto1)}>
                    <img src={config.bio.foto1} alt="Concejal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}
            </div>
            {(config.bio.videoUrl || config.bio.foto2) && (
              <div className="brand-media-section" style={{ padding: '80px 10%', display: 'flex', flexDirection: 'column', gap: '50px', position: 'relative', zIndex: 2 }}>
                {config.bio.videoUrl && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '30px', padding: '40px', boxShadow: '0 20px 50px rgba(0,51,102,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}><div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(227, 6, 19, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#E30613' }}>▶</div><h3 style={{ color: '#003366', margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>Gestión en Video</h3></div>
                    <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #cbd5e1', aspectRatio: config.bio.videoUrl.includes('instagram') ? '9/16' : '16/9', width: '100%', maxHeight: '700px', margin: '0 auto', backgroundColor: '#000' }}><iframe width="100%" height="100%" src={obtenerUrlEmbebida(config.bio.videoUrl)} frameBorder="0" allowFullScreen style={{ border: 'none' }}></iframe></div>
                  </div>
                )}
                {config.bio.foto2 && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '30px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', boxShadow: '0 20px 50px rgba(0,51,102,0.06)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '8px', height: '8px', background: '#003366', borderRadius: '50%' }}></div><span style={{ color: '#003366', letterSpacing: '2px', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase' }}>Galería en Territorio</span></div>
                    <div style={{ width: '100%', height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffffff' }}>
                        <div className="img-difuminada-wrapper zoom-img" onClick={() => setFotoBioExpandida(config.bio.foto2)}><img src={config.bio.foto2} alt="Territorio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    </div>
                    {config.bio.foto2Descripcion && (<p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', textAlign: 'center', margin: '10px auto 0 auto', maxWidth: '800px', fontStyle: 'italic' }}>{config.bio.foto2Descripcion}</p>)}
                  </div>
                )}
              </div>
            )}
            <div style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid #e2e8f0', marginTop: 'auto', background: '#ffffff' }}>
                <p style={{ color: '#003366', fontWeight: '900', letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase' }}>HECHOS PARA EL CAMBIO - CONCEJAL #5</p>
            </div>
          </div>
        </div>
      )}

      {fotoBioExpandida && (
        <div onClick={() => setFotoBioExpandida(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 26, 51, 0.98)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(10px)', cursor: 'zoom-out' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', textAlign: 'center' }}>
            <button style={{ position: 'absolute', top: '-40px', right: '-40px', border: 'none', background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', zIndex: 10 }}>✕</button>
            <img src={fotoBioExpandida} alt="Foto Expandida" style={{ width: '100%', borderRadius: '20px', border: '2px solid #333', maxHeight: '90vh', objectFit: 'contain', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}

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
              <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 'bold', color: '#E30613', display: 'block', marginBottom: '15px' }}>🔴 REGISTRO: EL ANTES</span><img src={noticiaSeleccionada.imagen_1_antes} onClick={() => setFotoBioExpandida(noticiaSeleccionada.imagen_1_antes)} className="zoom-img" style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', border: '4px solid white' }} /></div>
              <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 'bold', color: '#28a745', display: 'block', marginBottom: '15px' }}>🟢 GESTIÓN: EL DESPUÉS</span><img src={noticiaSeleccionada.imagen_1_despues} onClick={() => setFotoBioExpandida(noticiaSeleccionada.imagen_1_despues)} className="zoom-img" style={{ width: '100%', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', border: '4px solid white' }} /></div>
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