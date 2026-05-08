const isTouch = () => {
    return !!('ontouchstart' in window)
}
export default isTouch