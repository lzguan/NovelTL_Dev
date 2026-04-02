import { useEffect, useState, useCallback } from "react";
import { useLanguages } from "../../contexts/LanguageContext";
import { Modal } from "../common/Modal";
import {
    getGlossariesByNovel,
    getGlossaryById,
    createGlossary,
    deleteGlossary,
    getGlossaryEntriesByGlossary,
    createGlossaryEntry,
    updateGlossaryEntry,
    deleteGlossaryEntry,
    importGlossaryFromLabels,
} from "../../api/glossaries";
import { getLabelGroupsByNovel } from "../../api/labels";
import type * as GlossaryType from "../../types/glossary";
import type { LabelGroup } from "../../types/label";

// ---- Create Glossary Form ----

interface CreateGlossaryFormProps {
    novelId: string;
    onCreated: (glossary: GlossaryType.Glossary) => void;
    onClose: () => void;
}

const CreateGlossaryForm = ({ novelId, onCreated, onClose }: CreateGlossaryFormProps) => {
    const languages = useLanguages();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [sourceLang, setSourceLang] = useState("");
    const [targetLang, setTargetLang] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !sourceLang || !targetLang) {
            setError("Name, source language, and target language are required.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const created = await createGlossary({
                glossaryName: name.trim(),
                glossaryDescription: description.trim() || null,
                novelId,
                sourceLanguageCode: sourceLang,
                targetLanguageCode: targetLang,
            });
            onCreated(created);
        } catch (err) {
            console.error(err);
            setError("Failed to create glossary.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {error && <div style={{ color: "#c00", fontSize: "0.9rem" }}>{error}</div>}
            <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "0.85rem" }}>Name *</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={63}
                    style={{ width: "100%", padding: "6px 8px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
                />
            </div>
            <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "0.85rem" }}>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    style={{ width: "100%", padding: "6px 8px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc", resize: "vertical" }}
                />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "0.85rem" }}>Source *</label>
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        style={{ width: "100%", padding: "6px 4px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.85rem" }}
                    >
                        <option value="">Select...</option>
                        {languages.map((l) => (
                            <option key={l.languageCode} value={l.languageCode}>{l.languageName}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "0.85rem" }}>Target *</label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        style={{ width: "100%", padding: "6px 4px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.85rem" }}
                    >
                        <option value="">Select...</option>
                        {languages.map((l) => (
                            <option key={l.languageCode} value={l.languageCode}>{l.languageName}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button type="button" onClick={onClose} style={{ padding: "5px 12px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: "0.85rem" }}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: "5px 12px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#4a90d9", color: "#fff", fontWeight: 500, fontSize: "0.85rem" }}
                >
                    {submitting ? "Creating..." : "Create"}
                </button>
            </div>
        </form>
    );
};

// ---- Add Entry Form ----

interface AddEntryFormProps {
    glossaryId: string;
    onCreated: (entry: GlossaryType.GlossaryEntry) => void;
    onClose: () => void;
}

const AddEntryForm = ({ glossaryId, onCreated, onClose }: AddEntryFormProps) => {
    const [sourceTerm, setSourceTerm] = useState("");
    const [translatedTerm, setTranslatedTerm] = useState("");
    const [contextNotes, setContextNotes] = useState("");
    const [entityType, setEntityType] = useState("MISC");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourceTerm.trim()) {
            setError("Source term is required.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const created = await createGlossaryEntry({
                glossaryId,
                sourceTerm: sourceTerm.trim(),
                translatedTerm: translatedTerm.trim() || null,
                contextNotes: contextNotes.trim() || null,
                entityType: entityType || "MISC",
            });
            onCreated(created);
        } catch (err) {
            console.error(err);
            setError("Failed to add entry.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {error && <div style={{ color: "#c00", fontSize: "0.85rem" }}>{error}</div>}
            <div>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 500, fontSize: "0.85rem" }}>Source Term *</label>
                <input value={sourceTerm} onChange={(e) => setSourceTerm(e.target.value)} maxLength={128}
                    style={{ width: "100%", padding: "5px 7px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }} />
            </div>
            <div>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 500, fontSize: "0.85rem" }}>Translated Term</label>
                <input value={translatedTerm} onChange={(e) => setTranslatedTerm(e.target.value)} maxLength={128}
                    style={{ width: "100%", padding: "5px 7px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }} />
            </div>
            <div>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 500, fontSize: "0.85rem" }}>Entity Type</label>
                <input value={entityType} onChange={(e) => setEntityType(e.target.value)} maxLength={64}
                    style={{ width: "100%", padding: "5px 7px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }} />
            </div>
            <div>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 500, fontSize: "0.85rem" }}>Context Notes</label>
                <textarea value={contextNotes} onChange={(e) => setContextNotes(e.target.value)} rows={2}
                    style={{ width: "100%", padding: "5px 7px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} style={{ padding: "5px 12px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: "0.85rem" }}>Cancel</button>
                <button type="submit" disabled={submitting}
                    style={{ padding: "5px 12px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#4a90d9", color: "#fff", fontWeight: 500, fontSize: "0.85rem" }}>
                    {submitting ? "Adding..." : "Add Entry"}
                </button>
            </div>
        </form>
    );
};

// ---- Import From Labels Form ----

interface ImportFromLabelsFormProps {
    glossaryId: string;
    novelId: string;
    onImported: (result: GlossaryType.ImportResult) => void;
    onClose: () => void;
}

const ImportFromLabelsForm = ({ glossaryId, novelId, onImported, onClose }: ImportFromLabelsFormProps) => {
    const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [entityTypesInput, setEntityTypesInput] = useState("");
    const [overwrite, setOverwrite] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getLabelGroupsByNovel(novelId).then(setLabelGroups).catch((err) => {
            console.error(err);
            setError("Failed to load label groups.");
        });
    }, [novelId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroupId) {
            setError("Please select a label group.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const entityTypes = entityTypesInput.trim()
                ? entityTypesInput.split(",").map((s) => s.trim()).filter(Boolean)
                : null;
            const result = await importGlossaryFromLabels(glossaryId, {
                labelGroupId: selectedGroupId,
                entityTypes,
                overwriteExisting: overwrite,
            });
            onImported(result);
        } catch (err) {
            console.error(err);
            setError("Import failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {error && <div style={{ color: "#c00", fontSize: "0.85rem" }}>{error}</div>}
            <div>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 500, fontSize: "0.85rem" }}>Label Group *</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                    style={{ width: "100%", padding: "5px 7px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.85rem" }}>
                    <option value="">Select label group...</option>
                    {labelGroups.map((g) => (
                        <option key={g.labelGroupId} value={g.labelGroupId}>{g.labelGroupName}</option>
                    ))}
                </select>
            </div>
            <div>
                <label style={{ display: "block", marginBottom: "3px", fontWeight: 500, fontSize: "0.85rem" }}>Entity Types (comma-separated, blank for all)</label>
                <input value={entityTypesInput} onChange={(e) => setEntityTypesInput(e.target.value)} placeholder="e.g. PER, ORG, LOC"
                    style={{ width: "100%", padding: "5px 7px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc", fontSize: "0.85rem" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                <input id="ws-overwrite-toggle" type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                <label htmlFor="ws-overwrite-toggle">Overwrite existing entries</label>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} style={{ padding: "5px 12px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: "0.85rem" }}>Cancel</button>
                <button type="submit" disabled={submitting}
                    style={{ padding: "5px 12px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#4a90d9", color: "#fff", fontWeight: 500, fontSize: "0.85rem" }}>
                    {submitting ? "Importing..." : "Import"}
                </button>
            </div>
        </form>
    );
};

// ---- Glossary Detail View ----

interface GlossaryDetailProps {
    glossaryId: string;
    novelId: string;
    onBack: () => void;
}

const GlossaryDetail = ({ glossaryId, novelId, onBack }: GlossaryDetailProps) => {
    const [glossary, setGlossary] = useState<GlossaryType.Glossary | null>(null);
    const [entries, setEntries] = useState<GlossaryType.GlossaryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addEntryOpen, setAddEntryOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importResult, setImportResult] = useState<GlossaryType.ImportResult | null>(null);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState<{ translatedTerm: string; contextNotes: string; entityType: string }>({ translatedTerm: "", contextNotes: "", entityType: "" });
    const [savingEdit, setSavingEdit] = useState(false);

    const loadEntries = useCallback(async () => {
        try {
            const data = await getGlossaryEntriesByGlossary(glossaryId);
            setEntries(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load entries.");
        }
    }, [glossaryId]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getGlossaryById(glossaryId),
            getGlossaryEntriesByGlossary(glossaryId),
        ]).then(([g, e]) => {
            setGlossary(g);
            setEntries(e);
        }).catch((err) => {
            console.error(err);
            setError("Failed to load glossary.");
        }).finally(() => setLoading(false));
    }, [glossaryId]);

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Delete this entry?")) return;
        try {
            await deleteGlossaryEntry(entryId);
            setEntries((prev) => prev.filter((e) => e.glossaryEntryId !== entryId));
        } catch (err) {
            console.error(err);
            setError("Failed to delete entry.");
        }
    };

    const startEdit = (entry: GlossaryType.GlossaryEntry) => {
        setEditingEntryId(entry.glossaryEntryId);
        setEditFields({ translatedTerm: entry.translatedTerm ?? "", contextNotes: entry.contextNotes ?? "", entityType: entry.entityType });
    };

    const cancelEdit = () => setEditingEntryId(null);

    const saveEdit = async (entryId: string) => {
        setSavingEdit(true);
        try {
            const updated = await updateGlossaryEntry(entryId, {
                translatedTerm: editFields.translatedTerm.trim() || null,
                contextNotes: editFields.contextNotes.trim() || null,
                entityType: editFields.entityType.trim() || null,
            });
            setEntries((prev) => prev.map((e) => e.glossaryEntryId === entryId ? updated : e));
            setEditingEntryId(null);
        } catch (err) {
            console.error(err);
            setError("Failed to save entry.");
        } finally {
            setSavingEdit(false);
        }
    };

    if (loading) return <div style={{ padding: "12px", fontSize: "0.85rem" }}>Loading...</div>;
    if (!glossary) return <div style={{ padding: "12px", color: "#c00", fontSize: "0.85rem" }}>{error || "Glossary not found."}</div>;

    return (
        <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 0, fontSize: "0.85rem", textAlign: "left" }}>
                &larr; Back
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{glossary.glossaryName}</div>
                    {glossary.glossaryDescription && (
                        <div style={{ color: "#666", fontSize: "0.8rem", marginTop: "2px" }}>{glossary.glossaryDescription}</div>
                    )}
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>{glossary.sourceLanguageCode} &rarr; {glossary.targetLanguageCode}</div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button onClick={() => setImportOpen(true)}
                        style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: "0.75rem" }}>
                        Import
                    </button>
                    <button onClick={() => setAddEntryOpen(true)}
                        style={{ padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#4a90d9", color: "#fff", fontSize: "0.75rem" }}>
                        + Entry
                    </button>
                </div>
            </div>

            {error && <div style={{ color: "#c00", fontSize: "0.85rem" }}>{error}</div>}

            {importResult && (
                <div style={{ padding: "8px 10px", background: "#d4edda", borderRadius: "4px", fontSize: "0.8rem" }}>
                    Import: {importResult.entriesCreated} created, {importResult.entriesUpdated} updated, {importResult.entriesSkipped} skipped.
                    <button onClick={() => setImportResult(null)} style={{ marginLeft: "8px", background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "0.8rem" }}>x</button>
                </div>
            )}

            {entries.length === 0 ? (
                <div style={{ color: "#888", fontSize: "0.85rem" }}>No entries yet.</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {entries.map((entry) => {
                        const isEditing = editingEntryId === entry.glossaryEntryId;
                        return (
                            <div key={entry.glossaryEntryId} style={{ border: "1px solid #eee", borderRadius: "4px", padding: "8px", fontSize: "0.82rem", background: "#fff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600 }}>{entry.sourceTerm}</div>
                                        {isEditing ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                                                <input placeholder="Translation" value={editFields.translatedTerm}
                                                    onChange={(e) => setEditFields((f) => ({ ...f, translatedTerm: e.target.value }))}
                                                    maxLength={128} style={{ width: "100%", padding: "3px 5px", borderRadius: "3px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "0.82rem" }} />
                                                <input placeholder="Entity type" value={editFields.entityType}
                                                    onChange={(e) => setEditFields((f) => ({ ...f, entityType: e.target.value }))}
                                                    maxLength={64} style={{ width: "100%", padding: "3px 5px", borderRadius: "3px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "0.82rem" }} />
                                                <input placeholder="Context notes" value={editFields.contextNotes}
                                                    onChange={(e) => setEditFields((f) => ({ ...f, contextNotes: e.target.value }))}
                                                    style={{ width: "100%", padding: "3px 5px", borderRadius: "3px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "0.82rem" }} />
                                            </div>
                                        ) : (
                                            <>
                                                {entry.translatedTerm && <div style={{ color: "#444", marginTop: "2px" }}>{entry.translatedTerm}</div>}
                                                <div style={{ color: "#888", marginTop: "2px" }}>
                                                    <span style={{ background: "#eee", borderRadius: "3px", padding: "1px 5px" }}>{entry.entityType}</span>
                                                    {entry.contextNotes && <span style={{ marginLeft: "6px" }}>{entry.contextNotes}</span>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => void saveEdit(entry.glossaryEntryId)} disabled={savingEdit}
                                                    style={{ padding: "2px 7px", borderRadius: "3px", border: "none", cursor: "pointer", background: "#2ecc71", color: "#fff", fontSize: "0.75rem" }}>
                                                    Save
                                                </button>
                                                <button onClick={cancelEdit}
                                                    style={{ padding: "2px 7px", borderRadius: "3px", border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: "0.75rem" }}>
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(entry)}
                                                    style={{ padding: "2px 7px", borderRadius: "3px", border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: "0.75rem" }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => void handleDeleteEntry(entry.glossaryEntryId)}
                                                    style={{ padding: "2px 7px", borderRadius: "3px", border: "none", cursor: "pointer", background: "#e74c3c", color: "#fff", fontSize: "0.75rem" }}>
                                                    Del
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={addEntryOpen} onClose={() => setAddEntryOpen(false)} title="Add Entry">
                <AddEntryForm
                    glossaryId={glossaryId}
                    onCreated={(entry) => { setEntries((prev) => [...prev, entry]); setAddEntryOpen(false); }}
                    onClose={() => setAddEntryOpen(false)}
                />
            </Modal>

            <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import from Labels">
                <ImportFromLabelsForm
                    glossaryId={glossaryId}
                    novelId={novelId}
                    onImported={(result) => { setImportResult(result); setImportOpen(false); void loadEntries(); }}
                    onClose={() => setImportOpen(false)}
                />
            </Modal>
        </div>
    );
};

// ---- Glossary List View ----

interface GlossaryListProps {
    novelId: string;
    onSelect: (glossaryId: string) => void;
}

const GlossaryList = ({ novelId, onSelect }: GlossaryListProps) => {
    const [glossaries, setGlossaries] = useState<GlossaryType.Glossary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getGlossariesByNovel(novelId)
            .then((data) => { if (!cancelled) { setGlossaries(data); setLoading(false); } })
            .catch((err) => {
                console.error(err);
                if (!cancelled) { setError("Failed to load glossaries."); setLoading(false); }
            });
        return () => { cancelled = true; };
    }, [novelId]);

    const handleDelete = async (glossaryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this glossary and all its entries?")) return;
        try {
            await deleteGlossary(glossaryId);
            setGlossaries((prev) => prev.filter((g) => g.glossaryId !== glossaryId));
        } catch (err) {
            console.error(err);
            setError("Failed to delete glossary.");
        }
    };

    if (loading) return <div style={{ padding: "12px", fontSize: "0.85rem" }}>Loading...</div>;

    return (
        <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Glossaries</span>
                <button onClick={() => setCreateOpen(true)}
                    style={{ padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#4a90d9", color: "#fff", fontWeight: 500, fontSize: "0.8rem" }}>
                    + New
                </button>
            </div>

            {error && <div style={{ color: "#c00", fontSize: "0.85rem" }}>{error}</div>}

            {glossaries.length === 0 ? (
                <div style={{ color: "#888", fontSize: "0.85rem" }}>No glossaries yet.</div>
            ) : (
                glossaries.map((g) => (
                    <div key={g.glossaryId} onClick={() => onSelect(g.glossaryId)}
                        style={{ padding: "10px 12px", border: "1px solid #eee", borderRadius: "6px", cursor: "pointer", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontWeight: 500, fontSize: "0.88rem" }}>{g.glossaryName}</div>
                            {g.glossaryDescription && (
                                <div style={{ color: "#666", fontSize: "0.78rem", marginTop: "2px" }}>{g.glossaryDescription}</div>
                            )}
                            <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>{g.sourceLanguageCode} &rarr; {g.targetLanguageCode}</div>
                        </div>
                        <button onClick={(e) => void handleDelete(g.glossaryId, e)}
                            style={{ padding: "3px 8px", borderRadius: "4px", border: "none", cursor: "pointer", background: "#e74c3c", color: "#fff", fontSize: "0.75rem", flexShrink: 0 }}>
                            Del
                        </button>
                    </div>
                ))
            )}

            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Glossary">
                <CreateGlossaryForm
                    novelId={novelId}
                    onCreated={(g) => { setGlossaries((prev) => [...prev, g]); setCreateOpen(false); }}
                    onClose={() => setCreateOpen(false)}
                />
            </Modal>
        </div>
    );
};

// ---- Glossary Panel (workspace-embedded) ----

interface GlossaryPanelProps {
    novelId: string;
}

export const GlossaryPanel = ({ novelId }: GlossaryPanelProps) => {
    const [selectedGlossaryId, setSelectedGlossaryId] = useState<string | null>(null);

    const handleSelect = useCallback((glossaryId: string) => {
        setSelectedGlossaryId(glossaryId);
    }, []);

    const handleBack = useCallback(() => {
        setSelectedGlossaryId(null);
    }, []);

    if (selectedGlossaryId) {
        return (
            <GlossaryDetail
                glossaryId={selectedGlossaryId}
                novelId={novelId}
                onBack={handleBack}
            />
        );
    }

    return <GlossaryList novelId={novelId} onSelect={handleSelect} />;
};
