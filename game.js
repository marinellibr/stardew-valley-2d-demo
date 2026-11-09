const game = document.querySelector("#game");
const canvas = document.querySelector("#player");
const context = canvas.getContext("2d");
const spriteSheet = new Image();
const tileGrid = document.querySelector("#tile-grid");
const houseRoom = document.querySelector("#house-room");
const houseTileGrid = document.querySelector("#house-tile-grid");
const outdoorMapLayer = document.querySelector("#outdoor-map-layer");
const houseMapLayer = document.querySelector("#house-map-layer");
const outdoorBuildingsLayer = document.querySelector("#outdoor-buildings-layer");
const houseBuildingsLayer = document.querySelector("#house-buildings-layer");
const outdoorAnimalsLayer = document.querySelector("#outdoor-animals-layer");
const houseAnimalsLayer = document.querySelector("#house-animals-layer");
const outdoorFurnitureLayer = document.querySelector("#outdoor-furniture-layer");
const houseFurnitureLayer = document.querySelector("#house-furniture-layer");
const mapEditor = document.querySelector("#map-editor");
const selectedTileLabel = document.querySelector("#selected-tile-label");
const toggleTileBlock = document.querySelector("#toggle-tile-block");
const buildingLibrary = document.querySelector("#building-library");
const placedBuildingList = document.querySelector("#placed-building-list");
const placedBuildingsTitle = document.querySelector("#placed-buildings-title");
const mapLibraryElement = document.querySelector("#map-library");
const animalLibrary = document.querySelector("#animal-library");
const placedAnimalList = document.querySelector("#placed-animal-list");
const placedAnimalsTitle = document.querySelector("#placed-animals-title");
const furnitureLibrary = document.querySelector("#furniture-library");
const placedFurnitureList = document.querySelector("#placed-furniture-list");
const placedFurnitureTitle = document.querySelector("#placed-furniture-title");
const buildingSourceSheet = document.querySelector("#building-source-sheet");
const buildingSourceCells = document.querySelector("#building-source-cells");
const useBuildingSelection = document.querySelector("#use-building-selection");
const clearBuildingSelection = document.querySelector("#clear-building-selection");
const furnitureSourceSheet = document.querySelector("#furniture-source-sheet");
const furnitureSourceSelection = document.querySelector("#furniture-source-selection");
const eraseTileTool = document.querySelector("#erase-tile-tool");
const restoreTileTool = document.querySelector("#restore-tile-tool");

context.imageSmoothingEnabled = false;
spriteSheet.src = "assets/alex-sprites.png";

const FRAME_WIDTH = 16;
const FRAME_HEIGHT = 32;
const FRAMES_PER_DIRECTION = 4;
const MOBILE_GAME = window.matchMedia(
  "(max-width: 768px), (orientation: landscape) and (max-height: 500px)",
).matches;
const TILE_SIZE = MOBILE_GAME ? 16 : 32;
const STORAGE_KEY = "stardew-map-editor-v1";
const SHEET_SCALE = MOBILE_GAME ? 1 : 2;
const PICKER_SCALE = 2;
const DEFAULT_MAP_COLUMNS = 65;
const DEFAULT_MAP_ROWS = 30;

const FARM_BUILDING_RECTS = {
  "barn-01": { x: 0, y: 0, width: 112, height: 124 },
  "barn-02": { x: 128, y: 0, width: 112, height: 124 },
  "barn-03": { x: 256, y: 0, width: 116, height: 124 },
  silo: { x: 384, y: 0, width: 64, height: 128 },
  well: { x: 448, y: 16, width: 64, height: 96 },
  "special-building": { x: 600, y: 0, width: 184, height: 148 },
  "obelisk-01": { x: 800, y: 0, width: 56, height: 148 },
  "obelisk-02": { x: 864, y: 0, width: 55, height: 148 },
  "coop-01": { x: 0, y: 124, width: 116, height: 132 },
  "coop-02": { x: 128, y: 124, width: 116, height: 132 },
  "coop-03": { x: 256, y: 124, width: 116, height: 132 },
  shed: { x: 376, y: 128, width: 72, height: 112 },
  "construction-frame": { x: 480, y: 96, width: 120, height: 144 },
  "tree-huts": { x: 600, y: 160, width: 192, height: 80 },
  "farmhouse-01": { x: 0, y: 264, width: 148, height: 148 },
  "farmhouse-02": { x: 152, y: 264, width: 152, height: 148 },
  "farmhouse-03": { x: 304, y: 264, width: 156, height: 148 },
  greenhouse: { x: 480, y: 240, width: 120, height: 172 },
  windmill: { x: 600, y: 240, width: 232, height: 172 },
  clock: { x: 840, y: 152, width: 56, height: 88 },
};

function alignBuildingAsset(asset, rect) {
  if (!rect) return asset;
  const x = Math.floor(rect.x / 16) * 16;
  const y = Math.floor(rect.y / 16) * 16;
  const right = Math.ceil((rect.x + rect.width) / 16) * 16;
  const bottom = Math.ceil((rect.y + rect.height) / 16) * 16;
  return {
    ...asset,
    x,
    y,
    width: right - x,
    height: bottom - y,
    visibleWidth: rect.width,
    visibleHeight: rect.height,
    trimOffsetX: rect.x - x,
    trimOffsetY: rect.y - y,
    alignedFile: true,
    custom: true,
  };
}

const SHEETS = {
  "outdoors-spring": { file: "assets/tilesets/outdoors-spring.png", width: 656, height: 1664 },
  flooring: { file: "assets/tilesets/flooring.png", width: 512, height: 256 },
  "farm-buildings": { file: "assets/tilesets/farm-buildings.png", width: 919, height: 412 },
  cabins: { file: "assets/tilesets/cabins.png", width: 240, height: 784 },
  farmhouse: { file: "assets/tilesets/farmhouse.png", width: 192, height: 352 },
  "environment-crops": { file: "assets/tilesets/environment-crops.png", width: 256, height: 832 },
  "environment-bushes": { file: "assets/tilesets/environment-bushes.png", width: 128, height: 352 },
  "environment-fruit-trees": { file: "assets/tilesets/environment-fruit-trees.png", width: 432, height: 720 },
  "environment-grass": { file: "assets/tilesets/environment-grass.png", width: 66, height: 240 },
};

const BUILDING_ASSETS = [
  {
    name: "cabin-01",
    file: "assets/tiles/buildings/cabin-01.png",
    width: 80,
    height: 112,
    blockedTiles: [
      [1, 0], [2, 0], [3, 0],
      [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
      [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
      [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
      [0, 4], [1, 4], [3, 4], [4, 4],
      [0, 5], [1, 5], [3, 5], [4, 5],
    ],
  },
  { name: "barn-01", width: 112, height: 124 },
  { name: "barn-02", width: 112, height: 124 },
  { name: "barn-03", width: 116, height: 124 },
  { name: "silo", width: 64, height: 128 },
  { name: "well", width: 64, height: 96 },
  { name: "special-building", width: 184, height: 148 },
  { name: "obelisk-01", width: 56, height: 148 },
  { name: "obelisk-02", width: 55, height: 148 },
  { name: "coop-01", width: 116, height: 132 },
  { name: "coop-02", width: 116, height: 132 },
  { name: "coop-03", width: 116, height: 132 },
  { name: "shed", width: 72, height: 112 },
  { name: "construction-frame", width: 120, height: 144 },
  { name: "tree-huts", width: 192, height: 80 },
  { name: "farmhouse-01", width: 148, height: 148 },
  { name: "farmhouse-02", width: 152, height: 148 },
  { name: "farmhouse-03", width: 156, height: 148 },
  { name: "greenhouse", width: 120, height: 172 },
  { name: "windmill", width: 232, height: 172 },
  { name: "clock", width: 56, height: 88 },
].map((asset) => alignBuildingAsset(
  { ...asset, file: asset.file ?? `assets/tiles/buildings/farm/${asset.name}.png` },
  FARM_BUILDING_RECTS[asset.name],
));

const ANIMAL_ASSETS = [
  { name: "pig", label: "Porco", file: "assets/animals/pig.png", width: 128, height: 160, frame: 32, frames: 4 },
  { name: "horse", label: "Cavalo", file: "assets/animals/horse.png", width: 224, height: 128, frame: 32, frames: 4 },
  { name: "dog-grey", label: "Cachorro cinza", file: "assets/animals/dog-grey.png", width: 128, height: 288, frame: 32, frames: 4 },
  { name: "cow-white", label: "Vaca branca", file: "assets/animals/cow-white.png", width: 128, height: 160, frame: 32, frames: 4 },
  { name: "chicken-brown", label: "Galinha marrom", file: "assets/animals/chicken-brown.png", width: 64, height: 112, frame: 16, frames: 4 },
].map((asset) => {
  const image = new Image();
  image.src = asset.file;
  return { ...asset, image };
});

const furnitureSheet = new Image();
furnitureSheet.src = "assets/tilesets/furniture.png";
const buildingSheet = new Image();
buildingSheet.src = "assets/tilesets/farm-buildings.png";

// Cada entrada descreve o retângulo completo de um móvel, nunca um tile isolado.
const FURNITURE_ASSETS = [
  { name: "oak-chair", label: "Cadeira de carvalho", x: 0, y: 0, width: 16, height: 32 },
  { name: "mahogany-chair", label: "Cadeira de mogno", x: 128, y: 0, width: 16, height: 32 },
  { name: "blue-armchair", label: "Poltrona azul", x: 0, y: 144, width: 32, height: 32 },
  { name: "red-armchair", label: "Poltrona vermelha", x: 96, y: 144, width: 32, height: 32 },
  { name: "green-armchair", label: "Poltrona verde", x: 192, y: 144, width: 32, height: 32 },
  { name: "orange-armchair", label: "Poltrona laranja", x: 288, y: 144, width: 32, height: 32 },
  { name: "blue-armchair-side", label: "Poltrona azul lateral", x: 32, y: 144, width: 32, height: 32 },
  { name: "red-armchair-side", label: "Poltrona vermelha lateral", x: 128, y: 144, width: 32, height: 32 },
  { name: "green-armchair-side", label: "Poltrona verde lateral", x: 224, y: 144, width: 32, height: 32 },
  { name: "orange-armchair-side", label: "Poltrona laranja lateral", x: 320, y: 144, width: 32, height: 32 },
  { name: "brown-armchair", label: "Poltrona marrom", x: 384, y: 144, width: 32, height: 32 },
];

const LEGACY_CABIN_BLOCKED = [
  "2,1", "3,1", "4,1",
  "1,2", "2,2", "3,2", "4,2", "5,2",
  "1,3", "2,3", "3,3", "4,3", "5,3",
  "1,4", "2,4", "3,4", "4,4", "5,4",
  "1,5", "2,5", "4,5", "5,5",
  "1,6", "2,6", "4,6", "5,6",
];

const DEFAULT_MAP = {
  version: 6,
  tileSize: TILE_SIZE,
  dimensions: { columns: DEFAULT_MAP_COLUMNS, rows: DEFAULT_MAP_ROWS },
  maps: {
    outdoor: {
      defaultTile: { sheet: "outdoors-spring", x: 32, y: 208 },
      tiles: {},
      blocked: [],
      buildings: [{ id: "default-cabin-01", asset: "cabin-01", x: TILE_SIZE, y: TILE_SIZE }],
      animals: [],
      furniture: [],
    },
    house: { defaultTile: null, tiles: {}, blocked: [], buildings: [], animals: [], furniture: [] },
  },
};

function migrateSingleMap(parsed) {
  Object.values(parsed.maps).forEach((scene) => {
    scene.animals ??= [];
    scene.furniture ??= [];
  });
  if ((parsed.version ?? 1) < 2) {
    const legacyCollision = new Set(LEGACY_CABIN_BLOCKED);
    parsed.maps.outdoor.blocked = parsed.maps.outdoor.blocked.filter(
      (tile) => !legacyCollision.has(tile),
    );
    if (!parsed.maps.outdoor.buildings.some((building) => building.id === "default-cabin-01")) {
      parsed.maps.outdoor.buildings.unshift({
        id: "default-cabin-01",
        asset: "cabin-01",
        x: 64,
        y: 64,
      });
    }
    parsed.version = 2;
  }
  if (parsed.tileSize !== TILE_SIZE) {
    const scaleRatio = TILE_SIZE / (parsed.tileSize || 64);
    Object.values(parsed.maps).forEach((scene) => {
      scene.buildings.forEach((building) => {
        building.x *= scaleRatio;
        building.y *= scaleRatio;
      });
      scene.animals.forEach((animal) => {
        animal.x *= scaleRatio;
        animal.y *= scaleRatio;
      });
      scene.furniture.forEach((item) => {
        item.x *= scaleRatio;
        item.y *= scaleRatio;
      });
    });
    parsed.tileSize = TILE_SIZE;
    parsed.version = 6;
  }
  parsed.dimensions = { columns: DEFAULT_MAP_COLUMNS, rows: DEFAULT_MAP_ROWS };
  parsed.version = 6;
  return parsed;
}

function loadMapLibrary() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === 3 && Array.isArray(parsed.mapList)) {
        parsed.mapList.forEach((entry) => migrateSingleMap(entry.data));
        return parsed;
      }
      return {
        version: 3,
        activeMapId: "initial-scene",
        mapList: [{ id: "initial-scene", name: "Cena inicial", data: migrateSingleMap(parsed) }],
      };
    }
  } catch (error) {
    console.warn("Não foi possível ler o mapa do localStorage.", error);
  }
  return {
    version: 3,
    activeMapId: "initial-scene",
    mapList: [{
      id: "initial-scene",
      name: "Cena inicial",
      data: JSON.parse(JSON.stringify(DEFAULT_MAP)),
    }],
  };
}

