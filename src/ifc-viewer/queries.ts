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
    }
];

function iriToGlobalId(iri: string): string {
    return decodeURIComponent(iri.split("/")?.pop() ?? iri);
}