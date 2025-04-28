# unbuild

<!-- automd:badges -->

[![npm version](https://img.shields.io/npm/v/unbuild)](https://npmjs.com/package/unbuild)
[![npm downloads](https://img.shields.io/npm/dm/unbuild)](https://npm.chart.dev/unbuild)

<!-- /automd -->

> A unified JavaScript build system

### 📦 Optimized bundler

Robust [rollup](https://rollupjs.org) based bundler that supports TypeScript and generates commonjs and module formats + type declarations.

### 🪄 Automated config

Automagically infer build config and entries from `package.json`.

### 📁 Bundleless build

Integration with [mkdist](https://github.com/unjs/mkdist) for generating bundleless dists with file-to-file transpilation.

### ✨ Passive watcher

Stub `dist` once using `unbuild --stub` (powered by [jiti](https://github.com/unjs/jiti)) and you can try and link your project without needing to watch and rebuild during development.

### ✍ Untype Generator

Integration with [untyped](https://github.com/unjs/untyped).

### ✔️ Secure builds

Automatically check for various build issues such as potential **missing** and **unused** [dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#dependencies) and fail CI.

CLI output also includes output size and exports for quick inspection.

## Usage

Create `src/index.ts`:

```js
export function log(...args) {
  console.log(...args)
}
```

Update `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "build": "unbuild",
    "prepack": "unbuild"
  },
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"]
}
```

> **Note**
> You can find a more complete example in [unjs/template](https://github.com/unjs/template) for project setup.

Build with `unbuild`:

```sh
npx unbuild
```

Configuration is automatically inferred from fields in `package.json` mapped to `src/` directory. For more control, continue with next section.

## Configuration

Create `build.config.ts`:

```js
export default {
  entries: ['./src/index'],
}
```

You can either use `unbuild` key in `package.json` or `build.config.{js,cjs,mjs,ts,mts,cts,json}` to specify configuration.

See options [here](./src/types.ts).

Example:

```js
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  // If entries is not provided, will be automatically inferred from package.json
  entries: [
    // default
    './src/index',
    // mkdist builder transpiles file-to-file keeping original sources structure
    {
      builder: 'mkdist',
      input: './src/package/components/',
      outDir: './build/components',
    },
  ],

  // Change outDir, default is 'dist'
  outDir: 'build',

  // Generates .d.ts declaration file
  declaration: true,
})
```

Or with multiple builds you can declare an array of configs:

```js
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    // If entries is not provided, will be automatically inferred from package.json
    entries: [
      // default
      './src/index',
      // mkdist builder transpiles file-to-file keeping original sources structure
      {
        builder: 'mkdist',
        input: './src/package/components/',
        outDir: './build/components',
      },
    ],

    // Change outDir, default is 'dist'
    outDir: 'build',

    /**
     * `compatible` means "src/index.ts" will generate "dist/index.d.mts", "dist/index.d.cts" and "dist/index.d.ts".
     * `node16` means "src/index.ts" will generate "dist/index.d.mts" and "dist/index.d.cts".
     * `true` is equivalent to `compatible`.
     * `false` will disable declaration generation.
     * `undefined` will auto detect based on "package.json". If "package.json" has "types" field, it will be `"compatible"`, otherwise `false`.
     */
    declaration: 'compatible',
  },
  {
    name: 'minified',
    entries: ['./src/index'],
    outDir: 'build/min',
    rollup: {
      esbuild: {
        minify: true,
      },
    },
  },
])
```

## Recipes

### Decorators support

In `build.config.ts`

```ts
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  rollup: {
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
  },
})
```

### Generate sourcemaps

```ts
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  sourcemap: true,
})
```

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

[MIT](./LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unbuild?style=flat-square
[npm-version-href]: https://npmjs.com/package/unbuild
[npm-downloads-src]: https://img.shields.io/npm/dm/unbuild?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/unbuild
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/unjs/unbuild/ci.yml?style=flat-square
[github-actions-href]: https://github.com/unjs/unbuild/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/unbuild/main?style=flat-square
[codecov-href]: https://codecov.io/gh/unjs/unbuild

# EXAMPLES

import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/index.ts",
    {
      builder: "untyped",
      input: "src/index.ts",
      outDir: "schema",
      name: "schema",
    },
  ],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});

import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/index.ts",
    {
      input: "src/plugins/",
      outDir: "dist/plugins/",
      format: "esm",
    },
    {
      input: "src/plugins/",
      outDir: "dist/plugins/",
      format: "cjs",
      ext: "cjs",
      declaration: false,
    },
  ],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});

import { defineBuildConfig } from 'unbuild'

// Separeate config required for dev because mkdist + cli-entry doesn't work
// with stub. It will create a .d.ts and .mjs file in the src folder
const dev = defineBuildConfig({
  entries: ['src/cli-entry'],
  outDir: 'dist',
  clean: true,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      target: 'node18',
      minify: false,
    },
  },
})

const prod = defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      cleanDist: true,
      input: './src/',
      pattern: ['**/*.{ts,tsx}', '!**/template/**'],
    },
  ],
  outDir: 'dist',
  clean: true,
  declaration: true,
  rollup: {
    inlineDependencies: true,
    esbuild: {
      target: 'node18',
      minify: false,
    },
  },
})

const config = process.env.BUILD_ENV === 'production' ? prod : dev
export default config

import { defineBuildConfig } from 'unbuild'
import { addRollupTimingsPlugin, stubOptions } from '../../debug/build-config'

export default defineBuildConfig({
  declaration: true,
  entries: [
    'src/index',
  ],
  stubOptions,
  hooks: {
    'rollup:options' (ctx, options) {
      addRollupTimingsPlugin(options)
    },
  },
  externals: [
    '@rspack/core',
    '@nuxt/schema',
    'nitropack',
    'nitro',
    'webpack',
    'vite',
    'h3',
  ],
})

import type { InputPluginOption } from 'rollup'
import process from 'node:process'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineBuildConfig } from 'unbuild'
import { purgePolyfills } from 'unplugin-purge-polyfills'

const isAnalysingSize = process.env.BUNDLE_SIZE === 'true'

export default defineBuildConfig({
  declaration: !isAnalysingSize,
  failOnWarn: !isAnalysingSize,
  hooks: {
    'rollup:options': function (ctx, options) {
      const plugins = (options.plugins ||= []) as InputPluginOption[]
      plugins.push(purgePolyfills.rollup({ logLevel: 'verbose' }))
      if (isAnalysingSize) {
        plugins.unshift(visualizer({ template: 'raw-data' }))
      }
    },
  },
  rollup: {
    dts: {
      respectExternal: false,
    },
    inlineDependencies: true,
    resolve: {
      exportConditions: ['production', 'node'],
    },
  },
  entries: ['src/index'],
  externals: [
    '@nuxt/test-utils',
    'fsevents',
    'node:url',
    'node:buffer',
    'node:path',
    'node:child_process',
    'node:process',
    'node:path',
    'node:os',
  ],
})
