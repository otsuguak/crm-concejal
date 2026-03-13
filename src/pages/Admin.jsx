import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import '../App.css';

export default function Admin() {
  const [perfil, setPerfil] = useState(null);
  const [casos, setCasos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [noticiasListado, setNoticiasListado] = useState([]);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [moduloActivo, setModuloActivo] = useState('dashboard');
  const [busqueda, setBusqueda] = useState('');
  
  // --- ESTADOS DEL MODAL DE PUBLICACIONES ---
  const [mostrarModalNoticia, setMostrarModalNoticia] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [archivoAntes, setArchivoAntes] = useState(null);
  const [archivoDespues, setArchivoDespues] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  
  // Estados para ejecución de asesor
  const [respuestaActual, setRespuestaActual] = useState('');
  const [archivoSolucion, setArchivoSolucion] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    cargarTodo();
  }, [navigate]);

  async function cargarTodo() {
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

  // --- LÓGICA DE PUBLICACIONES (CRUD) ---
  const abrirParaCrear = () => {
    setIdEdicion(null);
    setTitulo(''); setDescripcion(''); setVideoUrl('');
    setMostrarModalNoticia(true);
  };

  const abrirParaEditar = (n) => {
    setIdEdicion(n.id);
    setTitulo(n.titulo);
    setDescripcion(n.descripcion);
    setVideoUrl(n.video_url || '');
    setMostrarModalNoticia(true);
  };

  const eliminarNoticia = async (id) => {
    if (window.confirm("¿Eliminar esta publicación?")) {
      await supabase.from('noticias').delete().eq('id', id);
      cargarTodo();
    }
  };

  const subirArchivo = async (file) => {
    if (!file) return null;
    const name = `${Date.now()}-${file.name}`;
    await supabase.storage.from('noticias').upload(name, file);
    return supabase.storage.from('noticias').getPublicUrl(name).data.publicUrl;
  };

  const guardarNoticia = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      const urlA = await subirArchivo(archivoAntes);
      const urlD = await subirArchivo(archivoDespues);
      const datos = { titulo, descripcion, video_url: videoUrl };
      if (urlA) datos.imagen_1_antes = urlA;
      if (urlD) datos.imagen_1_despues = urlD;

      if (idEdicion) {
        await supabase.from('noticias').update(datos).eq('id', idEdicion);
      } else {
        if (!archivoAntes || !archivoDespues) throw new Error("Las fotos son obligatorias.");
        datos.imagen_1_antes = urlA;
        datos.imagen_1_despues = urlD;
        await supabase.from('noticias').insert([datos]);
      }
      setMostrarModalNoticia(false);
      cargarTodo();
    } catch (err) { alert(err.message); }
    setSubiendo(false);
  };

  // --- LÓGICA CRM ---
  const asignarCaso = async (idCol) => {
    const colab = colaboradores.find(c => c.id === idCol);
    await supabase.from('casos').update({ asesor_asignado: idCol, estado: 'Escalado' }).eq('id', casoSeleccionado.id);
    const tel = colab.telefono?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/57${tel}?text=${encodeURIComponent("Nuevo caso asignado #" + casoSeleccionado.id)}`, '_blank');
    window.location.reload();
  };

  const stats = {
    total: casos.length,
    pendientes: casos.filter(c => c.estado !== 'Solucionado').length,
    vencidos: casos.filter(c => new Date(c.fecha_limite) < new Date() && c.estado !== 'Solucionado').length,
    cerrados: casos.filter(c => c.estado === 'Solucionado').length
  };

  if (!perfil) return <div style={{padding:'50px', textAlign:'center'}}>Iniciando Dashboard...</div>;

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 style={{color: '#38bdf8', marginBottom: '30px', fontWeight:'800'}}>🏛️ CRM #5</h2>
        <nav style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <button onClick={()=>setModuloActivo('dashboard')} style={btnStyle(moduloActivo==='dashboard')}>📊 Dashboard</button>
          {perfil.rol === 'admin' && (
            <button onClick={()=>setModuloActivo('noticias')} style={btnStyle(moduloActivo==='noticias')}>📢 Publicaciones</button>
          )}
        </nav>
        <div style={{marginTop:'auto', borderTop:'1px solid #1e293b', paddingTop:'20px'}}>
          <button onClick={()=>{supabase.auth.signOut(); navigate('/login')}} style={{color:'#f87171', background:'none', border:'none', cursor:'pointer'}}>Salir</button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="main-content">
        {moduloActivo === 'dashboard' ? (
          <>
            <div className="grid-stats">
              <StatCard label="Total" val={stats.total} col="#3b82f6" />
              <StatCard label="Pendientes" val={stats.pendientes} col="#f59e0b" />
              <StatCard label="Urgentes" val={stats.vencidos} col="#ef4444" />
              <StatCard label="Cerrados" val={stats.cerrados} col="#10b981" />
            </div>

            <div className="tabla-scroll">
              <input type="text" placeholder="🔍 Buscar por nombre..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={inStyle} />
              <table style={{width:'100%', borderCollapse:'collapse', marginTop:'15px'}}>
                <thead>
                  <tr style={{textAlign:'left', fontSize:'0.75rem', color:'#64748b'}}>
                    <th style={{padding:'12px'}}>CIUDADANO</th>
                    <th className="ocultar-movil" style={{padding:'12px'}}>TIPO</th>
                    <th style={{padding:'12px'}}>ESTADO</th>
                    <th style={{padding:'12px'}}>GESTIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {casos.filter(c => c.ciudadano_nombre.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
                    <tr key={c.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                      <td style={{padding:'12px'}}><b>{c.ciudadano_nombre}</b></td>
                      <td className="ocultar-movil" style={{padding:'12px'}}>{c.tipos_solicitud?.nombre}</td>
                      <td style={{padding:'12px'}}><span style={badgeStyle(c.estado)}>{c.estado}</span></td>
                      <td style={{padding:'12px'}}><button onClick={()=>setCasoSeleccionado(c)} style={{padding:'5px 12px', cursor:'pointer'}}>Abrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* MÓDULO PUBLICACIONES (VISTA TABLA) */
          <div className="tabla-scroll">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h2 style={{margin:0, color:'#0f172a'}}>Historial de Gestión</h2>
              <button onClick={abrirParaCrear} style={{background:'#3b82f6', color:'white', border:'none', padding:'10px 20px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>
                + Nueva Publicación
              </button>
            </div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{textAlign:'left', color:'#64748b', fontSize:'0.8rem'}}>
                  <th style={{padding:'12px'}}>TÍTULO</th>
                  <th style={{padding:'12px'}}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {noticiasListado.map(n => (
                  <tr key={n.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                    <td style={{padding:'12px'}}><b>{n.titulo}</b></td>
                    <td style={{padding:'12px', display:'flex', gap:'10px'}}>
                      <button onClick={()=>abrirParaEditar(n)} style={{background:'#fef3c7', color:'#92400e', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer'}}>Editar</button>
                      <button onClick={()=>eliminarNoticia(n.id)} style={{background:'#fee2e2', color:'#991b1b', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer'}}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* --- MODAL PRO PARA PUBLICACIONES (NUEVA / EDITAR) --- */}
      {mostrarModalNoticia && (
        <div style={{position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, padding:'20px'}}>
          <div style={{background:'white', width:'100%', maxWidth:'600px', borderRadius:'24px', padding:'35px', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative', maxHeight:'90vh', overflowY:'auto'}}>
            <button onClick={()=>setMostrarModalNoticia(false)} style={{position:'absolute', top:'25px', right:'25px', border:'none', background:'#f1f5f9', width:'35px', height:'35px', borderRadius:'50%', cursor:'pointer'}}>✕</button>
            
            <h2 style={{marginTop:0, color:'#0f172a'}}>{idEdicion ? '✏️ Editar Logro' : '📢 Publicar Nuevo Logro'}</h2>
            <form onSubmit={guardarNoticia} style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'20px'}}>
              <input type="text" placeholder="Título de la obra" value={titulo} onChange={e=>setTitulo(e.target.value)} required style={inStyle} />
              <textarea placeholder="Descripción detallada..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required style={{...inStyle, height:'100px'}} />
              <input type="text" placeholder="Link de Video YouTube (Opcional)" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} style={inStyle} />
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                <label style={{fontSize:'0.85rem', fontWeight:'bold'}}>📸 Foto Antes: <input type="file" onChange={e=>setArchivoAntes(e.target.files[0])} style={{marginTop:'5px', display:'block'}}/></label>
                <label style={{fontSize:'0.85rem', fontWeight:'bold'}}>📸 Foto Después: <input type="file" onChange={e=>setArchivoDespues(e.target.files[0])} style={{marginTop:'5px', display:'block'}}/></label>
              </div>
              
              <button type="submit" disabled={subiendo} style={{padding:'15px', backgroundColor:'#3b82f6', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'1rem', cursor:'pointer', marginTop:'10px'}}>
                {subiendo ? '🚀 Procesando...' : idEdicion ? 'Guardar Cambios' : 'Publicar Ahora'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL GESTIÓN DE CASOS (ESTO NO SE CAMBIA) --- */}
      {casoSeleccionado && (
        <div style={{position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100, padding:'20px'}}>
          <div style={{background:'white', width:'100%', maxWidth:'500px', borderRadius:'24px', padding:'35px', position:'relative'}}>
            <button onClick={()=>setCasoSeleccionado(null)} style={{position:'absolute', top:'20px', right:'20px', border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer'}}>✕</button>
            <h3 style={{marginTop:0}}>Caso #{casoSeleccionado.id}</h3>
            <p><b>Ciudadano:</b> {casoSeleccionado.ciudadano_nombre}</p>
            <hr style={{opacity:0.1, margin:'20px 0'}}/>
            {perfil.rol === 'admin' && casoSeleccionado.estado !== 'Solucionado' && (
              <div>
                <label style={{fontWeight:'bold'}}>Asignar a:</label>
                <select onChange={e=>asignarCaso(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', marginTop:'10px'}}>
                  <option value="">-- Seleccionar --</option>
                  {colaboradores.map(col => <option key={col.id} value={col.id}>{col.nombre}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS RAPIDOS
const btnStyle = (act) => ({ textAlign:'left', padding:'12px', borderRadius:'8px', border:'none', background: act ? '#1e293b' : 'transparent', color:'white', cursor:'pointer', fontWeight:'bold' });
const badgeStyle = (est) => ({ padding:'4px 10px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'bold', background: est==='Solucionado'?'#dcfce7':'#fee2e2', color: est==='Solucionado'?'#166534':'#991b1b' });
const inStyle = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', fontSize:'0.95rem', outline:'none', boxSizing:'border-box' };
function StatCard({label, val, col}) {
  return (
    <div style={{background:'white', padding:'20px', borderRadius:'16px', borderTop:`5px solid ${col}`, boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
      <p style={{margin:0, fontSize:'0.75rem', color:'#64748b', fontWeight:'800'}}>{label.toUpperCase()}</p>
      <h2 style={{margin:'8px 0 0 0', color:'#0f172a'}}>{val}</h2>
    </div>
  );
}