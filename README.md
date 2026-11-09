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

A grama curta foi extraída para `assets/tiles/terrain/short-grass.png` e é repetida no fundo em escala 4×, acompanhando a escala do personagem.

O tileset `farm-buildings.png` também foi separado em 20 arquivos transparentes dentro de `assets/tiles/buildings/farm/`, incluindo celeiros, galinheiros, silo, poço, casas, estufa, moinho, obeliscos e estruturas decorativas. O arquivo `manifest.json` dessa pasta registra todas as coordenadas e dimensões de origem.

## Tela fixa

O projeto bloqueia rolagem, overscroll, zoom por pinça, duplo toque, roda do mouse e atalhos de zoom do navegador para manter o jogo sempre ocupando uma tela fixa.

## Grade de coordenadas

A tela exibe uma grade de tiles de 64×64 px sobre o terreno. Cada tile possui contorno vermelho interno e mostra sua coordenada no formato `x,y`, começando por `0,0` no canto superior esquerdo.

## Construções posicionadas

A primeira cabana do tileset `cabins.png` foi extraída para `assets/tiles/buildings/cabin-01.png`. Seu tile superior esquerdo está posicionado em `1,1`, equivalente a `left: 64px` e `top: 64px` na escala 4×.

### Colisão da cabana

Estão bloqueados os tiles `2,1`, `3,1`, `4,1` e todo o retângulo entre `1,2` e `5,6`. As exceções acessíveis são `3,5` e `3,6`, formando a passagem da porta. A colisão considera a área dos pés do personagem.

O tile `3,4` funciona como entrada: a cabeça do personagem nunca o ocupa. Ao tentar avançar por ele, o jogo muda para a rota `/house` e abre o cenário interno. A casa possui fundo externo preto, paredes sólidas, piso de madeira, móveis baseados nos novos tilesets e uma saída central inferior que retorna ao exterior.

O interior também exibe uma grade vermelha de tiles de 64×64 px, com coordenadas locais `x,y` iniciando em `0,0` no canto superior esquerdo da casa.

## Controles móveis

Em telas com largura de até 768 px, a interface assume o modo celular e é dividida em duas metades. O jogo ocupa a parte superior e um direcional com quatro botões aparece sobre fundo preto na parte inferior. Os botões suportam pressão contínua e dois toques simultâneos para movimento diagonal.

## Editor de mapas

- Clique em um tile para selecioná-lo e trocar sua textura pelas bibliotecas disponíveis.
- Use o botão de bloqueio para permitir ou impedir a passagem do jogador.
- Na aba **Construções**, escolha um objeto e clique no mapa para posicioná-lo com encaixe na grade.
- Construções ficam em uma segunda camada, independente do piso. O botão **Remover** apaga apenas a construção e revela o tile original que já estava embaixo.
- A cabana inicial também pertence a essa camada: ela pode ser removida pelo editor, liberando suas colisões e desativando a entrada da casa.
- Toda alteração é salva automaticamente no `localStorage`, seguindo o formato de `map.json`.

Os controles do editor ficam ocultos em telas de celular.

### Mapas salvos

A aba **Mapas** mantém a cena existente como **Cena inicial** e permite criar novos mapas vazios. Cada mapa possui tiles, bloqueios e construções independentes, com troca instantânea e salvamento automático no `localStorage`.
