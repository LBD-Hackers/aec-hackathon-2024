import {
  OrthoPerspectiveCamera,
  Components,
  PostproductionRenderer,
  SimpleScene,
  SimpleRaycaster,
  FragmentManager,
  FragmentHighlighter,
  SimpleGrid,
  FragmentCacher,
  IfcPropertiesProcessor,
  FragmentHighlighterConfig,
} from "openbim-components";
import { Postproduction } from "openbim-components/src/navigation/PostproductionRenderer/src/postproduction";
import { Color, Matrix4, MeshBasicMaterial } from "three";
import { FragmentsGroup, IfcProperties } from "bim-fragment";
import { ExtendedClassifier } from "./quick-dirty-fixes/extended-classifier";

export class SimpleSetupSettings {
  divId = "app";
  models: ModelDetails[] = [];
  showGrid = false;
  clickToZoom = false; // Zoom to object when clicked?
  centerAll = false; // If false, all models will be placed according to first model's transformation. If true, all models will simply be centered
}

export interface ModelDetails {
  fragmentsFilePath: string;
  propertiesFilePath?: string;
  cache: boolean;
  hidden: boolean; // If true the model will be hidden after load
  classifications?: { [className: string]: string }; // Appended to the classifier
  group?: FragmentsGroup
}

export class SimpleSceneSetup {
  private _viewer = new Components();
  private _viewerContainer?: HTMLDivElement;
  private _postproduction?: Postproduction;
  private _highlighter?: FragmentHighlighter;
  private _coordinationMatrix?: Matrix4;
  private _camera?: OrthoPerspectiveCamera;

  constructor(private _settings: SimpleSetupSettings) {}

  async init(): Promise<Components> {
    this._initScene();
    this._initRenderer();
    this._initCam();
    this._initViewer();
    this._initHighlighter();
    if (this._settings.showGrid) this._addGrid();
    await this.loadModels(this._settings.models);
    if (this._settings.clickToZoom) this._addClickToZoom();
    return this._viewer;
  }

  getViewerContainer(): HTMLElement {
    if(this._viewerContainer === undefined) throw new Error("Viewer container not set!");
    return this._viewerContainer;
  }

  get components(): Components{
    return this._viewer;
  }

  async loadModels(models: ModelDetails[], callback?: any) {
    let counter = 0;
    for (const model of models) {
      if(model.group === undefined){
        model.group = await this.loadLocalModel(
          model.fragmentsFilePath,
          model.propertiesFilePath,
          model.cache,
          model.hidden,
          model.classifications
        );
      }
      counter++;
      if(callback !== undefined) callback(counter, model.group);
    }
  }

  // LOAD MODEL
  async loadLocalModel(
    fragPath: string,
    propsPath?: string,
    useCache = false,
    hideImmidiately = false,
    classifications?: { [className: string]: string }
  ): Promise<FragmentsGroup> {
    const fragFile = await fetch(fragPath);
    const buffer = await fragFile.arrayBuffer();
    if (propsPath !== undefined) {
      const propsFile = await fetch(propsPath);
      const props = await propsFile.json();
      return this.loadModel(
        buffer,
        useCache,
        fragPath,
        hideImmidiately,
        props,
        classifications
      );
    }
    return this.loadModel(buffer, useCache, fragPath, hideImmidiately);
  }

