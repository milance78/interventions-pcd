import * as React from "react";
import "./KnowledgeBasePage.scss";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";

type KBImage = { id: string; src: string; width?: number };
type KBPage = { page: number; title: string; content: string; images?: string[]; section?: string; html?: string; embeddedImages?: KBImage[] };
const STORE = "pcd-kb-crud-v1";
const normalize = (s: string) => s.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const initials = import.meta.glob("../../assets/illuminated-initials/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const kbArtwork = import.meta.glob("../../assets/**/*.{png,jpg,jpeg,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const manuscript = Object.entries(kbArtwork).find(([key]) => /kb-manuscript-clean/i.test(key))?.[1];
const defaultArtwork = Object.entries(kbArtwork).find(([key]) => /pcd[-_ ]?kb/i.test(key) && !/manuscript/i.test(key))?.[1];
const initialFor = (text: string) => initials[Object.keys(initials).find((key) => key.endsWith(`/${(text.trim()[0] || "A").toUpperCase()}.png`)) || ""];
const replaceBullets = (text: string) => text.replace(/^[•·▪●○◦]\s*/gm, "⚜ ");
const stripMetadata = (text: string) => text.replace(/^\s*[^\n]+\n\s*(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),[^\n]+|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[^\n]+)\n\s*/i, "").replace(/\n\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),[^\n]+$/i, "").replace(/\s+Page\s+\d+\s*$/i, "").trim();

const ADMIN_EMAILS = (import.meta.env.VITE_KB_ADMIN_EMAILS || "").split(",").map((v: string) => v.trim().toLowerCase()).filter(Boolean);
const isAdminUser = () => {
  const user = auth.currentUser;
  const email = user?.email?.toLowerCase() || "";
  return Boolean(user && (ADMIN_EMAILS.includes(email) || user.displayName === "milance78" || email.startsWith("milance78@")));
};

