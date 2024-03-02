import { Query } from "./components/triplestore.component";

export const queries: Query[] = [
    {
      id: "listWindows",
      query: `PREFIX ifc: <http://ifcowl.openbimstandards.org/IFC2X3_Final#> 
      SELECT ?s WHERE {?s a ifc:IFCPLATE}`,
      postProcessing: (res: any): any[] => {
        return res.results.bindings.map(b => iriToGlobalId(b.s.value));
      },
      highlightColor: "red",
      highlightResults: true
    },
    {
      id: "listWalls",
      query: `PREFIX ifc: <http://ifcowl.openbimstandards.org/IFC2X3_Final#> 
      SELECT ?s WHERE {?s a ifc:IFCWALL}`,
      postProcessing: (res: any): any[] => {
        return res.results.bindings.map(b => iriToGlobalId(b.s.value));
      },
      highlightColor: "red",
      highlightResults: true
    },
    {
      id: "listWalls",
      query: `PREFIX bot: <https://w3id.org/bot#> 
      PREFIX schema: <http://schema.org/> 
      PREFIX rec: <http://purl.org/ontology/rec/core#> 
      
      SELECT ?s ?lat ?lng
      WHERE {
        ?s a bot:Building ;
           schema:geo [
             schema:latitude ?lat ;
             schema:longitude ?lng 
           ]
      }`,
      postProcessing: (res: any): any[] => {
        return res.results.bindings.map(b => {
          return {iri: iriToGlobalId(b.s.value), lat: b.lat.value, lng: b.lng.value};
        });
      },
    }
];

function iriToGlobalId(iri: string): string {
    return decodeURIComponent(iri.split("/")?.pop() ?? iri);
}