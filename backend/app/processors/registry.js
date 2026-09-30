import path from "node:path";

const registry = new Map();

export function register(processor) {
  if (registry.has(processor.name)) {
    throw new Error(`Processor '${processor.name}' is already registered`);
  }
  registry.set(processor.name, processor);
  return processor;
}

export function getProcessor(name) {
  return registry.get(name) ?? null;
}

export function processorFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  for (const processor of registry.values()) {
    if (processor.extensions.includes(ext)) return processor;
  }
  return null;
}

export function allProcessors() {
  return [...registry.values()];
}
