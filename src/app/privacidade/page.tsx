import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade • Imperiall RPG',
  description:
    'Como o Imperiall RPG coleta, usa, guarda e protege os seus dados pessoais.',
  robots: { index: true, follow: true },
}

const UPDATED_AT = '16 de outubro de 2026'

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: '1. Quem é o controlador dos dados',
    body: (
      <>
        O <strong className="text-amber-300">Imperiall RPG</strong> é desenvolvido e publicado por{' '}
        <strong className="text-amber-300">Produções Kazenski</strong>. Este documento explica quais
        dados são coletados quando você usa o aplicativo, por que coletamos e quais são os seus
        direitos.
      </>
    ),
  },
  {
    title: '2. Dados que coletamos',
    body: (
      <ul className="list-disc space-y-2 pl-5 marker:text-amber-500/70">
        <li>
          <strong>Dados de conta</strong> — se você entrar com Google, coletamos seu e-mail, nome de
          exibição e foto de perfil (fornecidos pelo Google). Se preferir, é possível usar o modo
          visitante sem criar conta.
        </li>
        <li>
          <strong>Dados de jogo</strong> — personagens criados, itens, equipamentos, história
          avançada, batalhas, moedas e progresso. Esses dados existem para o jogo funcionar e são
          guardados em nosso banco de dados.
        </li>
        <li>
          <strong>Telemetria de uso</strong> — registrando eventos de navegação de forma agregada
          (por exemplo: qual história foi escolhida, qual zona foi visitada, quais itens foram
          equipados). Não contém dados pessoais e é usada apenas para gerar estatísticas do jogo.
        </li>
        <li>
          <strong>Dados técnicos</strong> — modelo do aparelho, versão do Android e versão do app,
          usados para diagnóstico de falhas e para priorizar melhorias.
        </li>
        <li>
          <strong>Armazenamento local</strong> — o aplicativo guarda algumas informações no próprio
          aparelho (por exemplo, sua sessão de login) para o acesso ser mais rápido.
        </li>
      </ul>
    ),
  },
  {
    title: '3. Para que usamos os seus dados',
    body: (
      <ul className="list-disc space-y-2 pl-5 marker:text-amber-500/70">
        <li>Permitir que você entre na sua conta e recupere seu progresso.</li>
        <li>Exibir o conteúdo do jogo (histórias, itens, personagens) corretamente.</li>
        <li>Entender quais partes do jogo são mais usadas, para equilibrá-lo e corrigir problemas.</li>
        <li>Cumprir obrigações legais aplicáveis, quando houver.</li>
      </ul>
    ),
  },
  {
    title: '4. Base legal',
    body: (
      <>
       Tratamos seus dados com base no seu <strong>consentimento</strong> (ao entrar com Google ou usar
        o aplicativo), na <strong>execução de contrato</strong> (sem os dados de jogo o serviço não
        funciona) e no <strong>legítimo interesse</strong> em melhorar o produto, sempre respeitando
        a LGPD (Lei nº 13.709/2018).
      </>
    ),
  },
  {
    title: '5. Com quem compartilhamos',
    body: (
      <ul className="list-disc space-y-2 pl-5 marker:text-amber-500/70">
        <li>
          <strong>Supabase</strong> — fornecedor de infraestrutura que hospeda o banco de dados e os
          arquivos do jogo.
        </li>
        <li>
          <strong>Google</strong> — responsável pelo login social (e pela Google Play, caso o app seja
          distribuído por lá).
        </li>
        <li>
          <strong>Autoridades públicas</strong> — apenas quando houver determinação legal.
        </li>
      </ul>
    ),
  },
  {
    title: '6. Não vendemos seus dados',
    body: (
      <>
        Não vendemos, alugamos nem cedemos seus dados pessoais a terceiros para fins publicitários.
        A telemetria é agregada e não permite identificar você.
      </>
    ),
  },
  {
    title: '7. Por quanto tempo guardamos',
    body: (
      <>
        Os dados da sua conta e do seu progresso são mantidos enquanto sua conta existir. A telemetria
        é mantida por um período limitado e depois agregada ou apagada. Ao excluir sua conta, seus
        dados são removidos em até 30 dias.
      </>
    ),
  },
  {
    title: '8. Seus direitos (LGPD)',
    body: (
      <>
        Você pode, a qualquer momento, solicitar: confirmação da existência de tratamento; acesso,
        correção e anonimização de dados; portabilidade; informação sobre compartilhamentos; e
        eliminação dos seus dados. Basta escrever para{' '}
        <a
          href="mailto:kazenski.developer@gmail.com"
          className="text-amber-300 underline underline-offset-4 hover:text-amber-200"
        >
          kazenski.developer@gmail.com
        </a>
        . Respondemos em até 15 dias.
      </>
    ),
  },
  {
    title: '9. Crianças e adolescentes',
    body: (
      <>
        O aplicativo é destinado a pessoas com 13 anos ou mais. Não coletamos intencionalmente
        dados de crianças. Se identificarmos que houve coleta indevida, os dados são eliminados.
      </>
    ),
  },
  {
    title: '10. Segurança',
    body: (
      <>
        O acesso ao painel administrativo exige perfil de administrador e as regras de acesso são
        aplicadas no próprio banco de dados. Senhas e chaves de assinatura ficam fora do código
        (armazenadas em ambiente seguro), e todo tráfego é criptografado.
      </>
    ),
  },
  {
    title: '11. Alterações desta política',
    body: (
      <>
        Esta política pode ser atualizada conforme o jogo evolui. A data no topo desta página sempre
        reflete a versão vigente. Mudanças relevantes podem ser comunicadas dentro do aplicativo.
      </>
    ),
  },
  {
    title: '12. Contato',
    body: (
      <>
        Produções Kazenski — responsável pelo Imperiall RPG.
        <br />
        E-mail:{' '}
        <a
          href="mailto:kazenski.developer@gmail.com"
          className="text-amber-300 underline underline-offset-4 hover:text-amber-200"
        >
          kazenski.developer@gmail.com
        </a>
      </>
    ),
  },
]

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-14 space-y-10">
        <header className="space-y-3 border-b border-amber-500/20 pb-8">
          <p className="text-[11px] tracking-[0.3em] text-amber-400/80 uppercase">Imperiall RPG</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-amber-200">Política de Privacidade</h1>
          <p className="text-sm text-slate-400">Última atualização: {UPDATED_AT}</p>
        </header>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-100">{s.title}</h2>
              <div className="text-[15px] leading-relaxed text-slate-300 space-y-3">{s.body}</div>
            </section>
          ))}
        </div>

        <footer className="border-t border-amber-500/20 pt-6 text-xs text-slate-500">
          Produções Kazenski • Imperiall RPG
        </footer>
      </div>
    </div>
  )
}