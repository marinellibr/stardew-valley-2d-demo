# Fazendeiro 2D — protótipo

Protótipo simples em HTML, CSS e JavaScript puro.

> Demonstração técnica sem fins comerciais. Stardew Valley e seus elementos visuais pertencem aos respectivos detentores de direitos; os sprites são usados aqui apenas como referência de apresentação.

## Como abrir

Abra o arquivo `index.html` no navegador.

## Controles

- WASD
- Setas do teclado

O movimento usa o primeiro grid 4×4 da folha `assets/alex-sprites.png` fornecida para esta demonstração.

- Linha 1: para baixo
- Linha 2: para a direita
- Linha 3: para cima
- Linha 4: para a esquerda

Cada linha possui quatro quadros de animação.

O seletor na parte inferior alterna entre os dois grids 4×4:

- Bolinha verde: roupa tradicional, iniciando em `x = 0`
- Bolinha vermelha: segunda roupa, iniciando em `x = 192`

## Tilesets

As folhas recebidas foram organizadas em `assets/tilesets/`:

- `outdoors-spring.png`: terreno, vegetação e estruturas externas
- `farm-buildings.png`: construções da fazenda
- `cabins.png`: variações de cabanas

A grama curta foi extraída para `assets/tiles/terrain/short-grass.png` e é repetida no fundo em escala 2×, acompanhando a escala do personagem.

O tileset `farm-buildings.png` também foi separado em 20 arquivos transparentes dentro de `assets/tiles/buildings/farm/`, incluindo celeiros, galinheiros, silo, poço, casas, estufa, moinho, obeliscos e estruturas decorativas. O arquivo `manifest.json` dessa pasta registra todas as coordenadas e dimensões de origem.

## Tela fixa

O projeto bloqueia rolagem, overscroll, zoom por pinça, duplo toque, roda do mouse e atalhos de zoom do navegador para manter o jogo sempre ocupando uma tela fixa.

## Grade de coordenadas

A tela exibe uma grade de tiles de 32×32 px sobre o terreno. Cada tile possui contorno vermelho interno e mostra sua coordenada no formato `x,y`, começando por `0,0` no canto superior esquerdo.

Cada mapa externo possui limite fixo de **65×30 tiles**. No desktop, isso equivale a 2080×960 px; no celular, a grade usa tiles de 16 px e ocupa 1040×480 px. A câmera acompanha o jogador e o mantém no centro da tela durante o movimento, respeitando as bordas do mundo.

## Construções posicionadas

A primeira cabana do tileset `cabins.png` foi extraída para `assets/tiles/buildings/cabin-01.png`. Seu tile superior esquerdo está posicionado em `1,1`, equivalente a `left: 32px` e `top: 32px` na escala 2×.

### Colisão da cabana

Estão bloqueados os tiles `2,1`, `3,1`, `4,1` e todo o retângulo entre `1,2` e `5,6`. As exceções acessíveis são `3,5` e `3,6`, formando a passagem da porta. A colisão considera a área dos pés do personagem.

O tile `3,4` funciona como entrada: a cabeça do personagem nunca o ocupa. Ao tentar avançar por ele, o jogo muda para a rota `/house` e abre o cenário interno. A casa possui fundo externo preto, paredes sólidas, piso de madeira, móveis baseados nos novos tilesets e uma saída central inferior que retorna ao exterior.

O interior também exibe uma grade vermelha de tiles de 32×32 px, com coordenadas locais `x,y` iniciando em `0,0` no canto superior esquerdo da casa.

## Controles móveis

Em celulares, o mapa ocupa toda a tela e os controles aparecem de forma semitransparente sobre os tiles. O direcional fica no canto inferior esquerdo e as ações no canto inferior direito. Em paisagem, os controles ficam compactos e os botões de ação são alinhados horizontalmente. Os botões suportam pressão contínua e multitoque para correr enquanto o personagem se movimenta.

Ao lado do direcional há dois botões de ação: segure o ícone de corrida para aumentar a velocidade em 85% e toque no ícone da mão para interagir com entradas e saídas próximas. No teclado, os equivalentes são `Shift` para correr e `E`, `Enter/Return` ou `Numpad Enter` para interagir.

No celular, a grade de edição fica visualmente oculta para não desenhar bordas sobre as construções. As imagens das construções permanecem na resolução nativa e usam apenas `transform: scale()` no desktop.

## Editor de mapas

- Clique em um tile para selecioná-lo e trocar sua textura pelas bibliotecas disponíveis.
- Ao escolher um tile da biblioteca, ele vira um pincel com prévia encaixada na grade; clique e arraste para pintar continuamente o mapa.
- Use o botão de bloqueio para permitir ou impedir a passagem do jogador.
- Na aba **Construções**, escolha um objeto e clique no mapa para posicioná-lo com encaixe na grade.
- Construções ficam em uma segunda camada, independente do piso. O botão **Remover** apaga apenas a construção e revela o tile original que já estava embaixo.
- A cabana inicial também pertence a essa camada: ela pode ser removida pelo editor, liberando suas colisões e desativando a entrada da casa.
- Toda alteração é salva automaticamente no `localStorage`, seguindo o formato de `map.json`.

Os controles do editor ficam ocultos em telas de celular.

### Mapas salvos

A aba **Mapas** mantém a cena existente como **Cena inicial**, permite criar novos mapas e excluir os que não forem mais necessários (o último mapa fica protegido). Cada mapa possui tiles, bloqueios, construções e animais independentes, com troca instantânea e salvamento automático no `localStorage`.

Na aba **Tiles**, as ferramentas **Vazio** e **Restaurar** também funcionam como pincel. Vazio recorta o piso e transforma a área em limite sólido; Restaurar remove a edição daquele ponto e revela novamente o piso-base.

O editor de tiles possui os modos **Pincel**, para aplicar enquanto o cursor é arrastado, e **1 quadrado**, para alterar apenas um tile por clique.

Dentro de **Tiles**, as abas **Crops**, **Bushes**, **Fruit Trees** e **Grass** expõem as quatro folhas de ambiente em uma grade de 16 px. Qualquer célula pode ser aplicada com o mesmo pincel ou individualmente, preservando a transparência sobre o piso e o salvamento independente de cada mapa.

### Furniture

A folha `furniture.png` não aparece mais como tiles isolados. A aba **Furniture** exibe a folha inteira e permite arrastar uma seleção com snap de 16 px ao redor de qualquer objeto ou visão. Assim, vistas frontais e laterais são recortadas separadamente e cada seleção vira um móvel completo, posicionado com snap e salvo em uma camada própria acima do piso e das construções. Cada móvel pode ser removido sem alterar as camadas inferiores.

A aba **Construções** também permite selecionar diretamente células de `farm-buildings.png`. Um clique marca ou desmarca um quadrado de 16 px; mantendo pressionado e arrastando, várias células são adicionadas ou removidas. **Usar seleção** combina as células marcadas em uma única construção, mantendo transparentes as áreas não selecionadas. A grade mantém as bordas de edição, mas não exibe mais números dentro dos tiles.

Os recortes rápidos de construções usam uma moldura lógica alinhada a 16 px. As margens transparentes originais são preservadas para que portas, bases e paredes encaixem corretamente na grade, inclusive nos sprites cujas dimensões visíveis não são múltiplas de 16.

### Animais

A aba **Animais** oferece porco, cavalo, cachorro cinza, vaca branca e galinha marrom, separados em `assets/animals/`. Eles são posicionados com snap na grade, salvos por mapa e caminham em direções aleatórias. Ao encontrar uma parede, construção bloqueada ou limite do mapa, viram para o sentido oposto.