const mapLibrary = loadMapLibrary();
const initialMapEntry = mapLibrary.mapList.find((entry) => entry.id === mapLibrary.activeMapId)
  ?? mapLibrary.mapList[0];
let activeMapId = initialMapEntry.id;
let mapState = initialMapEntry.data;
let selectedMapTile = null;
let buildingPlacement = null;
let animalPlacement = null;
let furniturePlacement = null;
let furnitureCropSelection = null;
const buildingSelectedCells = new Set();
let buildingCellGesture = null;
let tilePaintMode = "brush";
let tileBrush = null;
let suppressNextTileClick = false;
let currentScene = "outdoor";

const outfitSourceX = {
  green: 0,
  red: 192,
};

// Primeiro grid 4x4: uma linha por direção e quatro passos por linha.
const directionRow = {
  down: 0,
  right: 1,
  up: 2,
  left: 3,
};

const keys = new Set();
const player = {
  x: 0,
  y: 0,
  speed: MOBILE_GAME ? 58 : 116,
  direction: "down",
  moving: false,
  frame: 0,
  animationTime: 0,
  outfit: "green",
  running: false,
};
const camera = { x: 0, y: 0 };
const animalRuntime = new Map();
let animalPersistTime = 0;

const controlKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

const zoomShortcutKeys = new Set(["+", "=", "-", "0"]);

function drawPlayer() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.drawImage(
    spriteSheet,
    outfitSourceX[player.outfit] + player.frame * FRAME_WIDTH,
    directionRow[player.direction] * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}

function editorEnabled() {
  return !MOBILE_GAME;
}

function persistMap() {
  try {
    const activeEntry = mapLibrary.mapList.find((entry) => entry.id === activeMapId);
    if (activeEntry) activeEntry.data = mapState;
    mapLibrary.activeMapId = activeMapId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapLibrary));
  } catch (error) {
    console.warn("Não foi possível salvar o mapa no localStorage.", error);
  }
}

function emptyMapState() {
  const empty = JSON.parse(JSON.stringify(DEFAULT_MAP));
  empty.maps.outdoor.buildings = [];
  empty.maps.outdoor.animals = [];
  empty.maps.outdoor.furniture = [];
  empty.maps.outdoor.blocked = [];
  empty.maps.house.buildings = [];
  empty.maps.house.animals = [];
  empty.maps.house.furniture = [];
  empty.maps.house.blocked = [];
  return empty;
}

function renderMapLibrary() {
  const fragment = document.createDocumentFragment();
  mapLibrary.mapList.forEach((entry) => {
    const card = document.createElement("div");
    const selectButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    const summary = document.createElement("span");
    const outdoor = entry.data.maps.outdoor;
    const editedTileCount = Object.keys(outdoor.tiles).length;
    const buildingCount = outdoor.buildings.length;
    const animalCount = outdoor.animals.length;
    const furnitureCount = outdoor.furniture.length;

    card.className = "map-card";
    card.classList.toggle("is-active", entry.id === activeMapId);
    selectButton.className = "map-card-select";
    selectButton.type = "button";
    selectButton.setAttribute("aria-label", `Abrir ${entry.name}`);
    copy.className = "map-card-copy";
    name.textContent = entry.name;
    summary.textContent = `${editedTileCount} tiles · ${buildingCount} construções · ${furnitureCount} móveis · ${animalCount} animais`;
    copy.append(name, summary);
    deleteButton.className = "delete-map-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.disabled = mapLibrary.mapList.length === 1;
    deleteButton.setAttribute("aria-label", `Excluir ${entry.name}`);
    deleteButton.addEventListener("click", () => deleteMap(entry.id));
    card.append(selectButton, copy, deleteButton);
    selectButton.addEventListener("click", () => activateMap(entry.id));
    fragment.append(card);
  });
  mapLibraryElement.replaceChildren(fragment);
}

function activateMap(id) {
  if (id === activeMapId) return;
  persistMap();
  const entry = mapLibrary.mapList.find((candidate) => candidate.id === id);
  if (!entry) return;

  activeMapId = id;
  mapState = entry.data;
  selectedMapTile = null;
  buildTileGrid();
  buildHouseTileGrid();
  showScene("outdoor");
  centerPlayer();
  persistMap();
  renderMapLibrary();
  selectedTileLabel.textContent = entry.name;
  mapEditor.classList.add("is-open");
}

function createMap() {
  const number = mapLibrary.mapList.length + 1;
  const entry = {
    id: `map-${Date.now()}`,
    name: `Mapa ${number}`,
    data: emptyMapState(),
  };
  mapLibrary.mapList.push(entry);
  activateMap(entry.id);
}

function deleteMap(id) {
  if (mapLibrary.mapList.length <= 1) return;
  const index = mapLibrary.mapList.findIndex((entry) => entry.id === id);
  if (index < 0) return;
  const entry = mapLibrary.mapList[index];
  if (!window.confirm(`Excluir o mapa “${entry.name}”? Esta ação não pode ser desfeita.`)) return;

  mapLibrary.mapList.splice(index, 1);
  if (id === activeMapId) {
    const nextEntry = mapLibrary.mapList[Math.min(index, mapLibrary.mapList.length - 1)];
    activeMapId = nextEntry.id;
    mapState = nextEntry.data;
    selectedMapTile = null;
    buildTileGrid();
    buildHouseTileGrid();
    showScene("outdoor");
    centerPlayer();
  }
  persistMap();
  renderMapLibrary();
}

function sceneMap(scene = currentScene) {
  return mapState.maps[scene];
}

function isMapTileBlocked(scene, x, y) {
  if (sceneMap(scene).tiles[`${x},${y}`]?.empty) return true;
  if (sceneMap(scene).blocked.includes(`${x},${y}`)) return true;

  return sceneMap(scene).buildings.some((building) => {
    const asset = BUILDING_ASSETS.find((candidate) => candidate.name === building.asset);
    if (!asset?.blockedTiles) return false;
    const originX = building.x / TILE_SIZE;
    const originY = building.y / TILE_SIZE;
    return asset.blockedTiles.some(
      ([offsetX, offsetY]) => originX + offsetX === x && originY + offsetY === y,
    );
  });
}

function applyTileStyle(element, tile) {
  element.classList.toggle("is-empty", Boolean(tile?.empty));
  if (!tile) {
    element.removeAttribute("style");
    return;
  }

  if (tile.empty) {
    element.removeAttribute("style");
    return;
  }

  const sheet = SHEETS[tile.sheet];
  if (!sheet) return;
  element.style.backgroundImage = `url("${sheet.file}")`;
  element.style.backgroundSize = `${sheet.width * SHEET_SCALE}px ${sheet.height * SHEET_SCALE}px`;
  element.style.backgroundPosition = `${-tile.x * SHEET_SCALE}px ${-tile.y * SHEET_SCALE}px`;
}

function mapDimensions(scene) {
  if (scene === "house") {
    return {
      columns: Math.ceil(houseRoom.clientWidth / TILE_SIZE),
      rows: Math.ceil(houseRoom.clientHeight / TILE_SIZE),
    };
  }
  return mapState.dimensions;
}

