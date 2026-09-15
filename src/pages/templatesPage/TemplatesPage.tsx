import * as React from "react";
import "./TemplatesPage.scss";

type KBPage = { page: number; title: string; content: string; images?: string[]; section?: string };
const normalize = (s: string) => s.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const initials = import.meta.glob("../../assets/illuminated-initials/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const kbArtwork = import.meta.glob("../../assets/**/*.{png,jpg,jpeg,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const initialFor = (text: string) => initials[Object.keys(initials).find((key) => key.endsWith(`/${(text.trim()[0] || "A").toUpperCase()}.png`)) || ""];
const defaultArtwork = Object.entries(kbArtwork).find(([key]) => /pcd[-_ ]?kb/i.test(key) && !/manuscript/i.test(key))?.[1];
const replaceBullets = (text: string) => text.replace(/^[•·▪●○◦]\s*/gm, "⚜ ");
const stripMetadata = (text: string) => text.replace(/^\s*[^\n]+\n\s*(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),[^\n]+|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[^\n]+)\n\s*/i, "").replace(/\n\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),[^\n]+$/i, "").replace(/\s+Page\s+\d+\s*$/i, "").trim();

export default function TemplatesPage() {
  const [pages, setPages] = React.useState<KBPage[]>([]);
  const [selected, setSelected] = React.useState(-1);
  const [open, setOpen] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState<KBPage | null>(null);
  const [draft, setDraft] = React.useState<KBPage>({ page: 0, title: "", content: "", section: "Autres", images: [] });
  const [newImage, setNewImage] = React.useState("");
  const [sectionEditor, setSectionEditor] = React.useState<{ oldName?: string; name: string } | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("pcd-kb-pages");
    if (saved) { try { setPages(JSON.parse(saved)); return; } catch { localStorage.removeItem("pcd-kb-pages"); } }
    fetch(`${import.meta.env.BASE_URL}pcd-kb-pages.json`).then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }).then(setPages).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Erreur de chargement"));
  }, []);

  const groups = React.useMemo(() => {
    const map = new Map<string, KBPage[]>();
    pages.forEach((page) => { const section = page.section || "Autres"; if (!map.has(section)) map.set(section, []); map.get(section)!.push(page); });
    return [...map.entries()];
  }, [pages]);
  const filtered = React.useMemo(() => pages.map((page, index) => ({ page, index })).filter(({ page }) => !query || normalize(`${page.title} ${page.content} ${page.section || ""}`).includes(normalize(query))), [pages, query]);
  const current = selected >= 0 ? pages[selected] : undefined;
  const base = import.meta.env.BASE_URL;
  const persist = (next: KBPage[]) => { setPages(next); localStorage.setItem("pcd-kb-pages", JSON.stringify(next)); };
  const startNew = (section = "Autres") => { setDraft({ page: pages.length ? Math.max(...pages.map((p) => p.page)) + 1 : 1, title: "", content: "", section, images: [] }); setNewImage(""); setEditing({ page: 0, title: "", content: "" }); };
  const startEdit = (page: KBPage) => { setDraft({ ...page, images: [...(page.images || [])] }); setNewImage(""); setEditing(page); };
  const saveDraft = () => { if (!draft.title.trim()) return; const clean = { ...draft, title: draft.title.trim(), section: draft.section?.trim() || "Autres", images: (draft.images || []).filter(Boolean) }; const next = editing?.page === 0 ? [...pages, clean] : pages.map((p) => p.page === editing?.page ? clean : p); persist(next); setSelected(next.findIndex((p) => p.page === clean.page)); setEditing(null); };
  const removePage = (page: KBPage) => { if (window.confirm(`Supprimer « ${page.title} » ?`)) { persist(pages.filter((p) => p.page !== page.page)); setSelected(-1); } };
  const addImage = () => { const value = newImage.trim(); if (!value) return; setDraft((old) => ({ ...old, images: [...(old.images || []), value] })); setNewImage(""); };
  const removeImage = (index: number) => setDraft((old) => ({ ...old, images: (old.images || []).filter((_, i) => i !== index) }));
  const saveSection = () => { const name = sectionEditor?.name.trim(); if (!name) return; const oldName = sectionEditor.oldName; const next = pages.map((p) => oldName ? ({ ...p, section: (p.section || "Autres") === oldName ? name : p.section }) : p); persist(next); setSectionEditor(null); setOpen(name); };
  const removeSection = (name: string) => { if (!window.confirm(`Supprimer la section « ${name} » et toutes ses pages ?`)) return; persist(pages.filter((p) => (p.section || "Autres") !== name)); setSelected(-1); setOpen(null); };

  return <div className="kb-page">
    <main className={current ? "kb-content" : "kb-content kb-content--welcome"}><div className="kb-manuscript-viewport">
      {error ? <div className="kb-error">Impossible de charger la KB : {error}</div> : current ? <>
        <div className="kb-breadcrumb">KB / {current.section || "Autres"} / {current.title} / page {current.page}</div>
        <div className="kb-crud kb-page-actions"><button onClick={() => startEdit(current)}>Modifier</button><button onClick={() => removePage(current)}>Supprimer</button></div>
        <h1>{current.title}</h1><div className="kb-body">{replaceBullets(stripMetadata(current.content)).split(/\n{2,}/).filter(Boolean).map((part, index) => { const initial = index === 0 ? initialFor(part) : undefined; return <div key={index} className={index === 0 ? "kb-paragraph kb-first-paragraph" : "kb-paragraph"}>{initial ? <><img className="kb-initial" src={initial} alt="" aria-hidden="true" /><span className="kb-first-text">{part.slice(1)}</span></> : part}</div>; })}</div>
        {!!current.images?.length && <div className="kb-page-images">{current.images.map((image, index) => <figure className="kb-page-image" key={`${image}-${index}`}><img src={`${base}${image}`} alt={`Illustration ${index + 1} de la page ${current.page}`} /><figcaption>Illustration {index + 1} — page {current.page}</figcaption></figure>)}</div>}
      </> : pages.length === 0 ? <div className="kb-empty">Chargement du contenu KB…</div> : <div className="kb-welcome">{defaultArtwork && <img src={defaultArtwork} alt="PCD-KB" />}</div>}
    </div></main>

    {editing && <div className="kb-editor-backdrop"><div className="kb-editor"><h2>{editing.page === 0 ? "Nouvelle page" : "Modifier la page"}</h2><label>Titre<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>Section<input value={draft.section || ""} onChange={(e) => setDraft({ ...draft, section: e.target.value })} /></label><label>Contenu<textarea rows={12} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label><div className="kb-editor-images"><strong>Images</strong>{(draft.images || []).map((image, index) => <div className="kb-image-row" key={`${image}-${index}`}><span>{image}</span><button onClick={() => removeImage(index)}>Supprimer</button></div>)}<div className="kb-add-image"><input placeholder="Chemin image, ex. kb-images/page-001-img-1.png" value={newImage} onChange={(e) => setNewImage(e.target.value)} /><button onClick={addImage}>+ Image</button></div></div><div className="kb-editor-buttons"><button onClick={saveDraft}>Enregistrer</button><button onClick={() => setEditing(null)}>Annuler</button></div></div></div>}
    {sectionEditor && <div className="kb-editor-backdrop"><div className="kb-editor kb-section-editor"><h2>{sectionEditor.oldName ? "Modifier la section" : "Nouvelle section"}</h2><label>Nom de la section<input autoFocus value={sectionEditor.name} onChange={(e) => setSectionEditor({ ...sectionEditor, name: e.target.value })} /></label><div className="kb-editor-buttons"><button onClick={saveSection}>Enregistrer</button><button onClick={() => setSectionEditor(null)}>Annuler</button></div></div></div>}

    <aside className="kb-sidebar"><div className="kb-brand">KB</div><div className="kb-crud kb-sidebar-actions"><button onClick={() => startNew()}>+ Nouvelle page</button><button onClick={() => setSectionEditor({ name: "" })}>+ Section</button><button disabled={!current} onClick={() => current && startEdit(current)}>Modifier page</button><button disabled={!current} onClick={() => current && removePage(current)}>Supprimer page</button></div><img className="kb-default-artwork" src={defaultArtwork} alt="PCD-KB" /><input className="kb-search" placeholder="Rechercher dans la KB…" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="kb-nav">
      {query ? filtered.map(({ page, index }) => <button key={index} className={index === selected ? "kb-item active" : "kb-item"} onClick={() => setSelected(index)}>{page.title}<small>p. {page.page}</small></button>) : groups.map(([name, group]) => <div className="kb-group" key={name}><div className="kb-group-heading"><button className="kb-group-title" onClick={() => setOpen(open === name ? null : name)}><span>⚜ {name}</span><span>{open === name ? "−" : "+"}</span></button><span className="kb-section-actions"><button title="Modifier la section" onClick={() => setSectionEditor({ oldName: name, name })}>✎</button><button title="Supprimer la section" onClick={() => removeSection(name)}>×</button></span></div>{open === name && group.map((page) => { const index = pages.indexOf(page); return <button key={index} className={index === selected ? "kb-item active" : "kb-item"} onClick={() => setSelected(index)}><span>⚜ {page.title}</span><small>p. {page.page}</small></button>; })}</div>)}
    </div></aside>
  </div>;
}
