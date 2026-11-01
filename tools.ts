import { setTimeout as delay } from 'node:timers/promises';
import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';

const services = {
  website: { status: 'healthy', lastDeploy: 'deploy-104' },
  checkout: { status: 'degraded', lastDeploy: 'deploy-105' },
}

