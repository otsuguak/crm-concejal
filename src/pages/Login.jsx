import { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom'; // Nuestro "taxista" para cambiar de página

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Solo se usa al registrarse
  const [esRegistro, setEsRegistro] = useState(false); // Para cambiar entre Entrar o Registrarse
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate(); // Inicializamos el taxista

  async function manejarAcceso(evento) {
    evento.preventDefault();
    setCargando(true);

    if (esRegistro) {
      // --- RUTA 1: REGISTRAR UN NUEVO COLABORADOR ---
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: password,
      });

      if (error) {
        alert("Error al registrar: " + error.message);
      } else if (data.user) {
        // Si se crea en Supabase, lo anotamos en nuestra tabla de perfiles con rol "colaborador" por defecto
        await supabase.from('perfiles').insert([
          { id: data.user.id, correo: correo, nombre: nombre, rol: 'asesor' }
        ]);
        alert("¡Registro exitoso! Pídele al Administrador que te asigne tareas.");
        setEsRegistro(false); // Lo devolvemos a la pantalla de iniciar sesión
      }

    } else {
      // --- RUTA 2: INICIAR SESIÓN ---
      const { error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: password,
      });

      if (error) {
        alert("Correo o contraseña incorrectos.");
      } else {
        // ¡La llave funcionó! Lo mandamos a la oficina privada
        navigate('/admin');
      }
    }
    setCargando(false);
  }

  return (
    <div style={{ padding: '50px 20px', fontFamily: 'Arial', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ backgroundColor: '#f4f4f4', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', color: 'black' }}>
        
        <h2>{esRegistro ? '👤 Nuevo Colaborador' : '🔐 Iniciar Sesión'}</h2>
        <p>{esRegistro ? 'Crea tu cuenta para el CRM' : 'Ingresa a la Torre de Control'}</p>

        <form onSubmit={manejarAcceso} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          
          {/* El campo Nombre solo aparece si se están registrando */}
          {esRegistro && (
            <input type="text" placeholder="Tu Nombre Completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          )}

          <input type="email" placeholder="Correo Electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
          
          <input type="password" placeholder="Contraseña (mínimo 6 letras/números)" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />

          <button type="submit" disabled={cargando} style={{ padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            {cargando ? '⏳ Cargando...' : (esRegistro ? 'Registrarme' : 'Entrar al CRM')}
          </button>
        </form>

        {/* Botón para cambiar entre Iniciar Sesión y Registrarse */}
        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          {esRegistro ? '¿Ya tienes cuenta?' : '¿Eres nuevo en el equipo?'}
          <button 
            onClick={() => setEsRegistro(!esRegistro)} 
            style={{ background: 'none', border: 'none', color: '#007BFF', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
          >
            {esRegistro ? 'Inicia Sesión aquí' : 'Regístrate aquí'}
          </button>
        </p>

      </div>
    </div>
  );
}