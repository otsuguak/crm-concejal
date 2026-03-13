import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Admin() {
  const [perfil, setPerfil] = useState(null);
  const [casos, setCasos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [noticiasListado, setNoticiasListado] = useState([]);
  const [moduloActivo, setModuloActivo] = useState('dashboard');
  const [busqueda, setBusqueda] = useState('');
  
  // ESTADOS MODALES Y CRUD
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [mostrarModalNoticia, setMostrarModalNoticia] = useState(false);

  // ESTADOS PARA NOTICIAS (RECUPERADO COMPLETO)
  const [idEdicion, setIdEdicion] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [archivoAntes, setArchivoAntes] = useState(null);
  const [archivoDespues, setArchivoDespues] = useState(null);
  
  // ESTADOS CARGA Y SOLUCIÓN
  const [subiendo, setSubiendo] = useState(false); // Esta variable activará el nuevo loader
  const [respuestaActual, setRespuestaActual] = useState('');
  const [archivoSolucion, setArchivoSolucion] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    cargarTodo();
  }, [navigate]);

  async function cargarTodo() {
    // Al iniciar, si Supabase es lento, perfil será null.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const { data: miPerfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
    if (miPerfil) {
      setPerfil(miPerfil);
      const { data: todosCasos } = await supabase.from('casos').select('*, tipos_solicitud(nombre)').order('id', {ascending: false});
      setCasos(todosCasos || []);
      const { data: todasNoticias } = await supabase.from('noticias').select('*').order('id', {ascending: false});
      setNoticiasListado(todasNoticias || []);
      if (miPerfil.rol === 'admin') {
        const { data: eq } = await supabase.from('perfiles').select('*').eq('rol', 'asesor');
        setColaboradores(eq || []);
      }
    }
  }

  // --- LÓGICA DE PUBLICACIONES (RECUPERADO COMPLETO) ---
  const abrirParaCrear = () => {
    setIdEdicion(null); setTitulo(''); setDescripcion(''); setVideoUrl('');
    setArchivoAntes(null); setArchivoDespues(null); setMostrarModalNoticia(true);
  };

  const abrirParaEditar = (n) => {
    setIdEdicion(n.id); setTitulo(n.titulo); setDescripcion(n.descripcion);
    setVideoUrl(n.video_url || ''); setMostrarModalNoticia(true);
  };

  const subirArchivo = async (file, bucket) => {
    if (!file) return null;
    const name = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from(bucket).upload(name, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  };

  const guardarNoticia = async (e) => {
    e.preventDefault();
    setSubiendo(true); // Activa el Loader Elite
    try {
      const urlA = archivoAntes ? await subirArchivo(archivoAntes, 'noticias') : null;
      const urlD = archivoDespues ? await subirArchivo(archivoDespues, 'noticias') : null;
      
      const datos = { titulo, descripcion, video_url: videoUrl };
      if (urlA) datos.imagen_1_antes = urlA;
      if (urlD) datos.imagen_1_despues = urlD;

      if (idEdicion) {
        await supabase.from('noticias').update(datos).eq('id', idEdicion);
        alert("¡Logro actualizado!");
      } else {
        if (!archivoAntes || !archivoDespues) throw new Error("Las fotos Antes/Después son obligatorias.");
        datos.imagen_1_antes = urlA;
        datos.imagen_1_despues = urlD;
        await supabase.from('noticias').insert([datos]);
        alert("¡Nueva gestión publicada!");
      }
      setMostrarModalNoticia(false);
      cargarTodo();
    } catch (err) { alert("Error: " + err.message); }
    setSubiendo(false); // Apaga el Loader
  };

  const eliminarNoticia = async (id) => {
    if (window.confirm("¿Estás seguro de borrar este logro público?")) {
      setSubiendo(true); // Activa el Loader
      await supabase.from('noticias').delete().eq('id', id);
      cargarTodo();
      setSubiendo(false); // Apaga el Loader
    }
  };

  // --- LÓGICA CRM (CONCEJAL GESTIONA DIRECTO) ---
  const asignarCaso = async (idCol) => {
    if(!idCol) return;
    setSubiendo(true);
    await supabase.from('casos').update({ asesor_asignado: idCol, estado: 'Escalado' }).eq('id', casoSeleccionado.id);
    setCasoSeleccionado(null);
    cargarTodo();
    setSubiendo(false);
  };

  const finalizarCaso = async () => {
    if(!respuestaActual) { alert("Describe la gestión realizada."); return; }
    setSubiendo(true);
    try {
      let urlSol = null;
      if (archivoSolucion) {
        urlSol = await subirArchivo(archivoSolucion, 'casos');
      }
      await supabase.from('casos').update({ 
        estado: 'Solucionado', 
        respuesta_admin: respuestaActual,
        archivo_respuesta: urlSol
      }).eq('id', casoSeleccionado.id);
      
      alert("✅ Radicado cerrado con éxito.");
      setCasoSeleccionado(null);
      cargarTodo();
    } catch (err) { alert("Error: " + err.message); }
    setSubiendo(false);
  };

  // 1. Este return solo se muestra la primera vez que cargas la página y Supabase está lento
  if (!perfil) return (
    <div className="cr5-loader-overlay">
      <div className="cr5-loader-container">
        <div className="cr5-aro-azul"></div>
        <div className="cr5-logo-centro">5</div>
      </div>
      <p className="cr5-loader-texto">INICIANDO CRM #5...</p>
    </div>
  );

  // 2. RETURN PRINCIPAL DEL DASHBOARD
  return (
    <div className="admin-container">
      
      {/* MEJORA: LOADER ELITE #5 (Centrado y Creativo) */}
      {subiendo && (
        <div className="cr5-loader-overlay">
          <div className="cr5-loader-container">
            <div className="cr5-aro-azul"></div>
            <div className="cr5-logo-centro">5</div>
          </div>
          <p className="cr5-loader-texto">GESTIONANDO EL CAMBIO RADICAL #5...</p>
        </div>
      )}

      {/* SIDEBAR DE LUJO (ALTO CONTRASTE) */}
      <aside className="sidebar">
        <div style={{padding: '40px 20px', textAlign: 'center'}}>
           <div style={{background:'#E30613', color:'white', display:'inline-block', padding:'12px 25px', borderRadius:'15px', fontWeight:'900', fontSize:'2.2rem', boxShadow:'0 10px 20px rgba(0,0,0,0.4)'}}>5</div>
           <h3 style={{color:'white', marginTop:'20px', fontSize:'0.85rem', letterSpacing:'2px', opacity: 0.8, textTransform:'uppercase'}}>CRM Concejal</h3>
        </div>
        <nav style={{display:'flex', flexDirection:'column', gap:'15px', padding:'0 20px'}}>
          <button onClick={()=>setModuloActivo('dashboard')} style={btnStyle(moduloActivo==='dashboard')}>📊 DASHBOARD</button>
          {perfil.rol === 'admin' && (
            <button onClick={()=>setModuloActivo('noticias')} style={btnStyle(moduloActivo==='noticias')}>📢 LOGROS PÚBLICOS</button>
          )}
        </nav>
        <div style={{marginTop:'auto', padding:'30px 20px'}}>
           <button onClick={()=>{supabase.auth.signOut(); navigate('/login')}} style={{color:'#f87171', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'10px'}}>
             🚪 Cerrar Sesión
           </button>
        </div>
      </aside>

      <main className="main-content">
        {moduloActivo === 'dashboard' ? (
          <>
            <div className="grid-stats">
              <StatCard label="Peticiones Totales" val={casos.length} col="#3b82f6" />
              <StatCard label="En Gestión" val={casos.filter(c=>c.estado!=='Solucionado').length} col="#f59e0b" />
              <StatCard label="Casos Cerrados" val={casos.filter(c=>c.estado==='Solucionado').length} col="#10b981" />
            </div>

            <div className="tabla-scroll">
              <div style={{display:'flex', gap:'15px', marginBottom:'25px'}}>
                <input type="text" placeholder="🔍 Buscar ciudadano por nombre..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{...inStyle, flex: 1}} />
              </div>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{textAlign:'left', fontSize:'0.7rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'1.5px'}}>
                    <th style={{padding:'15px'}}>Ciudadano</th>
                    <th style={{padding:'15px'}}>Asunto</th>
                    <th style={{padding:'15px'}}>Estado</th>
                    <th style={{padding:'15px'}}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {casos.filter(c => c.ciudadano_nombre.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
                    <tr key={c.id} style={{borderBottom:'1px solid #f1f5f9', transition:'0.2s'}}>
                      <td style={{padding:'15px'}}><b>{c.ciudadano_nombre}</b></td>
                      <td style={{padding:'15px'}}>{c.tipos_solicitud?.nombre}</td>
                      <td style={{padding:'15px'}}><span style={badgeStyle(c.estado)}>{c.estado}</span></td>
                      <td style={{padding:'15px'}}><button className="btn-gestionar" onClick={()=>setCasoSeleccionado(c)}>Gestionar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* MÓDULO NOTICIAS COMPLETO (RECUPERADO) */
          <div className="tabla-scroll">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
              <h2 style={{margin:0, color:'#0f172a'}}>📢 Gestión de Logros Públicos</h2>
              <button onClick={abrirParaCrear} style={{background:'#3b82f6', color:'white', padding:'14px 28px', border:'none', borderRadius:'14px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(59,130,246,0.3)'}}>
                + Nueva Publicación
              </button>
            </div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{textAlign:'left', color:'#64748b', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'1px'}}>
                  <th style={{padding:'15px'}}>Título de la Obra o Gestión</th>
                  <th style={{padding:'15px'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {noticiasListado.map(n => (
                  <tr key={n.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                    <td style={{padding:'15px'}}><b>{n.titulo}</b></td>
                    <td style={{padding:'15px', display:'flex', gap:'12px'}}>
                      <button onClick={()=>abrirParaEditar(n)} style={{background:'#fef3c7', color:'#92400e', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>Editar</button>
                      <button onClick={()=>eliminarNoticia(n.id)} style={{background:'#fee2e2', color:'#991b1b', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DE GESTIÓN CRM (CONCEJAL GESTIONA DIRECTO) */}
      {casoSeleccionado && (
        <div style={{position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(8px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100, padding:'20px'}}>
          <div style={{background:'white', width:'100%', maxWidth:'550px', borderRadius:'30px', padding:'40px', position:'relative', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
            <button onClick={()=>setCasoSeleccionado(null)} style={{position:'absolute', top:'25px', right:'25px', border:'none', background:'#f1f5f9', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer'}}>✕</button>
            <h3 style={{marginTop:0, color:'#003366', fontSize:'1.5rem'}}>Radicado #{casoSeleccionado.id}</h3>
            <p style={{fontSize:'1rem'}}><b>Ciudadano:</b> {casoSeleccionado.ciudadano_nombre}</p>
            <div style={{background:'#f8fafc', padding:'15px', borderRadius:'12px', fontSize:'0.9rem', color:'#475569', border:'1px solid #e2e8f0', margin:'15px 0'}}>
              <b>Petición:</b> {casoSeleccionado.descripcion_caso}
            </div>
            
            <hr style={{opacity:0.1, margin:'25px 0'}}/>

            {perfil.rol === 'admin' && casoSeleccionado.estado !== 'Solucionado' && (
              <div style={{display:'flex', flexDirection:'column', gap:'25px'}}>
                <div>
                  <label style={{fontWeight:'bold', fontSize:'0.8rem', color:'#64748b'}}>OPCIÓN 1: ASIGNAR A ASESOR</label>
                  <select onChange={e=>asignarCaso(e.target.value)} style={{width:'100%', padding:'12px', marginTop:'8px', borderRadius:'12px', border:'1px solid #cbd5e1'}}>
                    <option value="">-- Seleccionar Equipo --</option>
                    {colaboradores.map(col => <option key={col.id} value={col.id}>{col.nombre}</option>)}
                  </select>
                </div>

                <div style={{background:'#fff1f2', padding:'25px', borderRadius:'20px', border:'2px dashed #fda4af'}}>
                  <label style={{fontWeight:'bold', fontSize:'0.8rem', color:'#E30613'}}>OPCIÓN 2: GESTIÓN DIRECTA DEL CONCEJAL</label>
                  <textarea placeholder="¿Cuál fue la gestión realizada?" onChange={e=>setRespuestaActual(e.target.value)} style={{...inStyle, height:'100px', marginTop:'10px', background:'white'}} />
                  <button onClick={finalizarCaso} style={{width:'100%', padding:'16px', background:'#10b981', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', marginTop:'15px', cursor:'pointer', boxShadow:'0 4px 12px rgba(16,185,129,0.3)'}}>
                    ✅ CERRAR RADICADO AHORA
                  </button>
                </div>
              </div>
            )}

            {perfil.rol === 'asesor' && casoSeleccionado.estado !== 'Solucionado' && (
               <div>
                  <label style={{fontWeight:'bold', fontSize:'0.8rem', color:'#003366'}}>REGISTRAR GESTIÓN:</label>
                  <textarea placeholder="Describe la solución detalladamente..." onChange={e=>setRespuestaActual(e.target.value)} style={{...inStyle, height:'150px', marginTop:'10px'}} />
                  <button onClick={finalizarCaso} style={{width:'100%', padding:'18px', background:'#3b82f6', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', marginTop:'20px', cursor:'pointer'}}>
                    ENVIAR SOLUCIÓN FINAL
                  </button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARA PUBLICAR LOGROS (RECUPERADO COMPLETO) */}
      {mostrarModalNoticia && (
        <div style={{position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(8px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, padding:'20px'}}>
          <div style={{background:'white', width:'100%', maxWidth:'650px', borderRadius:'35px', padding:'45px', position:'relative', maxHeight:'90vh', overflowY:'auto'}}>
            <button onClick={()=>setMostrarModalNoticia(false)} style={{position:'absolute', top:'30px', right:'30px', border:'none', background:'#f1f5f9', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer'}}>✕</button>
            <h2 style={{marginTop:0, color:'#0f172a'}}>{idEdicion ? '✏️ Editar Logro' : '📢 Publicar Nuevo Logro'}</h2>
            
            <form onSubmit={guardarNoticia} style={{display:'flex', flexDirection:'column', gap:'18px', marginTop:'25px'}}>
              <input type="text" placeholder="Título de la obra o gestión" value={titulo} onChange={e=>setTitulo(e.target.value)} required style={inStyle} />
              <textarea placeholder="Describe el impacto de esta gestión territorial..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required style={{...inStyle, height:'120px'}} />
              <input type="text" placeholder="Link de Video YouTube o Instagram Reel (Opcional)" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} style={inStyle} />
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'15px', border:'1px solid #e2e8f0'}}>
                  <label style={{fontSize:'0.75rem', fontWeight:'bold', color:'#64748b'}}>📸 FOTO ANTES:</label>
                  <input type="file" onChange={e=>setArchivoAntes(e.target.files[0])} style={{marginTop:'10px', fontSize:'0.8rem', width:'100%'}}/>
                </div>
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'15px', border:'1px solid #e2e8f0'}}>
                  <label style={{fontSize:'0.75rem', fontWeight:'bold', color:'#64748b'}}>📸 FOTO DESPUÉS:</label>
                  <input type="file" onChange={e=>setArchivoDespues(e.target.files[0])} style={{marginTop:'10px', fontSize:'0.8rem', width:'100%'}}/>
                </div>
              </div>
              
              <button type="submit" disabled={subiendo} style={{padding:'18px', backgroundColor:'#003366', color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', fontSize:'1.1rem', cursor:'pointer', marginTop:'10px'}}>
                {subiendo ? '⏳ SUBIENDO...' : idEdicion ? 'GUARDAR CAMBIOS' : 'PUBLICAR EN EL PORTAL'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ESTILOS DE ALTO NIVEL (SIDEBAR PRO)
const btnStyle = (act) => ({
  textAlign:'left', padding:'16px 22px', borderRadius:'14px', border:'none', cursor:'pointer', fontWeight:'800', transition:'0.3s', fontSize:'0.8rem', letterSpacing:'1px', display:'flex', alignItems:'center', gap:'12px',
  background: act ? '#fff' : 'transparent',
  color: act ? '#0f172a' : '#94a3b8',
  borderLeft: act ? '6px solid #E30613' : '6px solid transparent',
  boxShadow: act ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
});

const badgeStyle = (est) => ({ 
  padding:'6px 14px', borderRadius:'30px', fontSize:'0.65rem', fontWeight:'900', textTransform:'uppercase', letterSpacing:'1px',
  background: est==='Solucionado'?'#dcfce7':'#fee2e2', 
  color: est==='Solucionado'?'#166534':'#991b1b' 
});

const inStyle = { 
  width:'100%', padding:'14px 20px', borderRadius:'14px', border:'1px solid #e2e8f0', fontSize:'1rem', outline:'none', boxSizing:'border-box', backgroundColor: '#fcfcfc', transition: '0.3s', outline:'none'
};

function StatCard({label, val, col}) {
  return (
    <div style={{background:'white', padding:'30px', borderRadius:'24px', borderTop:`8px solid ${col}`, boxShadow:'0 10px 15px -3px rgba(0,0,0,0.05)'}}>
      <p style={{margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:'900', textTransform:'uppercase', letterSpacing:'1.5px'}}>{label}</p>
      <h2 style={{margin:'15px 0 0 0', color:'#0f172a', fontSize:'2.5rem', fontWeight:'900'}}>{val}</h2>
    </div>
  );
}