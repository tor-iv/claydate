export default function Notice({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <div className={`notice mb-4 ${error ? "notice-error" : "notice-ok"}`} role={error ? "alert" : "status"}>
      {error ?? notice}
    </div>
  );
}
