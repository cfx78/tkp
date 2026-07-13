import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemaTypes';
import { dataset, projectId } from './src/sanity/lib/client';

export default defineConfig({
  name: 'the-kitsune-protocol',
  title: 'The Kitsune Protocol',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes
  }
});
