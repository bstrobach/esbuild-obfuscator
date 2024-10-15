# esbuild-obfuscator

[![npm version](https://img.shields.io/npm/v/esbuild-obfuscator.svg)](https://www.npmjs.com/package/esbuild-obfuscator)
[![npm downloads](https://img.shields.io/npm/dm/esbuild-obfuscator.svg)](https://www.npmjs.com/package/esbuild-obfuscator)

An esbuild plugin that obfuscates JavaScript code using [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator).

## Installation

```bash
npm install esbuild-obfuscator
```

## Usage

```javascript
import esbuild from 'esbuild';
import { obfuscatorPlugin } from 'esbuild-obfuscator';

esbuild
  .build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'dist/bundle.js',
    metafile: true, // Required for the plugin
    plugins: [obfuscatorPlugin(/* options */)],
  })
  .catch(() => process.exit(1));
```

## Options

Pass options to customize the obfuscation process. Refer to the `javascript-obfuscator` [options](https://github.com/javascript-obfuscator/javascript-obfuscator#options).

```javascript
obfuscatorPlugin({
  compact: true,
  controlFlowFlattening: true,
  // ...other options
});
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
1. Create a new branch: git checkout -b feature/my-feature.
1. Make your changes.
1. Commit your changes: git commit -m 'Add some feature'.
1. Push to the branch: git push origin feature/my-feature.
1. Open a pull request.
1. Please ensure your code passes linting and tests.

## Development Setup

1. Clone the repository.
1. Install dependencies: npm install.
1. Build the library: nx build obfuscator-plugin.
1. Run tests: nx test obfuscator-plugin.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