function outdoorWorldSize() {
  const { columns, rows } = mapDimensions("outdoor");
  return { width: columns * TILE_SIZE, height: rows * TILE_SIZE };
}

function renderMapLayer(scene) {
  const layer = scene === "house" ? houseMapLayer : outdoorMapLayer;
  const { columns, rows } = mapDimensions(scene);
  const fragment = document.createDocumentFragment();
  layer.replaceChildren();
  layer.style.gridTemplateColumns = `repeat(${columns}, ${TILE_SIZE}px)`;
  layer.style.gridTemplateRows = `repeat(${rows}, ${TILE_SIZE}px)`;
  layer.style.width = `${columns * TILE_SIZE}px`;
  layer.style.height = `${rows * TILE_SIZE}px`;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const cell = document.createElement("div");
      cell.className = "map-tile-cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      applyTileStyle(cell, sceneMap(scene).tiles[`${x},${y}`]);
      fragment.append(cell);
    }
  }

  layer.append(fragment);
}

function refreshGridState(scene) {
  const grid = scene === "house" ? houseTileGrid : tileGrid;
  grid.querySelectorAll(".tile-coordinate").forEach((tile) => {
    const x = Number(tile.dataset.x);
    const y = Number(tile.dataset.y);
    tile.classList.toggle("is-blocked", isMapTileBlocked(scene, x, y));
    tile.classList.toggle(
      "is-selected",
      selectedMapTile?.scene === scene && selectedMapTile.x === x && selectedMapTile.y === y,
    );
  });
}

function buildingAssetForItem(building) {
  return BUILDING_ASSETS.find((candidate) => candidate.name === building.asset)
    ?? (building.source ? { ...building.source, name: building.asset, label: building.label ?? "Recorte da folha", custom: true } : null);
}

function drawBuildingCrop(target, asset) {
  const drawingContext = target.getContext("2d");
  drawingContext.imageSmoothingEnabled = false;
  drawingContext.clearRect(0, 0, asset.width, asset.height);
  if (asset.alignedFile) {
    asset.image ??= new Image();
    const drawAlignedFile = () => {
      drawingContext.clearRect(0, 0, asset.width, asset.height);
      drawingContext.drawImage(
        asset.image,
        asset.trimOffsetX,
        asset.trimOffsetY,
        asset.visibleWidth,
        asset.visibleHeight,
      );
    };
    if (asset.image.complete && asset.image.naturalWidth) drawAlignedFile();
    else asset.image.addEventListener("load", drawAlignedFile, { once: true });
    if (!asset.image.src) asset.image.src = asset.file;
    return;
  }
  if (!buildingSheet.complete || !buildingSheet.naturalWidth) return;
  if (asset.cells?.length) {
    asset.cells.forEach((cell) => {
      const cellWidth = Math.min(16, 919 - cell.x);
      const cellHeight = Math.min(16, 412 - cell.y);
      drawingContext.drawImage(
        buildingSheet,
        cell.x,
        cell.y,
        cellWidth,
        cellHeight,
        cell.x - asset.x,
        cell.y - asset.y,
        cellWidth,
        cellHeight,
      );
    });
    return;
  }
  drawingContext.drawImage(
    buildingSheet,
    asset.x,
    asset.y,
    asset.width,
    asset.height,
    0,
    0,
    asset.width,
    asset.height,
  );
}

function makeBuildingElement(asset, className = "placed-building") {
  if (!asset.custom) {
    const image = document.createElement("img");
    image.className = className;
    image.src = asset.file;
    image.alt = "";
    image.style.width = `${asset.width}px`;
    image.style.height = `${asset.height}px`;
    return image;
  }
  const cropCanvas = document.createElement("canvas");
  cropCanvas.className = className;
  cropCanvas.width = asset.width;
  cropCanvas.height = asset.height;
  cropCanvas.style.width = `${asset.width}px`;
  cropCanvas.style.height = `${asset.height}px`;
  drawBuildingCrop(cropCanvas, asset);
  if (!buildingSheet.complete) {
    buildingSheet.addEventListener("load", () => drawBuildingCrop(cropCanvas, asset), { once: true });
  }
  return cropCanvas;
}

function renderPlacedBuildings(scene) {
  const layer = scene === "house" ? houseBuildingsLayer : outdoorBuildingsLayer;
  const fragment = document.createDocumentFragment();
  layer.replaceChildren();
  for (const building of sceneMap(scene).buildings) {
    const asset = buildingAssetForItem(building);
    if (!asset) continue;
    const image = makeBuildingElement(asset);
    image.style.left = `${building.x}px`;
    image.style.top = `${building.y}px`;
    image.style.transform = `scale(${SHEET_SCALE})`;
    fragment.append(image);
  }
  layer.append(fragment);
  renderPlacedBuildingList(scene);
}

function removePlacedBuilding(scene, id) {
  const buildings = sceneMap(scene).buildings;
  const buildingIndex = buildings.findIndex((building) => building.id === id);
  if (buildingIndex === -1) return;

  buildings.splice(buildingIndex, 1);
  persistMap();
  renderPlacedBuildings(scene);
  refreshGridState(scene);
}

function renderPlacedBuildingList(scene = currentScene) {
  placedBuildingsTitle.textContent = `Construções colocadas · ${scene === "house" ? "casa" : "exterior"}`;
  const buildings = sceneMap(scene).buildings;

  if (buildings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "placed-building-empty";
    empty.textContent = "Nenhuma construção nesta camada.";
    placedBuildingList.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  buildings.forEach((building) => {
    const asset = buildingAssetForItem(building);
    if (!asset) return;

    const row = document.createElement("div");
    const image = makeBuildingElement(asset, "");
    const info = document.createElement("div");
    const name = document.createElement("strong");
    const position = document.createElement("span");
    const removeButton = document.createElement("button");

    row.className = "placed-building-row";
    image.style.position = "static";
    image.style.transform = "none";
    info.className = "placed-building-info";
    name.textContent = asset.label ?? asset.name;
    position.textContent = `tile ${building.x / TILE_SIZE},${building.y / TILE_SIZE}`;
    removeButton.className = "remove-building-button";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.setAttribute("aria-label", `Remover ${asset.name}`);
    removeButton.addEventListener("click", () => removePlacedBuilding(scene, building.id));

    info.append(name, position);
    row.append(image, info, removeButton);
    fragment.append(row);
  });

  placedBuildingList.replaceChildren(fragment);
}

function drawFurniture(target, asset) {
  const drawingContext = target.getContext("2d");
  drawingContext.imageSmoothingEnabled = false;
  drawingContext.clearRect(0, 0, asset.width, asset.height);
  if (!furnitureSheet.complete || !furnitureSheet.naturalWidth) return;
  drawingContext.drawImage(
    furnitureSheet,
    asset.x,
    asset.y,
    asset.width,
    asset.height,
    0,
    0,
    asset.width,
    asset.height,
  );
}

function makeFurnitureCanvas(asset, className = "furniture-canvas") {
  const itemCanvas = document.createElement("canvas");
  itemCanvas.className = className;
  itemCanvas.width = asset.width;
  itemCanvas.height = asset.height;
  itemCanvas.style.width = `${asset.width}px`;
  itemCanvas.style.height = `${asset.height}px`;
  itemCanvas.style.transform = `scale(${SHEET_SCALE})`;
  itemCanvas.style.transformOrigin = "top left";
  drawFurniture(itemCanvas, asset);
  if (!furnitureSheet.complete) {
    furnitureSheet.addEventListener("load", () => drawFurniture(itemCanvas, asset), { once: true });
  }
  return itemCanvas;
}

function furnitureAssetForItem(item) {
  return FURNITURE_ASSETS.find((candidate) => candidate.name === item.asset)
    ?? (item.source ? { ...item.source, name: item.asset, label: item.label ?? "Recorte da folha" } : null);
}

function renderPlacedFurniture(scene) {
  const layer = scene === "house" ? houseFurnitureLayer : outdoorFurnitureLayer;
  const fragment = document.createDocumentFragment();
  layer.replaceChildren();
  sceneMap(scene).furniture.forEach((item) => {
    const asset = furnitureAssetForItem(item);
    if (!asset) return;
    const itemCanvas = makeFurnitureCanvas(asset);
    itemCanvas.style.left = `${item.x}px`;
    itemCanvas.style.top = `${item.y}px`;
    fragment.append(itemCanvas);
  });
  layer.append(fragment);
  renderPlacedFurnitureList(scene);
}

function removePlacedFurniture(scene, id) {
  const items = sceneMap(scene).furniture;
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;
  items.splice(index, 1);
  persistMap();
  renderPlacedFurniture(scene);
}

function renderPlacedFurnitureList(scene = currentScene) {
  placedFurnitureTitle.textContent = `Móveis colocados · ${scene === "house" ? "casa" : "exterior"}`;
  const items = sceneMap(scene).furniture;
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "placed-building-empty";
    empty.textContent = "Nenhum móvel nesta camada.";
    placedFurnitureList.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const asset = furnitureAssetForItem(item);
    if (!asset) return;
    const row = document.createElement("div");
    const thumbnail = makeFurnitureCanvas(asset);
    const info = document.createElement("div");
    const name = document.createElement("strong");
    const position = document.createElement("span");
    const removeButton = document.createElement("button");
    row.className = "placed-building-row";
    thumbnail.style.position = "static";
    thumbnail.style.transform = "none";
    info.className = "placed-building-info";
    name.textContent = asset.label;
    position.textContent = `tile ${item.x / TILE_SIZE},${item.y / TILE_SIZE}`;
    removeButton.className = "remove-building-button";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => removePlacedFurniture(scene, item.id));
    info.append(name, position);
    row.append(thumbnail, info, removeButton);
    fragment.append(row);
  });
  placedFurnitureList.replaceChildren(fragment);
}

const ANIMAL_DIRECTIONS = ["down", "left", "up", "right"];
const ANIMAL_VECTORS = {
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
};
const ANIMAL_OPPOSITE = { down: "up", up: "down", left: "right", right: "left" };

