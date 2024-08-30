function appendError(result: string[], error: Error, depth: number) {
  const padding = ' '.repeat(depth);
  if (error.message) {
    result.push(padding, error.message, '\n');
  }
  if (error.stack) {
    result.push(padding, error.stack, '\n');
  }
  if (error.cause) {
    appendError(result, error.cause as Error, depth + 1);
  }
}

export default function errorToString(error: Error) {
  const result: string[] = [];
  appendError(result, error, 0);
  return result.join('');
}
