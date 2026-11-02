import { setTimeout as delay } from 'node:timers/promises';
import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';

const services = {
  website: { status: 'healthy', lastDeploy: 'deploy-104' },
  checkout: { status: 'degraded', lastDeploy: 'deploy-105' },
};

const serviceStatus = defineTool({
  name: 'service_status',
  description: 'Read the demo status for website or checkout',
  parameters: Type.Object({
    service: Type.Union([
      Type.Literal('website'),
      Type.Literal('checkout'),
    ]),
  }),
  replay: 'safe',
  execute: async ({ service }, api, context) => {
    api.output(`Checking ${service}...\n`)
    console.log(`Tool started: ${service}`)
    await delay(10000, undefined, { signal: context.abortSignal })
    return {
      output: [{ type: 'text', text: JSON.stringify(services[service]) }],
    }
  },
});

export const StatusTools = defineExtension({
  name: 'status-tools',
  tools: [serviceStatus],
});