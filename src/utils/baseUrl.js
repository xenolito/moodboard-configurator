/**
 * Returns the base URL for loading 3D visualizer assets.
 * In standalone mode (dev server): '/'
 * In WordPress plugin mode: injected via wp_localize_script as window.pd3dConfig.baseUrl
 */
export const getBaseUrl = () => window.pd3dConfig?.baseUrl ?? '/'
