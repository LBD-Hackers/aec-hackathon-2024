import { FragmentsGroup } from "bim-fragment";
import {
  Component,
  Components,
  FragmentHighlighter,
  FragmentIdMap,
} from "openbim-components";
import { MeshBasicMaterial } from "three";
import { fragmentMapToFragmentIdMap } from "./helpers/map-conversion";
import { ExtendedClassifier } from "./quick-dirty-fixes/extended-classifier";
import { mergeFragmentIdMaps } from "./helpers/map-merge";

export interface Color {
  id: string;
  color: string;
  opacity?: number;
}

export interface ElementColoringDef {
  fragmentsGroup: FragmentsGroup;
  expressIds: number[];
  color: Color;
}

export interface ElementColoringDefGlobalId {
  globalIds: string[];
  color: Color;
}

/**
 * Element coloring component that uses the FragmentHighlighter
 */
export class ElementColoringHL extends Component<string> {
  static readonly uuid = "042d8cd7-b0ba-4578-86f9-281fe3eeb6ee" as const;
  enabled = true;

  private _highlighter: FragmentHighlighter;
  private _classifier: ExtendedClassifier;
  private _selectionMaps: {[selectionId: string]: FragmentIdMap} = {};

  constructor(components: Components) {
    super(components);
    this._highlighter = components.tools.get(FragmentHighlighter);
    this._classifier = components.tools.get(ExtendedClassifier);
  }

  get() {
    return ElementColoringHL.uuid;
  }

  async appendMultiple(
    elementColoringDefs: ElementColoringDef[]
  ): Promise<void> {
    for (let def of elementColoringDefs) {
      await this.appendColors(def.fragmentsGroup, def.expressIds, def.color);
    }
  }

  async appendColors(
    fragmentsGroup: FragmentsGroup,
    expressIds: number[],
    color: Color,
    zoomTo = false
  ): Promise<void> {
    // Create color if it's not already done
    await this._addHighlightMaterialIfNotExists(color);

    // Build fragmentIdMap
    const fragmentMap = fragmentsGroup.getFragmentMap(expressIds);
    const fragmentIdMap = fragmentMapToFragmentIdMap(fragmentMap);
    await this._highlighter.highlightByID(
      color.id,
      fragmentIdMap,
      false,
      zoomTo
    );

    this._selectionMaps[color.id] = fragmentIdMap;
  }

  async appendMultipleGlobalId(
    elementColoringDefs: ElementColoringDefGlobalId[]
  ): Promise<void> {
    for (let def of elementColoringDefs) {
      await this.appendColorsGlobalId(def.globalIds, def.color);
    }
  }

  async appendColorsGlobalId(
    globalIds: string[],
    color: Color,
    zoomTo = false
  ): Promise<void> {
    // Create color if it's not already done
    await this._addHighlightMaterialIfNotExists(color);

    // Build FragmentIdMap from globalIds
    const classifications = this._classifier.get();
    console.log(classifications);
    if(classifications.globalIds === undefined) console.error("Classifier must have classifications by GlobalId to work!");
    const fragmentIdMaps: FragmentIdMap[] = [];
    globalIds.forEach(globalId => {
      const map: FragmentIdMap = classifications.globalIds[globalId];
      if(map !== undefined) fragmentIdMaps.push(map);
    });
    const fragmentIdMap = mergeFragmentIdMaps(fragmentIdMaps);

    await this._highlighter.highlightByID(color.id, fragmentIdMap, false, zoomTo);
    this._selectionMaps[color.id] = fragmentIdMap;
  }

  async dispose() {
    this.resetAll();
  }

  async resetAll() {
    const existingMaterials = this._highlighter.get();
    for (const id of Object.keys(existingMaterials)) {
      await this._highlighter.clear(id);
    }
    this._selectionMaps = {};
  }

  async zoomTo(selectionId: string) {
    const fragmentIdMap = this._selectionMaps[selectionId];
    if(fragmentIdMap === undefined) return;
    await this._highlighter.highlightByID(
        selectionId,
        fragmentIdMap,
        false,
        true
    );
  }

  private async _addHighlightMaterialIfNotExists(
    color: Color
  ): Promise<void> {

    const existingMaterials = this._highlighter.get();
    if (Object.keys(existingMaterials).includes(color.id)) return;

    const material = new MeshBasicMaterial({ color: color.color });
    if (color.opacity !== undefined) {
      material.opacity = color.opacity;
      material.transparent = true;
      material.depthTest = false;
    }
    
    // NB! This method is slow!
    await this._highlighter.add(color.id, [material]);
  }

}
