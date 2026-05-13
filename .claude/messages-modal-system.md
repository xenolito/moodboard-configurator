# OBJETIVO
Crear la funcionalidad de mostrar modales con diferentes mensajes (que se autocierren o no).

# IMPLEMENTACIÓN
Evaluar 2 opciones para implementación. Sugerir la más senicalla, confiable y fácil de mantener.

- Opción A: Utilizando la nueva API de <dialog> con el método de js .showModal()
- Opción B: En el WorPress donde vamos a mostrar esta app, ya tenemos una librería js que se encarga de mostrar modales y que usamos para cosas como mostrar mensajes de validación de formularios, auqnue no utiliza la nueva api. El módulo js se llama ModalWP.js

# APLICACIÓN
- Para empezar vamos a utilizarlo para lo siguiente:
Añadir un botón en el UI, dentro de .ui-actions, junto a "descargar imagen", con un icono de "i" (información). Este botón lanzará nuestra una modal donde se mostrará la información del modelo y variant seleccionado que muestra actualmente el render. Además del nombre del modelo y el tipo de variant seleccionado, podremos mostrar un apartado con más información adicional, como puedes ser 'otras medidas disponibles', etc. Esta info adicional la obtendremos de un nuevo param en el config.json del modelo que llamaremos "description" y será texto que pueda tener etiquetas html para renderizar, sanitizando para que sea seguro, ojo.

- En modo compare, vamos a mostrar la información de "antes" y "después"
- En ambientes con varias zonas (como baldosa técnica), vamos a mostar la información del modelo y variants utilizados en cada una de las zonas.

Pregunta todo lo que necesites.