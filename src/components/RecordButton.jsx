function RecordButton({ onClick, label = 'きろく する！' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ink-line blob-a sticker-shadow bg-cheek w-full py-4 text-2xl font-black transition active:translate-x-[3px] active:translate-y-[4px] active:shadow-none"
    >
      {label}
    </button>
  )
}

export default RecordButton
