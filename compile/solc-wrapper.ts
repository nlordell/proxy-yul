/// <reference path="./solc.d.ts" />

import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";
import solc from "solc";

const root = path.join(__dirname, "..");
const outdir = path.join(root, "build");

export type Language = "Yul" | "Solidity";

export interface Unit {
  language: Language;
  file: string;
  outputSelection?: string[];
  outputOverrides?: Record<string, unknown>;
}

export async function compileAll(units: Unit[]): Promise<void> {
  await Promise.all(
    units.map(({ language, file, outputSelection, outputOverrides }) =>
      compile(language, file, outputSelection, outputOverrides)
    )
  );
}

export async function compile(
  language: Language,
  file: string,
  outputSelection: string[] = ["*"],
  outputOverrides: Record<string, unknown> = {}
): Promise<void> {
  const source = path.join(root, file);
  const contractName =
    typeof outputOverrides.contractName === "string"
      ? outputOverrides.contractName
      : path.parse(file).name;

  const { errors, contracts } = JSON.parse(
    solc.compile(
      JSON.stringify({
        language,
        sources: {
          [file]: {
            content: await fs.readFile(source, "utf-8"),
          },
        },
        settings: {
          optimizer: { enabled: true },
          outputSelection: {
            [file]: {
              [contractName]: outputSelection,
            },
          },
        },
      })
    )
  );

  for (const { severity, formattedMessage } of errors ?? []) {
    console.log(
      severity === "error"
        ? chalk.red(formattedMessage)
        : chalk.yellow(formattedMessage)
    );
  }
  if (contracts === undefined || contracts[file][contractName] === undefined) {
    throw new Error(`Error compiling ${file}.`);
  }

  await fs.mkdir(outdir, { recursive: true });
  await fs.writeFile(
    path.join(outdir, `${contractName}.json`),
    JSON.stringify(
      {
        ...contracts[file][contractName],
        contractName,
        sourceName: file,
        ...outputOverrides,
      },
      undefined,
      "  "
    )
  );
}
