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
const mapEditor = document.querySelector("#map-editor");
const selectedTileLabel = document.querySelector("#selected-tile-label");
const toggleTileBlock = document.querySelector("#toggle-tile-block");
const buildingLibrary = document.querySelector("#building-library");
const placedBuildingList = document.querySelector("#placed-building-list");
const placedBuildingsTitle = document.querySelector("#placed-buildings-title");
const mapLibraryElement = document.querySelector("#map-library");

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

const SHEETS = {
  "outdoors-spring": { file: "assets/tilesets/outdoors-spring.png", width: 656, height: 1664 },
  flooring: { file: "assets/tilesets/flooring.png", width: 512, height: 256 },
  "farm-buildings": { file: "assets/tilesets/farm-buildings.png", width: 919, height: 412 },
  cabins: { file: "assets/tilesets/cabins.png", width: 240, height: 784 },
  farmhouse: { file: "assets/tilesets/farmhouse.png", width: 192, height: 352 },
  furniture: { file: "assets/tilesets/furniture.png", width: 980, height: 1488 },
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
].map((asset) => ({
  ...asset,
  file: asset.file ?? `assets/tiles/buildings/farm/${asset.name}.png`,
}));

const LEGACY_CABIN_BLOCKED = [
  "2,1", "3,1", "4,1",
  "1,2", "2,2", "3,2", "4,2", "5,2",
  "1,3", "2,3", "3,3", "4,3", "5,3",
  "1,4", "2,4", "3,4", "4,4", "5,4",
  "1,5", "2,5", "4,5", "5,5",
  "1,6", "2,6", "4,6", "5,6",
];

const DEFAULT_MAP = {
  version: 4,
  tileSize: TILE_SIZE,
  dimensions: { columns: DEFAULT_MAP_COLUMNS, rows: DEFAULT_MAP_ROWS },
  maps: {
    outdoor: {
      defaultTile: { sheet: "outdoors-spring", x: 32, y: 208 },
      tiles: {},
      blocked: [],
      buildings: [{ id: "default-cabin-01", asset: "cabin-01", x: TILE_SIZE, y: TILE_SIZE }],
    },
    house: { defaultTile: null, tiles: {}, blocked: [], buildings: [] },
  },
};

function migrateSingleMap(parsed) {
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
    });
    parsed.tileSize = TILE_SIZE;
    parsed.version = 4;
  }
  parsed.dimensions = { columns: DEFAULT_MAP_COLUMNS, rows: DEFAULT_MAP_ROWS };
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
  return window.innerWidth > 768;
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
  empty.maps.outdoor.blocked = [];
  empty.maps.house.buildings = [];
  empty.maps.house.blocked = [];
  return empty;
}

