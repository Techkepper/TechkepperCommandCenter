import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const variablePattern = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

export const extractTemplateVariablesFromBuffer = (
  buffer: Buffer
): string[] => {
  const zip = new PizZip(buffer);
  const xml = zip.file("word/document.xml")?.asText();

  if (!xml) {
    throw new Error("El archivo no contiene un documento Word valido");
  }

  const readableText = xml.replace(/<[^>]+>/g, "");
  const variables: string[] = [];
  let match = variablePattern.exec(readableText);

  while (match) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
    match = variablePattern.exec(readableText);
  }

  return variables.sort();
};

export const renderDocxTemplate = async (
  templatePath: string,
  data: Record<string, unknown>
): Promise<Buffer> => {
  const content = await fs.promises.readFile(templatePath);
  const zip = new PizZip(content);
  const document = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: () => ""
  });

  document.render(data);

  return document.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
};
