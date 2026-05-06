import { useEffect, useRef, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

const navItems = [
  ['inicio', 'Início'],
  ['instituicao', 'Instituição'],
  ['educacao', 'Educação não formal'],
  ['pratica', 'Prática'],
  ['atividade', 'Atividade'],
  ['reflexao', 'Reflexão'],
  ['referencias', 'Referências'],
]

const references = [
  'APPDA-Madeira. (s.d.-a). APPDA-Madeira. https://www.appda-madeira.com/',
  'APPDA-Madeira. (s.d.-b). Missão. https://www.appda-madeira.com/missao',
  'APPDA-Madeira. (s.d.-c). Centro de Apoio Terapêutico - CAT. https://www.appda-madeira.com/cat',
  'APPDA-Madeira. (s.d.-d). Centro de Atividades Diárias - CAD. https://www.appda-madeira.com/cad',
  'APPDA-Madeira. (s.d.-e). Centro de Férias Inclusivo - CFI. https://www.appda-madeira.com/cfi',
  'APPDA-Madeira. (s.d.-f). (Des)Montar o Puzzle. https://www.appda-madeira.com/des-montar-o-puzzle',
  'APPDA-Madeira. (s.d.-g). Encontros de Experiências com Liberdade. https://www.appda-madeira.com/encontros-de-experi%C3%AAncias-com-liberdade',
  'APPDA-Madeira. (s.d.-h). Ações de sensibilização e formação. https://www.appda-madeira.com/acoes-de-sensibilizacao',
  'APPDA-Madeira. (s.d.-i). Parceria APPDA/FPDA/IDiPD, I.P. https://www.appda-madeira.com/parceriaappda-fpda-inr',
  'Agyapong, B., Obuobi-Donkor, G., Burback, L., & Wei, Y. (2022). Stress, burnout, anxiety and depression among teachers: A scoping review. International Journal of Environmental Research and Public Health, 19(17), 10706. https://doi.org/10.3390/ijerph191710706',
  'CASEL. (2020). CASEL’s SEL framework: What are the core competence areas and where are they promoted? https://casel.org/casel-sel-framework-11-2020/',
  'Coombs, P. H., & Ahmed, M. (1974). Attacking rural poverty: How nonformal education can help. Johns Hopkins University Press.',
  'Goleman, D. (1995). Emotional intelligence. Bantam Books.',
  'La Belle, T. J. (1982). Formal, nonformal and informal education: A holistic perspective on lifelong learning. International Review of Education, 28(2), 159-175.',
  'Mazefsky, C. A., Herrington, J., Siegel, M., Scarpa, A., Maddox, B. B., Scahill, L., & White, S. W. (2013). The role of emotion regulation in autism spectrum disorder. Journal of the American Academy of Child & Adolescent Psychiatry, 52(7), 679-688.',
  'Lei n.º 46/86, de 14 de outubro. (1986). Lei de Bases do Sistema Educativo. Diário da República. https://diariodarepublica.pt/dr/legislacao-consolidada/lei/1986-34444975',
  'Ribeiro, M. C., & Castro, M. (2021). Educação não formal: Perceções e potencialidades formativas. EDUSER: Revista de Educação, 13(2), 45-61. https://www.eduser.ipb.pt/index.php/eduser/article/download/166/161/492',
  'Schön, D. A. (1992). Formar professores como profissionais reflexivos. In A. Nóvoa (Coord.), Os professores e a sua formação (pp. 77-91). Publicações Dom Quixote.',
  'Steuer, G., Rosman, T., Pietschnig, J., et al. (2024). Error climate and alienation from teachers: The role of classroom goal structures and academic failure. Learning Environments Research. https://pmc.ncbi.nlm.nih.gov/articles/PMC11802967/',
]

const gallery = [
  {
    src: '/assets/dissertation/image1.jpg',
    caption: 'Construção de personagens da Disney com recurso a palitos.',
  },
  {
    src: '/assets/dissertation/image3.jpg',
    caption: 'Elaboração de gravatas para o Dia do Pai.',
  },
  {
    src: '/assets/dissertation/image4.jpg',
    caption: 'Atividade de associação de letras para formação de palavras.',
  },
  {
    src: '/assets/dissertation/image5.jpg',
    caption: 'Dinamização da atividade “Semáforo das Emoções”.',
  },
  {
    src: '/assets/dissertation/image2.png',
    caption: '“Semáforo das emoções” finalizado.',
  },
  {
    src: '/assets/dissertation/image7.png',
    caption: 'Jogo da memória das emoções.',
  },
  {
    src: '/assets/dissertation/image8.png',
    caption: 'Realização da ficha de consolidação.',
  },
]

const observedActivities = [
  {
    title: 'Atividades lúdicas e motoras',
    text: 'As atividades observadas mostraram como o brincar pode promover coordenação motora, equilíbrio, orientação espacial e motricidade global.',
    image: '/assets/dissertation/image1.jpg',
  },
  {
    title: 'Apoio individualizado',
    text: 'O estágio incluiu momentos de apoio direto, permitindo observar necessidades específicas e adaptar a intervenção ao ritmo dos participantes.',
    image: '/assets/dissertation/image4.jpg',
  },
  {
    title: 'Expressão e criatividade',
    text: 'As propostas manuais e artísticas surgiram como oportunidades para participação, interação e desenvolvimento de competências pessoais e sociais.',
    image: '/assets/dissertation/image3.jpg',
  },
]

const activityStages = [
  ['Acolhimento', 'Receção dos participantes e explicação inicial sobre o tema das emoções.'],
  ['Introdução ao tema', 'Conversa acessível sobre emoções como alegria, medo, tristeza e raiva.'],
  ['Exploração visual', 'Utilização do cartaz “Semáforo das Emoções” e cartões com situações do quotidiano.'],
  ['Partilha oral', 'Associação entre emoções e experiências pessoais dos participantes.'],
  ['Consolidação', 'Ficha de consolidação e jogo da memória das emoções.'],
  ['Encerramento', 'Síntese final, reforçando a importância de reconhecer e falar sobre emoções.'],
]

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.18 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}

