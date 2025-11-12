import { PluginObj } from '@babel/core';
import * as babelTypes from '@babel/types';
import { LinguiConfigNormalized } from '@lingui/conf';

type LinguiPluginOpts = {
    extract?: boolean;
    stripMessageField?: boolean;
    linguiConfig?: LinguiConfigNormalized;
};
declare function export_default({ types: t, }: {
    types: typeof babelTypes;
}): PluginObj;

export { export_default as default };
export type { LinguiPluginOpts };
