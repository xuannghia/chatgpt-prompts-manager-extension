export function animationFrame(fn: () => void, interval: number) {
  // Set Interval using requestAnimationFrame
  let start = Date.now()
  let id: number
  function loop() {
    id = requestAnimationFrame(loop)
    if (Date.now() - start >= interval) {
      fn()
      start = Date.now()
    }
  }
  loop()
  return () => cancelAnimationFrame(id)
}
