# OBJETIVO
Crear un guided tour para explicar al usuario el interfaz de la app y lo que puede hacer.


# DEFINICIÓN
Vamos a añadir, como opción via atributo de #ambient_viewer "data-ambient-tour" o como param "tour" de tipo boolean en el config.json la funcionalidad de un tour rápido del interfaz de la aplicación y su funcionamiento.

Si el tour está activado, vamos a guardar en el localStorage la información de si el usuario ya lo ha visto o lo ha cerrado/cancelado para no volver a mostrárselo en esos casos.

# Stack
Para la implementación del tour, utilizaremos la librería de react-joyride (https://github.com/gilbarbara/react-joyride)
Obtén toda la información de la documentación oficial si lo necesitas.

Consideraciones generales de estilo, diseño y funcionalidad:
 - Queremos destacar los elementos indicados en el tour oscureciendo el resto de la página (ver documentación de la librería)
 - Las cajas de texto/información que sean de color oscuro con texto blanco (como dark mode)
 - El usuario debe poder abandonar fácilmente el tour, sin ningún tipo de confirmación o saltarse/ir al siguiente paso fácilmente. La información textual de cada elemento ui o funcionalidad debe ser lo más escueta y mínima posible.

Contenido del tour y secuencia:

1- Mensaje de bienvenida y incitar al primer paso.
2 - Paso 1: Info sobre clicar en la zona al mismo tiempo que llamamos al autoHint de la zona para que se muestre visualmente (en el caso de que haya varias zonas, lanzar el autohint secuencial que ya tenemos)
3 - Si estamos en un ambiente de una sola zona, el panel ya estará visible, por lo que el siguente paso es mostar el panel con la información de seleccionar modelo y color. Si estamos en un ambiente de varias zonas, tenemos que mostrar el panel con la selección de la primera zona antes. Al ir al siguiente paso en el caso de varias zonas, debemos volver a ocultar el panel para dejarlo como estaría inicialmente sino hubier tour.
4 - Mostramos el botón de comparar y lanzamos el modo comparar, para que el usuario vea cómo funciona. Indicación de que puede/debe arrastrar el handler...
5 - Mostramos el botón de "descargar" con la info para descargarse su selección, incluso en modo compare...
6 - Mostramos el botón de "inforamción" con la inforamción de que puede ver en cualquier momento el modelo y color actuales seleccionados.

7 - Mostramos el botón de "volver" con la información de que puede cambiar de ambiente o elegir otros ambientes.


Pregunta todo lo que necesites.
Haz 2 pasasdas de plan.