function RevealSection({ children, id, tone = 'light' }) {
  const [ref, visible] = useReveal()
  return (
    <Section id={id} ref={ref} $visible={visible} $tone={tone}>
      {children}
    </Section>
  )
}

function App() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotion.matches) return undefined

    const onScroll = () => setScrollY(window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <GlobalStyle />
      <SiteNav aria-label="Navegação principal">
        <a href="#inicio" className="brand">Educar para Incluir</a>
        <NavLinks>
          {navItems.map(([href, label]) => (
            <a href={`#${href}`} key={href}>{label}</a>
          ))}
        </NavLinks>
      </SiteNav>

      <Hero id="inicio">
        <HeroBackdrop
          style={{ transform: `translate3d(0, ${scrollY * 0.12}px, 0)` }}
          aria-hidden="true"
        />
        <StickerLayer aria-hidden="true">
          <Sticker $top="26%" $right="8%" $rotate="9deg" $color="#b8cbb3">incluir</Sticker>
          <Sticker $bottom="9%" $right="28%" $rotate="-7deg" $color="#f3dbe7">emoções</Sticker>
          <Doodle $top="40%" $left="3%" $rotate="-14deg">+</Doodle>
          <Doodle $top="13%" $right="23%" $rotate="12deg">*</Doodle>
          <Doodle $bottom="28%" $right="5%" $rotate="-8deg">x</Doodle>
        </StickerLayer>
        <HeroContent>
          <Kicker>Relatório de estágio · Licenciatura em Educação Básica</Kicker>
          <h1>Educar para Incluir</h1>
          <HeroText>
            Estágio na APPDA-Madeira em contexto de educação não formal, com foco na inclusão,
            na adaptação pedagógica e na atividade “Semáforo das Emoções”.
          </HeroText>
          <MetaGrid>
            <span>Cristina Vares</span>
            <span>3.º ano</span>
            <span>Funchal, 2026</span>
          </MetaGrid>
        </HeroContent>
        <HeroCard>
          <Tape $top="10px" $left="18%">atividade central</Tape>
          <img src="/assets/dissertation/image6.png" alt="Material visual da atividade Semáforo das Emoções" />
        </HeroCard>
      </Hero>

      <main>
        <RevealSection id="contexto">
          <SectionSticker $top="4rem" $right="8%" $rotate="8deg">estágio</SectionSticker>
          <Split>
            <SectionIntro>
              <Kicker>01 · Contexto</Kicker>
              <h2>Contexto do Estágio</h2>
            </SectionIntro>
            <TextBlock>
              <p>
                O relatório descreve e reflete sobre a experiência de estágio realizada na Associação
                Portuguesa para as Perturbações do Desenvolvimento e Autismo da Madeira.
              </p>
              <p>
                A experiência permitiu contacto direto com um contexto educativo e social diferenciado,
                especialmente relevante no âmbito da educação não formal e informal, da inclusão e da
                participação social.
              </p>
            </TextBlock>
          </Split>
        </RevealSection>

        <RevealSection id="instituicao" tone="rose">
          <SectionSticker $top="4.5rem" $right="7%" $rotate="-7deg" $accent="#f8d65c">IPSS</SectionSticker>
          <SectionIntro>
            <Kicker>02 · Instituição</Kicker>
            <h2>APPDA-Madeira</h2>
            <Lead>
              A instituição é apresentada no relatório como uma IPSS sem fins lucrativos, fundada por um
              grupo de pais, com intervenção junto de crianças, jovens e adultos com perturbações do
              desenvolvimento e Perturbação do Espetro do Autismo.
            </Lead>
          </SectionIntro>
          <CardGrid>
            <InfoCard>
              <span>História</span>
              <h3>Resposta regional</h3>
              <p>A associação procura responder às necessidades das pessoas com PEA e das respetivas famílias na Região Autónoma da Madeira.</p>
            </InfoCard>
            <InfoCard>
              <span>Serviços</span>
              <h3>CAT, CAD e CFI</h3>
              <p>O relatório destaca o Centro de Apoio Terapêutico, o Centro de Atividades Diárias e o Centro de Férias Inclusivo.</p>
            </InfoCard>
            <InfoCard>
              <span>Projetos</span>
              <h3>Intervenção comunitária</h3>
              <p>São referidos projetos como “(Des)Montar o Puzzle”, “Encontros de Experiências com Liberdade” e ações de sensibilização.</p>
            </InfoCard>
          </CardGrid>
        </RevealSection>

        <RevealSection id="educacao">
          <SectionSticker $top="4rem" $right="9%" $rotate="9deg" $accent="#b8cbb3">não formal</SectionSticker>
          <Split>
            <SectionIntro>
              <Kicker>03 · Enquadramento</Kicker>
              <h2>Educação Não Formal</h2>
            </SectionIntro>
            <Diagram>
              <DiagramItem>
                <strong>Organizada</strong>
                <span>Atividades intencionais e sistemáticas.</span>
              </DiagramItem>
              <DiagramItem>
                <strong>Flexível</strong>
                <span>Adaptação a interesses e necessidades dos participantes.</span>
              </DiagramItem>
              <DiagramItem>
                <strong>Ao longo da vida</strong>
                <span>Aprendizagem para além do sistema formal de ensino.</span>
              </DiagramItem>
            </Diagram>
          </Split>
        </RevealSection>

        <RevealSection id="pratica" tone="sage">
          <SectionSticker $top="4rem" $right="8%" $rotate="-8deg" $accent="#c9c1df">refletir</SectionSticker>
          <SectionIntro>
            <Kicker>04 · Prática pedagógica</Kicker>
            <h2>Observar, adaptar e refletir</h2>
            <Lead>
              A prática pedagógica foi marcada pelo contacto com situações reais, pela observação de
              profissionais em ação e pela necessidade de ajustar a intervenção à diversidade dos participantes.
            </Lead>
          </SectionIntro>
          <PracticeList>
            <li>Desenvolvimento de competências de observação.</li>
            <li>Planeamento de atividades ajustadas à diversidade.</li>
            <li>Atenção à autonomia, comunicação, interação social e bem-estar.</li>
            <li>Reflexão sobre a ação e reformulação da intervenção.</li>
          </PracticeList>
        </RevealSection>

        <RevealSection id="observadas">
          <SectionSticker $top="4rem" $right="8%" $rotate="6deg">observar</SectionSticker>
          <SectionIntro>
            <Kicker>05 · Atividades observadas</Kicker>
            <h2>Momentos de aprendizagem em contexto</h2>
          </SectionIntro>
          <Timeline>
            {observedActivities.map((activity) => (
              <TimelineItem key={activity.title}>
                <img src={activity.image} alt={activity.title} />
                <div>
                  <h3>{activity.title}</h3>
                  <p>{activity.text}</p>
                </div>
              </TimelineItem>
            ))}
          </Timeline>
        </RevealSection>

        <FeatureSection id="atividade">
          <FeatureSticker aria-hidden="true">semáforo das emoções</FeatureSticker>
          <FeatureMedia style={{ transform: `translate3d(0, ${Math.max(scrollY - 2200, 0) * -0.035}px, 0)` }}>
            <img src="/assets/dissertation/image2.png" alt="Semáforo das emoções finalizado" />
          </FeatureMedia>
          <FeatureContent>
            <Kicker>06 · Atividade realizada</Kicker>
            <h2>Semáforo das Emoções</h2>
            <Lead>
              A atividade centrou-se na identificação e expressão emocional, procurando promover consciência
              emocional, comunicação, partilha e interação entre jovens/adultos com perturbações do
              desenvolvimento e Perturbação do Espetro do Autismo.
            </Lead>
            <Stats>
              <span><strong>25 março 2026</strong>Data</span>
              <span><strong>115 min</strong>Duração prevista</span>
              <span><strong>4</strong>Participantes</span>
            </Stats>
            <StageGrid>
              {activityStages.map(([title, text]) => (
                <StageCard key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </StageCard>
              ))}
            </StageGrid>
          </FeatureContent>
        </FeatureSection>

        <RevealSection id="reflexao" tone="lilac">
          <SectionSticker $top="4rem" $right="9%" $rotate="-5deg" $accent="#f8d65c">crescer</SectionSticker>
          <Split>
            <SectionIntro>
              <Kicker>07 · Reflexão crítica</Kicker>
              <h2>Aprendizagem pessoal e académica</h2>
            </SectionIntro>
            <TextBlock>
              <p>
                A experiência foi formativa, mas também trouxe consciência das exigências, tensões e desafios
                presentes em contextos de intervenção com pessoas com necessidades diversas.
              </p>
              <p>
                O relatório valoriza a importância de respeitar ritmos individuais, criar ambientes seguros
                para participar e compreender o erro como parte do processo de aprendizagem.
              </p>
            </TextBlock>
          </Split>
        </RevealSection>

        <RevealSection id="final">
          <SectionSticker $top="4rem" $right="8%" $rotate="8deg" $accent="#b8cbb3">futuro</SectionSticker>
          <SectionIntro>
            <Kicker>08 · Considerações finais</Kicker>
            <h2>Competências para o futuro profissional</h2>
            <Lead>
              O estágio contribuiu para compreender melhor a importância da adaptação, da empatia e do respeito
              pelas necessidades individuais dos participantes, reforçando competências de observação, planeamento
              e reflexão crítica sobre a prática pedagógica.
            </Lead>
          </SectionIntro>
        </RevealSection>

        <RevealSection id="referencias" tone="rose">
          <SectionIntro>
            <Kicker>09 · Referências</Kicker>
            <h2>Fontes utilizadas no relatório</h2>
          </SectionIntro>
          <ReferencesList>
            {references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ReferencesList>
        </RevealSection>

        <RevealSection id="anexos">
          <SectionIntro>
            <Kicker>10 · Anexos</Kicker>
            <h2>Galeria de atividades</h2>
          </SectionIntro>
          <GalleryGrid>
            {gallery.map((item) => (
              <GalleryItem key={item.caption}>
                <img src={item.src} alt={item.caption} />
                <figcaption>{item.caption}</figcaption>
              </GalleryItem>
            ))}
          </GalleryGrid>
        </RevealSection>
      </main>
    </>
  )
}

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650;9..144,750&family=Nunito+Sans:wght@400;600;700;800&display=swap');

  :root {
    color: #3f2b38;
    background: #fff8ef;
    font-family: 'Nunito Sans', system-ui, sans-serif;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    scroll-behavior: smooth;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    overflow-x: hidden;
    background:
      linear-gradient(rgba(214, 184, 203, 0.16) 1px, transparent 1px) 0 0 / 100% 34px,
      radial-gradient(circle at 8% 18%, rgba(248, 214, 92, 0.18), transparent 24%),
      #fff8ef;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img {
    display: block;
    max-width: 100%;
  }

  h1, h2, h3, p {
    margin: 0;
  }

  h1, h2, h3 {
    font-family: 'Fraunces', Georgia, serif;
    letter-spacing: 0;
  }

  h1 {
    color: #fff8ef;
    max-width: 920px;
    font-size: clamp(4.3rem, 11vw, 9.8rem);
    line-height: 0.84;
    text-shadow:
      3px 3px 0 #3f2b38,
      -2px 2px 0 #3f2b38,
      2px -2px 0 #3f2b38,
      0 12px 0 rgba(214, 184, 203, 0.72),
      0 26px 34px rgba(63, 43, 56, 0.24);
  }

  h2 {
    max-width: 780px;
    font-size: clamp(2.4rem, 5vw, 5.1rem);
    line-height: 0.95;
    text-shadow: 0 6px 0 rgba(214, 184, 203, 0.32);
  }

  h3 {
    font-size: clamp(1.3rem, 2vw, 1.8rem);
    line-height: 1.05;
  }

  p, li {
    font-size: clamp(1rem, 1.25vw, 1.16rem);
    line-height: 1.75;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.001ms !important;
    }
  }
