import { AsyncOxigraph, RDFMimetype } from "async-oxigraph";
import { Query, RDFFile } from "./models";
import { EventEmitter } from "tsee";
import Handlebars from "handlebars";

export class Triplestore {
  private static _instance: Triplestore;

  private _size = 0;
  private _asyncOxigraph: AsyncOxigraph;
  private _queries: Query[] = [];
  private _prefixes: { [prefix: string]: string } = {};
  // private _reasoner = RoxiReasoner.new();

  events = new EventEmitter<{
    sizeUpdated: (size: number) => void;
  }>();

  get queries(){
    return this._queries;
  }

  private constructor(workerPath: string){
    this._asyncOxigraph = new AsyncOxigraph(workerPath);
    this._resetPrefixes();
  }

  static getInstance(workerPath = "./data/oxigraph/worker.js") {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new Triplestore(workerPath);
    return this._instance;
  }

  async init(): Promise<void> {
    await this._asyncOxigraph.init();
    console.log("Oxigraph ready");
  }

  close(){
    this._asyncOxigraph.close();
    this._resetPrefixes();
  }

  async initFromFiles(files: RDFFile[], queries: Query[] = []): Promise<void> {
    this.addPrefinedQueries(queries);
    await this._asyncOxigraph.init();
    await this.loadFiles(files);
    console.info("Oxigraph ready");
  }

  async loadFiles(files: RDFFile[]): Promise<void> {
    for (let f of files) {
      const file = await fetch(f.filePath);
      const quads = await file.text();

      // Load in Oxigraph
      await this._asyncOxigraph.load(quads, f.mimetype);

      console.info(`Loaded ${f.filePath}`);
    }
    await this._updateSize();
  }

  async loadString(rdf: string, mimetype: RDFMimetype): Promise<void> {
    await this._asyncOxigraph.load(rdf, mimetype);
    this._updateSize();
  }

  // Predefined queries are stored in the component and can easily be used. Post-processing can be defined as well to make it even easier
  addPrefinedQueries(queries: Query[] = []): void {
    queries.forEach((query) => {
      const match = this._queries.find((q) => q.id === query.id);
      if (match === undefined) this._queries.push(query);
    });
  }

  addPrefixes(prefixes: { [prefix: string]: string }): void {
    this._prefixes = { ...this._prefixes, ...prefixes };
  }

  async queryStored(queryId: string, params?: any): Promise<any> {
    const queryData = this._queries.find((q) => q.id === queryId);
    if (queryData === undefined)
      throw new Error(`Unknown query with id "${queryId}"`);
    const queryFunction = Handlebars.compile(queryData.query);
    const query = this._appendPrefixesToQuery(queryFunction(params));
    const res = await this._asyncOxigraph.query(query);
    if (queryData.postProcessing !== undefined) {
      return await queryData.postProcessing(res.data);
    }
    return res.data;
  }

  async query(query: string): Promise<any> {
    return this._asyncOxigraph.query(query);
  }

  private async _updateSize() {
    const res = await this._asyncOxigraph.query(
      "SELECT (COUNT(*) AS ?count) WHERE {?s ?p ?o}"
    );
    this._size = res.data.results.bindings[0].count.value;
    this.events.emit("sizeUpdated", this._size);
  }

  private _appendPrefixesToQuery(query: string) {
    Object.keys(this._prefixes).forEach((pfx) => {
      query = `PREFIX ${pfx}: <${this._prefixes[pfx]}>\n${query}`;
    });
    return query;
  }

  private _resetPrefixes(){
    this._prefixes = {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#"
    }
  }

}
