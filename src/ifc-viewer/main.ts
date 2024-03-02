import { RDFFile } from "./components/oxigraph";
import { SimpleSceneSetup, SimpleSetupSettings } from "./components/simple-scene-setup";
import { TriplestoreComponent } from "./components/triplestore.component";
import { RDFMimetype } from "async-oxigraph";
import { queries } from "./queries";

// SETTINGS
const viewerSettings = new SimpleSetupSettings();
viewerSettings.models = [{
    "fragmentsFilePath": "../data/blox.frag",
    "propertiesFilePath": "../data/blox.json",
    "cache": true,
    "hidden": false
}];
const rdfFiles: RDFFile[] = [{
    filePath: "../data/blox.ttl",
    mimetype: RDFMimetype.TURTLE
}];

// GLOBALS
let triplestore: TriplestoreComponent;

// ELEMENT ACCESS
const btnDiv = document.getElementById("btns");
const showWindowsBtn = document.getElementById("show-windows");
showWindowsBtn?.addEventListener("click", async () => {
    const res = await triplestore.queryStored("listWindows");
    console.info(`Found ${res.length} windows`);
});
const showWallsBtn = document.getElementById("show-walls");
showWallsBtn?.addEventListener("click", async () => {
    const res = await triplestore.queryStored("listWalls");
    console.info(`Found ${res.length} walls`);
});

build();
async function build() {
    
    let app = new SimpleSceneSetup(viewerSettings);
    triplestore = app.components.tools.get(TriplestoreComponent);

    // Initialize the app while loading triples in the store
    const appInitPromise = app.init();
    const triplestorePromise = triplestore.initFromFiles(rdfFiles);
    triplestore.addPrefinedQueries(queries);

    // Wait for scene to init and show button row
    await appInitPromise;
    await triplestorePromise;
    if(btnDiv) btnDiv.style.display = "flex";
}