function drawAnimalFrame(target, asset, direction = "down", frame = 0) {
  const drawingContext = target.getContext("2d");
  drawingContext.imageSmoothingEnabled = false;
  drawingContext.clearRect(0, 0, asset.frame, asset.frame);
  if (!asset.image.complete || !asset.image.naturalWidth) return;
  const row = direction === "down" ? 0 : direction === "up" ? 2 : 1;
  const sourceX = (frame % asset.frames) * asset.frame;
  const sourceY = row * asset.frame;
  drawingContext.save();
  if (direction === "left") {
    drawingContext.translate(asset.frame, 0);
    drawingContext.scale(-1, 1);
  }
  drawingContext.drawImage(
    asset.image,
    sourceX,
    sourceY,
    asset.frame,
    asset.frame,
    0,
    0,
    asset.frame,
    asset.frame,
  );
  drawingContext.restore();
}

function makeAnimalCanvas(asset, className = "animal-canvas") {
  const animalCanvas = document.createElement("canvas");
  animalCanvas.className = className;
  animalCanvas.width = asset.frame;
  animalCanvas.height = asset.frame;
  animalCanvas.style.width = `${asset.frame}px`;
  animalCanvas.style.height = `${asset.frame}px`;
  animalCanvas.style.transform = `scale(${SHEET_SCALE})`;
  animalCanvas.style.transformOrigin = "top left";
  drawAnimalFrame(animalCanvas, asset);
  if (!asset.image.complete) {
    asset.image.addEventListener("load", () => drawAnimalFrame(animalCanvas, asset), { once: true });
  }
  return animalCanvas;
}

function renderPlacedAnimals(scene) {
  const layer = scene === "house" ? houseAnimalsLayer : outdoorAnimalsLayer;
  const validIds = new Set();
  const fragment = document.createDocumentFragment();
  layer.replaceChildren();

  sceneMap(scene).animals.forEach((animal) => {
    const asset = ANIMAL_ASSETS.find((candidate) => candidate.name === animal.asset);
    if (!asset) return;
    validIds.add(animal.id);
    const animalCanvas = makeAnimalCanvas(asset);
    animalCanvas.style.left = `${animal.x}px`;
    animalCanvas.style.top = `${animal.y}px`;
    fragment.append(animalCanvas);
    const runtime = animalRuntime.get(animal.id) ?? {
      direction: ANIMAL_DIRECTIONS[Math.floor(Math.random() * ANIMAL_DIRECTIONS.length)],
      decisionTime: 0.5 + Math.random() * 2,
      animationTime: 0,
      frame: 0,
    };
    runtime.canvas = animalCanvas;
    runtime.asset = asset;
    runtime.scene = scene;
    animalRuntime.set(animal.id, runtime);
    drawAnimalFrame(animalCanvas, asset, runtime.direction, runtime.frame);
  });

  [...animalRuntime.entries()].forEach(([id, runtime]) => {
    if (runtime.scene === scene && !validIds.has(id)) animalRuntime.delete(id);
  });
  layer.append(fragment);
  renderPlacedAnimalList(scene);
}

function removePlacedAnimal(scene, id) {
  const animals = sceneMap(scene).animals;
  const index = animals.findIndex((animal) => animal.id === id);
  if (index === -1) return;
  animals.splice(index, 1);
  animalRuntime.delete(id);
  persistMap();
  renderPlacedAnimals(scene);
}

function renderPlacedAnimalList(scene = currentScene) {
  placedAnimalsTitle.textContent = `Animais colocados · ${scene === "house" ? "casa" : "exterior"}`;
  const animals = sceneMap(scene).animals;
  if (animals.length === 0) {
    const empty = document.createElement("p");
    empty.className = "placed-building-empty";
    empty.textContent = "Nenhum animal neste mapa.";
    placedAnimalList.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  animals.forEach((animal) => {
    const asset = ANIMAL_ASSETS.find((candidate) => candidate.name === animal.asset);
    if (!asset) return;
    const row = document.createElement("div");
    const thumbnail = makeAnimalCanvas(asset);
    const info = document.createElement("div");
    const name = document.createElement("strong");
    const removeButton = document.createElement("button");
    row.className = "placed-building-row";
    thumbnail.style.position = "static";
    thumbnail.style.transform = "none";
    info.className = "placed-building-info";
    name.textContent = asset.label;
    info.append(name);
    removeButton.className = "remove-building-button";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => removePlacedAnimal(scene, animal.id));
    row.append(thumbnail, info, removeButton);
    fragment.append(row);
  });
  placedAnimalList.replaceChildren(fragment);
}

function buildTileGrid() {
  const { columns, rows } = mapDimensions("outdoor");
  const fragment = document.createDocumentFragment();

  tileGrid.replaceChildren();
  tileGrid.style.gridTemplateColumns = `repeat(${columns}, ${TILE_SIZE}px)`;
  tileGrid.style.gridTemplateRows = `repeat(${rows}, ${TILE_SIZE}px)`;
  tileGrid.style.width = `${columns * TILE_SIZE}px`;
  tileGrid.style.height = `${rows * TILE_SIZE}px`;
  outdoorBuildingsLayer.style.width = `${columns * TILE_SIZE}px`;
  outdoorBuildingsLayer.style.height = `${rows * TILE_SIZE}px`;
  outdoorAnimalsLayer.style.width = `${columns * TILE_SIZE}px`;
  outdoorAnimalsLayer.style.height = `${rows * TILE_SIZE}px`;
  outdoorFurnitureLayer.style.width = `${columns * TILE_SIZE}px`;
  outdoorFurnitureLayer.style.height = `${rows * TILE_SIZE}px`;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const tile = document.createElement("div");
      tile.className = "tile-coordinate";
      tile.dataset.scene = "outdoor";
      tile.dataset.x = String(x);
      tile.dataset.y = String(y);
      fragment.append(tile);
    }
  }

  tileGrid.append(fragment);
  renderMapLayer("outdoor");
  refreshGridState("outdoor");
}

function buildHouseTileGrid() {
  const columns = Math.ceil(houseRoom.clientWidth / TILE_SIZE);
  const rows = Math.ceil(houseRoom.clientHeight / TILE_SIZE);
  const fragment = document.createDocumentFragment();

  houseTileGrid.replaceChildren();
  houseTileGrid.style.gridTemplateColumns = `repeat(${columns}, ${TILE_SIZE}px)`;
  houseTileGrid.style.gridTemplateRows = `repeat(${rows}, ${TILE_SIZE}px)`;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const tile = document.createElement("div");
      tile.className = "tile-coordinate";
      tile.dataset.scene = "house";
      tile.dataset.x = String(x);
      tile.dataset.y = String(y);
      fragment.append(tile);
    }
  }

  houseTileGrid.append(fragment);
  renderMapLayer("house");
  refreshGridState("house");
}

function playerSize() {
  const styles = getComputedStyle(canvas);
  return {
    width: Number.parseFloat(styles.width),
    height: Number.parseFloat(styles.height),
  };
}

function centerPlayer() {
  const size = playerSize();
  const world = outdoorWorldSize();
  player.x = (world.width - size.width) / 2;
  player.y = (world.height - size.height) / 2;

  if (currentScene === "outdoor" && positionTouchesBlockedTile(player.x, player.y)) {
    player.x = 0;
    player.y = 0;
  }

  renderPosition();
}

function renderPosition() {
  game.scrollLeft = 0;
  game.scrollTop = 0;
  if (currentScene === "house") {
    canvas.style.transform = `translate3d(${player.x}px, ${player.y}px, 0)`;
    return;
  }

  const size = playerSize();
  const world = outdoorWorldSize();
  const cameraAxis = (worldSize, viewportSize, playerCenter) => {
    if (worldSize <= viewportSize) return (worldSize - viewportSize) / 2;
    return Math.max(0, Math.min(worldSize - viewportSize, playerCenter - viewportSize / 2));
  };
  camera.x = cameraAxis(world.width, game.clientWidth, player.x + size.width / 2);
  camera.y = cameraAxis(world.height, game.clientHeight, player.y + size.height / 2);

  const worldTransform = `translate3d(${-camera.x}px, ${-camera.y}px, 0)`;
  outdoorMapLayer.style.transform = worldTransform;
  outdoorBuildingsLayer.style.transform = worldTransform;
  outdoorAnimalsLayer.style.transform = worldTransform;
  outdoorFurnitureLayer.style.transform = worldTransform;
  tileGrid.style.transform = worldTransform;
  canvas.style.transform = `translate3d(${player.x - camera.x}px, ${player.y - camera.y}px, 0)`;
  game.style.backgroundPosition = `${-camera.x}px ${-camera.y}px`;
}

function inputAxis() {
  const left = keys.has("ArrowLeft") || keys.has("KeyA");
  const right = keys.has("ArrowRight") || keys.has("KeyD");
  const up = keys.has("ArrowUp") || keys.has("KeyW");
  const down = keys.has("ArrowDown") || keys.has("KeyS");
  return { x: Number(right) - Number(left), y: Number(down) - Number(up) };
}

function playerHitbox(x, y) {
  const size = playerSize();
  return {
    left: x + size.width * 0.25,
    right: x + size.width * 0.75 - 1,
    top: y + size.height * 0.75,
    bottom: y + size.height - 1,
  };
}

function positionTouchesBlockedTile(x, y) {
  // Apenas a base do personagem colide, simulando a área dos pés.
  const hitbox = playerHitbox(x, y);
  const world = outdoorWorldSize();
  if (hitbox.left < 0 || hitbox.right >= world.width || hitbox.top < 0 || hitbox.bottom >= world.height) {
    return true;
  }

  const startTileX = Math.floor(hitbox.left / TILE_SIZE);
  const endTileX = Math.floor(hitbox.right / TILE_SIZE);
  const startTileY = Math.floor(hitbox.top / TILE_SIZE);
  const endTileY = Math.floor(hitbox.bottom / TILE_SIZE);

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      if (isMapTileBlocked("outdoor", tileX, tileY)) {
        return true;
      }
    }
  }

  return false;
}

function headTouchesHouseDoor(x, y) {
  const cabinExists = sceneMap("outdoor").buildings.some(
    (building) => building.asset === "cabin-01" && building.x === TILE_SIZE && building.y === TILE_SIZE,
  );
  if (!cabinExists) return false;

  const size = playerSize();
  const head = {
    left: x + size.width * 0.125,
    right: x + size.width * 0.875 - 1,
    top: y,
    bottom: y + size.height * 0.5 - 1,
  };
  const doorTile = {
    left: 3 * TILE_SIZE,
    right: 4 * TILE_SIZE - 1,
    top: 4 * TILE_SIZE,
    bottom: 5 * TILE_SIZE - 1,
  };

  return (
    head.left <= doorTile.right &&
    head.right >= doorTile.left &&
    head.top <= doorTile.bottom &&
    head.bottom >= doorTile.top
  );
}

