export function resolveSpintax(template: string): string {
  let result = template;
  const MAX_DEPTH = 10;
  let depth = 0;
  while (result.includes("{") && depth < MAX_DEPTH) {
    result = result.replace(/\{([^{}]+)\}/g, (_, group) => {
      const options = group.split("|");
      return options[Math.floor(Math.random() * options.length)];
    });
    depth++;
  }
  return result.replace(/\s+/g, " ").trim();
}
