function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-4 shadow-2xl ${toast.type === "error" ? "bg-red-500/95 text-white" : "bg-emerald-500/95 text-black"}`}>
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
}

export default Toast;
