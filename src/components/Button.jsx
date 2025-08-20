export default function Button({ children, type = "primary", onClick, disabled }) {
  const base = "px-4 py-2 rounded font-semibold transition-colors";
  const styles =
    type === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100";

  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
