import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useLanguages } from '../contexts/LanguageContext'
import { Modal } from '../components/common/Modal'
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
} from '../api/glossaries'
import { getLabelGroupsByNovel } from '../api/labels'
import type * as GlossaryType from '../types/glossary'
import type { LabelGroup } from '../types/label'
import { routeTo } from '../routes'

// ---- Create Glossary Form ----

interface CreateGlossaryFormProps {
    novelId: string
    onCreated: (glossary: GlossaryType.Glossary) => void
    onClose: () => void
}

const CreateGlossaryForm = ({ novelId, onCreated, onClose }: CreateGlossaryFormProps) => {
    const languages = useLanguages()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [sourceLang, setSourceLang] = useState('')
    const [targetLang, setTargetLang] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !sourceLang || !targetLang) {
            setError('Name, source language, and target language are required.')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const created = await createGlossary({
                glossaryName: name.trim(),
                glossaryDescription: description.trim() || null,
                novelId,
                sourceLanguageCode: sourceLang,
                targetLanguageCode: targetLang,
            })
            onCreated(created)
        } catch (err) {
            console.error(err)
            setError('Failed to create glossary.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && <div style={{ color: '#c00', fontSize: '0.9rem' }}>{error}</div>}
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Name *</label>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={63}
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Description</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Source Language *</label>
                    <select
                        value={sourceLang}
                        onChange={e => setSourceLang(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Select...</option>
                        {languages.map(l => (
                            <option key={l.languageCode} value={l.languageCode}>{l.languageName}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Target Language *</label>
                    <select
                        value={targetLang}
                        onChange={e => setTargetLang(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Select...</option>
                        {languages.map(l => (
                            <option key={l.languageCode} value={l.languageCode}>{l.languageName}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={onClose} style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#4a90d9', color: '#fff', fontWeight: 500 }}
                >
                    {submitting ? 'Creating...' : 'Create'}
                </button>
            </div>
        </form>
    )
}

// ---- Add Entry Form ----

interface AddEntryFormProps {
    glossaryId: string
    onCreated: (entry: GlossaryType.GlossaryEntry) => void
    onClose: () => void
}

const AddEntryForm = ({ glossaryId, onCreated, onClose }: AddEntryFormProps) => {
    const [sourceTerm, setSourceTerm] = useState('')
    const [translatedTerm, setTranslatedTerm] = useState('')
    const [contextNotes, setContextNotes] = useState('')
    const [entityType, setEntityType] = useState('MISC')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!sourceTerm.trim()) {
            setError('Source term is required.')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const created = await createGlossaryEntry({
                glossaryId,
                sourceTerm: sourceTerm.trim(),
                translatedTerm: translatedTerm.trim() || null,
                contextNotes: contextNotes.trim() || null,
                entityType: entityType || 'MISC',
            })
            onCreated(created)
        } catch (err) {
            console.error(err)
            setError('Failed to add entry.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && <div style={{ color: '#c00', fontSize: '0.9rem' }}>{error}</div>}
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Source Term *</label>
                <input
                    value={sourceTerm}
                    onChange={e => setSourceTerm(e.target.value)}
                    maxLength={128}
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Translated Term</label>
                <input
                    value={translatedTerm}
                    onChange={e => setTranslatedTerm(e.target.value)}
                    maxLength={128}
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Entity Type</label>
                <input
                    value={entityType}
                    onChange={e => setEntityType(e.target.value)}
                    maxLength={64}
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Context Notes</label>
                <textarea
                    value={contextNotes}
                    onChange={e => setContextNotes(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={onClose} style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#4a90d9', color: '#fff', fontWeight: 500 }}
                >
                    {submitting ? 'Adding...' : 'Add Entry'}
                </button>
            </div>
        </form>
    )
}

// ---- Import From Labels Modal ----

interface ImportFromLabelsModalProps {
    glossaryId: string
    novelId: string
    onImported: (result: GlossaryType.ImportResult) => void
    onClose: () => void
}

const ImportFromLabelsModal = ({ glossaryId, novelId, onImported, onClose }: ImportFromLabelsModalProps) => {
    const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [entityTypesInput, setEntityTypesInput] = useState('')
    const [overwrite, setOverwrite] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        getLabelGroupsByNovel(novelId).then(setLabelGroups).catch(err => {
            console.error(err)
            setError('Failed to load label groups.')
        })
    }, [novelId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGroupId) {
            setError('Please select a label group.')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const entityTypes = entityTypesInput.trim()
                ? entityTypesInput.split(',').map(s => s.trim()).filter(Boolean)
                : null
            const result = await importGlossaryFromLabels(glossaryId, {
                labelGroupId: selectedGroupId,
                entityTypes,
                overwriteExisting: overwrite,
            })
            onImported(result)
        } catch (err) {
            console.error(err)
            setError('Import failed.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && <div style={{ color: '#c00', fontSize: '0.9rem' }}>{error}</div>}
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Label Group *</label>
                <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">Select label group...</option>
                    {labelGroups.map(g => (
                        <option key={g.labelGroupId} value={g.labelGroupId}>{g.labelGroupName}</option>
                    ))}
                </select>
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Entity Types (comma-separated, leave blank for all)</label>
                <input
                    value={entityTypesInput}
                    onChange={e => setEntityTypesInput(e.target.value)}
                    placeholder="e.g. PER, ORG, LOC"
                    style={{ width: '100%', padding: '6px 8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                    id="overwrite-toggle"
                    type="checkbox"
                    checked={overwrite}
                    onChange={e => setOverwrite(e.target.checked)}
                />
                <label htmlFor="overwrite-toggle">Overwrite existing entries</label>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={onClose} style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#4a90d9', color: '#fff', fontWeight: 500 }}
                >
                    {submitting ? 'Importing...' : 'Import'}
                </button>
            </div>
        </form>
    )
}

// ---- Glossary Detail View ----

interface GlossaryDetailProps {
    glossaryId: string
    novelId: string
    onBack: () => void
}

const GlossaryDetail = ({ glossaryId, novelId, onBack }: GlossaryDetailProps) => {
    const [glossary, setGlossary] = useState<GlossaryType.Glossary | null>(null)
    const [entries, setEntries] = useState<GlossaryType.GlossaryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [addEntryOpen, setAddEntryOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [importResult, setImportResult] = useState<GlossaryType.ImportResult | null>(null)
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
    const [editFields, setEditFields] = useState<{ translatedTerm: string; contextNotes: string; entityType: string }>({ translatedTerm: '', contextNotes: '', entityType: '' })
    const [savingEdit, setSavingEdit] = useState(false)

    const loadEntries = useCallback(async () => {
        try {
            const data = await getGlossaryEntriesByGlossary(glossaryId)
            setEntries(data)
        } catch (err) {
            console.error(err)
            setError('Failed to load entries.')
        }
    }, [glossaryId])

    useEffect(() => {
        setLoading(true)
        Promise.all([
            getGlossaryById(glossaryId),
            getGlossaryEntriesByGlossary(glossaryId),
        ]).then(([g, e]) => {
            setGlossary(g)
            setEntries(e)
        }).catch(err => {
            console.error(err)
            setError('Failed to load glossary.')
        }).finally(() => setLoading(false))
    }, [glossaryId])

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm('Delete this entry?')) return
        try {
            await deleteGlossaryEntry(entryId)
            setEntries(prev => prev.filter(e => e.glossaryEntryId !== entryId))
        } catch (err) {
            console.error(err)
            setError('Failed to delete entry.')
        }
    }

    const startEdit = (entry: GlossaryType.GlossaryEntry) => {
        setEditingEntryId(entry.glossaryEntryId)
        setEditFields({
            translatedTerm: entry.translatedTerm ?? '',
            contextNotes: entry.contextNotes ?? '',
            entityType: entry.entityType,
        })
    }

    const cancelEdit = () => {
        setEditingEntryId(null)
    }

    const saveEdit = async (entryId: string) => {
        setSavingEdit(true)
        try {
            const updated = await updateGlossaryEntry(entryId, {
                translatedTerm: editFields.translatedTerm.trim() || null,
                contextNotes: editFields.contextNotes.trim() || null,
                entityType: editFields.entityType.trim() || null,
            })
            setEntries(prev => prev.map(e => e.glossaryEntryId === entryId ? updated : e))
            setEditingEntryId(null)
        } catch (err) {
            console.error(err)
            setError('Failed to save entry.')
        } finally {
            setSavingEdit(false)
        }
    }

    if (loading) return <div>Loading...</div>
    if (!glossary) return <div style={{ color: '#c00' }}>{error || 'Glossary not found.'}</div>

    return (
        <div>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
                &larr; Back to glossaries
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px 0' }}>{glossary.glossaryName}</h2>
                    {glossary.glossaryDescription && (
                        <p style={{ color: '#666', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{glossary.glossaryDescription}</p>
                    )}
                    <span style={{ fontSize: '0.85rem', color: '#888' }}>
                        {glossary.sourceLanguageCode} &rarr; {glossary.targetLanguageCode}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setImportOpen(true)}
                        style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}
                    >
                        Import from Labels
                    </button>
                    <button
                        onClick={() => setAddEntryOpen(true)}
                        style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#4a90d9', color: '#fff' }}
                    >
                        + Add Entry
                    </button>
                </div>
            </div>

            {error && <div style={{ color: '#c00', marginBottom: '12px', fontSize: '0.9rem' }}>{error}</div>}

            {importResult && (
                <div style={{ padding: '10px 14px', background: '#d4edda', borderRadius: '4px', marginBottom: '12px', fontSize: '0.9rem' }}>
                    Import complete: {importResult.entriesCreated} created, {importResult.entriesUpdated} updated, {importResult.entriesSkipped} skipped.
                    <button onClick={() => setImportResult(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>x</button>
                </div>
            )}

            {entries.length === 0 ? (
                <p style={{ color: '#888' }}>No entries yet. Add entries or import from a label group.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', fontWeight: 600, borderBottom: '2px solid #dee2e6' }}>Source Term</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, borderBottom: '2px solid #dee2e6' }}>Translation</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, borderBottom: '2px solid #dee2e6' }}>Entity Type</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, borderBottom: '2px solid #dee2e6' }}>Context Notes</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, borderBottom: '2px solid #dee2e6', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(entry => {
                            const isEditing = editingEntryId === entry.glossaryEntryId
                            return (
                                <tr key={entry.glossaryEntryId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{entry.sourceTerm}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {isEditing ? (
                                            <input
                                                value={editFields.translatedTerm}
                                                onChange={e => setEditFields(f => ({ ...f, translatedTerm: e.target.value }))}
                                                maxLength={128}
                                                style={{ width: '100%', padding: '4px 6px', borderRadius: '3px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            entry.translatedTerm ?? <span style={{ color: '#aaa' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {isEditing ? (
                                            <input
                                                value={editFields.entityType}
                                                onChange={e => setEditFields(f => ({ ...f, entityType: e.target.value }))}
                                                maxLength={64}
                                                style={{ width: '100%', padding: '4px 6px', borderRadius: '3px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', padding: '2px 6px', background: '#eee', borderRadius: '3px' }}>{entry.entityType}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: '#666', fontSize: '0.9rem' }}>
                                        {isEditing ? (
                                            <input
                                                value={editFields.contextNotes}
                                                onChange={e => setEditFields(f => ({ ...f, contextNotes: e.target.value }))}
                                                style={{ width: '100%', padding: '4px 6px', borderRadius: '3px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                                            />
                                        ) : (
                                            entry.contextNotes ?? <span style={{ color: '#aaa' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => saveEdit(entry.glossaryEntryId)}
                                                    disabled={savingEdit}
                                                    style={{ marginRight: '6px', padding: '3px 10px', borderRadius: '3px', border: 'none', cursor: 'pointer', background: '#2ecc71', color: '#fff', fontSize: '0.85rem' }}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    style={{ padding: '3px 10px', borderRadius: '3px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff', fontSize: '0.85rem' }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => startEdit(entry)}
                                                    style={{ marginRight: '6px', padding: '3px 10px', borderRadius: '3px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff', fontSize: '0.85rem' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.glossaryEntryId)}
                                                    style={{ padding: '3px 10px', borderRadius: '3px', border: 'none', cursor: 'pointer', background: '#e74c3c', color: '#fff', fontSize: '0.85rem' }}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}

            <Modal isOpen={addEntryOpen} onClose={() => setAddEntryOpen(false)} title="Add Entry">
                <AddEntryForm
                    glossaryId={glossaryId}
                    onCreated={entry => {
                        setEntries(prev => [...prev, entry])
                        setAddEntryOpen(false)
                    }}
                    onClose={() => setAddEntryOpen(false)}
                />
            </Modal>

            <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import from Labels">
                <ImportFromLabelsModal
                    glossaryId={glossaryId}
                    novelId={novelId}
                    onImported={result => {
                        setImportResult(result)
                        setImportOpen(false)
                        loadEntries()
                    }}
                    onClose={() => setImportOpen(false)}
                />
            </Modal>
        </div>
    )
}

// ---- Glossary List View ----

interface GlossaryListProps {
    novelId: string
    onSelect: (glossaryId: string) => void
}

const GlossaryList = ({ novelId, onSelect }: GlossaryListProps) => {
    const [glossaries, setGlossaries] = useState<GlossaryType.Glossary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [createOpen, setCreateOpen] = useState(false)

    useEffect(() => {
        let cancelled = false
        getGlossariesByNovel(novelId)
            .then(data => { if (!cancelled) { setGlossaries(data); setLoading(false) } })
            .catch(err => {
                console.error(err)
                if (!cancelled) { setError('Failed to load glossaries.'); setLoading(false) }
            })
        return () => { cancelled = true }
    }, [novelId])

    const handleDelete = async (glossaryId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this glossary and all its entries?')) return
        try {
            await deleteGlossary(glossaryId)
            setGlossaries(prev => prev.filter(g => g.glossaryId !== glossaryId))
        } catch (err) {
            console.error(err)
            setError('Failed to delete glossary.')
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Glossaries</h2>
                <button
                    onClick={() => setCreateOpen(true)}
                    style={{ padding: '8px 18px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#4a90d9', color: '#fff', fontWeight: 500 }}
                >
                    + New Glossary
                </button>
            </div>

            {error && <div style={{ color: '#c00', marginBottom: '12px', fontSize: '0.9rem' }}>{error}</div>}

            {glossaries.length === 0 ? (
                <p style={{ color: '#888' }}>No glossaries yet. Create one to get started.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {glossaries.map(g => (
                        <div
                            key={g.glossaryId}
                            onClick={() => onSelect(g.glossaryId)}
                            style={{
                                padding: '14px 16px',
                                border: '1px solid #eee',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: '#fafafa',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '2px' }}>{g.glossaryName}</div>
                                {g.glossaryDescription && (
                                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2px' }}>{g.glossaryDescription}</div>
                                )}
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{g.sourceLanguageCode} &rarr; {g.targetLanguageCode}</div>
                            </div>
                            <button
                                onClick={e => handleDelete(g.glossaryId, e)}
                                style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#e74c3c', color: '#fff', fontSize: '0.85rem' }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Glossary">
                <CreateGlossaryForm
                    novelId={novelId}
                    onCreated={g => {
                        setGlossaries(prev => [...prev, g])
                        setCreateOpen(false)
                    }}
                    onClose={() => setCreateOpen(false)}
                />
            </Modal>
        </div>
    )
}

// ---- Page ----

export const GlossaryPage = () => {
    const { novel_id } = useParams<{ novel_id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()

    const selectedGlossaryId = searchParams.get('glossary') ?? null

    const handleSelectGlossary = useCallback((glossaryId: string) => {
        setSearchParams({ glossary: glossaryId })
    }, [setSearchParams])

    const handleBack = useCallback(() => {
        setSearchParams({})
    }, [setSearchParams])

    if (!novel_id) return <div>Invalid URL.</div>

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '16px', marginBottom: '20px' }}>
                <Link to={routeTo.view.novel(novel_id)} style={{ textDecoration: 'none', color: '#666' }}>&larr; Back to Novel</Link>
                <h1 style={{ margin: '8px 0 0 0' }}>Glossary Manager</h1>
            </div>

            {selectedGlossaryId ? (
                <GlossaryDetail
                    glossaryId={selectedGlossaryId}
                    novelId={novel_id}
                    onBack={handleBack}
                />
            ) : (
                <GlossaryList
                    novelId={novel_id}
                    onSelect={handleSelectGlossary}
                />
            )}
        </div>
    )
}
