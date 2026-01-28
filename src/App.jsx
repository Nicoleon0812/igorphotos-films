import { useState, useEffect } from 'react'
import { FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import { supabase } from './supabase'
import './App.css'

// 👇 IMPORTANTE: Revisa que el nombre de tu logo sea correcto
import logoNuevo from './beth_igor.jpeg' 

// Importaciones del Carrusel
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function App() {
  const [categoriasAgrupadas, setCategoriasAgrupadas] = useState([])
  const [cargando, setCargando] = useState(true)
  
  // 1. EL ESTADO DEL LIGHTBOX (Memoria de qué foto estamos viendo)
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null)

  useEffect(() => {
    fetchYAgruparFotos()
  }, [])

  async function fetchYAgruparFotos() {
    try {
      setCargando(true);
      const nuevosGrupos = [];

      const { data: listaRaiz, error: errorRaiz } = await supabase
        .storage
        .from('portafolio')
        .list('', { sortBy: { column: 'name', order: 'asc' } })

      if (errorRaiz) throw errorRaiz;

      for (const item of listaRaiz) {
        if (item.name.startsWith('.')) continue;

        const { data: fotosCarpeta, error: errorCarpeta } = await supabase
          .storage
          .from('portafolio')
          .list(item.name, { limit: 15, sortBy: { column: 'created_at', order: 'desc' } });

        if (errorCarpeta) continue;

        const fotosValidas = fotosCarpeta.filter(f => f.name !== '.emptyFolderPlaceholder');

        if (fotosValidas.length > 0) {
          const fotosProcesadas = fotosValidas.map(archivo => {
            const ruta = `${item.name}/${archivo.name}`;
            const { data } = supabase.storage.from('portafolio').getPublicUrl(ruta);
            
            let urlOptimizada = data.publicUrl;
            if (urlOptimizada.includes('/object/public/')) {
               urlOptimizada = urlOptimizada.replace('/object/public/', '/render/image/public/');
               urlOptimizada += '?height=1000&quality=85&resize=contain';
            }

            return {
              id: archivo.id || archivo.name,
              url: urlOptimizada,
              // nombreLimpio: archivo.name.split('.')[0] // Ya no lo usamos para mostrar, pero lo dejo por si acaso
            };
          });

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

  if (cargando) {
    return <div style={{color: '#800020', textAlign: 'center', fontSize:'2.5rem', display:'flex', justifyContent:'center', alignItems:'center', height: '100vh', width:'100%', backgroundColor: '#FFFCF7'}}>Cargando portafolio...</div>
  }

  return (
    <div className="App">
      
      <header className="hero-banner">
        <img src={logoNuevo} alt="Beth Igor Fotografías Logo" className="hero-logo-img" />
        <p className="eslogan">Capturando la esencia de cada momento</p>
        <div className="redes-sociales">
          <a href="https://www.instagram.com/bethigor.fotografias?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="icono-social"><FaInstagram /></a>
          <a href="https://wa.me/56932994417" target="_blank" rel="noopener noreferrer" className="icono-social"><FaWhatsapp /></a>
        </div>
      </header>

      <main>
        {categoriasAgrupadas.length === 0 ? (
          <p style={{textAlign: 'center', color: 'var(--color-principal)'}}>
            No se encontraron fotos en Supabase.
          </p>
        ) : (
          categoriasAgrupadas.map((grupo) => (
            <section key={grupo.category} className="seccion-categoria">
              <h2>{grupo.category}</h2>
              
              <Swiper
                modules={[Navigation, Pagination, A11y]}
                spaceBetween={20}
                slidesPerView={1.2}
                navigation
                pagination={{ clickable: true }}
                loop={true}
                breakpoints={{
                  320: { slidesPerView: 1.2, spaceBetween: 10 },
                  640: { slidesPerView: 2.2, spaceBetween: 20 },
                  1024: { slidesPerView: 3, spaceBetween: 30 },
                  1300: { slidesPerView: 4, spaceBetween: 30 },
                  1600: { slidesPerView: 6, spaceBetween: 30 },
                  1900: { slidesPerView: 6, spaceBetween: 40 }
                }}
                className="mi-carrusel"
              >
                {grupo.photos.map((foto) => (
                  <SwiperSlide key={foto.id}>
                    <div className="foto-card">
                      {/* 2. EL GATILLO: Al hacer click, guardamos la foto en el estado */}
                      <img 
                        src={foto.url} 
                        alt="Fotografía Portafolio" 
                        className="foto-img"
                        loading="lazy" 
                        onClick={() => setFotoSeleccionada(foto)} 
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          ))
        )}
      </main>

      <footer>
        <p>© 2026 Beth Igor Fotografías</p>
      </footer>

      {/* 3. EL VISOR (LIGHTBOX): Se muestra solo si hay una foto seleccionada */}
      {fotoSeleccionada && (
        <div className="lightbox-overlay" onClick={() => setFotoSeleccionada(null)}>
          <span className="btn-cerrar">&times;</span>
          <img 
            src={fotoSeleccionada.url} 
            alt="Vista completa" 
            className="lightbox-imagen"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

    </div>
  )
}

export default App