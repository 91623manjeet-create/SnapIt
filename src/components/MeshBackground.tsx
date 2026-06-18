export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 mesh-gradient" aria-hidden="true">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-snap-rose/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-snap-lavender/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-snap-peach/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>
    </div>
  )
}