function houseWalkableBounds() {
  const room = houseRoom.getBoundingClientRect();
  return {
    left: room.left + TILE_SIZE,
    right: room.right - TILE_SIZE,
    top: room.top + TILE_SIZE,
    bottom: room.bottom - TILE_SIZE,
    centerX: room.left + room.width / 2,
  };
}

function positionTouchesHouseWall(x, y) {
  const hitbox = playerHitbox(x, y);
  const bounds = houseWalkableBounds();
  const touchesBoundary = (
    hitbox.left < bounds.left ||
    hitbox.right > bounds.right ||
    hitbox.top < bounds.top ||
    hitbox.bottom > bounds.bottom
  );
  if (touchesBoundary) return true;

  const room = houseRoom.getBoundingClientRect();
  const startTileX = Math.floor((hitbox.left - room.left) / TILE_SIZE);
  const endTileX = Math.floor((hitbox.right - room.left) / TILE_SIZE);
  const startTileY = Math.floor((hitbox.top - room.top) / TILE_SIZE);
  const endTileY = Math.floor((hitbox.bottom - room.top) / TILE_SIZE);

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      if (isMapTileBlocked("house", tileX, tileY)) return true;
    }
  }
  return false;
}

function reachesHouseExit(x, y) {
  const hitbox = playerHitbox(x, y);
  const bounds = houseWalkableBounds();
  const playerCenterX = (hitbox.left + hitbox.right) / 2;
  return (
    hitbox.bottom > bounds.bottom &&
    Math.abs(playerCenterX - bounds.centerX) < TILE_SIZE / 2
  );
}

function routeIsHouse() {
  return location.pathname.endsWith("/house") || location.hash === "#/house";
}

function writeRoute(scene) {
  const path = scene === "house" ? "/house" : "/";
  const isStaticHost = location.protocol === "file:" || location.hostname.endsWith("github.io");
  if (isStaticHost) {
    location.hash = scene === "house" ? "/house" : "";
  } else {
    history.pushState({ scene }, "", path);
  }
}

function spawnPlayerInHouse() {
  const bounds = houseWalkableBounds();
  player.x = bounds.centerX - playerSize().width / 2;
  player.y = bounds.bottom - playerSize().height - 8;
  player.direction = "up";
  renderPosition();
}

function spawnPlayerOutsideDoor() {
  player.x = 3 * TILE_SIZE;
  // Mantém toda a cabeça abaixo do tile 3,4 ao retornar ao exterior.
  player.y = 5 * TILE_SIZE;
  player.direction = "down";
  renderPosition();
}

function showScene(scene, { pushRoute = true } = {}) {
  cancelBuildingPlacement();
  cancelAnimalPlacement();
  cancelFurniturePlacement();
  cancelTileBrush();
  selectedMapTile = null;
  mapEditor.classList.remove("is-open");
  currentScene = scene;
  document.body.classList.toggle("house-route", scene === "house");
  keys.clear();

  if (pushRoute) {
    writeRoute(scene);
  }

  if (scene === "house") {
    buildHouseTileGrid();
    renderPlacedBuildings("house");
    renderPlacedAnimals("house");
    renderPlacedFurniture("house");
    spawnPlayerInHouse();
  } else {
    renderPlacedBuildings("outdoor");
    renderPlacedAnimals("outdoor");
    renderPlacedFurniture("outdoor");
    spawnPlayerOutsideDoor();
  }
}

function updateBlockButton() {
  if (!selectedMapTile) {
    toggleTileBlock.disabled = true;
    toggleTileBlock.textContent = "Bloquear tile";
    toggleTileBlock.classList.remove("is-blocked");
    return;
  }
  const blocked = isMapTileBlocked(
    selectedMapTile.scene,
    selectedMapTile.x,
    selectedMapTile.y,
  );
  toggleTileBlock.disabled = false;
  toggleTileBlock.textContent = blocked ? "Desbloquear tile" : "Bloquear tile";
  toggleTileBlock.classList.toggle("is-blocked", blocked);
}

function selectMapTile(scene, x, y) {
  if (!editorEnabled() || buildingPlacement || animalPlacement || furniturePlacement) return;
  selectedMapTile = { scene, x, y };
  selectedTileLabel.textContent = `${scene} · ${x},${y}`;
  mapEditor.classList.add("is-open");
  refreshGridState("outdoor");
  refreshGridState("house");
  updateBlockButton();
  renderPlacedBuildingList(scene);
  renderPlacedAnimalList(scene);
  renderPlacedFurnitureList(scene);
}

function cancelTileBrush() {
  tileBrush?.preview.remove();
  tileBrush = null;
  document.querySelectorAll(".tile-tool-option").forEach((button) => {
    button.classList.remove("is-active");
  });
}

function beginTileBrush(tileDefinition, activeButton = null) {
  cancelBuildingPlacement();
  cancelAnimalPlacement();
  cancelFurniturePlacement();
  cancelTileBrush();
  const preview = document.createElement("div");
  preview.className = "tile-brush-preview";
  applyTileStyle(preview, tileDefinition);
  const container = currentScene === "house" ? houseRoom : game;
  container.append(preview);
  tileBrush = {
    tile: tileDefinition,
    preview,
    scene: currentScene,
    painting: false,
    lastKey: null,
    position: null,
  };
  activeButton?.classList.add("is-active");
}

function brushPositionFromPointer(event) {
  if (!tileBrush || tileBrush.scene !== currentScene) return null;
  const container = currentScene === "house" ? houseRoom : game;
  const rect = container.getBoundingClientRect();
  const offsetX = currentScene === "outdoor" ? camera.x : 0;
  const offsetY = currentScene === "outdoor" ? camera.y : 0;
  const worldX = event.clientX - rect.left + offsetX;
  const worldY = event.clientY - rect.top + offsetY;
  const x = Math.floor(worldX / TILE_SIZE);
  const y = Math.floor(worldY / TILE_SIZE);
  const { columns, rows } = mapDimensions(currentScene);
  if (x < 0 || y < 0 || x >= columns || y >= rows) return null;
  return { x, y, offsetX, offsetY };
}

function updateTileBrushPreview(event) {
  if (!tileBrush) return;
  const position = brushPositionFromPointer(event);
  tileBrush.position = position;
  tileBrush.preview.style.display = position ? "block" : "none";
  if (!position) return;
  tileBrush.preview.style.left = `${position.x * TILE_SIZE - position.offsetX}px`;
  tileBrush.preview.style.top = `${position.y * TILE_SIZE - position.offsetY}px`;
}

function paintWithTileBrush(position = tileBrush?.position) {
  if (!tileBrush || !position) return;
  const key = `${position.x},${position.y}`;
  if (tileBrush.lastKey === key) return;
  tileBrush.lastKey = key;
  if (tileBrush.tile.restore) delete sceneMap(tileBrush.scene).tiles[key];
  else sceneMap(tileBrush.scene).tiles[key] = { ...tileBrush.tile };
  const layer = tileBrush.scene === "house" ? houseMapLayer : outdoorMapLayer;
  const cell = layer.querySelector(`[data-x="${position.x}"][data-y="${position.y}"]`);
  if (cell) applyTileStyle(cell, tileBrush.tile.restore ? null : tileBrush.tile);
  refreshGridState(tileBrush.scene);
  persistMap();
}

function buildTilesetPicker(details) {
  if (details.dataset.ready === "true") return;
  const sheetId = details.dataset.sheet;
  const sheet = SHEETS[sheetId];
  const picker = details.querySelector(".tileset-picker");
  const wrapper = document.createElement("div");
  const image = document.createElement("img");
  const selection = document.createElement("span");
  wrapper.className = "tileset-sheet";
  selection.className = "tileset-sheet-selection";
  image.src = sheet.file;
  image.alt = sheetId;
  image.draggable = false;
  image.width = sheet.width * PICKER_SCALE;
  image.height = sheet.height * PICKER_SCALE;
  wrapper.append(image, selection);
  picker.append(wrapper);

  wrapper.addEventListener("click", (event) => {
    if (!selectedMapTile) return;
    const rect = wrapper.getBoundingClientRect();
    const sourceX = Math.floor((event.clientX - rect.left) / (16 * PICKER_SCALE)) * 16;
    const sourceY = Math.floor((event.clientY - rect.top) / (16 * PICKER_SCALE)) * 16;
    if (sourceX >= sheet.width || sourceY >= sheet.height) return;
    selection.style.display = "block";
    selection.style.left = `${sourceX * PICKER_SCALE}px`;
    selection.style.top = `${sourceY * PICKER_SCALE}px`;
    beginTileBrush({ sheet: sheetId, x: sourceX, y: sourceY });
  });

  details.dataset.ready = "true";
}

function cancelBuildingPlacement() {
  buildingPlacement?.preview.remove();
  buildingPlacement = null;
  buildingLibrary.querySelectorAll(".building-option").forEach((button) => {
    button.classList.remove("is-active");
  });
}

function beginBuildingPlacement(asset, button) {
  cancelBuildingPlacement();
  cancelAnimalPlacement();
  cancelFurniturePlacement();
  cancelTileBrush();
  const preview = makeBuildingElement(asset, "building-preview");
  preview.style.transform = `scale(${SHEET_SCALE})`;
  const container = currentScene === "house" ? houseRoom : game;
  container.append(preview);
  button?.classList.add("is-active");
  buildingPlacement = {
    asset,
    preview,
    scene: currentScene,
    x: 0,
    y: 0,
    valid: false,
  };
}

function renderBuildingLibrary() {
  const fragment = document.createDocumentFragment();
  for (const asset of BUILDING_ASSETS) {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const label = document.createElement("span");
    button.className = "building-option";
    button.type = "button";
    image.src = asset.file;
    image.alt = "";
    label.textContent = asset.name;
    button.append(image, label);
    button.addEventListener("click", () => beginBuildingPlacement(asset, button));
    fragment.append(button);
  }
  buildingLibrary.replaceChildren(fragment);
}

function buildingSourcePoint(event) {
  const rect = buildingSourceSheet.getBoundingClientRect();
  const x = Math.max(0, Math.min(918, event.clientX - rect.left));
  const y = Math.max(0, Math.min(411, event.clientY - rect.top));
  return {
    x: Math.floor(x / 16) * 16,
    y: Math.floor(y / 16) * 16,
  };
}