`

const SiteNav = styled.nav`
  align-items: center;
  backdrop-filter: blur(18px);
  background: rgba(255, 250, 246, 0.78);
  border: 1px solid rgba(63, 43, 56, 0.1);
  border-radius: 999px;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  left: 50%;
  max-width: min(1120px, calc(100vw - 32px));
  padding: 0.7rem 0.85rem 0.7rem 1.25rem;
  position: fixed;
  top: 1rem;
  transform: translateX(-50%);
  width: 100%;
  z-index: 20;

  .brand {
    color: #6f465f;
    font-weight: 800;
    white-space: nowrap;
  }

  @media (max-width: 820px) {
    align-items: flex-start;
    border-radius: 24px;
    flex-direction: column;
  }
`

const NavLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  justify-content: flex-end;

  a {
    border-radius: 999px;
    color: #604654;
    font-size: 0.86rem;
    font-weight: 800;
    padding: 0.55rem 0.8rem;
    transition: background 220ms ease, color 220ms ease, transform 220ms ease;
  }

  a:hover,
  a:focus-visible {
    background: #d6b8cb;
    color: #3f2b38;
    transform: translateY(-1px);
  }
`

const Hero = styled.header`
  align-items: end;
  display: grid;
  gap: clamp(2rem, 5vw, 5rem);
  grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
  min-height: 100svh;
  overflow: hidden;
  padding: clamp(7rem, 12vw, 10rem) clamp(1.25rem, 5vw, 5rem) clamp(3rem, 7vw, 5rem);
  position: relative;

  &::after {
    background: linear-gradient(180deg, rgba(255,250,246,0), #fffaf6 80%);
    bottom: 0;
    content: '';
    height: 28%;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const HeroBackdrop = styled.div`
  background:
    linear-gradient(rgba(63, 43, 56, 0.06) 1px, transparent 1px) 0 0 / 100% 38px,
    radial-gradient(circle at 18% 26%, rgba(214, 184, 203, 0.9), transparent 28%),
    radial-gradient(circle at 82% 18%, rgba(184, 203, 179, 0.62), transparent 24%),
    radial-gradient(circle at 58% 78%, rgba(248, 214, 92, 0.44), transparent 25%),
    linear-gradient(135deg, #fff8ef 0%, #f3dbe7 42%, #ead8c0 100%);
  inset: -12% -4% 0;
  position: absolute;
  z-index: -2;
`

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
`

const Kicker = styled.p`
  background: #fff8ef;
  border: 2px solid #3f2b38;
  box-shadow: 4px 4px 0 #3f2b38;
  color: #3f2b38;
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  margin-bottom: 1.1rem;
  padding: 0.5rem 0.75rem;
  text-transform: uppercase;
`

const HeroText = styled.p`
  background: rgba(255, 248, 239, 0.74);
  border: 2px solid rgba(63, 43, 56, 0.78);
  box-shadow: 8px 8px 0 rgba(63, 43, 56, 0.18);
  font-size: clamp(1.15rem, 1.8vw, 1.45rem);
  line-height: 1.65;
  margin-top: 1.5rem;
  max-width: 710px;
  padding: 1rem 1.1rem;
`

const MetaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;

  span {
    background: #f3dbe7;
    border: 2px solid #3f2b38;
    border-radius: 999px;
    color: #563b4c;
    font-weight: 800;
    padding: 0.65rem 0.95rem;
  }

  span:nth-child(2) {
    background: #b8cbb3;
  }

  span:nth-child(3) {
    background: #f8d65c;
  }
`

const HeroCard = styled.figure`
  background: #fff8ef;
  border: 3px solid #3f2b38;
  border-radius: 8px;
  box-shadow: 14px 14px 0 #3f2b38, 0 34px 80px rgba(63, 43, 56, 0.18);
  margin: 0;
  overflow: visible;
  position: relative;
  transform: rotate(2deg);
  z-index: 1;

  img {
    aspect-ratio: 4 / 5;
    border-radius: 5px;
    height: min(62svh, 680px);
    object-fit: cover;
    object-position: 50% 28%;
    width: 100%;
  }
`

const StickerLayer = styled.div`
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 2;

  @media (max-width: 760px) {
    opacity: 0.72;
  }
`

const Sticker = styled.span`
  background: ${({ $color }) => $color || '#d6b8cb'};
  border: 2px solid #3f2b38;
  border-radius: 999px;
  box-shadow: 5px 5px 0 #3f2b38;
  color: #3f2b38;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  font-size: clamp(0.92rem, 1.4vw, 1.25rem);
  font-weight: 900;
  left: ${({ $left }) => $left || 'auto'};
  padding: 0.55rem 0.9rem;
  position: absolute;
  right: ${({ $right }) => $right || 'auto'};
  text-transform: uppercase;
  top: ${({ $top }) => $top || 'auto'};
  bottom: ${({ $bottom }) => $bottom || 'auto'};
  transform: rotate(${({ $rotate }) => $rotate || '0deg'});
`

const Doodle = styled.span`
  color: #3f2b38;
  font-family: Georgia, serif;
  font-size: clamp(2.2rem, 5vw, 4.8rem);
  font-weight: 900;
  left: ${({ $left }) => $left || 'auto'};
  line-height: 1;
  opacity: 0.72;
  position: absolute;
  right: ${({ $right }) => $right || 'auto'};
  top: ${({ $top }) => $top || 'auto'};
  bottom: ${({ $bottom }) => $bottom || 'auto'};
  transform: rotate(${({ $rotate }) => $rotate || '0deg'});
`

const Tape = styled.span`
  background: rgba(248, 214, 92, 0.88);
  border: 2px solid #3f2b38;
  box-shadow: 4px 4px 0 #3f2b38;
  color: #3f2b38;
  font-size: 0.84rem;
  font-weight: 900;
  left: ${({ $left }) => $left || 'auto'};
  letter-spacing: 0.08em;
  padding: 0.38rem 0.8rem;
  position: absolute;
  text-transform: uppercase;
  top: ${({ $top }) => $top || 'auto'};
  transform: rotate(-4deg);
  z-index: 10;
`

const SectionSticker = styled.span`
  background: ${({ $accent }) => $accent || '#d6b8cb'};
  border: 2px solid #3f2b38;
  border-radius: 999px;
  box-shadow: 5px 5px 0 #3f2b38;
  color: #3f2b38;
  font-size: clamp(0.82rem, 1.2vw, 1rem);
  font-weight: 900;
  padding: 0.5rem 0.8rem;
  position: absolute;
  right: ${({ $right }) => $right || '5%'};
  text-transform: uppercase;
  top: ${({ $top }) => $top || '3rem'};
  transform: rotate(${({ $rotate }) => $rotate || '0deg'});
  z-index: 2;

  @media (max-width: 720px) {
    opacity: 0.55;
    right: 1rem;
  }
`

const Section = styled.section`
  background: ${({ $tone }) => {
    if ($tone === 'rose') return '#f7dbe7'
    if ($tone === 'sage') return '#e3efdc'
    if ($tone === 'lilac') return '#ebe3f7'
    return '#fff8ef'
  }};
  border-top: 1px solid rgba(63, 43, 56, 0.08);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  padding: clamp(5rem, 9vw, 9rem) clamp(1.25rem, 5vw, 5rem);
  position: relative;
  scroll-margin-top: 7rem;
  transform: ${({ $visible }) => ($visible ? 'translateY(0)' : 'translateY(56px)')};
  transition: opacity 850ms cubic-bezier(.19,1,.22,1), transform 850ms cubic-bezier(.19,1,.22,1);

  &::before {
    background:
      linear-gradient(rgba(63, 43, 56, 0.05) 1px, transparent 1px) 0 0 / 100% 34px,
      radial-gradient(circle, rgba(63, 43, 56, 0.16) 1px, transparent 1.5px) 0 0 / 22px 22px;
    content: '';
    inset: 0;
    opacity: 0.45;
    pointer-events: none;
    position: absolute;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`

const Split = styled.div`
  align-items: start;
  display: grid;
  gap: clamp(2rem, 5vw, 5rem);
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  margin: 0 auto;
  max-width: 1180px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`

const SectionIntro = styled.div`
  margin: 0 auto 3rem;
  max-width: 1180px;
`

const Lead = styled.p`
  font-size: clamp(1.12rem, 1.6vw, 1.35rem);
  line-height: 1.75;
  margin-top: 1.4rem;
  max-width: 850px;
`

const TextBlock = styled.div`
  display: grid;
  gap: 1.35rem;
`

const CardGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 auto;
  max-width: 1180px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`

const InfoCard = styled.article`
  background: #fff8ef;
  border: 2px solid #3f2b38;
  border-radius: 8px;
  box-shadow: 8px 8px 0 rgba(63, 43, 56, 0.16);
  padding: clamp(1.25rem, 2.8vw, 2rem);
  transform: rotate(-1deg);

  &:nth-child(2) {
    transform: rotate(1deg);
  }

  &:nth-child(3) {
    transform: rotate(-0.5deg);
  }

  span {
    background: #d6b8cb;
    border: 2px solid #3f2b38;
    border-radius: 999px;
    color: #3f2b38;
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
    padding: 0.35rem 0.7rem;
    text-transform: uppercase;
  }

  p {
    margin-top: 1rem;
  }
`

const Diagram = styled.div`
  display: grid;
  gap: 1rem;
`

const DiagramItem = styled.div`
  align-items: center;
  background: #fff8ef;
  border: 2px solid #3f2b38;
  border-radius: 8px;
  box-shadow: 8px 8px 0 rgba(214, 184, 203, 0.85);
  display: grid;
  gap: 0.45rem;
  padding: 1.4rem;

  strong {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.5rem;
  }
`

const PracticeList = styled.ul`
  display: grid;
  gap: 0.85rem;
  list-style: none;
  margin: 0 auto;
  max-width: 900px;
  padding: 0;

  li {
    background: #fff8ef;
    border: 2px solid #3f2b38;
    border-radius: 8px;
    box-shadow: 6px 6px 0 rgba(63, 43, 56, 0.14);
    font-weight: 800;
    padding: 1rem 1.2rem;
  }

  li:nth-child(even) {
    background: #f3dbe7;
  }
`

const Timeline = styled.div`
  display: grid;
  gap: 1.4rem;
  margin: 0 auto;
  max-width: 1050px;
`

const TimelineItem = styled.article`
  align-items: center;
  display: grid;
  gap: clamp(1.25rem, 4vw, 3rem);
  grid-template-columns: 220px 1fr;

  img {
    aspect-ratio: 4 / 5;
    background: #fff8ef;
    border: 8px solid #fff8ef;
    box-shadow: 8px 8px 0 #d6b8cb, 0 18px 40px rgba(63, 43, 56, 0.16);
    border-radius: 8px;
    object-fit: cover;
    transform: rotate(-2deg);
    width: 100%;
  }

  &:nth-child(even) img {
    box-shadow: 8px 8px 0 #b8cbb3, 0 18px 40px rgba(63, 43, 56, 0.16);
    transform: rotate(2deg);
  }

  div {
    background: rgba(255, 248, 239, 0.72);
    border: 2px dashed rgba(63, 43, 56, 0.32);
    border-radius: 8px;
    padding: 1.25rem;
  }

  p {
    margin-top: 0.8rem;
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;

    img {
      max-height: 360px;
    }
  }
`

const FeatureSection = styled.section`
  align-items: stretch;
  background: #3f2b38;
  color: #fffaf6;
  display: grid;
  grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.18fr);
  min-height: 100svh;
  overflow: hidden;
  position: relative;
  scroll-margin-top: 5rem;

  ${Kicker} {
    color: #f3dbe7;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const FeatureMedia = styled.div`
  background: #d6b8cb;
  min-height: 420px;
  padding: clamp(1rem, 3vw, 2rem);

  img {
    border: 3px solid #fff8ef;
    box-shadow: 12px 12px 0 #f8d65c;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
    width: 100%;
  }
`

const FeatureContent = styled.div`
  padding: clamp(5rem, 8vw, 8rem) clamp(1.25rem, 5vw, 5rem);
  position: relative;
  z-index: 1;
`

const FeatureSticker = styled.span`
  background: #f8d65c;
  border: 2px solid #fff8ef;
  border-radius: 999px;
  box-shadow: 6px 6px 0 rgba(255, 248, 239, 0.22);
  color: #3f2b38;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 0.6rem 1rem;
  position: absolute;
  right: 5vw;
  text-transform: uppercase;
  top: 3rem;
  transform: rotate(7deg);
  z-index: 2;
`

const Stats = styled.div`
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, 1fr);
  margin: 2rem 0;

  span {
    background: rgba(255, 248, 239, 0.12);
    border: 2px solid rgba(255, 248, 239, 0.72);
    border-radius: 8px;
    box-shadow: 5px 5px 0 rgba(255, 248, 239, 0.14);
    display: grid;
    gap: 0.25rem;
    padding: 1rem;
  }

  strong {
    color: #f3dbe7;
    font-family: 'Fraunces', Georgia, serif;
    font-size: 1.45rem;
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`

const StageGrid = styled.div`
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(2, 1fr);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`

const StageCard = styled.article`
  background: rgba(255, 248, 239, 0.1);
  border: 2px dashed rgba(255, 248, 239, 0.34);
  border-radius: 8px;
  padding: 1rem;

  p {
    color: rgba(255, 250, 246, 0.8);
    font-size: 0.98rem;
    margin-top: 0.7rem;
  }
`

const ReferencesList = styled.ol`
  display: grid;
  gap: 0.85rem;
  margin: 0 auto;
  max-width: 1040px;
  padding-left: 1.25rem;

  li {
    background: rgba(255, 248, 239, 0.68);
    border: 1px solid rgba(63, 43, 56, 0.12);
    border-radius: 8px;
    overflow-wrap: anywhere;
    padding: 0.8rem 1rem;
  }
`

const GalleryGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 auto;
  max-width: 1180px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

const GalleryItem = styled.figure`
  background: #fff8ef;
  border: 2px solid #3f2b38;
  border-radius: 8px;
  box-shadow: 8px 8px 0 rgba(63, 43, 56, 0.16);
  margin: 0;
  overflow: hidden;
  transform: rotate(-1.2deg);

  &:nth-child(2n) {
    transform: rotate(1.2deg);
  }

  img {
    aspect-ratio: 4 / 5;
    object-fit: cover;
    width: 100%;
  }

  figcaption {
    color: #563b4c;
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.45;
    padding: 1rem;
  }
`

export default App
