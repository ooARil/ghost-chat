import { DEFAULT_EXTENSIONS, transformAsync } from '@babel/core';
import linguiExtractMessages from './index.mjs';
import linguiMacroPlugin from '@lingui-solid/babel-plugin-lingui-macro';
import '@babel/types';

const babelRe = new RegExp(
  "\\.(" + [...DEFAULT_EXTENSIONS, ".ts", ".mts", ".cts", ".tsx"].map((ext) => ext.slice(1)).join("|") + ")$",
  "i"
);
const inlineSourceMapsRE = new RegExp(
  /\/[\/\*][#@]\s+sourceMappingURL=data:application\/json;(?:charset:utf-8;)?base64,/i
);
async function createSourceMapper(code, sourceMaps) {
  let sourceMapsConsumer;
  if (sourceMaps) {
    const { SourceMapConsumer } = await import('./chunks/source-map.mjs').then(function (n) { return n.s; });
    sourceMapsConsumer = await new SourceMapConsumer(sourceMaps);
  } else if (code.search(inlineSourceMapsRE) != -1) {
    const { SourceMapConsumer } = await import('./chunks/source-map.mjs').then(function (n) { return n.s; });
    const { fromSource } = await import('./chunks/index.mjs').then(function (n) { return n.i; });
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
  await transformAsync(code, {
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
          linguiMacroPlugin,
          {
            extract: true,
            linguiConfig: ctx.linguiConfig
          }
        ]
      ] : [],
      [
        linguiExtractMessages,
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

export { extractor as default };
