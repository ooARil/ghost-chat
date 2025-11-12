'use strict';

const core = require('@babel/core');
const index = require('./index.cjs');
const linguiMacroPlugin = require('@lingui-solid/babel-plugin-lingui-macro');
require('@babel/types');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const linguiMacroPlugin__default = /*#__PURE__*/_interopDefaultCompat(linguiMacroPlugin);

const babelRe = new RegExp(
  "\\.(" + [...core.DEFAULT_EXTENSIONS, ".ts", ".mts", ".cts", ".tsx"].map((ext) => ext.slice(1)).join("|") + ")$",
  "i"
);
const inlineSourceMapsRE = new RegExp(
  /\/[\/\*][#@]\s+sourceMappingURL=data:application\/json;(?:charset:utf-8;)?base64,/i
);
async function createSourceMapper(code, sourceMaps) {
  let sourceMapsConsumer;
  if (sourceMaps) {
    const { SourceMapConsumer } = await import('./chunks/source-map.cjs').then(function (n) { return n.sourceMap; });
    sourceMapsConsumer = await new SourceMapConsumer(sourceMaps);
  } else if (code.search(inlineSourceMapsRE) != -1) {
    const { SourceMapConsumer } = await import('./chunks/source-map.cjs').then(function (n) { return n.sourceMap; });
    const { fromSource } = await import('./chunks/index.cjs').then(function (n) { return n.index; });
    const t = fromSource(code).toObject();
    sourceMapsConsumer = await new SourceMapConsumer(t);
  }
  return {
    destroy: () => {
      if (sourceMapsConsumer) {
        sourceMapsConsumer.destroy();
      }
    },
    originalPositionFor: (origin) => {
      if (!sourceMapsConsumer) {
        return origin;
      }
      const [_, line, column] = origin;
      const mappedPosition = sourceMapsConsumer.originalPositionFor({
        line,
        column
      });
      return [mappedPosition.source, mappedPosition.line, mappedPosition.column];
    }
  };
}
async function extractFromFileWithBabel(filename, code, onMessageExtracted, ctx, parserOpts, skipMacroPlugin = false) {
  const mapper = await createSourceMapper(code, ctx?.sourceMaps);
  await core.transformAsync(code, {
    // don't generate code
    code: false,
    babelrc: false,
    configFile: false,
    filename,
    inputSourceMap: ctx?.sourceMaps,
    parserOpts,
    plugins: [
      ...!skipMacroPlugin ? [
        [
          linguiMacroPlugin__default,
          {
            extract: true,
            linguiConfig: ctx.linguiConfig
          }
        ]
      ] : [],
      [
        index,
        {
          onMessageExtracted: (msg) => {
            return onMessageExtracted({
              ...msg,
              origin: mapper.originalPositionFor(msg.origin)
            });
          }
        }
      ]
    ]
  });
  mapper.destroy();
}
function getBabelParserOptions(filename, parserOptions) {
  const parserPlugins = [
    "importAttributes",
    // stage3
    "explicitResourceManagement",
    // stage3,
    "decoratorAutoAccessors"
    // stage3,
  ];
  if ([/\.ts$/, /\.mts$/, /\.cts$/, /\.tsx$/].some((r) => filename.match(r))) {
    parserPlugins.push("typescript");
    if (parserOptions.tsExperimentalDecorators) {
      parserPlugins.push("decorators-legacy");
    } else {
      parserPlugins.push("decorators");
    }
  } else {
    parserPlugins.push("decorators");
    if (parserOptions?.flow) {
      parserPlugins.push("flow");
    }
  }
  if ([/\.js$/, /\.jsx$/, /\.tsx$/].some((r) => filename.match(r))) {
    parserPlugins.push("jsx");
  }
  return parserPlugins;
}
const extractor = {
  match(filename) {
    return babelRe.test(filename);
  },
  async extract(filename, code, onMessageExtracted, ctx) {
    const parserOptions = ctx.linguiConfig.extractorParserOptions;
    return extractFromFileWithBabel(filename, code, onMessageExtracted, ctx, {
      plugins: getBabelParserOptions(filename, parserOptions)
    });
  }
};

module.exports = extractor;
