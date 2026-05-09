# Instrucciones para Claude

## Verificación de errores con Playwright

Después de añadir cualquier nueva funcionalidad o realizar cualquier cambio en el código, verificar siempre con el MCP de Playwright:

1. **Errores de consola**: Navegar a `http://localhost:5173`, comprobar los mensajes de consola de nivel `error` y corregir cualquier error encontrado.
2. **Verificación visual**: Tomar un screenshot con `browser_take_screenshot` y revisar que no hay problemas visuales evidentes.

Ambas verificaciones son obligatorias antes de dar la tarea por completada. Limpiar el directorio `.playwright-mcp/` con `rm -rf .playwright-mcp` al terminar.

## Documentación

Siempre que se añada una nueva funcionalidad o una variación relevante en una funcionalidad existente (nuevas propiedades de config.json, nuevos comportamientos, nuevos modos, cambios en la lógica de materiales, etc.), actualiza `README.md` para reflejar el cambio. La documentación debe ir en la sección correspondiente o crear una nueva sección si no existe.
