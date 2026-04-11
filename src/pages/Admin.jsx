import Swal from 'sweetalert2'; 
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Admin() {
  const [perfil, setPerfil] = useState(null);
  const [casos, setCasos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [noticiasListado, setNoticiasListado] = useState([]);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroAsunto, setFiltroAsunto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [filtroSLA, setFiltroSLA] = useState('');
  
  const [tiposSolicitud, setTiposSolicitud] = useState([]); 
  
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [mostrarModalLogros, setMostrarModalLogros] = useState(false);
  const [mostrarModalTiempos, setMostrarModalTiempos] = useState(false); 
  const [mostrarModalFormNoticia, setMostrarModalFormNoticia] = useState(false);

  const [mostrarModalSeguridad, setMostrarModalSeguridad] = useState(false);
  const [mostrarModalCategorias, setMostrarModalCategorias] = useState(false);
  const [mostrarModalTextos, setMostrarModalTextos] = useState(false);
  const [mostrarModalBio, setMostrarModalBio] = useState(false); 

  const [confSeguridad, setConfSeguridad] = useState({ requiere: true, codigo: '' });
  const [confListas, setConfListas] = useState({ subcat: [], nuevaSubcat: '' });
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState('');
  
  const [confTextos, setConfTextos] = useState({ 
    navbarTexto: '', logoUrlActual: '', heroFondoActual: '',
    tituloHero: '', descHero: '', tituloForm: '', descForm: '', tituloNoticias: '', descNoticias: '',
    tituloRedes: '', descRedes: '', urlFacebook: '', urlInstagram: '', urlTiktok: ''
  });
  
  const [archivoLogo, setArchivoLogo] = useState(null);
  const [archivoHeroFondo, setArchivoHeroFondo] = useState(null);

  const [confBio, setConfBio] = useState({
    titulo: '', descripcion: '', videoUrl: '', foto1Actual: '', foto2Actual: '', label: '', foto2Descripcion: '', fraseFinal: ''
  });
  const [archivoBio1, setArchivoBio1] = useState(null);
  const [archivoBio2, setArchivoBio2] = useState(null);

  const [colaboradorAsignado, setColaboradorAsignado] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  
  const [respuestaActual, setRespuestaActual] = useState('');
  const [archivoRespuesta, setArchivoRespuesta] = useState(null);

  const [idEdicion, setIdEdicion] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [archivoAntes, setArchivoAntes] = useState(null);
  const [archivoDespues, setArchivoDespues] = useState(null);
  
  const [subiendo, setSubiendo] = useState(false);
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const esCasoNuevo = (estado) => {
    if (!estado) return true; 
    const estLimpio = estado.toLowerCase().trim();
    return estLimpio === 'abierto' || estLimpio === 'pendiente';
  };

  useEffect(() => {
    cargarTodo();
    const canalCasos = supabase.channel('cambios-en-casos').on('postgres_changes', { event: '*', schema: 'public', table: 'casos' }, () => cargarTodo()).subscribe();
    return () => { supabase.removeChannel(canalCasos); };
  }, [navigate]);

  async function cargarTodo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const { data: miPerfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
    if (miPerfil) {
      setPerfil(miPerfil);
      
      let queryCasos = supabase.from('casos').select('*, tipos_solicitud(nombre)').order('id', {ascending: false});
      if (miPerfil.rol !== 'admin') queryCasos = queryCasos.eq('colaborador_id', miPerfil.id);
      
      const { data: todosCasos } = await queryCasos;
      setCasos(todosCasos || []);
      
      if (miPerfil.rol === 'admin') {
        const casosNuevos = (todosCasos || []).filter(c => esCasoNuevo(c.estado)).length;
        if (casosNuevos > 0) setTimeout(() => { mostrarExito(`🔔 Tienes ${casosNuevos} radicados nuevos sin asignar.`); }, 1000); 

        const { data: configData } = await supabase.from('configuracion').select('*').eq('id', 1).single();
        if (configData) {
          setConfSeguridad({ requiere: configData.requiere_codigo ?? true, codigo: configData.codigo_secreto_registro || '' });
          setConfListas({ subcat: configData.lista_subcategorias || [], nuevaSubcat: '' });
          
          setConfTextos({ 
            navbarTexto: configData.navbar_texto || 'CONCEJAL #5 Mosquera',
            logoUrlActual: configData.logo_url || '',
            heroFondoActual: configData.hero_fondo_url || '',
            tituloHero: configData.titulo_hero || '', descHero: configData.descripcion_hero || '', 
            tituloForm: configData.titulo_formulario || '', descForm: configData.descripcion_formulario || '', 
            tituloNoticias: configData.titulo_noticias || '', descNoticias: configData.descripcion_noticias_seccion || '',
            tituloRedes: configData.titulo_redes || '', descRedes: configData.descripcion_redes || '',
            urlFacebook: configData.url_facebook || '', urlInstagram: configData.url_instagram || '', urlTiktok: configData.url_tiktok || ''
          });

          setConfBio({
            titulo: configData.bio_titulo || '', descripcion: configData.bio_descripcion || '', 
            videoUrl: configData.bio_video_url || '', foto1Actual: configData.bio_foto_1 || '', foto2Actual: configData.bio_foto_2 || '',
            label: configData.bio_label || 'PERFIL TERRITORIAL',
            foto2Descripcion: configData.bio_foto_2_descripcion || '', 
            fraseFinal: configData.bio_pie_pagina || 'HECHOS PARA EL CAMBIO - CONCEJAL #5' 
          });
        }
      }
      
      const { data: todasNoticias } = await supabase.from('noticias').select('*').order('id', {ascending: false});
      setNoticiasListado(todasNoticias || []);
      
      const { data: todosTipos } = await supabase.from('tipos_solicitud').select('*').order('id', {ascending: true});
      setTiposSolicitud(todosTipos || []);

      if (miPerfil.rol === 'admin') {
        const { data: eq } = await supabase.from('perfiles').select('*').in('rol', ['asesor', 'admin']);
        setColaboradores(eq || []);
      }
    }
  }

  const mostrarExito = (mensaje) => { setToastMsg(mensaje); setTimeout(() => { setToastMsg(''); }, 3000); };
  
  const extraerNombreArchivo = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch (error) { return null; }
  };

  const borrarArchivoDeStorage = async (urlVieja, bucket) => {
    const nombreArchivo = extraerNombreArchivo(urlVieja);
    if (nombreArchivo) { await supabase.storage.from(bucket).remove([nombreArchivo]); }
  };

  const subirArchivo = async (file, bucket) => { 
    if (!file) return null; 
    const name = `${Date.now()}-${file.name.replace(/\s/g, '_')}`; 
    const { error } = await supabase.storage.from(bucket).upload(name, file); 
    if (error) throw error; 
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl; 
  };

  const guardarConfigSeguridad = async (e) => { e.preventDefault(); setSubiendo(true); try { const { error } = await supabase.from('configuracion').update({ requiere_codigo: confSeguridad.requiere, codigo_secreto_registro: confSeguridad.codigo }).eq('id', 1); if (error) throw error; mostrarExito("¡Seguridad del portal actualizada!"); setMostrarModalSeguridad(false); cargarTodo(); } catch (err) { alert("Error: " + err.message); } setSubiendo(false); };
  
  const guardarConfigTextos = async (e) => { 
    e.preventDefault(); setSubiendo(true); 
    try { 
      let urlLogoFinal = confTextos.logoUrlActual;
      if (archivoLogo) { if (confTextos.logoUrlActual) await borrarArchivoDeStorage(confTextos.logoUrlActual, 'noticias'); urlLogoFinal = await subirArchivo(archivoLogo, 'noticias'); }
      let urlFondoFinal = confTextos.heroFondoActual;
      if (archivoHeroFondo) { if (confTextos.heroFondoActual) await borrarArchivoDeStorage(confTextos.heroFondoActual, 'noticias'); urlFondoFinal = await subirArchivo(archivoHeroFondo, 'noticias'); }
      const { error } = await supabase.from('configuracion').update({ 
        navbar_texto: confTextos.navbarTexto, logo_url: urlLogoFinal, hero_fondo_url: urlFondoFinal,
        titulo_hero: confTextos.tituloHero, descripcion_hero: confTextos.descHero, 
        titulo_formulario: confTextos.tituloForm, descripcion_formulario: confTextos.descForm, 
        titulo_noticias: confTextos.tituloNoticias, descripcion_noticias_seccion: confTextos.descNoticias, 
        titulo_redes: confTextos.tituloRedes, descripcion_redes: confTextos.descRedes, 
        url_facebook: confTextos.urlFacebook, url_instagram: confTextos.urlInstagram, url_tiktok: confTextos.urlTiktok 
      }).eq('id', 1); 
      if (error) throw error; 
      mostrarExito("¡Identidad, Textos y Redes actualizados!"); 
      setMostrarModalTextos(false); setArchivoLogo(null); setArchivoHeroFondo(null); cargarTodo(); 
    } catch (err) { alert("Error: " + err.message); } setSubiendo(false); 
  };

  const guardarConfigBio = async (e) => {
    e.preventDefault(); setSubiendo(true);
    try {
      let urlFoto1 = confBio.foto1Actual;
      if (archivoBio1) { if (confBio.foto1Actual) await borrarArchivoDeStorage(confBio.foto1Actual, 'noticias'); urlFoto1 = await subirArchivo(archivoBio1, 'noticias'); }
      let urlFoto2 = confBio.foto2Actual;
      if (archivoBio2) { if (confBio.foto2Actual) await borrarArchivoDeStorage(confBio.foto2Actual, 'noticias'); urlFoto2 = await subirArchivo(archivoBio2, 'noticias'); }
      const { error } = await supabase.from('configuracion').update({
        bio_titulo: confBio.titulo, bio_descripcion: confBio.descripcion, bio_video_url: confBio.videoUrl,
        bio_foto_1: urlFoto1, bio_foto_2: urlFoto2, bio_label: confBio.label, bio_foto_2_descripcion: confBio.foto2Descripcion, bio_pie_pagina: confBio.fraseFinal
      }).eq('id', 1);
      if (error) throw error;
      mostrarExito("¡Biografía actualizada!"); setMostrarModalBio(false); cargarTodo();
    } catch (err) { alert("Error: " + err.message); } setSubiendo(false);
  };

  const agregarNotaAlHistorial = async (idCaso) => { 
    if (!respuestaActual.trim() && !archivoRespuesta) return; 
    setSubiendo(true); 
    try { 
      let urlDocumentoAdjunto = null;
      if (archivoRespuesta) { urlDocumentoAdjunto = await subirArchivo(archivoRespuesta, 'noticias'); }
      const fechaObj = new Date(); 
      const fechaTexto = fechaObj.toLocaleString(); 
      const nombreAutor = perfil.nombre || (perfil.rol === 'admin' ? 'Administrador' : 'Asesor'); 
      let textoBase = respuestaActual.trim() ? respuestaActual : 'Documento oficial adjuntado.';
      if (urlDocumentoAdjunto) { textoBase += `\n📎 Documento Adjunto: ${urlDocumentoAdjunto}`; }
      const nuevaNota = `[${fechaTexto}] - ${nombreAutor}:\n${textoBase}`; 
      const historialPrevio = casoSeleccionado.respuesta_gestion || ''; 
      const nuevoHistorialCompleto = historialPrevio ? `${historialPrevio}\n\n=========================\n\n${nuevaNota}` : nuevaNota; 
      const { error } = await supabase.from('casos').update({ respuesta_gestion: nuevoHistorialCompleto, fecha_respuesta: fechaObj.toISOString() }).eq('id', idCaso); 
      if (error) throw error; 
      mostrarExito("¡Respuesta guardada!"); 
      setCasoSeleccionado(prev => ({ ...prev, respuesta_gestion: nuevoHistorialCompleto, fecha_respuesta: fechaObj.toISOString() })); 
      await cargarTodo(); 
      setRespuestaActual(''); setArchivoRespuesta(null); 
    } catch (err) { alert("Error: " + err.message); } setSubiendo(false); 
  };

  const asignarCaso = async (idCaso) => { 
    if (!colaboradorAsignado) { alert("⚠️ Selecciona un asesor."); return; } 
    setSubiendo(true); 
    try { 
        const { error: updateError } = await supabase.from('casos').update({ estado: 'Escalado', colaborador_id: colaboradorAsignado }).eq('id', idCaso); 
        if (updateError) throw updateError; 
        const { data: perfilData } = await supabase.from('perfiles').select('correo').eq('id', colaboradorAsignado).single();
        if (perfilData) {
          const datosEmailEscalado = {
            service_id: 'service_omhcwuf', template_id: 'template_a8hy01e', user_id: 'EJwAep9er9Fhi3d1W',
            template_params: { correo_destino: perfilData.correo, nombre_ciudadano: casoSeleccionado.ciudadano_nombre, numero_radicado: idCaso }
          };
          fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosEmailEscalado) });
        }
        mostrarExito("¡Caso escalado!"); setCasoSeleccionado(null); cargarTodo(); 
    } catch (err) { alert("Error: " + err.message); } setSubiendo(false); 
  };

  const solucionarCaso = async (idCaso) => { 
    try {
      const result = await Swal.fire({ title: '¿Confirmas gestión?', text: "¿Finalizar este radicado?", icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#d33', confirmButtonText: 'Sí, finalizar' });
      if (result.isConfirmed) { 
        setSubiendo(true); 
        const { error } = await supabase.from('casos').update({ estado: 'Solucionado' }).eq('id', idCaso); 
        if (error) throw error; 
        const datosEmailCierre = {
          service_id: 'service_omhcwuf', template_id: 'template_ap7el9i', user_id: 'EJwAep9er9Fhi3d1W',
          template_params: { correo_ciudadano: casoSeleccionado.ciudadano_correo, nombre_ciudadano: casoSeleccionado.ciudadano_nombre, numero_radicado: idCaso }
        };
        fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosEmailCierre) });
        Swal.fire("¡Éxito!", "Caso cerrado.", "success"); setCasoSeleccionado(null); cargarTodo(); 
      }
    } catch (err) { Swal.fire("Error", err.message, "error"); } finally { setSubiendo(false); }
  };

  const toggleVisibilidad = async (n) => { setSubiendo(true); try { await supabase.from('noticias').update({ visible: !n.visible }).eq('id', n.id); cargarTodo(); } catch (e) { alert(e.message); } setSubiendo(false); };
  
  const calcularColorEstado = (fecha, est) => { 
    if (est?.toLowerCase() === 'solucionado') return ''; 
    if (!fecha) return ''; 
    const hoy = new Date(); const lim = new Date(fecha); 
    const diff = Math.ceil((lim.getTime() - hoy.getTime()) / (1000 * 3600 * 24)); 
    if (diff < 0) return 'fila-vencida'; if (diff <= 2) return 'fila-alerta'; return ''; 
  };

  const casosFiltrados = casos.filter(c => {
    const matchNombre = c.ciudadano_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado ? c.estado?.toLowerCase() === filtroEstado.toLowerCase() : true;
    return matchNombre && matchEstado;
  });

  const formatearTextoChat = (textoRaw) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const partes = textoRaw.split(urlRegex);
    return partes.map((parte, i) => (parte.match(urlRegex) ? <a key={i} href={parte} target="_blank" rel="noreferrer" className="btn-documento-chat">Abrir Documento 📄</a> : <span key={i}>{parte}</span>));
  };

  if (!perfil) return <div className="cr5-loader-overlay">Cargando...</div>;

  return (
    <div className="admin-layout">
      {toastMsg && <div className="toast-exito">✅ {toastMsg}</div>}
      {subiendo && <div className="cr5-loader-overlay">Procesando...</div>}

      <aside className={`admin-sidebar ${menuAbierto ? 'abierto' : ''}`}>
        <div style={{padding: '40px 20px', textAlign: 'center'}}>
          <div className="admin-logo-circle">5</div>
          <h3 className="admin-sidebar-title">CRM CONCEJAL</h3>
        </div>
        <nav className="admin-nav">
          <button style={btnStyle(true)}>📊 DASHBOARD</button>
          {perfil.rol === 'admin' && (
            <>
              <button onClick={() => setMostrarModalLogros(true)} style={btnStyle(false)}>📢 LOGROS PÚBLICOS</button>
              <button onClick={() => setMostrarModalTextos(true)} style={btnStyle(false)}>🖥️ IDENTIDAD Y TEXTOS</button>
              <button onClick={() => setMostrarModalBio(true)} style={btnStyle(false)}>👤 BIOGRAFÍA</button>
            </>
          )}
          <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="btn-logout-sidebar">🚪 CERRAR SESIÓN</button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
            <div><h1>Panel de Control</h1><p>Bienvenido, {perfil.nombre}</p></div>
        </header>

        <div className="stats-grid">
          <StatCard label="Total Peticiones" val={casos.length} col="#3b82f6" />
          <StatCard label="En Gestión" val={casos.filter(c => (c.estado || '').toLowerCase() === 'en gestión').length} col="#f59e0b" />
          <StatCard label="Cerrados" val={casos.filter(c => (c.estado || '').toLowerCase() === 'solucionado').length} col="#10b981" />
        </div>

        <div className="table-module">
          <div className="table-header-flex">
            <h2>Gestión de Radicados</h2>
            <div className="filters-row">
              <input type="text" placeholder="Buscar ciudadano..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="search-bar" />
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="search-bar">
                <option value="">Todos los Estados</option>
                <option value="Abierto">⏳ Abiertos</option>
                <option value="En Gestión">⚙️ En Gestión</option>
                <option value="Escalado">⚙️ Escalados</option>
                <option value="Solucionado">✅ Solucionados</option>
              </select>
            </div>
          </div>

          <table className="admin-table">
            <thead><tr><th># Radicado</th><th>Ciudadano</th><th>Estado</th><th>Vencimiento</th><th>Acción</th></tr></thead>
            <tbody>
              {casosFiltrados.map(c => (
                <tr key={c.id} className={calcularColorEstado(c.fecha_limite, c.estado)}>
                  <td><strong>#{c.id}</strong></td>
                  <td>{c.ciudadano_nombre}</td>
                  <td><span style={badgeStyle(c.estado)}>{c.estado || 'ABIERTO'}</span></td>
                  <td>{c.fecha_limite ? new Date(c.fecha_limite).toLocaleDateString() : '-'}</td>
                  <td><button className="btn-gestionar-pro" onClick={() => setCasoSeleccionado(c)}>Gestionar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL DE GESTIÓN DE CASO --- */}
      {casoSeleccionado && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '750px'}}>
            <button onClick={() => setCasoSeleccionado(null)} style={closeBtnStyle}>✕</button>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px', paddingRight: '60px'}}>
              <h3 style={{margin:0, color:'#003366', fontSize:'1.5rem'}}>Radicado #{casoSeleccionado.id}</h3>
              <span style={badgeStyle(casoSeleccionado.estado)}>{casoSeleccionado.estado || 'ABIERTO'}</span>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                <div><p className="label-modal">Ciudadano</p><p><b>{casoSeleccionado.ciudadano_nombre}</b></p></div>
                <div><p className="label-modal">Contacto</p><p>{casoSeleccionado.ciudadano_telefono}</p></div>
                <div style={{gridColumn: '1/-1'}}><p className="label-modal">Descripción</p><div className="desc-box-modal">{casoSeleccionado.descripcion_caso}</div></div>
            </div>

            <div className="chat-container-modal">
                <h4>💬 Historial de Notas</h4>
                <div className="chat-history-box">
                    {casoSeleccionado.respuesta_gestion ? formatearTextoChat(casoSeleccionado.respuesta_gestion) : "Sin notas aún."}
                </div>
                <div className="chat-input-row">
                    <input type="text" placeholder="Escribe una nota..." value={respuestaActual} onChange={e => setRespuestaActual(e.target.value)} className="chat-input" />
                    <button onClick={() => agregarNotaAlHistorial(casoSeleccionado.id)} className="btn-send-chat">Guardar</button>
                </div>
            </div>

            <div className="actions-panel-modal">
                {casoSeleccionado.estado?.toLowerCase() !== 'solucionado' ? (
                    <>
                        <div style={{display:'flex', gap:'10px', marginBottom: '10px'}}>
                            <button onClick={async () => {
                                setSubiendo(true);
                                await supabase.from('casos').update({ estado: 'En Gestión' }).eq('id', casoSeleccionado.id);
                                mostrarExito("En Gestión ⚙️"); cargarTodo(); setCasoSeleccionado(null);
                                setSubiendo(false);
                            }} style={{flex:1, background: '#f59e0b', color:'white', border:'none', padding:'12px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>⚙️ Gestionar</button>
                            
                            {perfil.rol === 'admin' && (
                                <div style={{flex:2, display:'flex', gap:'5px'}}>
                                    <select value={colaboradorAsignado} onChange={e=>setColaboradorAsignado(e.target.value)} className="select-modal">
                                        <option value="">Asignar a...</option>
                                        {colaboradores.map(col => <option key={col.id} value={col.id}>{col.nombre}</option>)}
                                    </select>
                                    <button onClick={() => asignarCaso(casoSeleccionado.id)} className="btn-escalar-modal">Escalar</button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => solucionarCaso(casoSeleccionado.id)} className="btn-solucionar-modal">✅ MARCAR SOLUCIONADO</button>
                    </>
                ) : (
                    perfil.rol === 'admin' && (
                        <button onClick={async () => {
                            setSubiendo(true);
                            await supabase.from('casos').update({ estado: 'En Gestión' }).eq('id', casoSeleccionado.id);
                            mostrarExito("Radicado Reabierto 🔓"); cargarTodo(); setCasoSeleccionado(null);
                            setSubiendo(false);
                        }} className="btn-reabrir-modal">🔓 REABRIR RADICADO</button>
                    )
                )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL BIOGRAFÍA (Con campo de frase final) --- */}
      {mostrarModalBio && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={() => setMostrarModalBio(false)} style={closeBtnStyle}>✕</button>
            <h2>👤 Biografía del Concejal</h2>
            <form onSubmit={guardarConfigBio} className="admin-form">
              <input type="text" value={confBio.titulo} onChange={e => setConfBio({...confBio, titulo: e.target.value})} placeholder="Título" required style={inStyle} />
              <textarea value={confBio.descripcion} onChange={e => setConfBio({...confBio, descripcion: e.target.value})} placeholder="Biografía..." required style={{...inStyle, height: '150px'}} />
              
              <div className="footer-edit-box">
                <label>Frase de Cierre (Footer):</label>
                <input type="text" value={confBio.fraseFinal} onChange={e => setConfBio({...confBio, fraseFinal: e.target.value})} placeholder="HECHOS PARA EL CAMBIO..." style={inStyle} />
              </div>

              <button type="submit" className="btn-submit-admin">GUARDAR BIOGRAFÍA</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ESTILOS CONSTANTES
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' };
const modalStyle = { background: 'white', width: '100%', borderRadius: '24px', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' };
const closeBtnStyle = { position: 'absolute', top: '20px', right: '25px', border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', color: '#64748b', transition: '0.3s' };

const badgeStyle = (est) => {
  const estReal = (est || 'abierto').toLowerCase().trim();
  const colores = { 'solucionado': { bg: '#dcfce7', text: '#166534' }, 'escalado': { bg: '#fef3c7', text: '#92400e' }, 'en gestión': { bg: '#fff7ed', text: '#ea580c' }, 'default': { bg: '#fee2e2', text: '#991b1b' } };
  const estilo = colores[estReal] || colores['default'];
  return { padding:'6px 14px', borderRadius:'30px', fontSize:'0.7rem', fontWeight:'800', textTransform:'uppercase', background: estilo.bg, color: estilo.text };
};

const btnStyle = (act) => ({ textAlign:'left', padding:'12px 18px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:'0.85rem', background: act ? 'rgba(255,255,255,0.1)' : 'transparent', color: act ? '#ffffff' : '#94a3b8', borderLeft: act ? '4px solid #E30613' : '4px solid transparent', width: '100%', marginBottom: '5px' });
const inStyle = { width:'100%', padding:'14px 20px', borderRadius:'14px', border:'1px solid #e2e8f0', fontSize:'1rem', outline:'none', marginBottom: '15px' };

function StatCard({label, val, col}) { return ( <div className="stat-card-admin" style={{borderTop:`5px solid ${col}`}}><p>{label}</p><h2>{val}</h2></div> ); }