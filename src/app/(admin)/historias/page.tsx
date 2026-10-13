'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  listStories, createStory, updateStory, deleteStory,
  listScenes, createScene, updateScene, deleteScene,
  listLines, createLine, updateLine, deleteLine,
  listChoices, createChoice, deleteChoice,
} from '@/lib/actions/stories'
import { listNpcs } from '@/lib/actions/npcs'
import { listItems } from '@/lib/actions/items'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Pencil, Trash2, BookOpen, MessageSquare, GitBranch } from 'lucide-react'

const SPEAKERS: Record<string, string> = { narrator: 'Narrador', npc: 'NPC', player: 'Jogador' }

export default function HistoriasPage() {
  const [stories, setStories] = useState<any[]>([])
  const [activeStory, setActiveStory] = useState<any>(null)
  const [scenes, setScenes] = useState<any[]>([])
  const [activeScene, setActiveScene] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [choices, setChoices] = useState<Record<string, any[]>>({})
  const [npcs, setNpcs] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  const [showStoryForm, setShowStoryForm] = useState(false)
  const [storyForm, setStoryForm] = useState({ slug: '', name: '', description: '', cover_url: '', is_active: true, sort_order: 0 })
  const [editingStory, setEditingStory] = useState<any>(null)

  const [sceneForm, setSceneForm] = useState({ order_index: 0, title: '', background_url: '' })
  const [editingScene, setEditingScene] = useState<any>(null)
  const [showSceneForm, setShowSceneForm] = useState(false)

  const [lineForm, setLineForm] = useState({ order_index: 0, speaker_type: 'narrator', speaker_name: '', npc_id: '', text: '', portrait_url: '' })
  const [editingLine, setEditingLine] = useState<any>(null)
  const [showLineForm, setShowLineForm] = useState(false)

  const [choiceForm, setChoiceForm] = useState({ line_id: '', label: '', next_scene_id: '', reward_xp: 0, reward_item_id: '', reward_qty: 1, sort_order: 0 })
  const [showChoiceForm, setShowChoiceForm] = useState(false)

  const loadStories = () => listStories().then(setStories).catch(() => setStories([]))
  useEffect(() => { loadStories(); listNpcs().then(setNpcs).catch(() => {}); listItems().then(setItems).catch(() => {}) }, [])

  const selectStory = (s: any) => {
    setActiveStory(s); setActiveScene(null); setLines([]); setChoices({})
    listScenes(s.id).then(setScenes).catch(() => setScenes([]))
  }

  const selectScene = (sc: any) => {
    setActiveScene(sc)
    listLines(sc.id).then(ls => {
      setLines(ls)
      ls.forEach((l: any) => listChoices(l.id).then(c => setChoices(prev => ({ ...prev, [l.id]: c }))).catch(() => {}))
    }).catch(() => setLines([]))
  }

  const refresh = () => {
    loadStories()
    if (activeStory) listScenes(activeStory.id).then(setScenes).catch(() => {})
    if (activeScene) {
      listLines(activeScene.id).then(ls => {
        setLines(ls)
        ls.forEach((l: any) => listChoices(l.id).then(c => setChoices(prev => ({ ...prev, [l.id]: c }))).catch(() => {}))
      }).catch(() => {})
    }
  }

  const run = (fn: () => Promise<any>) => startTransition(() => fn().then(refresh).catch((e) => alert('Falha: ' + (e?.message || e))))

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><BookOpen size={20} /> Histórias</h2>
          <p className="text-sm text-muted-foreground">Visual novel: história → cenas (fundo) → falas (ordem) → escolhas do jogador</p>
        </div>
        <button onClick={() => { setEditingStory(null); setStoryForm({ slug: '', name: '', description: '', cover_url: '', is_active: true, sort_order: 0 }); setShowStoryForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2"><Plus size={16} /> Nova História</button>
      </div>

      {showStoryForm && (
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { const fd = new FormData(e.target as HTMLFormElement); if (editingStory) await updateStory(editingStory.id, fd); else await createStory(fd); setShowStoryForm(false); setEditingStory(null) }) }} className="border rounded p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm">Slug <Tooltip text="Identificador único. Ex.: prologo_heroi" /></label><input name="slug" defaultValue={storyForm.slug} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Nome</label><input name="name" defaultValue={storyForm.name} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Ordem</label><input name="sort_order" type="number" defaultValue={storyForm.sort_order} className="w-full border rounded px-2 py-1" /></div>
          </div>
          <ImageUpload label="Capa da história" fieldName="cover_url" tooltipText="Imagem de capa 16:9 exibida na lista de histórias do app." folder="stories" value={storyForm.cover_url} onChange={(url) => setStoryForm({ ...storyForm, cover_url: url })} hint="JPG ou PNG 1280x720" accept="image/png,image/jpeg,image/webp" />
          <div><label className="text-sm">Descrição</label><textarea name="description" defaultValue={storyForm.description} className="w-full border rounded px-2 py-1" /></div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={storyForm.is_active} /> Ativa</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => setShowStoryForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-3 gap-2">
        {stories.map(s => (
          <button key={s.id} onClick={() => selectStory(s)} className={`border rounded p-3 text-left hover:border-primary ${activeStory?.id === s.id ? 'border-primary bg-primary/5' : ''}`}>
            <div className="font-semibold">{s.name}</div>
            <div className="text-xs text-muted-foreground"><code>{s.slug}</code> {s.is_active ? '' : '• inativa'}</div>
          </button>
        ))}
      </div>
      {stories.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma história ainda. Crie a primeira (ex.: Prólogo).</p>}

      {activeStory && (
        <div className="border-t pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cenas de “{activeStory.name}”</h3>
            <button onClick={() => { setEditingScene(null); setSceneForm({ order_index: scenes.length, title: '', background_url: '' }); setShowSceneForm(true) }} className="px-3 py-1.5 border rounded text-sm inline-flex items-center gap-1"><Plus size={14} /> Nova Cena</button>
          </div>

          {showSceneForm && (
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { const fd = new FormData(); fd.set('story_id', activeStory.id); fd.set('order_index', String(sceneForm.order_index)); fd.set('title', sceneForm.title); fd.set('background_url', sceneForm.background_url); if (editingScene) await updateScene(editingScene.id, fd); else await createScene(fd); setShowSceneForm(false); setEditingScene(null) }) }} className="border rounded p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm">Ordem <Tooltip text="0 = primeira cena. O app segue esta ordem salvo quando uma escolha pula." /></label><input type="number" value={sceneForm.order_index} onChange={e => setSceneForm({ ...sceneForm, order_index: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                <div className="col-span-2"><label className="text-sm">Título da cena</label><input value={sceneForm.title} onChange={e => setSceneForm({ ...sceneForm, title: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="Ex.: A taverna" /></div>
              </div>
              <ImageUpload label="Fundo da cena" fieldName="background_url" tooltipText="Imagem de fundo 16:9 atrás da caixa de diálogo." folder="stories" value={sceneForm.background_url} onChange={(url) => setSceneForm({ ...sceneForm, background_url: url })} hint="JPG ou PNG 1280x720" accept="image/png,image/jpeg,image/webp" />
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">Salvar cena</button>
                <button type="button" onClick={() => setShowSceneForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {scenes.map(sc => (
              <div key={sc.id} className={`border rounded p-3 ${activeScene?.id === sc.id ? 'border-primary' : ''}`}>
                <div className="flex justify-between items-center">
                  <button onClick={() => selectScene(sc)} className="font-semibold text-left">#{sc.order_index} — {sc.title || '(sem título)'}</button>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => { setEditingScene(sc); setSceneForm({ order_index: sc.order_index, title: sc.title || '', background_url: sc.background_url || '' }); setShowSceneForm(true) }} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                    <button onClick={() => { if (confirm('Excluir cena e todas as falas?')) run(() => deleteScene(sc.id)) }} className="text-red-600 underline">Excluir</button>
                  </div>
                </div>

                {activeScene?.id === sc.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm flex items-center gap-1"><MessageSquare size={14} /> Falas (em ordem)</h4>
                      <button onClick={() => { setEditingLine(null); setLineForm({ order_index: lines.length, speaker_type: 'narrator', speaker_name: '', npc_id: '', text: '', portrait_url: '' }); setShowLineForm(true) }} className="text-sm px-3 py-1 border rounded inline-flex items-center gap-1"><Plus size={12} /> Nova Fala</button>
                    </div>

                    {showLineForm && (
                      <form onSubmit={(e) => { e.preventDefault(); run(async () => { const fd = new FormData(); fd.set('scene_id', sc.id); fd.set('order_index', String(lineForm.order_index)); fd.set('speaker_type', lineForm.speaker_type); fd.set('speaker_name', lineForm.speaker_name); fd.set('npc_id', lineForm.npc_id); fd.set('text', lineForm.text); fd.set('portrait_url', lineForm.portrait_url); if (editingLine) await updateLine(editingLine.id, fd); else await createLine(fd); setShowLineForm(false); setEditingLine(null) }) }} className="border rounded p-3 space-y-2 bg-muted/30">
                        <div className="grid grid-cols-4 gap-2">
                          <div><label className="text-xs">Ordem</label><input type="number" value={lineForm.order_index} onChange={e => setLineForm({ ...lineForm, order_index: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                          <div><label className="text-xs">Quem fala <Tooltip text="Narrador = texto corrido. NPC = usa retrato do NPC. Jogador = fala do herói." /></label>
                            <select value={lineForm.speaker_type} onChange={e => setLineForm({ ...lineForm, speaker_type: e.target.value })} className="w-full border rounded px-2 py-1">
                              {Object.entries(SPEAKERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </div>
                          <div><label className="text-xs">NPC</label>
                            <select value={lineForm.npc_id} onChange={e => setLineForm({ ...lineForm, npc_id: e.target.value })} className="w-full border rounded px-2 py-1">
                              <option value="">—</option>
                              {npcs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                            </select>
                          </div>
                          <div><label className="text-xs">Nome exibido (opcional)</label><input value={lineForm.speaker_name} onChange={e => setLineForm({ ...lineForm, speaker_name: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="Ex.: ???" /></div>
                        </div>
                        <div><label className="text-xs">Texto da fala</label><textarea value={lineForm.text} onChange={e => setLineForm({ ...lineForm, text: e.target.value })} className="w-full border rounded px-2 py-1" rows={2} required /></div>
                        <ImageUpload label="Retrato da fala (opcional)" fieldName="portrait_url" tooltipText="Se vazio e houver NPC, o app usa o retrato do NPC." folder="stories" value={lineForm.portrait_url} onChange={(url) => setLineForm({ ...lineForm, portrait_url: url })} hint="PNG retrato (opcional)" />
                        <div className="flex gap-2">
                          <button type="submit" disabled={isPending} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50">Salvar fala</button>
                          <button type="button" onClick={() => setShowLineForm(false)} className="px-3 py-1.5 border rounded text-sm">Cancelar</button>
                        </div>
                      </form>
                    )}

                    {lines.map(l => (
                      <div key={l.id} className="border rounded p-2 text-sm">
                        <div className="flex justify-between gap-2">
                          <span><strong>#{l.order_index}</strong> <span className="text-muted-foreground">[{SPEAKERS[l.speaker_type] || l.speaker_type}{l.npcs?.name ? `: ${l.npcs.name}` : l.speaker_name ? `: ${l.speaker_name}` : ''}]</span> — {l.text}</span>
                          <span className="flex gap-2 flex-shrink-0">
                            <button onClick={() => { setEditingLine(l); setLineForm({ order_index: l.order_index, speaker_type: l.speaker_type, speaker_name: l.speaker_name || '', npc_id: l.npc_id || '', text: l.text, portrait_url: l.portrait_url || '' }); setShowLineForm(true) }} className="text-blue-600 underline">Editar</button>
                            <button onClick={() => { if (confirm('Excluir fala e escolhas?')) run(() => deleteLine(l.id)) }} className="text-red-600 underline">Excluir</button>
                          </span>
                        </div>
                        <div className="mt-1 pl-3 space-y-1">
                          {(choices[l.id] || []).map(c => (
                            <div key={c.id} className="flex justify-between text-xs bg-muted/40 rounded px-2 py-1">
                              <span><GitBranch size={11} className="inline mr-1" />“{c.label}” → {c.next_scene_id ? `cena …${c.next_scene_id.slice(0, 8)}` : 'continua'}{Number(c.reward_xp) > 0 ? ` • +${c.reward_xp} XP` : ''}{c.items?.name ? ` • ${c.reward_qty}x ${c.items.name}` : ''}</span>
                              <button onClick={() => { if (confirm('Excluir escolha?')) run(() => deleteChoice(c.id)) }} className="text-red-600 underline">Excluir</button>
                            </div>
                          ))}
                          {!showChoiceForm || choiceForm.line_id !== l.id ? (
                            <button onClick={() => { setChoiceForm({ line_id: l.id, label: '', next_scene_id: '', reward_xp: 0, reward_item_id: '', reward_qty: 1, sort_order: (choices[l.id]?.length || 0) }); setShowChoiceForm(true) }} className="text-xs text-blue-600 underline">+ Adicionar escolha do jogador</button>
                          ) : (
                            <form onSubmit={(e) => { e.preventDefault(); run(async () => { const fd = new FormData(); fd.set('line_id', l.id); fd.set('label', choiceForm.label); fd.set('next_scene_id', choiceForm.next_scene_id); fd.set('reward_xp', String(choiceForm.reward_xp)); fd.set('reward_item_id', choiceForm.reward_item_id); fd.set('reward_qty', String(choiceForm.reward_qty)); fd.set('sort_order', String(choiceForm.sort_order)); await createChoice(fd); setShowChoiceForm(false) }) }} className="grid grid-cols-4 gap-2 border rounded p-2 bg-muted/30">
                              <div className="col-span-2"><label className="text-xs">Texto do botão <Tooltip text="O que o jogador lê e clica. Ex.: 'Aceitar a missão'" /></label><input value={choiceForm.label} onChange={e => setChoiceForm({ ...choiceForm, label: e.target.value })} className="w-full border rounded px-2 py-1" required /></div>
                              <div><label className="text-xs">Pula para cena <Tooltip text="Vazio = segue a ordem normal. Preenchido = desvia a história." /></label>
                                <select value={choiceForm.next_scene_id} onChange={e => setChoiceForm({ ...choiceForm, next_scene_id: e.target.value })} className="w-full border rounded px-2 py-1">
                                  <option value="">Continua…</option>
                                  {scenes.filter(s => s.id !== sc.id).map(s => <option key={s.id} value={s.id}>#{s.order_index} {s.title}</option>)}
                                </select>
                              </div>
                              <div><label className="text-xs">Recompensa XP</label><input type="number" value={choiceForm.reward_xp} onChange={e => setChoiceForm({ ...choiceForm, reward_xp: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                              <div><label className="text-xs">Item recompensa</label>
                                <select value={choiceForm.reward_item_id} onChange={e => setChoiceForm({ ...choiceForm, reward_item_id: e.target.value })} className="w-full border rounded px-2 py-1">
                                  <option value="">Nenhum</option>
                                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                              </div>
                              <div><label className="text-xs">Qtd</label><input type="number" value={choiceForm.reward_qty} onChange={e => setChoiceForm({ ...choiceForm, reward_qty: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                              <div className="col-span-2 flex gap-2 items-end">
                                <button type="submit" disabled={isPending} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">Salvar escolha</button>
                                <button type="button" onClick={() => setShowChoiceForm(false)} className="px-3 py-1.5 border rounded text-xs">Cancelar</button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    ))}
                    {lines.length === 0 && <p className="text-xs text-muted-foreground">Sem falas nesta cena ainda.</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
