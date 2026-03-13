import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import '../App.css';

export default function Admin() {
  const [perfil, setPerfil] = useState(null);
  const [casos, setCasos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [moduloActivo, setModuloActivo] = useState('dashboard');
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para noticias y ejecución (¡AQUÍ ESTÁ TODO!)
  const [subiendo, setSubiendo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivoAntes, setArchivoAntes] = useState(null);
  const [archivoDespues, setArchivoDespues] = useState(null);
  const [respuestaActual, setRespuestaActual] = useState('');
  const [archivoSolucion, setArchivoSolucion] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: miPerfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
      if (miPerfil) {
        setPerfil(miPerfil);
        const { data: todos } = await supabase.from('casos').select('*, tipos_solicitud(nombre)').order('id', {ascending: false});
        
        if (miPerfil.rol === 'admin') {
          setCasos(todos || []);
          const { data: eq } = await supabase.from('perfiles').select('*').eq('rol', 'asesor');
          setColaboradores(eq || []);
        } else {
          setCasos(todos?.filter(c => c.asesor_asignado === user.id) || []);
        }
      }
    }
    cargarDatos();
  }, [navigate]);

  // --- FUNCIONES MÓVIL Y NOTIFICACIONES ---
  const enviarAvisos = async (caso, colab) => {
    // 1. EmailJS
    emailjs.send('TU_SERVICE_ID', 'TU_TEMPLATE_ID', {
      nombre_ciudadano: caso.ciudadano_nombre,
      tipo_caso: caso.tipos_solicitud?.nombre,
      email_colaborador: colab.correo
    }, 'TU_PUBLIC_KEY').catch(e => console.log(e));

    // 2. WhatsApp
    const tel = colab.telefono?.replace(/\D/g, '') || '';
    const msg = `Hola ${colab.nombre}, se te asignó el caso #${caso.id}. Revisa el CRM.`;
    window.open(`https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const subirStorage = async (file) => {
    const name = `${Date.now()}-${file.name}`;
    await supabase.storage.from('noticias').upload(name, file);
    return supabase.storage.from('noticias').getPublicUrl(name).data.publicUrl;
  };

  // --- ACCIONES DE GESTIÓN ---
  const publicarGestion = async (e) => {
    e.preventDefault(); setSubiendo(true);
    try {
      const urlA = await subirStorage(archivoAntes);
      const urlD = await subirStorage(archivoDespues);
      await supabase.from('noticias').insert([{ titulo, descripcion, imagen_1_antes: urlA, imagen_1_despues: urlD }]);
      alert("¡Gestión publicada!"); window.location.reload();
    } catch (err) { alert(err.message); }
    setSubiendo(false);
  };

  const asignarCaso = async (idCol) => {
    const colab = colaboradores.find(c => c.id === idCol);
    const { error } = await supabase.from('casos').update({ asesor_asignado: idCol, estado: 'Escalado' }).eq('id', casoSeleccionado.id);
    if (!error) {
      enviarAvisos(casoSeleccionado, colab);
      window.location.reload();
    }
  };

  const finalizarCaso = async () => {
    if (!respuestaActual) return alert("Escribe la solución.");
    setSubiendo(true);
    try {
      let urlSol = archivoSolucion ? await subirStorage(archivoSolucion) : '';
      await supabase.from('casos').update({ respuesta_asesor: respuestaActual, imagen_solucion: urlSol, estado: 'Solucionado' }).eq('id', casoSeleccionado.id);
      alert("Caso Cerrado"); window.location.reload();
    } catch (err) { alert(err.message); }
    setSubiendo(false);
  };

  // --- CÁLCULOS ---
  const stats = {
    total: casos.length,
    pendientes: casos.filter(c => c.estado !== 'Solucionado').length,
    vencidos: casos.filter(c => new Date(c.fecha_limite) < new Date() && c.estado !== 'Solucionado').length,
    cerrados: casos.filter(c => c.estado === 'Solucionado').length
  };

  const filtrados = casos.filter(c => c.ciudadano_nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (!perfil) return <div style={{padding:'50px', textAlign:'center'}}>Iniciando Dashboard...</div>;

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 style={{color: '#38bdf8', marginBottom: '30px'}}>🏛️ CONCEJAL PRO</h2>
        <nav style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <button onClick={()=>setModuloActivo('dashboard')} style={btnStyle(moduloActivo==='dashboard')}>📊 Dashboard</button>
          {perfil.rol === 'admin' && <button onClick={()=>setModuloActivo('noticias')} style={btnStyle(moduloActivo==='noticias')}>📢 Noticias</button>}
        </nav>
        <div style={{marginTop:'auto'}}>
          <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>{perfil.nombre}</p>
          <button onClick={()=>{supabase.auth.signOut(); navigate('/login')}} style={{color:'#f87171', background:'none', border:'none', cursor:'pointer'}}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="main-content">
        {moduloActivo === 'dashboard' ? (
          <>
            <div className="grid-stats">
              <StatCard label="Total" val={stats.total} col="#3b82f6" />
              <StatCard label="Pendientes" val={stats.pendientes} col="#f59e0b" />
              <StatCard label="Vencidos" val={stats.vencidos} col="#ef4444" />
              <StatCard label="Cerrados" val={stats.cerrados} col="#10b981" />
            </div>

            <div className="tabla-scroll">
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}>
                <h3 style={{margin:0}}>Gestión de Casos</h3>
                <input type="text" placeholder="🔍 Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{padding:'8px 15px', borderRadius:'20px', border:'1px solid #ddd'}} />
              </div>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{textAlign:'left', fontSize:'0.8rem', color:'#64748b', borderBottom:'1px solid #f1f5f9'}}>
                    <th style={{padding:'12px'}}>CASO</th>
                    <th style={{padding:'12px'}}>CIUDADANO</th>
                    <th className="ocultar-movil" style={{padding:'12px'}}>TIPIFICACIÓN</th>
                    <th style={{padding:'12px'}}>ESTADO</th>
                    <th style={{padding:'12px'}}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(c => (
                    <tr key={c.id} style={{borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem'}}>
                      <td style={{padding:'12px'}}>#{c.id}</td>
                      <td style={{padding:'12px'}}><b>{c.ciudadano_nombre}</b></td>
                      <td className="ocultar-movil" style={{padding:'12px'}}>{c.tipos_solicitud?.nombre}</td>
                      <td style={{padding:'12px'}}><span style={badgeStyle(c.estado)}>{c.estado}</span></td>
                      <td style={{padding:'12px'}}><button onClick={()=>setCasoSeleccionado(c)} style={{cursor:'pointer'}}>Gestionar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* MÓDULO NOTICIAS COMPLETO */
          <div style={{maxWidth:'600px', background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
            <h3>📢 Publicar Gestión del Concejal</h3>
            <form onSubmit={publicarGestion} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input type="text" placeholder="Título de la obra" onChange={e=>setTitulo(e.target.value)} required style={inStyle}/>
              <textarea placeholder="Descripción" onChange={e=>setDescripcion(e.target.value)} required style={{...inStyle, height:'100px'}}/>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <label>Foto Antes: <input type="file" onChange={e=>setArchivoAntes(e.target.files[0])} required /></label>
                <label>Foto Después: <input type="file" onChange={e=>setArchivoDespues(e.target.files[0])} required /></label>
              </div>
              <button type="submit" disabled={subiendo} style={{padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer'}}>
                {subiendo ? 'Subiendo...' : 'Publicar Ahora'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL DE GESTIÓN COMPLETO */}
      {casoSeleccionado && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100, padding:'20px'}}>
          <div style={{background:'white', width:'100%', maxWidth:'500px', borderRadius:'20px', padding:'25px', position:'relative', maxHeight:'90vh', overflowY:'auto'}}>
            <button onClick={()=>setCasoSeleccionado(null)} style={{position:'absolute', top:'20px', right:'20px', border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
            <h3 style={{marginTop:0}}>Gestión Caso #{casoSeleccionado.id}</h3>
            <div style={{background:'#f8fafc', padding:'15px', borderRadius:'10px', marginBottom:'20px'}}>
              <p><b>Ciudadano:</b> {casoSeleccionado.ciudadano_nombre}</p>
              <p><b>Descripción:</b> {casoSeleccionado.descripcion_caso}</p>
            </div>

            {perfil.rol === 'admin' && casoSeleccionado.estado !== 'Solucionado' && (
              <div style={{borderTop:'1px solid #eee', paddingTop:'20px'}}>
                <label><b>Escalar a colaborador:</b></label>
                <select onChange={e=>asignarCaso(e.target.value)} style={{width:'100%', padding:'10px', marginTop:'10px', borderRadius:'8px'}}>
                  <option value="">-- Seleccionar --</option>
                  {colaboradores.map(col => <option key={col.id} value={col.id}>{col.nombre}</option>)}
                </select>
              </div>
            )}

            {perfil.rol === 'asesor' && casoSeleccionado.estado !== 'Solucionado' && (
              <div style={{borderTop:'1px solid #eee', paddingTop:'20px'}}>
                <label><b>Registrar Solución:</b></label>
                <textarea placeholder="Describe lo que hiciste..." onChange={e=>setRespuestaActual(e.target.value)} style={{width:'100%', height:'80px', marginTop:'10px', padding:'10px'}}/>
                <input type="file" onChange={e=>setArchivoSolucion(e.target.files[0])} style={{marginTop:'10px'}} />
                <button onClick={finalizarCaso} disabled={subiendo} style={{width:'100%', padding:'12px', marginTop:'20px', background:'#10b981', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold'}}>
                  {subiendo ? 'Guardando...' : 'Finalizar y Cerrar'}
                </button>
              </div>
            )}

            {casoSeleccionado.estado === 'Solucionado' && (
              <div style={{background:'#f0fdf4', padding:'15px', borderRadius:'10px', border:'1px solid #bbf7d0'}}>
                <p><b>Solución dada:</b> {casoSeleccionado.respuesta_asesor}</p>
                {casoSeleccionado.imagen_solucion && <img src={casoSeleccionado.imagen_solucion} style={{width:'100%', marginTop:'10px', borderRadius:'8px'}} alt="Evidencia"/>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS MINI
function StatCard({label, val, col}) {
  return (
    <div style={{background:'white', padding:'15px', borderRadius:'12px', borderTop:`4px solid ${col}`, boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
      <p style={{margin:0, fontSize:'0.7rem', color:'#64748b', fontWeight:'800'}}>{label.toUpperCase()}</p>
      <h2 style={{margin:'5px 0 0 0', color:'#0f172a'}}>{val}</h2>
    </div>
  );
}
const btnStyle = (act) => ({ textAlign:'left', padding:'12px', borderRadius:'8px', border:'none', background: act ? '#1e293b' : 'transparent', color:'white', cursor:'pointer' });
const badgeStyle = (est) => ({ padding:'4px 10px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'bold', background: est==='Solucionado'?'#dcfce7':'#fee2e2', color: est==='Solucionado'?'#166534':'#991b1b' });
const inStyle = { padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'0.9rem' };