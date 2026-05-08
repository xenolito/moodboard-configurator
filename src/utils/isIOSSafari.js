const isIOSSafari = () =>
    /iP(ad|hone|od)/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent) &&
    !/(CriOS|FxiOS|OPiOS|mercury)/.test(navigator.userAgent)

export default isIOSSafari
