import { useState, useEffect } from 'react'
import { FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import { supabase } from './supabase'
import './App.css'

function App() {
  // Ahora el estado guardará "grupos" de categorías, no fotos sueltas
  // Estructura: [{ category: "Bodas", photos: [...] }, { category: "Urbano", photos: [...] }]
  const [categoriasAgrupadas, setCategoriasAgrupadas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchYAgruparFotos()
  }, [])

  // ... dentro de App.jsx

  async function fetchYAgruparFotos() {
    try {
      setCargando(true);
      const nuevosGrupos = [];

      // 1. Preguntamos a Supabase qué carpetas hay en la raíz
      // Ahora que arreglaste el RLS, esto SÍ funcionará.
      const { data: listaRaiz, error: errorRaiz } = await supabase
        .storage
        .from('portafolio')
        .list('', { sortBy: { column: 'name', order: 'asc' } })

      if (errorRaiz) throw errorRaiz;

      // 2. Recorremos lo que encontró (sea lo que sea)
      for (const item of listaRaiz) {
        
        // Ignoramos archivos sueltos o de sistema
        if (item.name.startsWith('.')) continue;

        // Entramos a investigar dentro de la carpeta
        const { data: fotosCarpeta, error: errorCarpeta } = await supabase
          .storage
          .from('portafolio')
          .list(item.name, { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });

        if (errorCarpeta) continue;

        // Filtramos solo imágenes reales
        const fotosValidas = fotosCarpeta.filter(f => f.name !== '.emptyFolderPlaceholder');

        if (fotosValidas.length > 0) {
          // Preparamos las fotos de esta categoría
          const fotosProcesadas = fotosValidas.map(archivo => {
            const ruta = `${item.name}/${archivo.name}`;
            const { data } = supabase.storage.from('portafolio').getPublicUrl(ruta);
            
            return {
              id: archivo.id || archivo.name,
              url: data.publicUrl,
              nombreLimpio: archivo.name.split('.')[0]
            };
          });

          // Agregamos el grupo detectado
          nuevosGrupos.push({
            category: item.name.charAt(0).toUpperCase() + item.name.slice(1),
            photos: fotosProcesadas
          });
        }
      }

      setCategoriasAgrupadas(nuevosGrupos);

    } catch (error) {
      console.error("Error cargando portafolio:", error.message)
    } finally {
      setCargando(false)
    }
  }
  return (
    <div className="contenedor-principal">
      
      {/* HEADER */}
      <header className="perfil">
        {/* Tip: ¡Cambia este src por la foto real de Ely en Supabase! */}
        <img src="D:\nleon\Desktop\ruta_fullstack\portafolio-ely\src\photosandfilms.jpg" alt="Ely" className="foto-perfil" />
        <h1>Igor Photos & Films</h1>
        <p className="subtitulo">Capturando la esencia de cada momento</p>
        <div className="redes-sociales">
          <a href="https://www.instagram.com/igorphotosandfilms?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="btn-social"><FaInstagram /></a>
          <a href="#" className="btn-social"><FaWhatsapp /></a>
          <a href="mailto:hola@test.com" className="btn-social"><FaEnvelope /></a>
        </div>
      </header>

      {/* --- SECCIONES TIPO BANNER --- */}
      <main className="contenido-portafolio">
        {cargando && <p style={{textAlign: 'center'}}>Cargando...</p>}

        {!cargando && categoriasAgrupadas.length === 0 && (
           <p style={{textAlign: 'center', opacity: 0.7}}>
             No se encontraron fotos organizadas en carpetas en Supabase.
           </p>
        )}

        {/* Aquí iteramos sobre las CATEGORÍAS */}
        {categoriasAgrupadas.map((grupo) => (
          <section key={grupo.category} className="seccion-categoria">
            
            {/* El Título del "Banner" */}
            <h2 className="titulo-categoria">{grupo.category}</h2>
            
            {/* La grilla de fotos de ESTA categoría */}
            <div className="galeria">
              {grupo.photos.map((foto) => (
                <div key={foto.id} className="item-galeria">
                  <img src={foto.url} alt={foto.nombreLimpio} loading="lazy" />
                  <div className="overlay">
                    <span>{foto.nombreLimpio}</span> 
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer><p>© 2026 igorphotosandfilms</p></footer>
    </div>
  )
}

export default App