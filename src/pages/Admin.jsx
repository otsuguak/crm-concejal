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
        const { data: eq } = await supabase
            .from('perfiles')
            .select('*')
            .in('rol', ['asesor', 'admin']); // Metemos a ambos en el combo
        setColaboradores(eq || []);
      }
    }
  }

  const mostrarExito = (mensaje) => { setToastMsg(mensaje); setTimeout(() => { setToastMsg(''); }, 3000); };
  
  // =======================================================================
  // 🔥 LÓGICA DEL CAMIÓN DE BASURA: SUBIR Y BORRAR DE STORAGE 🔥
  // =======================================================================
  
  // Extrae solo el nombre final del archivo de una URL pública
  const extraerNombreArchivo = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    } catch (error) { return null; }
  };

  // Va al Storage y destruye el archivo viejo
  const borrarArchivoDeStorage = async (urlVieja, bucket) => {
    const nombreArchivo = extraerNombreArchivo(urlVieja);
    if (nombreArchivo) {
      await supabase.storage.from(bucket).remove([nombreArchivo]);
    }
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
    e.preventDefault(); 
    setSubiendo(true); 
    try { 
      let urlLogoFinal = confTextos.logoUrlActual;
      if (archivoLogo) {
        // 🔥 Si sube logo nuevo, destruimos el viejo de la nube 🔥
        if (confTextos.logoUrlActual) await borrarArchivoDeStorage(confTextos.logoUrlActual, 'noticias');
        urlLogoFinal = await subirArchivo(archivoLogo, 'noticias');
      }

      let urlFondoFinal = confTextos.heroFondoActual;
      if (archivoHeroFondo) {
        // 🔥 Si sube fondo nuevo, destruimos el viejo de la nube 🔥
        if (confTextos.heroFondoActual) await borrarArchivoDeStorage(confTextos.heroFondoActual, 'noticias');
        urlFondoFinal = await subirArchivo(archivoHeroFondo, 'noticias');
      }

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
    } catch (err) { alert("Error: " + err.message); } 
    setSubiendo(false); 
  };

  const agregarTipoSolicitud = async () => {
    if (!nuevoTipoNombre.trim()) return;
    setSubiendo(true);
    try {
      const { error } = await supabase.from('tipos_solicitud').insert([{ nombre: nuevoTipoNombre, dias_respuesta: 5 }]);
      if (error) throw error;
      mostrarExito("¡Categoría agregada exitosamente!");
      setNuevoTipoNombre(''); cargarTodo(); 
    } catch (err) { alert("Error al agregar: " + err.message); }
    setSubiendo(false);
  };

  const eliminarTipoSolicitud = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría? (No se puede si ya hay casos vinculados)")) return;
    setSubiendo(true);
    try {
      const { error } = await supabase.from('tipos_solicitud').delete().eq('id', id);
      if (error) { if (error.code === '23503') throw new Error("No puedes eliminar esta categoría porque ya tiene radicados vinculados."); throw error; }
      mostrarExito("¡Categoría eliminada!"); cargarTodo();
    } catch (err) { alert("Error: " + err.message); }
    setSubiendo(false);
  };

  const guardarConfigSubcategorias = async () => { 
    setSubiendo(true); 
    try { const { error } = await supabase.from('configuracion').update({ lista_subcategorias: confListas.subcat }).eq('id', 1); if (error) throw error; mostrarExito("¡Subcategorías actualizadas!"); setMostrarModalCategorias(false); cargarTodo(); } 
    catch (err) { alert("Error: " + err.message); } 
    setSubiendo(false); 
  };

  const guardarConfigBio = async (e) => {
    e.preventDefault();
    setSubiendo(true);
    try {
      let urlFoto1 = confBio.foto1Actual;
      if (archivoBio1) {
        // 🔥 Si sube foto nueva, destruye la vieja 🔥
        if (confBio.foto1Actual) await borrarArchivoDeStorage(confBio.foto1Actual, 'noticias');
        urlFoto1 = await subirArchivo(archivoBio1, 'noticias');
      }

      let urlFoto2 = confBio.foto2Actual;
      if (archivoBio2) {
        // 🔥 Si sube foto nueva, destruye la vieja 🔥
        if (confBio.foto2Actual) await borrarArchivoDeStorage(confBio.foto2Actual, 'noticias');
        urlFoto2 = await subirArchivo(archivoBio2, 'noticias');
      }

      const { error } = await supabase.from('configuracion').update({
        bio_titulo: confBio.titulo, bio_descripcion: confBio.descripcion, bio_video_url: confBio.videoUrl,
        bio_foto_1: urlFoto1, bio_foto_2: urlFoto2, bio_label: confBio.label, bio_foto_2_descripcion: confBio.foto2Descripcion, bio_pie_pagina: confBio.fraseFinal
      }).eq('id', 1);

      if (error) throw error;
      mostrarExito("¡Biografía del Concejal actualizada con éxito!");
      setMostrarModalBio(false); setArchivoBio1(null); setArchivoBio2(null); cargarTodo();
    } catch (err) { alert("Error al guardar Biografía: " + err.message); }
    setSubiendo(false);
  };

  const abrirParaCrear = () => { setIdEdicion(null); setTitulo(''); setDescripcion(''); setVideoUrl(''); setArchivoAntes(null); setArchivoDespues(null); setMostrarModalFormNoticia(true); };
  const abrirParaEditar = (n) => { setIdEdicion(n.id); setTitulo(n.titulo); setDescripcion(n.descripcion); setVideoUrl(n.video_url || ''); setMostrarModalFormNoticia(true); };
  
  const guardarNoticia = async (e) => { 
    e.preventDefault(); 
    setSubiendo(true); 
    try { 
      const noticiaVieja = idEdicion ? noticiasListado.find(n => n.id === idEdicion) : null;
      
      let urlA = null;
      if (archivoAntes) {
        // 🔥 Si sube foto nueva en edición, destruye la vieja 🔥
        if (noticiaVieja && noticiaVieja.imagen_1_antes) await borrarArchivoDeStorage(noticiaVieja.imagen_1_antes, 'noticias');
        urlA = await subirArchivo(archivoAntes, 'noticias');
      }

      let urlD = null;
      if (archivoDespues) {
        // 🔥 Si sube foto nueva en edición, destruye la vieja 🔥
        if (noticiaVieja && noticiaVieja.imagen_1_despues) await borrarArchivoDeStorage(noticiaVieja.imagen_1_despues, 'noticias');
        urlD = await subirArchivo(archivoDespues, 'noticias');
      }

      const datos = { titulo, descripcion, video_url: videoUrl }; 
      if (urlA) datos.imagen_1_antes = urlA; 
      if (urlD) datos.imagen_1_despues = urlD; 
      
      if (idEdicion) { 
        await supabase.from('noticias').update(datos).eq('id', idEdicion); 
        mostrarExito("¡Logro actualizado!"); 
      } else { 
        if (!archivoAntes || !archivoDespues) throw new Error("Las fotos Antes/Después son obligatorias."); 
        datos.imagen_1_antes = urlA; 
        datos.imagen_1_despues = urlD; 
        await supabase.from('noticias').insert([datos]); 
        mostrarExito("¡Nueva gestión publicada!"); 
      } 
      setMostrarModalFormNoticia(false); setArchivoAntes(null); setArchivoDespues(null); cargarTodo(); 
    } catch (err) { alert("Error: " + err.message); } 
    setSubiendo(false); 
  };

  const eliminarNoticia = async (noticia) => { 
    if (window.confirm("¿Estás seguro de borrar este logro?")) { 
      setSubiendo(true); 
      try { 
        // 🔥 Usa el camión de basura para borrar ambas fotos cuando eliminas el registro 🔥
        await borrarArchivoDeStorage(noticia.imagen_1_antes, 'noticias');
        await borrarArchivoDeStorage(noticia.imagen_1_despues, 'noticias');

        await supabase.from('noticias').delete().eq('id', noticia.id); 
        mostrarExito("¡Logro eliminado y fotos borradas del Storage!"); 
        cargarTodo(); 
      } catch (error) { alert("Error al borrar: " + error.message); } 
      setSubiendo(false); 
    } 
  };

  const toggleVisibilidad = async (noticia) => { setSubiendo(true); try { const nuevoEstado = !noticia.visible; await supabase.from('noticias').update({ visible: nuevoEstado }).eq('id', noticia.id); cargarTodo(); } catch (error) { alert("Error al cambiar estado: " + error.message); } setSubiendo(false); };
  const actualizarDiasSLA = async (idTipo, nuevosDias) => { setSubiendo(true); try { await supabase.from('tipos_solicitud').update({ dias_respuesta: parseInt(nuevosDias) || 0 }).eq('id', idTipo); await cargarTodo(); mostrarExito("¡Tiempo actualizado!"); } catch (error) { alert("Error: " + error.message); } setSubiendo(false); };

  const calcularColorEstado = (fechaLimiteStr, estadoActual) => { if (estadoActual && estadoActual.toLowerCase() === 'solucionado') return ''; if (!fechaLimiteStr) return ''; const hoy = new Date(); const limite = new Date(fechaLimiteStr); const diffDays = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 3600 * 24)); if (diffDays < 0) { return 'fila-vencida'; } else if (diffDays >= 0 && diffDays <= 2) { return 'fila-alerta'; } return ''; };

  const agregarNotaAlHistorial = async (idCaso) => { 
    if (!respuestaActual.trim() && !archivoRespuesta) return; 
    setSubiendo(true); 
    try { 
      // 1. Manejo de archivos adjuntos (Tu lógica original intacta)
      let urlDocumentoAdjunto = null;
      if (archivoRespuesta) { 
        urlDocumentoAdjunto = await subirArchivo(archivoRespuesta, 'noticias'); 
      }

      const fechaObj = new Date(); 
      const fechaTexto = fechaObj.toLocaleString(); 
      const nombreAutor = perfil.nombre || (perfil.rol === 'admin' ? 'Administrador' : 'Asesor'); 
      
      let textoBase = respuestaActual.trim() ? respuestaActual : 'Documento oficial adjuntado.';
      if (urlDocumentoAdjunto) { 
        textoBase += `\n📎 Documento Adjunto: ${urlDocumentoAdjunto}`; 
      }

      // 2. Construcción del historial (Manteniendo tu formato de separadores)
      const nuevaNota = `[${fechaTexto}] - ${nombreAutor}:\n${textoBase}`; 
      const historialPrevio = casoSeleccionado.respuesta_gestion || ''; 
      const nuevoHistorialCompleto = historialPrevio 
        ? `${historialPrevio}\n\n=========================\n\n${nuevaNota}` 
        : nuevaNota; 
      
      // 3. Persistencia en Supabase
      const { error } = await supabase
        .from('casos')
        .update({ 
          respuesta_gestion: nuevoHistorialCompleto, 
          fecha_respuesta: fechaObj.toISOString() 
        })
        .eq('id', idCaso); 
      
      if (error) throw error; 
      
      mostrarExito("¡Respuesta guardada!"); 

      // 4. Sincronización de estados (Local y Global)
      // Actualizamos el modal abierto
      setCasoSeleccionado(prev => ({ 
        ...prev, 
        respuesta_gestion: nuevoHistorialCompleto, 
        fecha_respuesta: fechaObj.toISOString() 
      })); 

      // 🔥 EL REFRESCO MAESTRO: Para que al volver a entrar la nota siga ahí
      await cargarTodo(); 

      // 5. Limpieza de interfaz
      setRespuestaActual(''); 
      setArchivoRespuesta(null); 

    } catch (err) { 
      alert("Error: " + err.message); 
    } 
    setSubiendo(false); 
};

  const asignarCaso = async (idCaso) => { 
    if (!colaboradorAsignado) { alert("⚠️ Selecciona un asesor."); return; } 
    setSubiendo(true); 
    try { 
        const { error: updateError } = await supabase
        .from('casos')
        .update({ estado: 'Escalado', colaborador_id: colaboradorAsignado })
        .eq('id', idCaso); 

        if (updateError) throw updateError; 

        // 2. BUSCAMOS EL CORREO DEL COLABORADOR DIRECTAMENTE EN LA BASE DE DATOS
        // Usamos el ID del colaborador que ya tenemos (colaboradorAsignado)
        const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('correo')
        .eq('id', colaboradorAsignado)
        .single();

          if (perfilError || !perfilData) {
              alert("No se pudo encontrar el correo del colaborador:", perfilError);
          return;
          }

  const correoDelFuncionario = perfilData.correo;
      const datosEmailEscalado = {
        service_id: 'service_omhcwuf',
        template_id: 'template_a8hy01e',
        user_id: 'EJwAep9er9Fhi3d1W',
        template_params: { correo_destino: correoDelFuncionario, nombre_ciudadano: casoSeleccionado.ciudadano_nombre, numero_radicado: idCaso }
      };
      fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosEmailEscalado) }).catch(err => console.log(err));

      mostrarExito("¡Caso escalado y correo enviado!"); 
      setCasoSeleccionado(null); cargarTodo(); 
    } catch (err) { alert("Error al escalar: " + err.message); } 
    setSubiendo(false); 
  };

  const solucionarCaso = async (idCaso) => { 
    try {
    // Lanzamos la alerta y esperamos la respuesta
      const result = await Swal.fire({
        title: '¿Confirmas gestión?',
        text: "¿Confirmas que este caso ya fue gestionado?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2c3e50',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      });

      // Si el usuario confirma
      if (result.isConfirmed) { 
        setSubiendo(true); 
        
        let ultimaNotaExtraida = 'Tu caso ha sido gestionado con éxito por nuestro equipo.';
        
        if (casoSeleccionado.respuesta_gestion) {
          const arrayNotas = casoSeleccionado.respuesta_gestion.split('\n\n=========================\n\n');
          ultimaNotaExtraida = arrayNotas[arrayNotas.length - 1]; 
        }

        const { error } = await supabase.from('casos').update({ estado: 'Solucionado' }).eq('id', idCaso); 
        if (error) throw error; 

        const datosEmailCierre = {
          service_id: 'service_omhcwuf',
          template_id: 'template_ap7el9i',
          user_id: 'EJwAep9er9Fhi3d1W',
          template_params: { 
            correo_ciudadano: casoSeleccionado.ciudadano_correo, 
            nombre_ciudadano: casoSeleccionado.ciudadano_nombre, 
            numero_radicado: idCaso, 
            ultima_respuesta: ultimaNotaExtraida 
          }
        };

        await fetch('https://api.emailjs.com/api/v1.0/email/send', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(datosEmailCierre) 
        });

        Swal.fire("¡Éxito!", "Caso solucionado y correo enviado.", "success");
        setCasoSeleccionado(null); 
        cargarTodo(); 
      }
    } catch (err) { 
      Swal.fire("Error", err.message, "error"); 
    } finally {
      setSubiendo(false); 
    }
  };

  const casosFiltrados = casos.filter(c => {
    const matchNombre = c.ciudadano_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchAsunto = filtroAsunto ? c.tipos_solicitud?.nombre === filtroAsunto : true;
    let matchEstado = true; if (filtroEstado) { if (filtroEstado === 'ABIERTO') { matchEstado = esCasoNuevo(c.estado); } else { matchEstado = c.estado && c.estado.toLowerCase() === filtroEstado.toLowerCase(); } }
    let matchResponsable = true; if (filtroResponsable === 'SIN_ASIGNAR') { matchResponsable = !c.colaborador_id; } else if (filtroResponsable) { matchResponsable = c.colaborador_id === filtroResponsable; }
    const claseSLA = calcularColorEstado(c.fecha_limite, c.estado);
    let matchSLA = true; if (filtroSLA === 'atiempo') { matchSLA = claseSLA === ''; } else if (filtroSLA) { matchSLA = claseSLA === filtroSLA; }
    return matchNombre && matchAsunto && matchEstado && matchResponsable && matchSLA;
  });

  const formatearTextoChat = (textoRaw) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const partes = textoRaw.split(urlRegex);
    return partes.map((parte, i) => {
      if (parte.match(urlRegex)) {
        return ( <a key={i} href={parte} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', padding: '6px 12px', background: '#e0f2fe', color: '#0284c7', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #bae6fd' }}>Abrir Documento 📄</a> );
      }
      return <span key={i}>{parte}</span>;
    });
  };

  if (!perfil) return ( <div className="cr5-loader-overlay"><div className="cr5-loader-container"><div className="cr5-aro-azul"></div><div className="cr5-logo-centro">5</div></div><p className="cr5-loader-texto">INICIANDO CRM...</p></div> );

  return (
    <div className="admin-layout">
      {toastMsg && ( <div className="toast-exito" style={{ zIndex: 99999 }}>✅ {toastMsg}</div> )}
      {subiendo && ( <div className="cr5-loader-overlay" style={{zIndex: 9999}}><div className="cr5-loader-container"><div className="cr5-aro-azul"></div><div className="cr5-logo-centro">5</div></div><p className="cr5-loader-texto">PROCESANDO...</p></div> )}

     {menuAbierto && <div className="fondo-oscuro-menu" onClick={() => setMenuAbierto(false)}></div>}

      {/* SE LE AGREGA LA CLASE DINÁMICA 'abierto' AL ASIDE */}
      <aside className={`admin-sidebar ${menuAbierto ? 'abierto' : ''}`} style={{overflowY: 'auto'}}>
        <div style={{padding: '40px 20px', textAlign: 'center'}}>
           {confTextos.logoUrlActual ? (
             <img src={confTextos.logoUrlActual} style={{maxHeight:'60px', borderRadius:'10px', boxShadow:'0 10px 20px rgba(0,0,0,0.1)'}} />
           ) : (
             <div style={{background:'#E30613', color:'white', display:'inline-block', padding:'12px 25px', borderRadius:'15px', fontWeight:'900', fontSize:'2.2rem', boxShadow:'0 10px 20px rgba(227, 6, 19, 0.4)'}}>5</div>
           )}
           <h3 style={{color:'white', marginTop:'20px', fontSize:'0.85rem', letterSpacing:'2px', opacity: 0.8, textTransform:'uppercase'}}>CRM Concejal</h3>
        </div>
        
        <nav style={{display:'flex', flexDirection:'column', gap:'10px', padding:'0 20px'}}>
          <h4 style={{color: '#64748b', fontSize: '0.75rem', margin: '10px 0 5px 10px', letterSpacing: '1px'}}>📍 PRINCIPAL</h4>
          <button style={btnStyle(true)}>📊 DASHBOARD</button>
          
          {perfil.rol === 'admin' && (
            <>
              <button onClick={() => setMostrarModalTiempos(true)} style={btnStyle(false)}>⏱️ TIEMPOS (SLA)</button>
              <button onClick={()=>setMostrarModalLogros(true)} style={btnStyle(false)}>📢 LOGROS PÚBLICOS</button>

              <h4 style={{color: '#64748b', fontSize: '0.75rem', margin: '25px 0 5px 10px', letterSpacing: '1px'}}>⚙️ AJUSTES DEL PORTAL</h4>
              <button onClick={() => setMostrarModalSeguridad(true)} style={btnStyle(false)}>🔐 Cód. Seguridad</button>
              <button onClick={() => setMostrarModalCategorias(true)} style={btnStyle(false)}>📂 Cat. Solicitudes</button>
              <button onClick={() => setMostrarModalTextos(true)} style={btnStyle(false)}>🖥️ Identidad y Textos</button>
              <button onClick={() => setMostrarModalBio(true)} style={btnStyle(false)}>👤 Biografía Concejal</button>
            </>
          )}
        </nav>
        
        <div style={{marginTop:'auto', padding:'30px 20px'}}>
           <button onClick={()=>{supabase.auth.signOut(); navigate('/login')}} style={{color:'#f87171', background:'rgba(248, 113, 113, 0.1)', border:'none', padding:'12px', borderRadius:'10px', width:'100%', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>🚪 Cerrar Sesión</button>
        </div>
      </aside>

      <main className="admin-main">
        {/* BOTÓN HAMBURGUESA (Solo visible en móvil) */}
        <button className="btn-hamburguesa" onClick={() => setMenuAbierto(true)}>
          ☰ Menú Administrador
        </button>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px'}}>
          <div><h1 style={{margin:0, color:'#0f172a', fontSize:'1.8rem'}}>Panel de Control</h1><p style={{margin:'5px 0 0 0', color:'#64748b'}}>{perfil.rol === 'admin' ? 'Resumen en tiempo real.' : 'Tus casos asignados.'}</p></div>
          {perfil.rol === 'admin' && (
            <div onClick={() => setFiltroEstado('ABIERTO')} style={{background: 'white', padding: '10px 20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0'}} title="Ver casos nuevos">
              <div style={{position: 'relative'}}>
                <span style={{fontSize: '1.8rem'}}>🔔</span>
                {casos.filter(c => esCasoNuevo(c.estado)).length > 0 && ( <span style={{position: 'absolute', top: '-5px', right: '-5px', background: '#E30613', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.7rem', fontWeight: 'bold', border: '2px solid white'}}>{casos.filter(c => esCasoNuevo(c.estado)).length}</span> )}
              </div>
              <div style={{display: 'flex', flexDirection: 'column'}}><span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold'}}>Casos Nuevos</span><span style={{fontSize: '1.1rem', color: '#0f172a', fontWeight: '900'}}>{casos.filter(c => esCasoNuevo(c.estado)).length} Sin Asignar</span></div>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <StatCard label={perfil.rol === 'admin' ? "Peticiones Totales" : "Mis Casos Totales"} val={casos.length} col="#3b82f6" />
          <StatCard label="En Gestión" val={casos.filter(c=> c.estado && c.estado.toLowerCase() === 'en gestión').length} col="#f59e0b" />
          <StatCard label="Casos Cerrados" val={casos.filter(c=> c.estado && c.estado.toLowerCase() === 'solucionado').length} col="#10b981" />
        </div>

        <div className="table-module">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}><h2 style={{margin:0, fontSize:'1.2rem', color:'#0f172a'}}>Gestión de Casos</h2><div style={{fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold'}}>Mostrando {casosFiltrados.length} resultados</div></div>
          
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
            <input type="text" className="search-bar" placeholder="🔍 Buscar ciudadano..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{flex: '1 1 200px'}} />
            <select value={filtroSLA} onChange={e=>setFiltroSLA(e.target.value)} className="search-bar" style={{flex: '1 1 150px'}}><option value="">⏱️ Todos los Tiempos</option><option value="fila-vencida">🔴 Vencidos</option><option value="fila-alerta">🟡 Por Vencer</option><option value="atiempo">🟢 A Tiempo</option></select>
            <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)} className="search-bar" style={{flex: '1 1 150px'}}><option value="">📌 Todos los Estados</option>{perfil.rol === 'admin' && <option value="ABIERTO">⏳ Abiertos</option>}<option value="Escalado">⚙️ Escalados</option><option value="En Gestión">⚙️ En Gestión</option><option value="Solucionado">✅ Solucionados</option></select>
            {perfil.rol === 'admin' && ( <select value={filtroResponsable} onChange={e=>setFiltroResponsable(e.target.value)} className="search-bar" style={{flex: '1 1 160px'}}><option value="">👤 Responsables</option><option value="SIN_ASIGNAR">⚠️ Sin Asignar</option>{colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select> )}
            <select value={filtroAsunto} onChange={e=>setFiltroAsunto(e.target.value)} className="search-bar" style={{flex: '1 1 150px'}}><option value="">📁 Asuntos</option>{tiposSolicitud.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}</select>
            {(busqueda || filtroAsunto || filtroEstado || filtroResponsable || filtroSLA) && ( <button onClick={() => { setBusqueda(''); setFiltroAsunto(''); setFiltroEstado(''); setFiltroResponsable(''); setFiltroSLA(''); }} style={{background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>✖ Limpiar</button> )}
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th># Radicado</th>
                <th>Ciudadano</th>
                <th className="ocultar-movil">Asunto</th>
                <th>Estado</th>
                {perfil.rol === 'admin' && <th className="ocultar-movil">Responsable</th>}
                <th className="ocultar-movil">Vencimiento</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {casosFiltrados.map(c => (
                <tr key={c.id} className={calcularColorEstado(c.fecha_limite, c.estado)}>
                  <td><strong style={{color: '#0f172a', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px'}}>#{c.id}</strong></td>
                  <td><b>{c.ciudadano_nombre}</b></td>
                  
                  <td className="ocultar-movil">
                    <span style={{fontWeight: 'bold', display: 'block'}}>{c.tipos_solicitud?.nombre}</span>
                    <span style={{fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase'}}>{c.subcategoria || 'General'}</span>
                  </td>
                  
                  <td><span style={badgeStyle(c.estado)}>{c.estado || 'ABIERTO'}</span></td>
                  
                  {perfil.rol === 'admin' && ( <td className="ocultar-movil">{colaboradores.find(col => col.id === c.colaborador_id)?.nombre || <span style={{color:'#94a3b8', fontStyle:'italic'}}>Sin asignar</span>}</td> )}
                  
                  <td className="ocultar-movil">{c.fecha_limite ? new Date(c.fecha_limite).toLocaleDateString() : 'Sin fecha'}</td>
                  
                  <td><button className="btn-gestionar-pro" onClick={() => { setCasoSeleccionado(c); setColaboradorAsignado(c.colaborador_id || ''); setRespuestaActual(''); setArchivoRespuesta(null); setMenuAbierto(false); }}>Gestionar</button></td>
                </tr>
              ))}
              {casosFiltrados.length === 0 && (<tr><td colSpan={perfil.rol === 'admin' ? "7" : "6"} style={{textAlign:'center', color:'#94a3b8', padding:'3rem', fontSize: '1.1rem'}}>No se encontraron radicados. 🧐</td></tr>)}
            </tbody>
          </table>
        </div>
      </main>

      {/* =======================================================================
         MODALES DE CONFIGURACIÓN
         ======================================================================= */}
      {mostrarModalTextos && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto'}}>
            <button onClick={()=>setMostrarModalTextos(false)} style={closeBtnStyle}>✕</button>
            <h2 style={modalTitleStyle}>🖥️ Identidad, Textos y Redes</h2>
            <p style={modalDescStyle}>Edita el logo, los fondos y la información pública.</p>
            <form onSubmit={guardarConfigTextos} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#003366'}}>1. Identidad Principal (Logo y Barra)</h4>
                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>Logo Superior (NavBar):</label>
                <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'15px', marginTop:'5px'}}>
                   <input type="file" onChange={e=>setArchivoLogo(e.target.files[0])} style={{flex: 1, fontSize:'0.85rem'}}/>
                   {confTextos.logoUrlActual && !archivoLogo && ( <div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={confTextos.logoUrlActual} style={{height: '30px', borderRadius:'5px'}} /><span style={{fontSize: '0.7rem', color: '#10b981'}}>✓ Logo activo</span></div> )}
                </div>
                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>Texto al lado del Logo:</label>
                <input type="text" value={confTextos.navbarTexto} onChange={e => setConfTextos({...confTextos, navbarTexto: e.target.value})} placeholder="Ej. CONCEJAL #5 Mosquera" style={{...inStyle, marginTop:'5px'}} required />
              </div>

              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#003366'}}>2. Pantalla Principal (Hero)</h4>
                
                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>Fondo Inmersivo (Opcional):</label>
                <p style={{fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 10px 0'}}>Sube una imagen. Se le aplicará un filtro azul oscuro encima para que el texto resalte siempre.</p>
                <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'15px'}}>
                   <input type="file" onChange={e=>setArchivoHeroFondo(e.target.files[0])} style={{flex: 1, fontSize:'0.85rem'}}/>
                   {confTextos.heroFondoActual && !archivoHeroFondo && ( <div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={confTextos.heroFondoActual} style={{width: '60px', height: '40px', objectFit:'cover', borderRadius:'5px'}} /><span style={{fontSize: '0.7rem', color: '#10b981'}}>✓ Fondo activo</span></div> )}
                </div>

                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>Título Principal:</label>
                <input type="text" value={confTextos.tituloHero} onChange={e => setConfTextos({...confTextos, tituloHero: e.target.value})} placeholder="Ej. EL CAMBIO SIGUE" style={{...inStyle, marginBottom: '10px'}} required />
                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>Descripción Corta:</label>
                <textarea value={confTextos.descHero} onChange={e => setConfTextos({...confTextos, descHero: e.target.value})} placeholder="Descripción debajo..." style={{...inStyle, height: '60px', resize: 'none'}} required />
              </div>

              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}><h4 style={{margin: '0 0 15px 0', color: '#003366'}}>3. Sección Formulario de PQRSF</h4><input type="text" value={confTextos.tituloForm} onChange={e => setConfTextos({...confTextos, tituloForm: e.target.value})} placeholder="Ej. VENTANILLA CIUDADANA" style={{...inStyle, marginBottom: '10px'}} required /><textarea value={confTextos.descForm} onChange={e => setConfTextos({...confTextos, descForm: e.target.value})} placeholder="Texto que invita a la gente..." style={{...inStyle, height: '80px', resize: 'none'}} required /></div>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}><h4 style={{margin: '0 0 15px 0', color: '#003366'}}>4. Sección de Logros y Gestión</h4><input type="text" value={confTextos.tituloNoticias} onChange={e => setConfTextos({...confTextos, tituloNoticias: e.target.value})} placeholder="Ej. GESTIÓN EN TERRITORIO" style={{...inStyle, marginBottom: '10px'}} required /><textarea value={confTextos.descNoticias} onChange={e => setConfTextos({...confTextos, descNoticias: e.target.value})} placeholder="Texto explicativo..." style={{...inStyle, height: '80px', resize: 'none'}} required /></div>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}><h4 style={{margin: '0 0 15px 0', color: '#003366'}}>5. Textos de Redes Sociales</h4><input type="text" value={confTextos.tituloRedes} onChange={e => setConfTextos({...confTextos, tituloRedes: e.target.value})} placeholder="Ej. 📱 ¡Conéctate!" style={{...inStyle, marginBottom: '10px'}} required /><textarea value={confTextos.descRedes} onChange={e => setConfTextos({...confTextos, descRedes: e.target.value})} placeholder="Texto para invitar..." style={{...inStyle, height: '80px', resize: 'none'}} required /></div>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}><h4 style={{margin: '0 0 15px 0', color: '#003366'}}>6. Enlaces de Redes Sociales</h4><p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '-10px', marginBottom: '15px'}}>Pega el link completo. Si dejas un espacio en blanco, ese botón no aparecerá.</p><div style={{display: 'grid', gap: '15px'}}><div><label style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#1877F2', display: 'flex', alignItems: 'center', gap: '5px'}}>📘 Facebook URL</label><input type="url" value={confTextos.urlFacebook} onChange={e => setConfTextos({...confTextos, urlFacebook: e.target.value})} placeholder="https://facebook.com/tu_pagina" style={{...inStyle, marginTop: '5px'}} /></div><div><label style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#E1306C', display: 'flex', alignItems: 'center', gap: '5px'}}>📸 Instagram URL</label><input type="url" value={confTextos.urlInstagram} onChange={e => setConfTextos({...confTextos, urlInstagram: e.target.value})} placeholder="https://instagram.com/tu_perfil" style={{...inStyle, marginTop: '5px'}} /></div><div><label style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'center', gap: '5px'}}>🎵 TikTok URL</label><input type="url" value={confTextos.urlTiktok} onChange={e => setConfTextos({...confTextos, urlTiktok: e.target.value})} placeholder="https://tiktok.com/@tu_usuario" style={{...inStyle, marginTop: '5px'}} /></div></div></div>
              
              <button type="submit" disabled={subiendo} style={submitBtnStyle}>{subiendo ? 'Guardando...' : '💾 Guardar Cambios'}</button>
            </form>
          </div>
        </div>
      )}

      {mostrarModalCategorias && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '700px'}}>
            <button onClick={()=>setMostrarModalCategorias(false)} style={closeBtnStyle}>✕</button>
            <h2 style={modalTitleStyle}>📂 Configurar Categorías</h2>
            <p style={modalDescStyle}>Agrega o elimina los tipos de solicitud. ¡Al agregar aquí, se conectan directo con los tiempos SLA!</p>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 10px 0', color: '#0f172a'}}>Tipos Principales (PQRSF / SLA)</h4>
                <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px'}}>
                  {tiposSolicitud.map((item) => ( 
                    <span key={item.id} style={{background: '#e0e7ff', color: '#1d4ed8', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      {item.nombre} 
                      <button onClick={() => eliminarTipoSolicitud(item.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontWeight:'bold'}}>✕</button>
                    </span> 
                  ))}
                </div>
                <div style={{display: 'flex', gap: '5px'}}>
                  <input type="text" value={nuevoTipoNombre} onChange={e => setNuevoTipoNombre(e.target.value)} placeholder="Nueva solicitud..." style={{...inStyle, padding: '8px'}} />
                  <button onClick={agregarTipoSolicitud} disabled={subiendo} style={{background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', fontWeight:'bold'}}>+</button>
                </div>
              </div>

              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 10px 0', color: '#0f172a'}}>Subcategorías (Temas)</h4>
                <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px', maxHeight: '150px', overflowY: 'auto'}}>
                  {confListas.subcat.map((item, idx) => ( 
                    <span key={idx} style={{background: '#fce7f3', color: '#b91c1c', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
                      {item} <button onClick={() => setConfListas({...confListas, subcat: confListas.subcat.filter((_, i) => i !== idx)})} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontWeight:'bold'}}>✕</button>
                    </span> 
                  ))}
                </div>
                <div style={{display: 'flex', gap: '5px'}}>
                  <input type="text" value={confListas.nuevaSubcat} onChange={e => setConfListas({...confListas, nuevaSubcat: e.target.value})} placeholder="Nueva subcat..." style={{...inStyle, padding: '8px'}} />
                  <button onClick={() => { if(confListas.nuevaSubcat) setConfListas({...confListas, subcat: [...confListas.subcat, confListas.nuevaSubcat], nuevaSubcat: ''}) }} style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', fontWeight:'bold'}}>+</button>
                </div>
                <button onClick={guardarConfigSubcategorias} disabled={subiendo} style={{width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>💾 Guardar Subcategorías</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalBio && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto'}}>
            <button onClick={()=>setMostrarModalBio(false)} style={closeBtnStyle}>✕</button>
            <h2 style={modalTitleStyle}>👤 Biografía del Concejal</h2>
            <p style={modalDescStyle}>Cuenta la historia de Carlos Andrés Pabón al estilo Silicon Valley.</p>
            <form onSubmit={guardarConfigBio} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#003366'}}>1. Título y Perfil</h4>
                <label style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px'}}>Etiqueta Roja (ej. PERFIL TERRITORIAL)</label>
                <input type="text" value={confBio.label} onChange={e => setConfBio({...confBio, label: e.target.value})} placeholder="Ej. PERFIL TERRITORIAL" style={{...inStyle, marginBottom: '15px'}} required />
                <label style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px'}}>Título Gigante</label>
                <input type="text" value={confBio.titulo} onChange={e => setConfBio({...confBio, titulo: e.target.value})} placeholder="Ej. Conoce a Carlos Andrés Pabón" style={{...inStyle, marginBottom: '15px'}} required />
                <label style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px'}}>Biografía Completa</label>
                <textarea value={confBio.descripcion} onChange={e => setConfBio({...confBio, descripcion: e.target.value})} placeholder="Escribe aquí toda la historia..." style={{...inStyle, height: '150px', resize: 'vertical'}} required />
              </div>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#003366'}}>2. Video Multimedia (Opcional)</h4>
                <input type="url" value={confBio.videoUrl} onChange={e => setConfBio({...confBio, videoUrl: e.target.value})} placeholder="Link de YouTube o Instagram..." style={inStyle} />
              </div>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#003366'}}>3. Galería Fotográfica</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                  <div style={{background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #cbd5e1'}}>
                    <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>📸 FOTO PRINCIPAL:</label>
                    <input type="file" onChange={e=>setArchivoBio1(e.target.files[0])} style={{marginTop:'10px', fontSize:'0.8rem', width:'100%'}}/>
                    {confBio.foto1Actual && !archivoBio1 && ( <div style={{marginTop: '10px', display:'flex', alignItems:'center', gap:'10px'}}><img src={confBio.foto1Actual} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius:'8px'}} /><span style={{fontSize: '0.7rem', color: '#10b981'}}>✓ Foto asignada</span></div> )}
                  </div>
                  <div style={{background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #cbd5e1'}}>
                    <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#64748b'}}>📸 FOTO SECUNDARIA:</label>
                    <input type="file" onChange={e=>setArchivoBio2(e.target.files[0])} style={{marginTop:'10px', fontSize:'0.8rem', width:'100%'}}/>
                    {confBio.foto2Actual && !archivoBio2 && ( <div style={{marginTop: '10px', display:'flex', alignItems:'center', gap:'10px'}}><img src={confBio.foto2Actual} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius:'8px'}} /><span style={{fontSize: '0.7rem', color: '#10b981'}}>✓ Foto asignada</span></div> )}
                  </div>
                </div>
                {/* --- SECCIÓN PARA MODIFICAR LA FRASE DE CIERRE --- */}
                <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginTop: '20px'}}>
                    <h4 style={{margin: '0 0 15px 0', color: '#003366'}}>4. Texto de Cierre (Footer)</h4>
                    <label style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px'}}>Frase al final de la Biografía:</label>
                    <input 
                      type="text" 
                      value={confBio.fraseFinal} 
                      onChange={e => setConfBio({...confBio, fraseFinal: e.target.value})} 
                      placeholder="Ej. HECHOS PARA EL CAMBIO - CONCEJAL #5" 
                      style={inStyle} 
                    />
                 </div>
                <div style={{marginTop: '20px'}}>
                  <label style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px'}}>Descripción para Foto Secundaria (Opcional)</label>
                  <textarea value={confBio.foto2Descripcion} onChange={e => setConfBio({...confBio, foto2Descripcion: e.target.value})} placeholder="Escribe un pie de foto o descripción corta..." style={{...inStyle, height: '80px', resize: 'vertical'}} />
                </div>
              </div>
              <button type="submit" disabled={subiendo} style={submitBtnStyle}>{subiendo ? 'Guardando...' : '💾 Publicar Biografía'}</button>
            </form>
          </div>
        </div>
      )}

      {mostrarModalSeguridad && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '500px'}}>
            <button onClick={()=>setMostrarModalSeguridad(false)} style={closeBtnStyle}>✕</button>
            <h2 style={modalTitleStyle}>🔐 Seguridad del Sistema</h2>
            <p style={modalDescStyle}>Controla cómo se registran los nuevos asesores.</p>
            <form onSubmit={guardarConfigSeguridad}>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px'}}><label style={{fontWeight: 'bold', color: '#0f172a'}}>¿Exigir código secreto al registrarse?</label><label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}><input type="checkbox" checked={confSeguridad.requiere} onChange={(e) => setConfSeguridad({...confSeguridad, requiere: e.target.checked})} style={{width: '20px', height: '20px'}} /><span style={{marginLeft: '10px', color: confSeguridad.requiere ? '#10b981' : '#94a3b8', fontWeight: 'bold'}}>{confSeguridad.requiere ? 'PRENDIDO' : 'APAGADO'}</span></label></div>
                {confSeguridad.requiere && (<div><label style={{fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b'}}>Código Actual:</label><input type="text" value={confSeguridad.codigo} onChange={(e) => setConfSeguridad({...confSeguridad, codigo: e.target.value})} placeholder="Ej. Secreto123" required style={inStyle} /></div>)}
              </div>
              <button type="submit" disabled={subiendo} style={submitBtnStyle}>{subiendo ? 'Guardando...' : '💾 Guardar Cambios'}</button>
            </form>
          </div>
        </div>
      )}

      {mostrarModalTiempos && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '800px'}}>
            <button onClick={()=>setMostrarModalTiempos(false)} style={closeBtnStyle}>✕</button>
            <h2 style={modalTitleStyle}>⏱️ Tiempos de Respuesta (SLA)</h2>
            <p style={modalDescStyle}>Define los días calendario para resolver cada solicitud.</p>
            <div style={{padding:'10px', overflowY:'auto', flexGrow: 1}}>
              <table className="admin-table" style={{background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                <thead style={{background:'#f1f5f9'}}><tr><th style={{padding:'15px 20px'}}>Tipo de Solicitud</th><th style={{padding:'15px 20px', textAlign:'center'}}>Días para Responder</th><th style={{padding:'15px 20px', textAlign:'right'}}>Acción</th></tr></thead>
                <tbody>
                  {tiposSolicitud.map(tipo => (
                    <tr key={tipo.id}>
                      <td style={{padding:'15px 20px'}}><b>{tipo.nombre}</b></td>
                      <td style={{padding:'15px 20px', textAlign:'center'}}><input type="number" defaultValue={tipo.dias_respuesta || 5} id={`dias_${tipo.id}`} style={{width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center'}} /> días</td>
                      <td style={{padding:'15px 20px', textAlign:'right'}}><button className="btn-gestionar-pro" style={{background: '#10b981', color: 'white'}} onClick={() => actualizarDiasSLA(tipo.id, document.getElementById(`dias_${tipo.id}`).value)}>💾 Guardar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mostrarModalLogros && (
        <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '1000px'}}>
            <button onClick={()=>setMostrarModalLogros(false)} style={closeBtnStyle}>✕</button>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <div><h2 style={modalTitleStyle}>📢 Gestor de Logros Públicos</h2><p style={modalDescStyle}>Controla qué noticias ve la ciudadanía.</p></div>
              <button onClick={abrirParaCrear} style={{background:'#E30613', color:'white', padding:'10px 20px', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(227,6,19,0.3)'}}>+ Nueva Publicación</button>
            </div>
            <div style={{padding:'10px', overflowY:'auto', flexGrow: 1}}>
              <table className="admin-table" style={{background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}>
                <thead style={{background:'#f1f5f9'}}><tr><th style={{padding:'15px 20px'}}>Título de la Gestión</th><th style={{padding:'15px 20px', textAlign:'center'}}>Estado (Visible)</th><th style={{padding:'15px 20px', textAlign:'right'}}>Acciones</th></tr></thead>
                <tbody>
                  {noticiasListado.map(n => (
                    <tr key={n.id}>
                      <td style={{padding:'15px 20px'}}><b>{n.titulo}</b></td>
                      <td style={{padding:'15px 20px', textAlign:'center'}}><button onClick={()=>toggleVisibilidad(n)} style={{ background: n.visible ? '#dcfce7' : '#f1f5f9', color: n.visible ? '#166534' : '#64748b', border: n.visible ? '1px solid #bbf7d0' : '1px solid #cbd5e1', padding:'6px 16px', borderRadius:'20px', fontWeight:'bold', cursor:'pointer', fontSize:'0.8rem', transition:'0.3s' }}>{n.visible ? '🟢 PUBLICADO' : '⚪ OCULTO'}</button></td>
                      <td style={{padding:'15px 20px', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button onClick={()=>abrirParaEditar(n)} style={{background:'#fef3c7', color:'#92400e', border:'none', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem'}}>✏️ Editar</button><button onClick={()=>eliminarNoticia(n)} style={{background:'#fee2e2', color:'#991b1b', border:'none', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'0.85rem'}}>🗑️ Borrar</button></td>
                    </tr>
                  ))}
                  {noticiasListado.length === 0 && ( <tr><td colSpan="3" style={{textAlign:'center', padding:'3rem', color:'#94a3b8'}}>No hay logros publicados aún.</td></tr> )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mostrarModalFormNoticia && (
        <div style={{...overlayStyle, zIndex: 2000}}>
          <div style={{...modalStyle, maxWidth: '650px'}}>
            <button onClick={()=>setMostrarModalFormNoticia(false)} style={closeBtnStyle}>✕</button>
            <h2 style={modalTitleStyle}>{idEdicion ? '✏️ Editar Logro' : '📢 Publicar Nuevo Logro'}</h2>
            <form onSubmit={guardarNoticia} style={{display:'flex', flexDirection:'column', gap:'18px', marginTop:'25px'}}>
              <input type="text" placeholder="Título de la obra o gestión" value={titulo} onChange={e=>setTitulo(e.target.value)} required style={inStyle} />
              <textarea placeholder="Describe el impacto..." value={descripcion} onChange={e=>setDescripcion(e.target.value)} required style={{...inStyle, height:'120px'}} />
              <input type="text" placeholder="Link YouTube/Insta Reel (Opcional)" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} style={inStyle} />
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'15px', border:'1px solid #e2e8f0'}}><label style={{fontSize:'0.75rem', fontWeight:'bold', color:'#64748b'}}>📸 FOTO ANTES:</label><input type="file" onChange={e=>setArchivoAntes(e.target.files[0])} style={{marginTop:'10px', fontSize:'0.8rem', width:'100%'}}/></div>
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'15px', border:'1px solid #e2e8f0'}}><label style={{fontSize:'0.75rem', fontWeight:'bold', color:'#64748b'}}>📸 FOTO DESPUÉS:</label><input type="file" onChange={e=>setArchivoDespues(e.target.files[0])} style={{marginTop:'10px', fontSize:'0.8rem', width:'100%'}}/></div>
              </div>
              <button type="submit" disabled={subiendo} style={submitBtnStyle}>{subiendo ? '⏳ SUBIENDO...' : idEdicion ? 'GUARDAR CAMBIOS' : 'PUBLICAR log'}</button>
            </form>
          </div>
        </div>
      )}

      {casoSeleccionado && (
         <div style={overlayStyle}>
          <div style={{...modalStyle, maxWidth: '750px'}}>
            <button onClick={()=>setCasoSeleccionado(null)} style={closeBtnStyle}>✕</button>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px', paddingRight: '60px'}}>
              <h3 style={{margin:0, color:'#003366', fontSize:'1.5rem'}}>Radicado #{casoSeleccionado.id}</h3>
              <span style={badgeStyle(casoSeleccionado.estado)}>{casoSeleccionado.estado || 'ABIERTO'}</span>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              {/* FILA 1: Datos del ciudadano */}
              <div><p style={subTitleStyle}>Ciudadano</p><p style={{margin: 0, fontWeight: 'bold'}}>{casoSeleccionado.ciudadano_nombre}</p></div>
              <div><p style={subTitleStyle}>Contacto</p><p style={{margin: 0, fontWeight: 'bold'}}>{casoSeleccionado.ciudadano_telefono} | {casoSeleccionado.ciudadano_correo}</p></div>
              
              {/* FILA 2 (NUEVA): Contexto de la solicitud */}
              <div><p style={subTitleStyle}>Tipo de Solicitud</p><p style={{margin: 0, fontWeight: 'bold'}}>{casoSeleccionado.tipos_solicitud?.nombre}</p></div>
              <div>
                <p style={subTitleStyle}>Categoría / Tema</p>
                <p style={{margin: 0, fontWeight: '900', color: '#E30613', textTransform: 'uppercase'}}>{casoSeleccionado.subcategoria || 'No especificada'}</p>
              </div>

              {/* FILA 3: El problema detallado */}
              <div style={{gridColumn: '1 / -1'}}><p style={subTitleStyle}>Descripción del Caso</p><div style={{background: '#f8fafc', padding: '15px', borderRadius: '10px', fontSize: '0.95rem', color: '#334155'}}>{casoSeleccionado.descripcion_caso || 'Sin descripción.'}</div></div>
            </div>

            <div style={{marginTop: '25px', marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#0f172a'}}>💬 Historial de Gestión</h4>
              
              <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', minHeight: '100px', maxHeight: '250px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#334155', marginBottom: '15px', lineHeight: '1.5' }}>
                {casoSeleccionado.respuesta_gestion ? formatearTextoChat(casoSeleccionado.respuesta_gestion) : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Aún no hay notas...</span>}
              </div>
              
              {/* Barra de Chat Responsiva */}
              <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
                
                <input type="text" placeholder="Escribe una nota o solución..." value={respuestaActual} onChange={e => setRespuestaActual(e.target.value)} style={{flex: '1 1 200px', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem'}} />
                
                <div style={{display: 'flex', gap: '10px', flex: '1 0 auto', justifyContent: 'flex-end'}}>
                  <label style={{ cursor: 'pointer', background: archivoRespuesta ? '#dcfce7' : '#f1f5f9', padding: '10px 15px', borderRadius: '10px', border: archivoRespuesta ? '1px solid #86efac' : '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }} title="Adjuntar documento o foto">
                     <span style={{ fontSize: '1.2rem' }}>📎</span>
                     <input type="file" style={{ display: 'none' }} onChange={e => setArchivoRespuesta(e.target.files[0])} />
                  </label>
                  
                  <button onClick={() => agregarNotaAlHistorial(casoSeleccionado.id)} disabled={subiendo || (!respuestaActual.trim() && !archivoRespuesta)} style={{background: '#00A6FB', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', opacity: ((!respuestaActual.trim() && !archivoRespuesta) || subiendo) ? 0.6 : 1}}>➕ Guardar</button>
                </div>
              </div>
              {archivoRespuesta && <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '8px', fontWeight: 'bold', paddingLeft: '5px' }}>✓ Archivo listo: {archivoRespuesta.name}</div>}

            </div>

            <div style={{background: '#f1f5f9', padding: '25px', borderRadius: '15px'}}>
              <h4 style={{margin: '0 0 15px 0', color: '#0f172a'}}>{perfil.rol === 'admin' ? '⚙️ Acciones de Gestión' : '⚙️ Acciones de Gestión'}</h4>
              
              {casoSeleccionado.estado?.toLowerCase() !== 'solucionado' ? (
                <>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap'}}>
                    {/* Botón para poner En Gestión */}
                    <button 
                      onClick={async () => {
                        setSubiendo(true);
                        const { error } = await supabase.from('casos').update({ estado: 'En Gestión' }).eq('id', casoSeleccionado.id);
                        if (!error) { mostrarExito("Estado: En Gestión ⚙️"); cargarTodo(); setCasoSeleccionado(null); }
                        setSubiendo(false);
                      }}
                      style={{flex: 1, background: '#f59e0b', color: 'white', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', minWidth: '150px'}}
                    >
                      ⚙️ Empezar Gestión
                    </button>

                    {perfil.rol === 'admin' && (
                      <div style={{display: 'flex', gap: '10px', flex: 2, minWidth: '250px'}}>
                        <select value={colaboradorAsignado} onChange={e => setColaboradorAsignado(e.target.value)} style={{flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', background: 'white'}}>
                          <option value="">Seleccione asesor...</option>
                          {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <button onClick={() => asignarCaso(casoSeleccionado.id)} style={{background: '#003366', color: 'white', padding: '14px 25px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}>Escalar</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => solucionarCaso(casoSeleccionado.id)} style={{width: '100%', background: '#10b981', color: 'white', padding: '16px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem', marginTop: '10px'}}>✅ Marcar Solucionado</button>
                </>
              ) : (
                perfil.rol === 'admin' && (
                  <button 
                    onClick={async () => {
                      setSubiendo(true);
                      const { error } = await supabase.from('casos').update({ estado: 'En Gestión' }).eq('id', casoSeleccionado.id);
                      if (!error) { mostrarExito("Radicado Reabierto 🔓"); cargarTodo(); setCasoSeleccionado(null); }
                      setSubiendo(false);
                    }} 
                    style={{width: '100%', background: '#64748b', color: 'white', padding: '16px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem', marginTop: '10px'}}
                  >
                    🔓 Reabrir para Ajustes
                  </button>
                )
              )}
            </div>
          </div>
         </div>
      )}
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' };
const modalStyle = { background: 'white', width: '100%', borderRadius: '24px', padding: '40px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' };
const closeBtnStyle = {position: 'absolute', top: '20px', right: '25px', border: 'none', background: '#f1f5f9', width: '40px', height: '40px',  borderRadius: '50%',  display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', zIndex: 10, transition: '0.3s'};
const modalTitleStyle = { margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.8rem' };
const modalDescStyle = { margin: '0 0 25px 0', color: '#64748b', fontSize: '0.95rem' };
const subTitleStyle = { margin: '5px 0', fontSize: '0.85rem', color: '#64748b' };
const submitBtnStyle = { width: '100%', padding: '16px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' };

const btnStyle = (act) => ({
  textAlign:'left', padding:'12px 18px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:'700', transition:'0.2s', fontSize:'0.85rem', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:'12px',
  background: act ? 'rgba(255,255,255,0.1)' : 'transparent', color: act ? '#ffffff' : '#94a3b8', borderLeft: act ? '4px solid #E30613' : '4px solid transparent',
});

const badgeStyle = (est) => {
  const estReal = est ? est.toLowerCase().trim() : 'abierto';
  let bg = '#fee2e2'; let text = '#991b1b';
  if (estReal === 'solucionado') { bg = '#dcfce7'; text = '#166534'; }
  else if (estReal === 'escalado') { bg = '#fef3c7'; text = '#92400e'; }
  else if (estReal === 'en gestión') { bg = '#fff7ed'; text = '#ea580c'; }
  return { padding:'6px 14px', borderRadius:'30px', fontSize:'0.7rem', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.5px', background: bg, color: text };
};

const inStyle = { width:'100%', padding:'14px 20px', borderRadius:'14px', border:'1px solid #e2e8f0', fontSize:'1rem', outline:'none', boxSizing:'border-box', backgroundColor: '#fcfcfc', transition: '0.3s' };

function StatCard({label, val, col}) { return ( <div style={{background:'white', padding:'1.5rem', borderRadius:'16px', borderTop:`5px solid ${col}`, boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}><p style={{margin:0, fontSize:'0.8rem', color:'#64748b', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px'}}>{label}</p><h2 style={{margin:'10px 0 0 0', color:'#0f172a', fontSize:'2.5rem', fontWeight:'800'}}>{val}</h2></div> ); }