function renderMapLibrary() {
  const fragment = document.createDocumentFragment();
  mapLibrary.mapList.forEach((entry) => {
    const button = document.createElement("button");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    const summary = document.createElement("span");
    const outdoor = entry.data.maps.outdoor;
    const editedTileCount = Object.keys(outdoor.tiles).length;
    const buildingCount = outdoor.buildings.length;

    button.className = "map-card";
    button.classList.toggle("is-active", entry.id === activeMapId);
    button.type = "button";
    copy.className = "map-card-copy";
    name.textContent = entry.name;
    summary.textContent = `${editedTileCount} tiles editados · ${buildingCount} construções`;
    copy.append(name, summary);
    button.append(copy);
    button.addEventListener("click", () => activateMap(entry.id));
    fragment.append(button);
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

function sceneMap(scene = currentScene) {
  return mapState.maps[scene];
}

function isMapTileBlocked(scene, x, y) {
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
  if (!tile) {
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

function renderPlacedBuildings(scene) {
  const layer = scene === "house" ? houseBuildingsLayer : outdoorBuildingsLayer;
  const fragment = document.createDocumentFragment();
  layer.replaceChildren();
  for (const building of sceneMap(scene).buildings) {
    const asset = BUILDING_ASSETS.find((candidate) => candidate.name === building.asset);
    if (!asset) continue;
    const image = document.createElement("img");
    image.className = "placed-building";
    image.src = asset.file;
    image.alt = "";
    image.style.left = `${building.x}px`;
    image.style.top = `${building.y}px`;
    image.style.width = `${asset.width}px`;
    image.style.height = `${asset.height}px`;
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
    const asset = BUILDING_ASSETS.find((candidate) => candidate.name === building.asset);
    if (!asset) return;

    const row = document.createElement("div");
    const image = document.createElement("img");
    const info = document.createElement("div");
    const name = document.createElement("strong");
    const position = document.createElement("span");
    const removeButton = document.createElement("button");

    row.className = "placed-building-row";
    image.src = asset.file;
    image.alt = "";
    info.className = "placed-building-info";
    name.textContent = asset.name;
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

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const tile = document.createElement("div");
      const label = document.createElement("span");
      tile.className = "tile-coordinate";
      tile.dataset.scene = "outdoor";
      tile.dataset.x = String(x);
      tile.dataset.y = String(y);
      label.textContent = `${x},${y}`;
      tile.append(label);
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
      const label = document.createElement("span");
      tile.className = "tile-coordinate";
      tile.dataset.scene = "house";
      tile.dataset.x = String(x);
      tile.dataset.y = String(y);
      label.textContent = `${x},${y}`;
      tile.append(label);
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
    spawnPlayerInHouse();
  } else {
    renderPlacedBuildings("outdoor");
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
  if (!editorEnabled() || buildingPlacement) return;
  selectedMapTile = { scene, x, y };
  selectedTileLabel.textContent = `${scene} · ${x},${y}`;
  mapEditor.classList.add("is-open");
  refreshGridState("outdoor");
  refreshGridState("house");
  updateBlockButton();
  renderPlacedBuildingList(scene);
}

function cancelTileBrush() {
  tileBrush?.preview.remove();
  tileBrush = null;
}

function beginTileBrush(tileDefinition) {
  cancelBuildingPlacement();
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
  sceneMap(tileBrush.scene).tiles[key] = { ...tileBrush.tile };
  const layer = tileBrush.scene === "house" ? houseMapLayer : outdoorMapLayer;
  const cell = layer.querySelector(`[data-x="${position.x}"][data-y="${position.y}"]`);
  if (cell) applyTileStyle(cell, tileBrush.tile);
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
  cancelTileBrush();
  const preview = document.createElement("img");
  preview.className = "building-preview";
  preview.src = asset.file;
  preview.alt = "";
  preview.style.width = `${asset.width}px`;
  preview.style.height = `${asset.height}px`;
  preview.style.transform = `scale(${SHEET_SCALE})`;
  const container = currentScene === "house" ? houseRoom : game;
  container.append(preview);
  button.classList.add("is-active");
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
  sceneMap(buildingPlacement.scene).buildings.push({
    id: `${buildingPlacement.asset.name}-${Date.now()}`,
    asset: buildingPlacement.asset.name,
    x: buildingPlacement.x,
    y: buildingPlacement.y,
  });
  const scene = buildingPlacement.scene;
  persistMap();
  cancelBuildingPlacement();
  renderPlacedBuildings(scene);
  refreshGridState(scene);
  return true;
}

function update(deltaTime) {
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
  if (event.key === "Escape" && (buildingPlacement || tileBrush)) {
    event.preventDefault();
    cancelBuildingPlacement();
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
    if (!tile || buildingPlacement || tileBrush) return;
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
    if (target === "maps") renderMapLibrary();
    if (target !== "tiles") cancelTileBrush();
  });
});

document.querySelector("#create-map").addEventListener("click", createMap);

document.querySelectorAll("#tileset-accordions details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (details.open) buildTilesetPicker(details);
  });
});

game.addEventListener("pointermove", (event) => {
  updateBuildingPreview(event);
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
    if (tileBrush) {
      updateTileBrushPreview(event);
      if (!tileBrush.position) return;
      tileBrush.painting = true;
      tileBrush.lastKey = null;
      paintWithTileBrush();
      game.setPointerCapture(event.pointerId);
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
  renderMapLibrary();
  buildTileGrid();
  renderPlacedBuildings("outdoor");
  renderPlacedBuildings("house");
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
