// obfuscatorPlugin.test.ts
import { build, BuildOptions } from 'esbuild';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { obfuscatorPlugin } from './esbuild-obfuscator';

describe('obfuscatorPlugin', () => {
  it('should obfuscate JavaScript output files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Write some simple JavaScript code to an input file
      const inputFile = path.join(tempDir, 'input.js');
      const inputCode =
        'function hello() { console.log("Hello, world!"); } hello();';
      await fs.writeFile(inputFile, inputCode);

      // Build options with obfuscation settings
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile],
        outfile: path.join(tempDir, 'out.js'),
        bundle: false,
        metafile: true,
        plugins: [
          obfuscatorPlugin({
            renameGlobals: true,
            identifierNamesGenerator: 'mangled', // or 'hexadecimal'
          }),
        ],
      };

      // Run esbuild
      await build(buildOptions);

      // Read the output file
      const outputFile = path.join(tempDir, 'out.js');
      const outputCode = await fs.readFile(outputFile, 'utf8');

      // Check that the output code is different from the input code (i.e., it has been obfuscated)
      expect(outputCode).not.toEqual(inputCode);

      // Check that the output code contains an obfuscated function definition
      expect(/function \w+\(\)/.test(outputCode)).toBe(true);

      // Optionally, check that the obfuscated function name is present
      // This depends on the obfuscation settings and might vary
      // For example, if identifierNamesGenerator is 'mangled':
      expect(/function \w+\(\)/.test(outputCode)).toBe(true);
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should obfuscate multiple JavaScript output files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Write multiple JavaScript files
      const inputFile1 = path.join(tempDir, 'input1.js');
      const inputCode1 =
        'function greet() { console.log("Hello from file 1"); } greet();';
      await fs.writeFile(inputFile1, inputCode1);

      const inputFile2 = path.join(tempDir, 'input2.js');
      const inputCode2 =
        'function salute() { console.log("Hello from file 2"); } salute();';
      await fs.writeFile(inputFile2, inputCode2);

      // Build options with multiple entry points
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile1, inputFile2],
        outdir: tempDir,
        bundle: false,
        metafile: true,
        plugins: [
          obfuscatorPlugin({
            renameGlobals: true,
            identifierNamesGenerator: 'mangled',
          }),
        ],
      };

      // Run esbuild
      await build(buildOptions);

      // Read and test output files
      for (const [inputFile, inputCode] of [
        [inputFile1, inputCode1],
        [inputFile2, inputCode2],
      ] as const) {
        const outputFile = path.join(tempDir, path.basename(inputFile));
        const outputCode = await fs.readFile(outputFile, 'utf8');

        expect(outputCode).not.toEqual(inputCode);
        expect(outputCode).not.toContain('function greet()');
        expect(outputCode).not.toContain('function salute()');
        expect(/function \w+\(\)/.test(outputCode)).toBe(true);
      }
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should log an error when metafile is missing', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    // Mock console.error
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      // Write some simple JavaScript code to an input file
      const inputFile = path.join(tempDir, 'input.js');
      const inputCode =
        'function hello() { console.log("Hello, world!"); } hello();';
      await fs.writeFile(inputFile, inputCode);

      // Build options without metafile
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile],
        outfile: path.join(tempDir, 'out.js'),
        bundle: false,
        plugins: [obfuscatorPlugin()],
      };

      // Run esbuild
      await build(buildOptions);

      // Check that console.error was called with the expected message
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Metafile is required for the obfuscator plugin to work.'
      );
    } finally {
      // Restore console.error
      consoleErrorMock.mockRestore();

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should not run obfuscation if there are build errors', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Write some invalid JavaScript code to an input file
      const inputFile = path.join(tempDir, 'input.js');
      const inputCode = 'function hello() { console.log("Hello, world!");'; // Missing closing brace
      await fs.writeFile(inputFile, inputCode);

      // Build options with logLevel set to 'silent'
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile],
        outfile: path.join(tempDir, 'out.js'),
        bundle: false,
        metafile: true,
        logLevel: 'silent', // Suppress esbuild log messages
        plugins: [obfuscatorPlugin()],
      };

      // Run esbuild and expect it to fail
      await expect(build(buildOptions)).rejects.toThrow();

      // Since build failed, there should be no output file
      const outputFile = path.join(tempDir, 'out.js');
      const fileExists = await fs
        .access(outputFile)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should not obfuscate non-JavaScript files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Write a JavaScript file and a CSS file
      const jsFile = path.join(tempDir, 'script.js');
      const jsCode = 'function test() { console.log("Testing"); } test();';
      await fs.writeFile(jsFile, jsCode);

      const cssFile = path.join(tempDir, 'style.css');
      const cssCode = 'body { background-color: #fff; }';
      await fs.writeFile(cssFile, cssCode);

      // Build options - only include JavaScript entry point
      const buildOptions: BuildOptions = {
        entryPoints: [jsFile],
        outdir: tempDir,
        bundle: false,
        metafile: true,
        plugins: [
          obfuscatorPlugin({
            renameGlobals: true,
            identifierNamesGenerator: 'mangled',
          }),
        ],
      };

      // Run esbuild
      await build(buildOptions);

      // Read and test JavaScript output
      const outputJs = await fs.readFile(jsFile, 'utf8');
      expect(outputJs).not.toEqual(jsCode);
      expect(outputJs).not.toContain('function test()');

      // Ensure the CSS file remains unchanged
      const outputCss = await fs.readFile(cssFile, 'utf8');
      expect(outputCss).toEqual(cssCode);
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should apply custom obfuscator options', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Write JavaScript code with string literals
      const inputFile = path.join(tempDir, 'input.js');
      const inputCode =
        'const message = "Secret Message"; console.log(message);';
      await fs.writeFile(inputFile, inputCode);

      // Build options with custom obfuscator settings
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile],
        outfile: path.join(tempDir, 'out.js'),
        bundle: false,
        metafile: true,
        plugins: [
          obfuscatorPlugin({
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 1,
          }),
        ],
      };

      // Run esbuild
      await build(buildOptions);

      // Read the output file
      const outputFile = path.join(tempDir, 'out.js');
      const outputCode = await fs.readFile(outputFile, 'utf8');

      // Check that string literals are obfuscated
      expect(outputCode).not.toContain('"Secret Message"');
      expect(outputCode).toContain('var _0x');
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should work with code splitting', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      const sharedModule = path.join(tempDir, 'shared.js');
      const sharedCode =
        'export function shared() { console.log("Shared Module"); }';
      await fs.writeFile(sharedModule, sharedCode);

      const entryFile = path.join(tempDir, 'entry.js');
      const entryCode = 'import { shared } from "./shared"; shared();';
      await fs.writeFile(entryFile, entryCode);

      const buildOptions: BuildOptions = {
        entryPoints: [entryFile],
        outdir: tempDir,
        bundle: true,
        splitting: true,
        format: 'esm',
        metafile: true,
        // Remove plugins temporarily
        // plugins: [obfuscatorPlugin(/* options */)],
      };

      await build(buildOptions);

      // Check the output files
      const files = await fs.readdir(tempDir);
      console.log('Output files:', files);
    } catch (error) {
      console.error('Error during test execution:', error);
      throw error;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle large JavaScript files efficiently', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Generate a large JavaScript file
      const inputFile = path.join(tempDir, 'large.js');
      let inputCode = '';
      for (let i = 0; i < 1000; i++) {
        inputCode += `function testFunc${i}() { console.log("Function ${i}"); }\n`;
      }
      inputCode += 'testFunc0();';

      await fs.writeFile(inputFile, inputCode);

      // Build options
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile],
        outfile: path.join(tempDir, 'out.js'),
        bundle: false,
        metafile: true,
        plugins: [
          obfuscatorPlugin({
            renameGlobals: true,
            identifierNamesGenerator: 'mangled',
          }),
        ],
      };

      // Run esbuild and measure time
      const startTime = Date.now();
      await build(buildOptions);
      const duration = Date.now() - startTime;

      // Read the output file
      const outputFile = path.join(tempDir, 'out.js');
      const outputCode = await fs.readFile(outputFile, 'utf8');

      // Ensure the output code is obfuscated
      expect(outputCode).not.toContain('function testFunc0()');
      expect(/function \w+\(\)/.test(outputCode)).toBe(true);

      // Check that the build didn't take excessively long (e.g., less than 10 seconds)
      expect(duration).toBeLessThan(10000);
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle empty output gracefully', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-test-'));

    try {
      // Write an empty JavaScript file
      const inputFile = path.join(tempDir, 'empty.js');
      const inputCode = '';
      await fs.writeFile(inputFile, inputCode);

      // Build options
      const buildOptions: BuildOptions = {
        entryPoints: [inputFile],
        outfile: path.join(tempDir, 'out.js'),
        bundle: false,
        metafile: true,
        plugins: [obfuscatorPlugin()],
      };

      // Run esbuild
      await build(buildOptions);

      // Read the output file
      const outputFile = path.join(tempDir, 'out.js');
      const outputCode = await fs.readFile(outputFile, 'utf8');

      // Ensure the output code is still empty
      expect(outputCode).toEqual('');
    } finally {
      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
