import { RDFMimetype } from "async-oxigraph";

export interface Query {
  id: string;
  query: string;
  postProcessing?: any;
}

export interface RDFFile{
    filePath: string;
    mimetype: RDFMimetype;
}