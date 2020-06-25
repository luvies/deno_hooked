interface Hooks {
  beforeAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;

  waitingTests: number;
  completedTests: number;
}

interface StackItem extends Hooks {
  name: string;
  first: boolean;
}

interface GlobalContext extends Hooks {
  stack: StackItem[];
}

const globalContext: GlobalContext = {
  stack: [],
  waitingTests: 0,
  completedTests: 0,
};

function badArgs(): never {
  throw new Error("Invalid test definition");
}

function tab(i: number): string {
  return " ".repeat(i * 4);
}

function clearTestName(name: string): string {
  return "\u0008".repeat(name.length + 10);
}

export function test(t: Deno.TestDefinition): void;
export function test(name: string, fn: () => void | Promise<void>): void;
export function test(
  t: Deno.TestDefinition | string,
  testFn?: () => void | Promise<void>,
): void {
  // Extract args
  const { name: testName, fn, ...opts } = typeof t === "object"
    ? t
    : (typeof testFn !== "undefined" ? { name: t, fn: testFn } : badArgs());

  // Set up waiting count.
  if (!opts.ignore) {
    globalContext.waitingTests++;
    globalContext.stack.map((name) => name.waitingTests++);
  }

  // Generate name.
  let name = [];
  for (const [item, i] of globalContext.stack.map((n, i) => [n, i] as const)) {
    if (item.first) {
      name.push(tab(i) + item.name);
      item.first = false;
    }
  }
  name.push(tab(globalContext.stack.length) + testName);

  // Build hook stack.
  const hooks: Hooks[] = [globalContext, ...globalContext.stack];
  const revHooks: Hooks[] = [...hooks].reverse();

  Deno.test({
    name: clearTestName(name[0]) + name.join("\n"),
    async fn() {
      // Before.
      for (const { beforeAll, beforeEach, completedTests } of hooks) {
        if (completedTests === 0) {
          await beforeAll?.();
        }

        await beforeEach?.();
      }

      // Test.
      await fn();
      for (const hook of hooks) {
        hook.completedTests++;
      }

      // After.
      for (
        const { afterAll, afterEach, waitingTests, completedTests } of revHooks
      ) {
        await afterEach?.();

        if (waitingTests === completedTests) {
          afterAll?.();
        }
      }
    },
    ...opts,
  });
}

export function group(name: string, fn: () => void): void {
  globalContext.stack.push({
    name,
    first: true,
    waitingTests: 0,
    completedTests: 0,
  });
  fn();
  globalContext.stack.pop();
}

function getTopHooks(): Hooks {
  if (globalContext.stack.length > 0) {
    return globalContext.stack[globalContext.stack.length - 1];
  } else {
    return globalContext;
  }
}

export function beforeAll(fn: () => void | Promise<void>): void {
  getTopHooks().beforeAll = fn;
}

export function beforeEach(fn: () => void | Promise<void>): void {
  getTopHooks().beforeEach = fn;
}

export function afterEach(fn: () => void | Promise<void>): void {
  getTopHooks().afterEach = fn;
}

export function afterAll(fn: () => void | Promise<void>): void {
  getTopHooks().afterAll = fn;
}
