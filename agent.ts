import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createModels } from '@earendil-works/pi-ai/models';
import { openaiProvider } from '@earendil-works/pi-ai/providers/openai';
import {
  AssistantEntry,
  createRegistry,
  Harness,
} from '@earendil-works/pi-durable';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import { StatusTools } from './tools.js';

const requestId = process.argv[2]
const prompt = process.argv.slice(3).join(' ')
if (!requestId || !prompt) {
  throw new Error('Pass a request ID followed by a prompt')
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Set OPENAI_API_KEY before running the agent')
}

const context = BACKGROUND_CONTEXT
const models = createModels()
models.setProvider(openaiProvider())
const registry = createRegistry()
registry.install(StatusTools)

const harness = await Harness.open(
  await openNodeSqliteStorage('./agent.sqlite'),
  { models, registry },
  context,
)

try {
  const root = await harness.root(context, {
    agent: {
      model: { provider: 'openai', modelId: 'gpt-6-sol' },
      instructions: 'Use service_status for service questions. Explain the demo results briefly. Never claim to repair or deploy anything.',
    },
  })
  harness.resume()
  const submission = await root.submit(
    { type: 'input', content: prompt, requestId },
    context,
  )
  console.log(`Submission: ${submission.id}`)
  const settled = await submission.wait(context)
  if (settled.status !== 'done' || settled.type !== 'input') {
    throw new Error(`The input was not answered: ${JSON.stringify(settled)}`)
  }
  const answer = await root.commit(
    (tx) => tx.entry(AssistantEntry, settled.answer),
    context,
  )
  for (const message of answer?.model ?? []) {
    if (message.role !== 'assistant') continue
    for (const part of message.content) {
      if (part.type === 'text') console.log(part.text)
    }
  }
} finally {
  await harness.close(context)
}