import { BuildOptions, BuildResult, Plugin, PluginBuild } from 'esbuild';
import { obfuscate } from 'javascript-obfuscator';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export interface ObfuscatorPluginOptions {
  [key: string]: unknown;
}

export function obfuscatorPlugin(
  options: ObfuscatorPluginOptions = {}
): Plugin {
  return {
    name: 'esbuild-obfuscator',
    setup(build: PluginBuild) {
      build.onEnd(async (result: BuildResult<BuildOptions>) => {
        if (result.errors.length) {
          return;
        }

        if (!result.metafile) {
          console.error(
            'Metafile is required for the obfuscator plugin to work.'
          );
          return;
        }

        const outputFiles: string[] = Object.keys(result.metafile.outputs);

        await Promise.all(
          outputFiles.map(async (outputFile: string) => {
            if (outputFile.endsWith('.js')) {
              const filePath: string = path.resolve(outputFile);
              const code: string = await fs.readFile(filePath, 'utf8');
              const obfuscatedCode: string = obfuscate(
                code,
                options
              ).getObfuscatedCode();
              await fs.writeFile(filePath, obfuscatedCode, 'utf8');
            }
          })
        );
      });
    },
  };
}