export default function KnowledgeBasePage() {
  const [pages, setPages] = React.useState<KBPage[]>([]);
  const [selected, setSelected] = React.useState(-1);
  const [open, setOpen] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [admin, setAdmin] = React.useState(isAdminUser());
  const editorRef = React.useRef<HTMLDivElement>(null);
  const base = import.meta.env.BASE_URL;

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => setAdmin(Boolean(user && (ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") || user.displayName === "milance78" || user.email?.toLowerCase().startsWith("milance78@")))));
    const fallback = () => {
      const saved = localStorage.getItem(STORE);
      if (saved) { try { setPages(JSON.parse(saved)); return; } catch { /* fallback */ } }
      fetch(`${base}pcd-kb-pages.json`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(setPages).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Erreur de chargement"));
    };
    const reference = doc(db, "knowledgeBase", "main");
    const unsubscribe = onSnapshot(reference, (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data().pages)) setPages(snapshot.data().pages as KBPage[]);
      else fallback();
    }, () => fallback());
    return () => { unsubscribe(); unsubscribeAuth(); };
  }, [base]);

  React.useEffect(() => { if (pages.length) localStorage.setItem(STORE, JSON.stringify(pages)); }, [pages]);
  const groups = React.useMemo(() => { const map = new Map<string, KBPage[]>(); pages.forEach((p) => { const s = p.section || "Autres"; if (!map.has(s)) map.set(s, []); map.get(s)!.push(p); }); return [...map.entries()]; }, [pages]);
  const filtered = React.useMemo(() => pages.map((page, index) => ({ page, index })).filter(({ page }) => !query || normalize(`${page.title} ${page.content} ${page.section || ""}`).includes(normalize(query))), [pages, query]);
  const current = selected >= 0 ? pages[selected] : undefined;

  React.useEffect(() => {
    if (!editing || !editorRef.current || !current) return;
    const html = current.html || replaceBullets(stripMetadata(current.content)).split(/\n{2,}/).filter(Boolean).map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`).join("");
    editorRef.current.innerHTML = html;
  }, [editing, selected]);

  const persistPages = async (next: KBPage[]) => {
    setPages(next);
    try {
      await setDoc(doc(db, "knowledgeBase", "main"), {
        pages: next,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || null,
      }, { merge: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d'enregistrer dans Firebase");
    }
  };

  const updateCurrent = (patch: Partial<KBPage>) => setPages((old) => old.map((p, i) => i === selected ? { ...p, ...patch } : p));
  const saveEdit = async () => {
    if (!admin || !current || !editorRef.current) return;
    const next = pages.map((p, i) => i === selected ? { ...p, html: editorRef.current!.innerHTML, content: editorRef.current!.innerText } : p);
    await persistPages(next);
    setEditing(false);
  };
  const addPage = async () => { if (!admin) return; const section = groups[0]?.[0] || "Autres"; const next = Math.max(0, ...pages.map((p) => p.page)) + 1; const nextPages = [...pages, { page: next, title: "Nouvelle page", section, content: "", html: "<p>Écrivez ici…</p>", images: [] }]; await persistPages(nextPages); setSelected(nextPages.length - 1); setOpen(section); setEditing(true); };
  const deletePage = async () => { if (!admin || !current || !confirm(`Supprimer la page « ${current.title} » ?`)) return; await persistPages(pages.filter((_, i) => i !== selected)); setSelected(-1); setEditing(false); };
  const addSection = async () => { if (!admin) return; const name = prompt("Nom de la nouvelle section :", "Nouvelle section"); if (!name?.trim()) return; const next = Math.max(0, ...pages.map((p) => p.page)) + 1; const nextPages = [...pages, { page: next, title: "Nouvelle page", section: name.trim(), content: "", html: "<p>Écrivez ici…</p>", images: [] }]; await persistPages(nextPages); setSelected(nextPages.length - 1); setOpen(name.trim()); setEditing(true); };
  const renameSection = async (oldName: string) => { if (!admin) return; const name = prompt("Nouveau nom de section :", oldName); if (!name?.trim() || name.trim() === oldName) return; await persistPages(pages.map((p) => (p.section || "Autres") === oldName ? { ...p, section: name.trim() } : p)); if (open === oldName) setOpen(name.trim()); };
  const deleteSection = async (name: string) => { if (!admin || !confirm(`Supprimer toute la section « ${name} » et ses pages ?`)) return; await persistPages(pages.filter((p) => (p.section || "Autres") !== name)); setSelected(-1); };
  const onEditorPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLImageElement;
    if (target.tagName !== "IMG") return;
    const rect = target.getBoundingClientRect(); if (event.clientX < rect.right - 24 || event.clientY < rect.bottom - 24) return;
    event.preventDefault(); const startX = event.clientX; const startWidth = rect.width; const ratio = target.naturalWidth && target.naturalHeight ? target.naturalHeight / target.naturalWidth : rect.height / rect.width;
    const move = (e: PointerEvent) => { const width = Math.max(60, startWidth + e.clientX - startX); target.style.width = `${width}px`; target.style.height = `${width * ratio}px`; };
    const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); }; window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop);
  };
  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => { const item = [...event.clipboardData.items].find((i) => i.type.startsWith("image/")); if (!item || !editorRef.current) return; event.preventDefault(); const file = item.getAsFile(); if (!file) return; const reader = new FileReader(); reader.onload = () => { const img = document.createElement("img"); img.src = String(reader.result); img.alt = "Image collée"; img.className = "kb-edit-image"; img.style.width = "420px"; const sel = window.getSelection(); if (sel?.rangeCount) { const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(img); range.setStartAfter(img); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); } else editorRef.current?.appendChild(img); }; reader.readAsDataURL(file); };

  return <div className="kb-page">
    <main className="kb-content" style={manuscript ? { backgroundImage: `url(${manuscript})` } : undefined}>
      <div className="kb-manuscript-viewport">
        {error && <div className="kb-error">{error}</div>}
        {current ? <>
          {admin && <div className="kb-toolbar"><button onClick={() => setEditing((v) => !v)}>{editing ? "Annuler" : "✎ Éditer"}</button>{editing && <button onClick={saveEdit}>💾 Enregistrer</button>}<button onClick={addPage}>＋ Page</button><button onClick={deletePage}>🗑 Page</button></div>}
          {editing && admin ? <><input className="kb-edit-title" value={current.title} onChange={(e) => updateCurrent({ title: e.target.value })} /><input className="kb-edit-section" value={current.section || "Autres"} onChange={(e) => updateCurrent({ section: e.target.value })} /><div ref={editorRef} className="kb-editor" contentEditable suppressContentEditableWarning onPaste={onPaste} onPointerDown={onEditorPointerDown} /><p className="kb-editor-help">Pastez une image directement dans le texte. Sélectionnez-la puis tirez son coin inférieur droit.</p></> : <><div className="kb-breadcrumb">KB / {current.section || "Autres"} / {current.title} / page {current.page}</div><h1>{current.title}</h1><div className="kb-body">{current.html ? <div dangerouslySetInnerHTML={{ __html: current.html }} /> : replaceBullets(stripMetadata(current.content)).split(/\n{2,}/).filter(Boolean).map((part, index) => { const initial = index === 0 ? initialFor(part) : undefined; return <div key={index} className={index === 0 ? "kb-paragraph kb-first-paragraph" : "kb-paragraph"}>{initial ? <><img className="kb-initial" src={initial} alt="" aria-hidden="true" /><span className="kb-first-text">{part.slice(1)}</span></> : part}</div>; })}</div>{!current.html && !!current.images?.length && <div className="kb-page-images">{current.images.map((image, index) => <figure className="kb-page-image" key={image}><img src={`${base}${image}`} alt={`Illustration ${index + 1}`} /><figcaption>Illustration {index + 1}</figcaption></figure>)}</div>}</>}
        </> : <div className="kb-empty">{pages.length ? "Choisissez une page dans le sidebar." : "Chargement du contenu KB…"}</div>}
      </div>
    </main>
    <aside className="kb-sidebar"><div className="kb-brand">KB</div>{defaultArtwork && <img className="kb-default-artwork" src={defaultArtwork} alt="PCD-KB" />}<input className="kb-search" placeholder="Rechercher dans la KB…" value={query} onChange={(e) => setQuery(e.target.value)} />{admin && <div className="kb-sidebar-actions"><button onClick={addSection}>＋ Section</button><button onClick={addPage}>＋ Page</button></div>}<div className="kb-nav">{query ? filtered.map(({ page, index }) => <button key={index} className={index === selected ? "kb-item active" : "kb-item"} onClick={() => { setSelected(index); setEditing(false); }}>{page.title}<small>p. {page.page}</small></button>) : groups.map(([name, group]) => <div className="kb-group" key={name}><div className="kb-group-title"><button onClick={() => setOpen(open === name ? null : name)}>⚜ {name}</button>{admin && <span><button title="Renommer" onClick={() => renameSection(name)}>✎</button><button title="Supprimer" onClick={() => deleteSection(name)}>🗑</button></span>}<button onClick={() => setOpen(open === name ? null : name)}>{open === name ? "−" : "+"}</button></div>{open === name && group.map((page) => { const index = pages.indexOf(page); return <button key={index} className={index === selected ? "kb-item active" : "kb-item"} onClick={() => { setSelected(index); setEditing(false); }}><span>⚜ {page.title}</span><small>p. {page.page}</small></button>; })}</div>)}</div></aside>
  </div>;
}
