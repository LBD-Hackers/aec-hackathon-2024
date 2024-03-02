import { RDFMimetype } from "async-oxigraph";
import { Component, Components } from "openbim-components";
import { EventEmitter } from "tsee";
import { ElementColoringHL } from "./element-coloring-hl.component";
import { Query as DefaultQuery, RDFFile, Triplestore } from './oxigraph';
 
export interface Query extends DefaultQuery{
  id: string;
  query: string;
  postProcessing?: any;
  highlightResults?: boolean;   // Only possible if post processing returns an array of globalIds
  highlightColor?: string;
}

export class TriplestoreSettings{
  namespace = "https://web-bim/resources/"; // Namespace in which ABox resides
  greyOutRemainingOnHighlight = true;
}
 
/**
* Triplestore component that allows easy querying with predefined queries
*/
export class TriplestoreComponent extends Component<string> {
  static readonly uuid = "7fb96e3b-349d-4783-9cd6-836c11555d63" as const;
  enabled = true;

  private _size = 0;
  private _triplestore: Triplestore;
  private _elementColoringHL: ElementColoringHL;
  private _settings = new TriplestoreSettings();

  events = new EventEmitter<{
    sizeUpdated: (size: number) => void;
  }>();
 
  constructor(components: Components, workerPath = "./data/oxigraph/worker.js") {
    super(components);
    this._triplestore = Triplestore.getInstance(workerPath);
    this._triplestore.events.addListener("sizeUpdated", (size) => {
      this.events.emit("sizeUpdated", size);
    })
    this._elementColoringHL = components.tools.get(ElementColoringHL);
  }

  dispose(){
    this._triplestore.close();
  }

  async init(): Promise<void>{
    await this._triplestore.init();
  }
 
  async initFromFiles(files: RDFFile[], queries: Query[] = []): Promise<void> {
    this._triplestore.initFromFiles(files, queries);
  }

  async loadFiles(files: RDFFile[]): Promise<void>{
    this._triplestore.loadFiles(files);
  }

  async loadString(rdf: string, mimetype: RDFMimetype): Promise<void>{
    return this._triplestore.loadString(rdf, mimetype);
  }

  async clearHighlights(){
    this._elementColoringHL.resetAll();
  }

  // Predefined queries are stored in the component and can easily be used. Post-processing can be defined as well to make it even easier
  addPrefinedQueries(queries: Query[] = []): void{
    this._triplestore.addPrefinedQueries(queries);
  }
 
  addPrefixes(prefixes: {[prefix: string]: string}): void{
    this._triplestore.addPrefixes(prefixes);
  }
 
  async queryStored(queryId: string, params?: any): Promise<any>{
    const res = await this._triplestore.queryStored(queryId, params);

    const queryData: Query|undefined = this._triplestore.queries.find(q => q.id === queryId);
    if(queryData === undefined) return res;
    if(queryData.highlightResults){
      if(!Array.isArray(res)) throw new Error ("Highlighting is only possible if post-processing returns an array of GlobalIds");
      try{
        const color = queryData.highlightColor ?? "#FF0000";
        await this._elementColoringHL.appendColorsGlobalId(res, {color, id: color});
      }catch(err){
        throw new Error ("Highlighting failed. Are the returned values proper URI decoded GlobalIds?");
      }
    }
    return res;
  }

  async query(query: string): Promise<any>{
    return this._triplestore.query(query);
  }

  set settings(value: TriplestoreSettings){
    this._settings = value;
  }

  get settings(){
    return this._settings;
  }
 
  get() {
    return TriplestoreComponent.uuid;
  }

  get size(): number{
    return this._size;
  }

  buildIRI(globalId: string){
    return `${this._settings.namespace}${encodeURIComponent(globalId)}`;
  }
 
}