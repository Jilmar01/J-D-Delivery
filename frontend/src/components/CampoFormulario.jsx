
const estiloCampo =
  'w-full rounded-xl border border-zinc-700 bg-[#09090B] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

function CampoFormulario({ id, etiqueta, children, ...propsInput }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-200"
      >
        {etiqueta}
      </label>

      {children ? (
        children
      ) : (
        <input id={id} className={estiloCampo} {...propsInput} />
      )}
    </div>
  )
}

export { estiloCampo }
export default CampoFormulario