function renderBuildingSourceCells() {
  const fragment = document.createDocumentFragment();
  buildingSelectedCells.forEach((key) => {
    const [x, y] = key.split(",").map(Number);
    const cell = document.createElement("span");
    cell.className = "building-source-cell";
    cell.style.left = `${x}px`;
    cell.style.top = `${y}px`;
    fragment.append(cell);
  });
  buildingSourceCells.replaceChildren(fragment);
  const count = buildingSelectedCells.size;
  useBuildingSelection.disabled = count === 0;
  clearBuildingSelection.disabled = count === 0;
  useBuildingSelection.textContent = `Usar seleção (${count})`;
}

function applyBuildingCellGesture(event) {
  if (!buildingCellGesture) return;
  const point = buildingSourcePoint(event);
  const key = `${point.x},${point.y}`;
  if (buildingCellGesture.visited.has(key)) return;
  buildingCellGesture.visited.add(key);
  if (buildingCellGesture.mode === "add") buildingSelectedCells.add(key);
  else buildingSelectedCells.delete(key);
  renderBuildingSourceCells();
}

function finishBuildingCellGesture() {
  buildingCellGesture = null;
}

function clearBuildingSourceCells() {
  buildingSelectedCells.clear();
  renderBuildingSourceCells();
}

function useSelectedBuildingCells() {
  if (buildingSelectedCells.size === 0) return;
  const cells = [...buildingSelectedCells].map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
  const x = Math.min(...cells.map((cell) => cell.x));
  const y = Math.min(...cells.map((cell) => cell.y));
  const right = Math.min(919, Math.max(...cells.map((cell) => cell.x)) + 16);
  const bottom = Math.min(412, Math.max(...cells.map((cell) => cell.y)) + 16);
  const width = right - x;
  const height = bottom - y;
  beginBuildingPlacement({
    name: `building-cells-${Date.now()}`,
    label: `Construção personalizada · ${cells.length} quadrados`,
    x,
    y,
    width,
    height,
    cells,
    custom: true,
    userCrop: true,
  });
  clearBuildingSourceCells();
}

function updateBuildingPreview(event) {
  if (!buildingPlacement || buildingPlacement.scene !== currentScene) return;
  const container = currentScene === "house" ? houseRoom : game;
  const rect = container.getBoundingClientRect();
  const width = buildingPlacement.asset.width * SHEET_SCALE;
  const height = buildingPlacement.asset.height * SHEET_SCALE;
  const isOutdoor = currentScene === "outdoor";
  const world = isOutdoor ? outdoorWorldSize() : { width: rect.width, height: rect.height };
  const rawX = event.clientX - rect.left + (isOutdoor ? camera.x : 0);
  const rawY = event.clientY - rect.top + (isOutdoor ? camera.y : 0);
  const maxX = Math.max(0, Math.floor((world.width - width) / TILE_SIZE) * TILE_SIZE);
  const maxY = Math.max(0, Math.floor((world.height - height) / TILE_SIZE) * TILE_SIZE);
  const x = Math.max(0, Math.min(maxX, Math.floor(rawX / TILE_SIZE) * TILE_SIZE));
  const y = Math.max(0, Math.min(maxY, Math.floor(rawY / TILE_SIZE) * TILE_SIZE));
  buildingPlacement.x = x;
  buildingPlacement.y = y;
  buildingPlacement.valid = (
    event.clientX >= rect.left && event.clientX <= rect.right &&
    event.clientY >= rect.top && event.clientY <= rect.bottom
  );
  buildingPlacement.preview.style.display = buildingPlacement.valid ? "block" : "none";
  buildingPlacement.preview.style.left = `${x - (isOutdoor ? camera.x : 0)}px`;
  buildingPlacement.preview.style.top = `${y - (isOutdoor ? camera.y : 0)}px`;
}

function confirmBuildingPlacement() {
  if (!buildingPlacement?.valid) return false;
  const building = {
    id: `${buildingPlacement.asset.name}-${Date.now()}`,
    asset: buildingPlacement.asset.name,
    x: buildingPlacement.x,
    y: buildingPlacement.y,
  };
  if (buildingPlacement.asset.userCrop) {
    building.label = buildingPlacement.asset.label;
    building.source = {
      x: buildingPlacement.asset.x,
      y: buildingPlacement.asset.y,
      width: buildingPlacement.asset.width,
      height: buildingPlacement.asset.height,
      ...(buildingPlacement.asset.cells ? { cells: buildingPlacement.asset.cells } : {}),
    };
  }
  sceneMap(buildingPlacement.scene).buildings.push(building);
  const scene = buildingPlacement.scene;
  persistMap();
  cancelBuildingPlacement();
  renderPlacedBuildings(scene);
  refreshGridState(scene);
  return true;
}

function cancelFurniturePlacement() {
  furniturePlacement?.preview.remove();
  furniturePlacement = null;
  furnitureLibrary.querySelectorAll(".furniture-option").forEach((button) => {
    button.classList.remove("is-active");
  });
}

function beginFurniturePlacement(asset, button) {
  cancelBuildingPlacement();
  cancelAnimalPlacement();
  cancelFurniturePlacement();
  cancelTileBrush();
  const preview = makeFurnitureCanvas(asset, "furniture-preview");
  const container = currentScene === "house" ? houseRoom : game;
  container.append(preview);
  button?.classList.add("is-active");
  furniturePlacement = { asset, preview, scene: currentScene, x: 0, y: 0, valid: false };
}

function renderFurnitureLibrary() {
  const fragment = document.createDocumentFragment();
  FURNITURE_ASSETS.forEach((asset) => {
    const button = document.createElement("button");
    const preview = makeFurnitureCanvas(asset);
    const label = document.createElement("span");
    const previewScale = Math.min(PICKER_SCALE, 96 / asset.width, 64 / asset.height);
    button.className = "furniture-option";
    button.type = "button";
    preview.style.position = "static";
    preview.style.width = `${asset.width * previewScale}px`;
    preview.style.height = `${asset.height * previewScale}px`;
    preview.style.transform = "none";
    label.textContent = asset.label;
    button.append(preview, label);
    button.addEventListener("click", () => beginFurniturePlacement(asset, button));
    fragment.append(button);
  });
  furnitureLibrary.replaceChildren(fragment);
}

function furnitureSourcePoint(event) {
  const rect = furnitureSourceSheet.getBoundingClientRect();
  const x = Math.max(0, Math.min(979, event.clientX - rect.left));
  const y = Math.max(0, Math.min(1487, event.clientY - rect.top));
  return {
    x: Math.floor(x / 16) * 16,
    y: Math.floor(y / 16) * 16,
  };
}

