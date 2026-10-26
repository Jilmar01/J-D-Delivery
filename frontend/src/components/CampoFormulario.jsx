
const estiloCampo =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'

function CampoFormulario({
  id,
  etiqueta,
  children,
  icono,
  controlDerecho,
  ...propsInput
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {etiqueta}
      </label>

      {children ? (
        children
      ) : (
        <div className="relative">
          {icono && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              {icono}
            </span>
          )}
          <input
            id={id}
            className={`${estiloCampo} ${icono ? 'pl-11' : ''} ${
              controlDerecho ? 'pr-12' : ''
            }`}
            {...propsInput}
          />
          {controlDerecho && (
            <span className="absolute inset-y-0 right-3 flex items-center">
              {controlDerecho}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export { estiloCampo }
export default CampoFormulario
