import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";

import AppError from "../../errors/AppError";

const execFileAsync = promisify(execFile);

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface Request {
  sourcePath: string;
  mimeType: string;
}

const runLibreOffice = async (
  sourcePath: string,
  outputDirectory: string
): Promise<void> => {
  const profileDirectory = path.join(outputDirectory, "libreoffice-profile");
  await fs.mkdir(profileDirectory, { recursive: true });

  try {
    await execFileAsync(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profileDirectory).href}`,
        "--convert-to",
        "pdf:writer_pdf_Export",
        "--outdir",
        outputDirectory,
        sourcePath
      ],
      {
        timeout: 60000,
        windowsHide: true,
        maxBuffer: 1024 * 1024
      }
    );
  } catch (err) {
    const conversionError = err as NodeJS.ErrnoException;
    if (conversionError.code === "ENOENT") {
      throw new AppError(
        "La conversión a PDF no está disponible en el servidor.",
        503
      );
    }

    throw new AppError(
      "No fue posible convertir el documento a PDF. Revise que el archivo DOCX sea válido.",
      422
    );
  }
};

const ConvertDocumentToPdfService = async ({
  sourcePath,
  mimeType
}: Request): Promise<Buffer> => {
  if (mimeType === "application/pdf") {
    return fs.readFile(sourcePath);
  }

  if (mimeType !== docxMimeType) {
    throw new AppError(
      "Solo los documentos DOCX pueden convertirse a PDF.",
      400
    );
  }

  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "techkepper-pdf-")
  );

  try {
    await runLibreOffice(sourcePath, temporaryDirectory);

    const pdfName = `${path.basename(
      sourcePath,
      path.extname(sourcePath)
    )}.pdf`;
    const pdfPath = path.join(temporaryDirectory, pdfName);
    const pdf = await fs.readFile(pdfPath);

    if (!pdf.length) {
      throw new AppError("El PDF generado está vacío.", 422);
    }

    return pdf;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "No fue posible generar el archivo PDF solicitado.",
      422
    );
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
};

export default ConvertDocumentToPdfService;
