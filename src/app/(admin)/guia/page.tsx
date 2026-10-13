'use client'

export default function GuiaPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Guia de Preenchimento</h2>
        <p className="text-muted-foreground mt-1">Como cadastrar cada entidade do jogo com exemplos práticos</p>
      </div>

      {/* ITENS */}
      <section className="border rounded p-6 space-y-4">
        <h3 className="text-lg font-semibold">Itens</h3>
        <p className="text-sm text-muted-foreground">Itens são tudo que o jogador pode obter, equipar ou consumir. Cada item tem um slot, raridade e stats.</p>

        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-blue-500 pl-4">
            <strong>Exemplo — Espada de Aço Comum:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li><code>slug:</code> espada_aco_comum</li>
              <li><code>name:</code> Espada de Aço</li>
              <li><code>type:</code> Arma</li>
              <li><code>rarity:</code> Comum</li>
              <li><code>slot:</code> Arma</li>
              <li><code>ATK:</code> 15</li>
              <li><code>DEF:</code> 0</li>
              <li><code>price_gold:</code> 50</li>
              <li><code>is_active:</code> Sim</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <strong>Exemplo — Poção de Vida:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li><code>slug:</code> pocao_vida_1</li>
              <li><code>name:</code> Poção de Vida</li>
              <li><code>type:</code> Consumível</li>
              <li><code>slot:</code> Nenhum</li>
              <li><code>HP:</code> 50 (cura 50 HP ao usar)</li>
              <li><code>stackable:</code> Sim</li>
              <li><code>max_stack:</code> 99</li>
              <li><code>price_gold:</code> 20</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MOBS */}
      <section className="border rounded p-6 space-y-4">
        <h3 className="text-lg font-semibold">Mobs (Inimigos)</h3>
        <p className="text-sm text-muted-foreground">Inimigos que o jogador enfrenta. Cada mob tem stats de combate e 5 sprites de animação.</p>

        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-red-500 pl-4">
            <strong>Exemplo — Slime Iniciante:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li><code>slug:</code> slime_iniciante</li>
              <li><code>name:</code> Slime Verde</li>
              <li><code>tier:</code> Normal</li>
              <li><code>HP:</code> 80</li>
              <li><code>ATK:</code> 8</li>
              <li><code>DEF:</code> 2</li>
              <li><code>exp_reward:</code> 15</li>
              <li><code>gold_reward:</code> 10</li>
              <li><code>attack_cooldown_ms:</code> 1200 (ataca a cada 1.2s)</li>
              <li><code>scale:</code> 1.0</li>
            </ul>
          </div>

          <div className="border-l-4 border-amber-500 pl-4">
            <strong>Exemplo — Dragão Chefão:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li><code>slug:</code> dragao_chefe</li>
              <li><code>name:</code> Dragão de Fogo</li>
              <li><code>tier:</code> Boss</li>
              <li><code>HP:</code> 5000</li>
              <li><code>ATK:</code> 150</li>
              <li><code>DEF:</code> 50</li>
              <li><code>exp_reward:</code> 500</li>
              <li><code>gold_reward:</code> 2000</li>
              <li><code>scale:</code> 2.5 (maior na tela)</li>
            </ul>
          </div>
        </div>

        <div className="bg-muted/50 rounded p-3">
          <strong className="text-sm">Sprites necessários (5 por mob):</strong>
          <ul className="mt-1 text-sm text-muted-foreground grid grid-cols-1 gap-1">
            <li><code>sprite_idle_url</code> — Posição de repouso (2-4 frames)</li>
            <li><code>sprite_run_url</code> — Andando/correndo (4-6 frames)</li>
            <li><code>sprite_attack_url</code> — Animacão de ataque (3-4 frames)</li>
            <li><code>sprite_hit_url</code> — Tomando dano (1-2 frames)</li>
            <li><code>sprite_death_url</code> — Morrendo (2-3 frames)</li>
          </ul>
        </div>
      </section>

      {/* SKILLS */}
      <section className="border rounded p-6 space-y-4">
        <h3 className="text-lg font-semibold">Habilidades</h3>
        <p className="text-sm text-muted-foreground">Skills são habilidades especiais do jogador ou dos mobs.</p>

        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-purple-500 pl-4">
            <strong>Exemplo — Golpe Poderoso:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li><code>slug:</code> golpe_poderoso</li>
              <li><code>name:</code> Golpe Poderoso</li>
              <li><code>type:</code> Ativa</li>
              <li><code>target:</code> Inimigo</li>
              <li><code>cooldown_ms:</code> 5000 (5s de recarga)</li>
              <li><code>mana_cost:</code> 20</li>
              <li><code>base_damage:</code> 150</li>
              <li><code>effects:</code> {"{\"stun_ms\": 1000}"} (atordoa 1s)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* STAGES */}
      <section className="border rounded p-6 space-y-4">
        <h3 className="text-lg font-semibold">Zonas e Stages</h3>
        <p className="text-sm text-muted-foreground">Zonas são regiões do mapa. Stages são fases dentro de cada zona.</p>

        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-cyan-500 pl-4">
            <strong>Estrutura hierárquica:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>1. Criar <strong>Zona</strong> (ex.: "Floresta Sombria")</li>
              <li>2. Criar <strong>Stage</strong> dentro da zona (ex.: "Floresta — Fase 1")</li>
              <li>3. Criar <strong>Waves</strong> dentro do stage (ex.: Wave 1: 3 slimes)</li>
              <li>4. Adicionar <strong>Mobs</strong> em cada wave</li>
            </ul>
          </div>
        </div>
      </section>

      {/* LOOT */}
      <section className="border rounded p-6 space-y-4">
        <h3 className="text-lg font-semibold">Loot Tables</h3>
        <p className="text-sm text-muted-foreground">Define o que dropa ao matar um mob ou limpar um stage.</p>

        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-yellow-500 pl-4">
            <strong>Sistema de Peso:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>Cada item tem um <code>weight</code> (peso). Quanto maior, maior a chance.</li>
              <li>Ex.: Item A (weight 70) + Item B (weight 30) = 70% vs 30% de chance.</li>
              <li>Use <code>drop_chance_percent</code> para forçar uma chance exata (sobrescreve o cálculo de peso).</li>
              <li><code>guaranteed</code> = sempre dropa (ex.: recompensa fixa de boss).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PROGRESSÃO */}
      <section className="border rounded p-6 space-y-4">
        <h3 className="text-lg font-semibold">Sugestão de Progressão</h3>
        <p className="text-sm text-muted-foreground">Curvas de crescimento recomendadas para um ARPG mobile</p>

        <div className="space-y-3 text-sm">
          <div className="border-l-4 border-indigo-500 pl-4">
            <strong>XP por Nível:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>Fórmula: <code>XP necessário = 100 × nível^1.5</code></li>
              <li>Nível 1→2: 100 XP</li>
              <li>Nível 5→6: 1.118 XP</li>
              <li>Nível 10→11: 3.162 XP</li>
              <li>Nível 20→21: 8.944 XP</li>
            </ul>
          </div>

          <div className="border-l-4 border-pink-500 pl-4">
            <strong>Stats por Nível (jogador):</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>HP: 100 + 20 × nível</li>
              <li>ATK: 10 + 3 × nível</li>
              <li>DEF: 5 + 1.5 × nível</li>
            </ul>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <strong>Recompensa de Ouro:</strong>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>Mob normal: 5 + 2 × nível do mob</li>
              <li>Mob elite: 15 + 5 × nível</li>
              <li>Boss: 100 + 30 × nível do stage</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