function updateFurnitureSourceSelection(event) {
  if (!furnitureCropSelection) return;
  const point = furnitureSourcePoint(event);
  const left = Math.min(furnitureCropSelection.startX, point.x);
  const top = Math.min(furnitureCropSelection.startY, point.y);
  const right = Math.min(980, Math.max(furnitureCropSelection.startX, point.x) + 16);
  const bottom = Math.min(1488, Math.max(furnitureCropSelection.startY, point.y) + 16);
  furnitureCropSelection = {
    ...furnitureCropSelection,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
  furnitureSourceSelection.style.display = "block";
  furnitureSourceSelection.style.left = `${left}px`;
  furnitureSourceSelection.style.top = `${top}px`;
  furnitureSourceSelection.style.width = `${right - left}px`;
  furnitureSourceSelection.style.height = `${bottom - top}px`;
}

function finishFurnitureSourceSelection(event) {
  if (!furnitureCropSelection) return;
  updateFurnitureSourceSelection(event);
  const { x, y, width, height } = furnitureCropSelection;
  furnitureCropSelection = null;
  furnitureSourceSelection.style.display = "none";
  const asset = {
    name: `furniture-${x}-${y}-${width}-${height}`,
    label: `Recorte ${x},${y} · ${width}×${height}`,
    x,
    y,
    width,
    height,
    custom: true,
  };
  beginFurniturePlacement(asset);
}

function updateFurniturePreview(event) {
  if (!furniturePlacement || furniturePlacement.scene !== currentScene) return;
  const container = currentScene === "house" ? houseRoom : game;
  const rect = container.getBoundingClientRect();
  const width = furniturePlacement.asset.width * SHEET_SCALE;
  const height = furniturePlacement.asset.height * SHEET_SCALE;
  const isOutdoor = currentScene === "outdoor";
  const world = isOutdoor ? outdoorWorldSize() : { width: rect.width, height: rect.height };
  const rawX = event.clientX - rect.left + (isOutdoor ? camera.x : 0);
  const rawY = event.clientY - rect.top + (isOutdoor ? camera.y : 0);
  const maxX = Math.max(0, Math.floor((world.width - width) / TILE_SIZE) * TILE_SIZE);
  const maxY = Math.max(0, Math.floor((world.height - height) / TILE_SIZE) * TILE_SIZE);
  const x = Math.max(0, Math.min(maxX, Math.floor(rawX / TILE_SIZE) * TILE_SIZE));
  const y = Math.max(0, Math.min(maxY, Math.floor(rawY / TILE_SIZE) * TILE_SIZE));
  furniturePlacement.x = x;
  furniturePlacement.y = y;
  furniturePlacement.valid = (
    event.clientX >= rect.left && event.clientX <= rect.right &&
    event.clientY >= rect.top && event.clientY <= rect.bottom
  );
  furniturePlacement.preview.style.display = furniturePlacement.valid ? "block" : "none";
  furniturePlacement.preview.style.left = `${x - (isOutdoor ? camera.x : 0)}px`;
  furniturePlacement.preview.style.top = `${y - (isOutdoor ? camera.y : 0)}px`;
}

function confirmFurniturePlacement() {
  if (!furniturePlacement?.valid) return false;
  const scene = furniturePlacement.scene;
  const item = {
    id: `${furniturePlacement.asset.name}-${Date.now()}`,
    asset: furniturePlacement.asset.name,
    x: furniturePlacement.x,
    y: furniturePlacement.y,
  };
  if (furniturePlacement.asset.custom) {
    item.label = furniturePlacement.asset.label;
    item.source = {
      x: furniturePlacement.asset.x,
      y: furniturePlacement.asset.y,
      width: furniturePlacement.asset.width,
      height: furniturePlacement.asset.height,
    };
  }
  sceneMap(scene).furniture.push(item);
  persistMap();
  cancelFurniturePlacement();
  renderPlacedFurniture(scene);
  return true;
}

function cancelAnimalPlacement() {
  animalPlacement?.preview.remove();
  animalPlacement = null;
  animalLibrary.querySelectorAll(".animal-option").forEach((button) => {
    button.classList.remove("is-active");
  });
}

function beginAnimalPlacement(asset, button) {
  cancelBuildingPlacement();
  cancelAnimalPlacement();
  cancelFurniturePlacement();
  cancelTileBrush();
  const preview = makeAnimalCanvas(asset, "animal-preview");
  const container = currentScene === "house" ? houseRoom : game;
  container.append(preview);
  button.classList.add("is-active");
  animalPlacement = {
    asset,
    preview,
    scene: currentScene,
    x: 0,
    y: 0,
    valid: false,
  };
}

function renderAnimalLibrary() {
  const fragment = document.createDocumentFragment();
  ANIMAL_ASSETS.forEach((asset) => {
    const button = document.createElement("button");
    const preview = makeAnimalCanvas(asset);
    const label = document.createElement("span");
    button.className = "animal-option";
    button.type = "button";
    preview.style.position = "static";
    preview.style.width = `${asset.frame * PICKER_SCALE}px`;
    preview.style.height = `${asset.frame * PICKER_SCALE}px`;
    preview.style.transform = "none";
    label.textContent = asset.label;
    button.append(preview, label);
    button.addEventListener("click", () => beginAnimalPlacement(asset, button));
    fragment.append(button);
  });
  animalLibrary.replaceChildren(fragment);
}

function updateAnimalPreview(event) {
  if (!animalPlacement || animalPlacement.scene !== currentScene) return;
  const container = currentScene === "house" ? houseRoom : game;
  const rect = container.getBoundingClientRect();
  const size = animalPlacement.asset.frame * SHEET_SCALE;
  const isOutdoor = currentScene === "outdoor";
  const world = isOutdoor ? outdoorWorldSize() : { width: rect.width, height: rect.height };
  const rawX = event.clientX - rect.left + (isOutdoor ? camera.x : 0);
  const rawY = event.clientY - rect.top + (isOutdoor ? camera.y : 0);
  const maxX = Math.max(0, Math.floor((world.width - size) / TILE_SIZE) * TILE_SIZE);
  const maxY = Math.max(0, Math.floor((world.height - size) / TILE_SIZE) * TILE_SIZE);
  const x = Math.max(0, Math.min(maxX, Math.floor(rawX / TILE_SIZE) * TILE_SIZE));
  const y = Math.max(0, Math.min(maxY, Math.floor(rawY / TILE_SIZE) * TILE_SIZE));
  animalPlacement.x = x;
  animalPlacement.y = y;
  animalPlacement.valid = (
    event.clientX >= rect.left && event.clientX <= rect.right &&
    event.clientY >= rect.top && event.clientY <= rect.bottom &&
    !animalPositionBlocked(currentScene, { x, y }, animalPlacement.asset, x, y)
  );
  animalPlacement.preview.style.display = animalPlacement.valid ? "block" : "none";
  animalPlacement.preview.style.left = `${x - (isOutdoor ? camera.x : 0)}px`;
  animalPlacement.preview.style.top = `${y - (isOutdoor ? camera.y : 0)}px`;
}

function confirmAnimalPlacement() {
  if (!animalPlacement?.valid) return false;
  const scene = animalPlacement.scene;
  sceneMap(scene).animals.push({
    id: `${animalPlacement.asset.name}-${Date.now()}`,
    asset: animalPlacement.asset.name,
    x: animalPlacement.x,
    y: animalPlacement.y,
  });
  persistMap();
  cancelAnimalPlacement();
  renderPlacedAnimals(scene);
  return true;
}

function animalPositionBlocked(scene, animal, asset, x, y) {
  const size = asset.frame * SHEET_SCALE;
  const sceneSize = scene === "outdoor"
    ? outdoorWorldSize()
    : { width: houseRoom.clientWidth, height: houseRoom.clientHeight };
  const margin = scene === "house" ? TILE_SIZE : 0;
  const left = x + size * 0.2;
  const right = x + size * 0.8 - 1;
  const top = y + size * 0.58;
  const bottom = y + size - 1;
  if (
    left < margin || right >= sceneSize.width - margin ||
    top < margin || bottom >= sceneSize.height - margin
  ) return true;

  const startX = Math.floor(left / TILE_SIZE);
  const endX = Math.floor(right / TILE_SIZE);
  const startY = Math.floor(top / TILE_SIZE);
  const endY = Math.floor(bottom / TILE_SIZE);
  for (let tileY = startY; tileY <= endY; tileY += 1) {
    for (let tileX = startX; tileX <= endX; tileX += 1) {
      if (isMapTileBlocked(scene, tileX, tileY)) return true;
    }
  }
  return false;
}

function updateAnimals(deltaTime) {
  const animals = sceneMap(currentScene).animals;
  animals.forEach((animal) => {
    const runtime = animalRuntime.get(animal.id);
    if (!runtime?.canvas || !runtime.asset) return;
    runtime.decisionTime -= deltaTime;
    if (runtime.decisionTime <= 0) {
      runtime.direction = ANIMAL_DIRECTIONS[Math.floor(Math.random() * ANIMAL_DIRECTIONS.length)];
      runtime.decisionTime = 0.8 + Math.random() * 2.4;
    }

    const vector = ANIMAL_VECTORS[runtime.direction];
    const speed = TILE_SIZE * 0.62;
    const nextX = animal.x + vector.x * speed * deltaTime;
    const nextY = animal.y + vector.y * speed * deltaTime;
    if (animalPositionBlocked(currentScene, animal, runtime.asset, nextX, nextY)) {
      runtime.direction = ANIMAL_OPPOSITE[runtime.direction];
      runtime.decisionTime = 0.5 + Math.random();
    } else {
      animal.x = nextX;
      animal.y = nextY;
    }

    runtime.animationTime += deltaTime;
    runtime.frame = Math.floor(runtime.animationTime / 0.18) % runtime.asset.frames;
    runtime.canvas.style.left = `${animal.x}px`;
    runtime.canvas.style.top = `${animal.y}px`;
    drawAnimalFrame(runtime.canvas, runtime.asset, runtime.direction, runtime.frame);
  });

  animalPersistTime += deltaTime;
  if (animalPersistTime >= 2 && animals.length > 0) {
    animalPersistTime = 0;
    persistMap();
  }
}

function update(deltaTime) {
  updateAnimals(deltaTime);
  const axis = inputAxis();
  const length = Math.hypot(axis.x, axis.y);
  player.moving = length > 0;

  if (player.moving) {
    const movementSpeed = player.speed * (player.running ? 1.85 : 1);
    const movementX = (axis.x / length) * movementSpeed * deltaTime;
    const movementY = (axis.y / length) * movementSpeed * deltaTime;
    const nextX = player.x + movementX;
    const nextY = player.y + movementY;

    if (currentScene === "outdoor" && axis.y < 0 && headTouchesHouseDoor(player.x, nextY)) {
      showScene("house");
      return;
    }

    if (currentScene === "house" && axis.y > 0 && reachesHouseExit(player.x, nextY)) {
      showScene("outdoor");
      return;
    }

    const touchesWall = currentScene === "house"
      ? positionTouchesHouseWall
      : positionTouchesBlockedTile;

    // Eixos separados permitem deslizar pela borda da construção.
    if (!touchesWall(nextX, player.y)) {
      player.x = nextX;
    }
    if (!touchesWall(player.x, nextY)) {
      player.y = nextY;
    }

    if (Math.abs(axis.x) > Math.abs(axis.y)) {
      player.direction = axis.x > 0 ? "right" : "left";
    } else {
      player.direction = axis.y > 0 ? "down" : "up";
    }

    player.animationTime += deltaTime;
    player.frame = Math.floor(player.animationTime / 0.13) % FRAMES_PER_DIRECTION;
  } else {
    player.animationTime = 0;
    player.frame = 0;
  }

  const size = playerSize();
  const movementBounds = currentScene === "outdoor"
    ? outdoorWorldSize()
    : { width: game.clientWidth, height: game.clientHeight };
  player.x = Math.max(0, Math.min(movementBounds.width - size.width, player.x));
  player.y = Math.max(0, Math.min(movementBounds.height - size.height, player.y));

  drawPlayer();
  renderPosition();
}

let previousTime = performance.now();

function gameLoop(time) {
  const deltaTime = Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  update(deltaTime);
  requestAnimationFrame(gameLoop);
}

function setRunning(active) {
  player.running = active;
  const button = document.querySelector("#run-button");
  button.classList.toggle("is-pressed", active);
  button.setAttribute("aria-pressed", String(active));
}

function attemptInteraction() {
  const hitbox = playerHitbox(player.x, player.y);
  const centerX = (hitbox.left + hitbox.right) / 2;
  const centerY = (hitbox.top + hitbox.bottom) / 2;

  if (currentScene === "outdoor") {
    const cabinExists = sceneMap("outdoor").buildings.some(
      (building) => building.asset === "cabin-01" && building.x === TILE_SIZE && building.y === TILE_SIZE,
    );
    const doorCenterX = 3.5 * TILE_SIZE;
    const doorCenterY = 5 * TILE_SIZE;
    if (cabinExists && Math.hypot(centerX - doorCenterX, centerY - doorCenterY) <= TILE_SIZE * 2) {
      showScene("house");
      return;
    }
  } else {
    const bounds = houseWalkableBounds();
    if (
      Math.abs(centerX - bounds.centerX) <= TILE_SIZE &&
      Math.abs(hitbox.bottom - bounds.bottom) <= TILE_SIZE * 1.5
    ) {
      showScene("outdoor");
      return;
    }
  }

  game.dispatchEvent(new CustomEvent("game-interaction", {
    detail: { scene: currentScene, x: player.x, y: player.y },
  }));
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && (buildingPlacement || animalPlacement || furniturePlacement || tileBrush)) {
    event.preventDefault();
    cancelBuildingPlacement();
    cancelAnimalPlacement();
    cancelFurniturePlacement();
    cancelTileBrush();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && zoomShortcutKeys.has(event.key)) {
    event.preventDefault();
    return;
  }

  if (controlKeys.has(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    setRunning(true);
  }
  if (["KeyE", "Enter", "NumpadEnter"].includes(event.code) && !event.repeat) {
    event.preventDefault();
    attemptInteraction();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    setRunning(false);
  }
});

