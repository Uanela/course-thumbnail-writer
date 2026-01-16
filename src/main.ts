import ffmpeg from "ffmpeg";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const covers = [
  { number: 22, title: "O QUE É BASE DE DADOS" },
  { number: 23, title: " O QUE É SQL" },
  { number: 24, title: " COMANDOS BÁSICOS EM SQL" },
  { number: 25, title: " FAZENDO CRUD EM SQL" },
  { number: 26, title: " O QUE SÃO RELAÇÕES EM SQL" },
  { number: 27, title: " COMO USAR POSTGRESQL NO NODEJS" },
  { number: 28, title: " COMO CRIAR TABELAS NO SQL" },
  { number: 29, title: " OPERAÇÃO CREATE - CRUD" },
  { number: 30, title: " OPERAÇÃO READ - CRUD" },
  { number: 31, title: " OPERAÇÃO UPDATE - CRUD" },
  { number: 32, title: " OPERAÇÃO DELETE - CRUD" },
  { number: 33, title: " FAZENDO READ DE VALORES DE VÁRIAS TABELAS" },
  { number: 34, title: " COMO EVITAR INJEÇÃO SQL" },
  { number: 35, title: " O QUE É UMA ORM" },
  { number: 36, title: " O QUE É UM FRAMEWORK BACKEND" },
  { number: 37, title: " RESUMO MÓDULO 3" },
];

const imageFile = "cover-template.jpg";
const imagePath = path.join(Deno.cwd(), "images", imageFile);
const coversPath = path.join(Deno.cwd(), "covers");

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function generatecovers() {
  const coverFolder = path.join(coversPath, imageFile.replace(".jpg", ""));
  try {
    await fs.ensureDir(coversPath);

    await fs.emptyDir(coversPath);
    for (const cover of covers) {
      const kebabTitle = toKebabCase(cover.title);

      await fs.ensureDir(coverFolder);

      const outputPath = path.join(
        coverFolder,
        `${cover.number}${kebabTitle}.jpeg`
      );

      console.log(`Processing: ${cover.title}`);

      const image = await new ffmpeg(imagePath);
      const metadata = await image.metadata;

      const imageWidth = metadata.video.resolution.w;
      const imageHeight = metadata.video.resolution.h;
      const cropWidth = imageWidth;
      const cropHeight = imageHeight;

      const wrapText = (text: string, maxChars: number = 28): string[] => {
        const words = text.split(" ");
        let lines: string[] = [];
        let currentLine: string = "";

        for (const word of words) {
          const testLine = currentLine + word + " ";
          if (testLine.length > maxChars && currentLine.length > 0) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.trim().length > 0) {
          lines.push(currentLine.trim());
        }
        return lines;
      };

      const lines = wrapText(cover.title);
      const fontSize = 64;
      const lineHeight = fontSize + fontSize / 6;
      const startY = Math.round(cropHeight * 0.75);

      function getBoxX(length: number) {
        const x = length * 40;
        return Math.round((cropWidth - x) / 2);
      }

      const textFilters = lines
        .map(
          (line, index) =>
            `drawtext=text='${line.replace(/'/g, "\\'")}':fontcolor=white:fontsize=${fontSize}:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${getBoxX(line.length)}:y=${startY + index * lineHeight + 8}`
        )
        .join(",");
      const numberText = `drawtext=text='${String(cover.number).length === 3 ? cover.number : `0${cover.number}`}':fontcolor=white:fontsize=113:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${cropWidth - 252}:y=${28}`;

      const filterComplex = `${textFilters},${numberText}`;
      image.addCommand("-filter_complex", filterComplex);
      image.addCommand("-c:a", "copy");

      await image.save(outputPath);

      console.log(`✓ Created: ${outputPath}`);
    }

    console.log("All covers generated successfully!");
  } catch (error) {
    console.error("Error generating covers:", error);
  }
}

generatecovers();
