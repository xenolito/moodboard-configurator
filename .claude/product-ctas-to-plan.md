# OBJETIVOS
Queremos añadir las siguientes call to actions para el contenido de las modal de "información". Siempre todo click en un botón cta de esta modal de los que se describirán a continuación, debe provocar el cierre de la modal de información.

## CTA de "Solicita presupuesto"
- Un botón "Solicita presupuesto": para cada descripción de producto, dentro de .info-modal-zone. Debe tener el siguiente DOM template:
  ```
  <div class="wp-block-buttons is-layout-flex wp-block-buttons-is-layout-flex"><div class="wp-block-button arrow" data-modalform_input_name="producto" data-modalform_input_data="Información sobre <product id> en color <variant name> desde el ambiente <ambient>" data-modalform_target="lead"><a class="wp-block-button__link wp-element-button" href="#modal-lead">Solicita presupuesto<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><polyline points="144 56 216 128 144 200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></polyline></svg></a></div></div>
  ```
  Donde:
  data-modalform_input_data --> <product id> es id del producto,<variant name> es el nombre del color variant seleccionado,  <ambient> es el nombre del ambiente actual.


- Un link <a href> con el texto "Consulta otras medidas disponibles". El link debe ir a una url configurable en el config.json para cada modelo. Con un param "productFamilyURL", será una url relativa: si el string es "adoquines", la url debe empezar por "/", sin http ni https --> <a href="/adoquines">. Irá colocado en el dom también dentro de .info-modal-zone, para cada producto. Para empezar, popula en todos los productos este param con el string inicial de "/productos/". El link que tenga target="_blank".

Pregunta todo lo que necesites.