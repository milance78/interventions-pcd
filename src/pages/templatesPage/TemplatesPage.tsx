import * as React from "react";
import "./TemplatesPage.scss";

type KBPage = { page: number; title: string; content: string; images?: string[]; section?: string };
const normalize = (s: string) => s.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const initials = import.meta.glob("../../assets/illuminated-initials/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const kbArtwork = import.meta.glob("../../assets/**/*.{png,jpg,jpeg,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const initialFor = (text: string) => initials[Object.keys(initials).find((key) => key.endsWith(`/${(text.trim()[0] || "A").toUpperCase()}.png`)) || ""];
const defaultArtwork = Object.entries(kbArtwork).find(([key]) => /pcd[-_ ]?kb/i.test(key) && !/manuscript/i.test(key))?.[1];
const stripMetadata = (text: string) => text
  .replace(/^\s*[^\n]+\n\s*(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),[^\n]+|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[^\n]+)\n\s*/i, "")
  .replace(/\n\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),[^\n]+$/i, "")
  .replace(/\s+Page\s+\d+\s*$/i, "")
  .trim();

export default function TemplatesPage() {
  const [pages, setPages] = React.useState<KBPage[]>([]);
  const [selected, setSelected] = React.useState(-1);
  const [open, setOpen] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}pcd-kb-pages.json`)
      .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(setPages)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Erreur de chargement"));
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, KBPage[]>();
    pages.forEach((page) => { const section = page.section || "Autres"; if (!map.has(section)) map.set(section, []); map.get(section)!.push(page); });
    return [...map.entries()];
  }, [pages]);
  const filtered = React.useMemo(() => pages.map((page, index) => ({ page, index })).filter(({ page }) => !query || normalize(`${page.title} ${page.content}`).includes(normalize(query))), [pages, query]);
  const current = selected >= 0 ? pages[selected] : undefined;
  const base = import.meta.env.BASE_URL;

  return <div className="kb-page">
    <main className="kb-content">
      {error ? <div className="kb-error">Impossible de charger la KB : {error}</div> : current ? <>
        <div className="kb-breadcrumb">KB / {current.section || "Autres"} / {current.title} / page {current.page}</div>
        <h1>{current.title}</h1>
        <div className="kb-body">
          {stripMetadata(current.content).split(/\n{2,}/).filter(Boolean).map((part, index) => {
            const initial = index === 0 ? initialFor(part) : undefined;
            return <div key={index} className={index === 0 ? "kb-paragraph kb-first-paragraph" : "kb-paragraph"}>
              {initial ? <><img className="kb-initial" src={initial} alt="" aria-hidden="true" /><span className="kb-first-text">{part.slice(1)}</span></> : part}
            </div>;
          })}
        </div>
        {!!current.images?.length && <div className="kb-page-images">{current.images.map((image, index) => <figure className="kb-page-image" key={image}><img src={`${base}${image}`} alt={`Illustration ${index + 1} de la page ${current.page}`} /><figcaption>Illustration {index + 1} — page {current.page}</figcaption></figure>)}</div>}
      </> : pages.length === 0 ? <div className="kb-empty">Chargement du contenu KB…</div> : <div className="kb-welcome">{defaultArtwork && <img src={defaultArtwork} alt="PCD-KB" />}<h1>PCD – Knowledge Base</h1><p>Choisissez une section et une page dans le manuscrit à droite.</p></div>}
    </main>
    <aside className="kb-sidebar">
      <div className="kb-brand">KB</div>
      {defaultArtwork && <img className="kb-default-artwork" src={defaultArtwork} alt="PCD-KB" />}
      <input className="kb-search" placeholder="Rechercher dans la KB…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="kb-nav">
        {query ? filtered.map(({ page, index }) => <button key={index} className={index === selected ? "kb-item active" : "kb-item"} onClick={() => setSelected(index)}>{page.title}<small>p. {page.page}</small></button>) : groups.map(([name, group]) => <div className="kb-group" key={name}>
          <button className="kb-group-title" onClick={() => setOpen(open === name ? null : name)}><span>⚜ {name}</span><span>{open === name ? "−" : "+"}</span></button>
          {open === name && group.map((page) => { const index = pages.indexOf(page); return <button key={index} className={index === selected ? "kb-item active" : "kb-item"} onClick={() => setSelected(index)}><span>⚜ {page.title}</span><small>p. {page.page}</small></button>; })}
        </div>)}
      </div>
    </aside>
  </div>;
}
