/** Loom share URL → embed iframe */
export function LoomEmbed({ url, title }: { url: string; title: string }) {
  const embed = url.includes("/embed/")
    ? url
    : url.replace("https://www.loom.com/share/", "https://www.loom.com/embed/");

  if (!url.includes("loom.com")) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl ring-1 ring-slate-200">
      <iframe
        src={embed}
        title={title}
        allowFullScreen
        className="aspect-video w-full border-0"
      />
    </div>
  );
}
