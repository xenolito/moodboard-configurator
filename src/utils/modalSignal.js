const subscribers = new Set()

export const notifyModalOpen = () => subscribers.forEach(cb => cb(true))
export const notifyModalClose = () => subscribers.forEach(cb => cb(false))
export const subscribeModal = (cb) => {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}
