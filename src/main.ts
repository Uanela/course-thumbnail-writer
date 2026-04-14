import ffmpeg from "ffmpeg";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const covers = [
  { number: 14, title: "INTRODUÇÃO AO PROJECTO REACT" },
  { number: 15, title: "CRIANDO COMPONENTES DO PROJECTO" },
  { number: 16, title: "ADICIONANDO O ITEM TODO" },
  { number: 17, title: "ADICIONANDO LÓGICA DO APP" },
  { number: 18, title: "REFACTORIZANDO O CÓDIGO" },
  { number: 19, title: "AULA BÓNUS: ADICIONANDO BACKEND" },
];

function escapeFFmpegText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/%/g, "\\%");
}

const imageFile = "ts-course-cover.png";
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
        `${cover.number}-${kebabTitle}.jpeg`
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
      const lineHeight = fontSize + fontSize / 7;
      const startY = Math.round(cropHeight * 0.75);

      function getBoxX(length: number) {
        const x = length * 40;
        return Math.round((cropWidth - x) / 2);
      }

      const textFilters = lines
        .map(
          (line, index) =>
            `"drawtext=text='${escapeFFmpegText(line)}':fontcolor=white:fontsize=${fontSize}:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${getBoxX(line.length)}:y=${startY + index * lineHeight + 8}"`
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