  async loadModel(
    buffer: ArrayBuffer,
    useCache: boolean,
    cacheId: string,
    hideImmidiately = false,
    properties?: IfcProperties,
    classifications?: { [className: string]: string }
  ): Promise<FragmentsGroup> {
    let fragments = this._viewer.tools.get(FragmentManager);
    let propsProcessor = this._viewer.tools.get(IfcPropertiesProcessor);

    // Enable cacher?
    const cacher = this._viewer.tools.get(FragmentCacher);
    let modelExistsInCache = false;
    if (useCache) {
      // await cacher.deleteAll();
      cacher.enabled = true;
      // Already cached?
      if (cacher.ids.includes(`${cacheId}-fragments`))
        modelExistsInCache = true;
    }

    let fragmentGroup: FragmentsGroup;

    // First load or cache not enabled
    if (!modelExistsInCache) {
      console.log("Loading model from server...");

      // Load
      const uInt8Array = new Uint8Array(buffer);
      fragmentGroup = await fragments.load(uInt8Array);
      if (hideImmidiately) fragmentGroup.visible = false;

      // Save cache
      if (useCache) {
        await cacher.saveFragmentGroup(fragmentGroup, cacheId);
        console.log(`Cached model as ${cacheId}-fragments`);
      }
    }

    // Load from cache
    else {
      fragmentGroup = (await cacher.getFragmentGroup(
        cacheId
      )) as FragmentsGroup;
      if (hideImmidiately) fragmentGroup.visible = false;
      console.log("Loaded model from cache");
    }

    // Save coordination matrix if first model loaded
    if (this._coordinationMatrix === undefined) {
      this._coordinationMatrix = fragmentGroup.coordinationMatrix;
    } else {
      // Append saved coordination matrix if not the first model loaded
      // unless the centerAll setting is set to true
      if (!this._settings.centerAll) {
        // First place model in its own coordinate system
        fragmentGroup.applyMatrix4(fragmentGroup.coordinationMatrix.invert());
        // Then append the global coordination matrix of the first loaded model
        fragmentGroup.applyMatrix4(this._coordinationMatrix);
        fragmentGroup.items.forEach(fragment => {
          fragment.mesh.updateMatrixWorld(true);
        })
      }
      const highlighter = this._viewer.tools.get(FragmentHighlighter);
      highlighter.update();
    }

    // Add properties
    if (properties !== undefined) fragmentGroup.properties = properties;
    propsProcessor.process(fragmentGroup);

    // Add classifications to classifier
    const classifier = this._viewer.tools.get(ExtendedClassifier);
    classifier.byModel(cacheId, fragmentGroup);
    classifier.byEntity(fragmentGroup);
    classifier.byGlobalId(fragmentGroup);

    if (classifications !== undefined) {
      Object.keys(classifications).forEach((className) => {
        classifier.byModelClass(
          fragmentGroup,
          className,
          classifications[className]
        );
      });
    }

    if (this._highlighter != undefined) this._highlighter.update();

    return fragmentGroup;
  }

  private _initScene() {
    const sceneComponent = new SimpleScene(this._viewer);
    sceneComponent.setup();
    this._viewer.scene = sceneComponent;
  }

  private _initRenderer() {
    this._viewerContainer = document.getElementById(
      this._settings.divId
    ) as HTMLDivElement;
    const rendererComponent = new PostproductionRenderer(
      this._viewer,
      this._viewerContainer
    );
    this._viewer.renderer = rendererComponent;
    this._postproduction = rendererComponent.postproduction;
  }

  private _initCam(nearPlane = 0.1) {
    this._camera = new OrthoPerspectiveCamera(this._viewer);
    this._viewer.camera = this._camera;
    const c = this._camera.get();
    c.near = nearPlane; // Camera frustum near plane set to not crop detailed geometry
    c.updateProjectionMatrix();
    return this._camera;
  }

  private _initViewer() {
    this._viewer.init();
    if (this._postproduction != undefined) this._postproduction.enabled = true;
    // postproduction.customEffects.outlineEnabled = true;
  }

  private _initHighlighter() {
    // ADD RAYCASTER
    const raycasterComponent = new SimpleRaycaster(this._viewer);
    this._viewer.raycaster = raycasterComponent;

    // Setup highlighter
    this._highlighter = this._viewer.tools.get(FragmentHighlighter);

    this._highlighter.outlineEnabled = true;
    this._highlighter.outlineMaterial.color.set(0xf0ff7a);

    const hlConfig: FragmentHighlighterConfig = {
      selectName: "select",
      hoverName: "hover",
      selectionMaterial: new MeshBasicMaterial({
        color: "#9CC6CA",
        depthTest: false,
        opacity: 0.9,
        transparent: true,
      }),
      hoverMaterial: new MeshBasicMaterial({
        color: "#BCF124",
        depthTest: false,
        opacity: 0.3,
        transparent: true,
      }),
    };
    this._highlighter.setup(hlConfig);
  }

  private _addGrid() {
    const grid = new SimpleGrid(this._viewer, new Color(0x666666));
    if (this._postproduction !== undefined)
      this._postproduction.customEffects.excludedMeshes.push(grid.get());
  }

  private _addClickToZoom() {
    const highlighter = this._viewer.tools.get(FragmentHighlighter);
    highlighter.zoomToSelection = true;
  }
}
