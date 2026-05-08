Vamos a crear una app en React para poseriormente integrarla como un contenido de un WordPress

#OBJETIVO
Vamos a desarrollar una app cuya funcionalidad será:
- Tenemos una imagen de un abmiente exterior en el que vamos a poder seleecionar ciertas áreas clicables (la definición de las áreas clicables lo implementaremos con una imagen del mismo tamaño a modo de máscara: color negro -> zona clicable, color blanco --> no clicable )
- Al seleccionar un área, aparecerá un contenedor con las opciones disponibles.
- Al finalizar la selección de opciones disponibles, descargaremos una nueva imagen de ambiente y la mostraremos sobre la anterior, manteniendo la máscara. La idea es ir cambiando las piezas de pavimento (baldosas, adoquines, etc) o bloques de muros, por las seleccionadas, que ya tendremos renderizadas en imágenes. Dando la sensación que se cambia el pavimento.
- Una vez cargada una nueva imagen (es decir, hemos seleccionada un nuevo producto), tendremos un icono para visualizar el antes/después con un slider vertical. Por eso queremos mantener la anterior.
- También habrá un icono UI para poder descargar la imagen configurada con nuestra selección.

#DEFINICIÓN DE LA APP
- La app se renderizará en un HTMLElement de tipo DIV, que acepatará attributos. Estos atributos los usaremos para la configuración inicial de la app. Algunos atributos imprescindibles:
  - id: Identificador del ambiente seleccionado. Tendremos varios ambientes diferentes a elegir.
- Ambientes: Habrá 6 ambientes diferentes a elegir:
  - Adoquines
  - Baldosas 1
  - Baldosas 2
  - Bloques 1
  - Bloques 2
  - Baldosa técnica

- Configuraciones disponibles para cada ambiente (Selectores UI): En cada ambiente, podremos elegir/seleccionar
  - Modelo: diferentes modelos de piezas
  - Color: Cada modelo, tendrá unos colores disponibles
- Información de las opciones disponibles para cada ambiente: La información de las opciones disponibles para cada ambiente, así como sus assets (imágenes de fondo del selector, e imagen final a cargar) deberá cargarse a partir de un archivo .json. Sugiere la forma de generarlo y estructurarlo. Tenemos unos archivos json disponibles con la información del modelo/pieza y sus colores disponibles. Pídeme un ejemplo de su estructura por si podemos usarlo.
- El UI con los selectores de modelo y color, queremos que sea visual: Botones con un label indicando el color y con una imagen de fondo con su textura. Pregúntame de dónde obtenemos las texturas.
- Debemos priorizar el rendimiento, ya que será una app con mucho tráfico de archivos de imágenes. La app debe ser responsive y funcionar de forma óptima en dispositivos móviles que dispongan de poca potencia.
- Como vamos a integrarlo en un WordPress, queremos crear un plugin que podemos llamar pct-ambientes-moodboards donde podemos alojar todos los archivos y assets necesarios de la app.
- Ya tenenmos todas las imágenes de los ambientes con cada pieza+color generados. Proponme una nomenclatura para estos assets, que sea funcional y facil de mantener.
- CSS: Cualquier css que generes, debe ser vanilla css, no puedes utilizar tailwind, y siempre con la norma más actual con css anidado. No utilices BEM para nombrar clases, utiliza un guion medio simple '-' si lo necesitas.


#REFERENCIAS
- https://pavimarsa.es/configurador-de-ambientes/ (PREFERIDO)
- https://spaces.porcelanosa.com/space/terraza-hotel/


PREGUNTA TODO LO QUE NECESITES y lo que veas que esté sin definir
