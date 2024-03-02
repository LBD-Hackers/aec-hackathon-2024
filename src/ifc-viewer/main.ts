import { RDFFile } from "./components/oxigraph";
import { SimpleSceneSetup, SimpleSetupSettings } from "./components/simple-scene-setup";
import { TriplestoreComponent } from "./components/triplestore.component";
import { RDFMimetype } from "async-oxigraph";
import { queries } from "./queries";
import { ElementColoringHL } from "./components/element-coloring-hl.component";
import puppeteer from "puppeteer";

// SETTINGS
const viewerSettings = new SimpleSetupSettings();
viewerSettings.models = [{
    "fragmentsFilePath": "../data/blox.frag",
    "propertiesFilePath": "../data/blox.json",
    "cache": true,
    "hidden": false
}];
const rdfFiles: RDFFile[] = [{
    filePath: "../data/rdf/blox.ttl",
    mimetype: RDFMimetype.TURTLE
}];
const url = 'https://old.sparenergi.dk/forbruger/vaerktoejer/find-dit-energimaerke';

// GLOBALS
let triplestore: TriplestoreComponent;
let colorHighlighter: ElementColoringHL;

// ELEMENT ACCESS
const btnDiv = document.getElementById("btns");
const showWindowsBtn = document.getElementById("show-windows");
showWindowsBtn?.addEventListener("click", async () => {
    await colorHighlighter.resetAll();
    const res = await triplestore.queryStored("listWindows");
    console.info(`Found ${res.length} windows`);
});
const showWallsBtn = document.getElementById("show-walls");
showWallsBtn?.addEventListener("click", async () => {
    await colorHighlighter.resetAll();
    const res = await triplestore.queryStored("listWalls");
    console.info(`Found ${res.length} walls`);
});
const resetBtn = document.getElementById("reset-colors");
resetBtn?.addEventListener("click", async () => {
    await colorHighlighter.resetAll();
});

build();
async function build() {
    
    let app = new SimpleSceneSetup(viewerSettings);
    triplestore = app.components.tools.get(TriplestoreComponent);
    colorHighlighter = app.components.tools.get(ElementColoringHL);

    // Initialize the app while loading triples in the store
    const appInitPromise = app.init();
    const triplestorePromise = triplestore.initFromFiles(rdfFiles);
    triplestore.addPrefinedQueries(queries);

    // Wait for scene to init and show button row
    await appInitPromise;
    await triplestorePromise;
    if(btnDiv) btnDiv.style.display = "flex";
}