window.addEventListener("blur", () => {
  keys.clear();
  setRunning(false);
  document.querySelectorAll(".direction-button, .action-button").forEach((button) => {
    button.classList.remove("is-pressed");
  });
});

window.addEventListener(
  "wheel",
  (event) => {
    if (!event.target.closest(".map-editor")) event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => event.preventDefault());
});

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false },
);

document.querySelectorAll(".outfit-button").forEach((button) => {
  button.addEventListener("click", () => {
    player.outfit = button.dataset.outfit;

    document.querySelectorAll(".outfit-button").forEach((option) => {
      const isActive = option === button;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });

    drawPlayer();
  });
});

document.querySelectorAll(".direction-button").forEach((button) => {
  const code = button.dataset.code;

  const pressDirection = (event) => {
    event.preventDefault();
    keys.add(code);
    button.classList.add("is-pressed");
    if (event.pointerId !== undefined) {
      button.setPointerCapture(event.pointerId);
    }
  };

  const releaseDirection = (event) => {
    event.preventDefault();
    keys.delete(code);
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", pressDirection);
  button.addEventListener("pointerup", releaseDirection);
  button.addEventListener("pointercancel", releaseDirection);
  button.addEventListener("lostpointercapture", releaseDirection);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
});

const runButton = document.querySelector("#run-button");
const releaseRun = (event) => {
  event.preventDefault();
  setRunning(false);
};
runButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  setRunning(true);
  runButton.setPointerCapture(event.pointerId);
});
runButton.addEventListener("pointerup", releaseRun);
runButton.addEventListener("pointercancel", releaseRun);
runButton.addEventListener("lostpointercapture", releaseRun);
runButton.addEventListener("contextmenu", (event) => event.preventDefault());

const interactButton = document.querySelector("#interact-button");
const releaseInteraction = (event) => {
  event.preventDefault();
  interactButton.classList.remove("is-pressed");
};
interactButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  interactButton.classList.add("is-pressed");
  interactButton.setPointerCapture(event.pointerId);
  attemptInteraction();
});
interactButton.addEventListener("pointerup", releaseInteraction);
interactButton.addEventListener("pointercancel", releaseInteraction);
interactButton.addEventListener("lostpointercapture", releaseInteraction);
interactButton.addEventListener("contextmenu", (event) => event.preventDefault());

[tileGrid, houseTileGrid].forEach((grid) => {
  grid.addEventListener("click", (event) => {
    if (suppressNextTileClick) {
      suppressNextTileClick = false;
      return;
    }
    const tile = event.target.closest(".tile-coordinate");
    if (!tile || buildingPlacement || animalPlacement || furniturePlacement || tileBrush) return;
    selectMapTile(tile.dataset.scene, Number(tile.dataset.x), Number(tile.dataset.y));
  });
});

toggleTileBlock.addEventListener("click", () => {
  if (!selectedMapTile) return;
  const key = `${selectedMapTile.x},${selectedMapTile.y}`;
  const blocked = sceneMap(selectedMapTile.scene).blocked;
  const index = blocked.indexOf(key);
  if (index >= 0) blocked.splice(index, 1);
  else blocked.push(key);
  persistMap();
  refreshGridState(selectedMapTile.scene);
  updateBlockButton();
});

document.querySelector("#close-map-editor").addEventListener("click", () => {
  mapEditor.classList.remove("is-open");
  cancelBuildingPlacement();
  cancelAnimalPlacement();
  cancelFurniturePlacement();
  cancelTileBrush();
});

document.querySelectorAll(".editor-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.editorTab;
    document.querySelectorAll(".editor-tab").forEach((option) => {
      const active = option === tab;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".editor-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.editorPanel === target);
    });
    if (target === "buildings") renderPlacedBuildingList(currentScene);
    if (target === "animals") renderPlacedAnimalList(currentScene);
    if (target === "furniture") renderPlacedFurnitureList(currentScene);
    if (target === "maps") renderMapLibrary();
    if (target !== "tiles") cancelTileBrush();
    if (target !== "buildings") cancelBuildingPlacement();
    if (target !== "animals") cancelAnimalPlacement();
    if (target !== "furniture") cancelFurniturePlacement();
  });
});

document.querySelector("#create-map").addEventListener("click", createMap);
eraseTileTool.addEventListener("click", () => beginTileBrush({ empty: true }, eraseTileTool));
restoreTileTool.addEventListener("click", () => beginTileBrush({ restore: true }, restoreTileTool));
document.querySelectorAll(".tile-paint-mode").forEach((button) => {
  button.addEventListener("click", () => {
    tilePaintMode = button.dataset.tilePaintMode;
    document.querySelectorAll(".tile-paint-mode").forEach((option) => {
      const active = option === button;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-pressed", String(active));
    });
  });
});

buildingSourceSheet.addEventListener("pointerdown", (event) => {
  if (!editorEnabled()) return;
  event.preventDefault();
  const point = buildingSourcePoint(event);
  const key = `${point.x},${point.y}`;
  buildingCellGesture = {
    mode: buildingSelectedCells.has(key) ? "remove" : "add",
    visited: new Set(),
  };
  applyBuildingCellGesture(event);
});
document.addEventListener("pointermove", applyBuildingCellGesture);
document.addEventListener("pointerup", finishBuildingCellGesture);
document.addEventListener("pointercancel", finishBuildingCellGesture);
useBuildingSelection.addEventListener("click", useSelectedBuildingCells);
clearBuildingSelection.addEventListener("click", clearBuildingSourceCells);

furnitureSourceSheet.addEventListener("pointerdown", (event) => {
  if (!editorEnabled()) return;
  event.preventDefault();
  const point = furnitureSourcePoint(event);
  furnitureCropSelection = { startX: point.x, startY: point.y, x: point.x, y: point.y, width: 16, height: 16 };
  updateFurnitureSourceSelection(event);
});
furnitureSourceSheet.addEventListener("click", (event) => {
  if (furniturePlacement || furnitureCropSelection) return;
  const { x, y } = furnitureSourcePoint(event);
  beginFurniturePlacement({
    name: `furniture-${x}-${y}-16-16`,
    label: `Recorte ${x},${y} · 16×16`,
    x,
    y,
    width: 16,
    height: 16,
    custom: true,
  });
});
document.addEventListener("pointermove", updateFurnitureSourceSelection);
document.addEventListener("pointerup", finishFurnitureSourceSelection);
document.addEventListener("pointercancel", () => {
  furnitureCropSelection = null;
  furnitureSourceSelection.style.display = "none";
});

document.querySelectorAll("#tileset-accordions details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (details.open) buildTilesetPicker(details);
  });
});

document.querySelectorAll(".tile-source-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tileSourceTab;
    document.querySelectorAll(".tile-source-tab").forEach((option) => {
      const active = option === tab;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".tile-source-panel").forEach((panel) => {
      const active = panel.dataset.tileSourcePanel === target;
      panel.classList.toggle("is-active", active);
      if (active && panel.dataset.sheet) buildTilesetPicker(panel);
    });
  });
});

game.addEventListener("pointermove", (event) => {
  updateBuildingPreview(event);
  updateAnimalPreview(event);
  updateFurniturePreview(event);
  updateTileBrushPreview(event);
  if (tileBrush?.painting) paintWithTileBrush();
});
game.addEventListener(
  "pointerdown",
  (event) => {
    if (!editorEnabled()) return;
    if (event.target.closest(".outfit-picker")) return;
    if (buildingPlacement) {
      updateBuildingPreview(event);
      if (!confirmBuildingPlacement()) return;
      suppressNextTileClick = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (animalPlacement) {
      updateAnimalPreview(event);
      if (!confirmAnimalPlacement()) return;
      suppressNextTileClick = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (furniturePlacement) {
      updateFurniturePreview(event);
      if (!confirmFurniturePlacement()) return;
      suppressNextTileClick = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (tileBrush) {
      updateTileBrushPreview(event);
      if (!tileBrush.position) return;
      tileBrush.painting = tilePaintMode === "brush";
      tileBrush.lastKey = null;
      paintWithTileBrush();
      if (tileBrush.painting) game.setPointerCapture(event.pointerId);
      suppressNextTileClick = true;
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true,
);

const finishTileBrushStroke = () => {
  if (!tileBrush) return;
  tileBrush.painting = false;
  tileBrush.lastKey = null;
};
game.addEventListener("pointerup", finishTileBrushStroke);
game.addEventListener("pointercancel", finishTileBrushStroke);
game.addEventListener("lostpointercapture", finishTileBrushStroke);
game.addEventListener("pointerleave", () => {
  if (tileBrush && !tileBrush.painting) tileBrush.preview.style.display = "none";
});

window.addEventListener("resize", () => {
  buildTileGrid();
  buildHouseTileGrid();
  if (currentScene === "house") {
    spawnPlayerInHouse();
  } else {
    const size = playerSize();
    const world = outdoorWorldSize();
    player.x = Math.max(0, Math.min(world.width - size.width, player.x));
    player.y = Math.max(0, Math.min(world.height - size.height, player.y));
    if (positionTouchesBlockedTile(player.x, player.y)) {
      player.x = 0;
      player.y = 0;
    }
  }
  renderPosition();
});

window.addEventListener("popstate", () => {
  showScene(routeIsHouse() ? "house" : "outdoor", { pushRoute: false });
});

window.addEventListener("hashchange", () => {
  if (location.protocol === "file:" || location.hostname.endsWith("github.io")) {
    showScene(routeIsHouse() ? "house" : "outdoor", { pushRoute: false });
  }
});

spriteSheet.addEventListener("load", () => {
  persistMap();
  renderBuildingLibrary();
  renderAnimalLibrary();
  renderFurnitureLibrary();
  renderMapLibrary();
  buildTileGrid();
  renderPlacedBuildings("outdoor");
  renderPlacedBuildings("house");
  renderPlacedAnimals("outdoor");
  renderPlacedAnimals("house");
  renderPlacedFurniture("outdoor");
  renderPlacedFurniture("house");
  currentScene = routeIsHouse() ? "house" : "outdoor";
  renderPlacedBuildingList(currentScene);
  document.body.classList.toggle("house-route", currentScene === "house");
  if (currentScene === "house") {
    buildHouseTileGrid();
    spawnPlayerInHouse();
  } else {
    centerPlayer();
  }
  drawPlayer();
  requestAnimationFrame(gameLoop);
});

spriteSheet.addEventListener("error", () => {
  console.error("Não foi possível carregar a folha de sprites.");
});
