interface Hooks {
  beforeAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;

  waitingTests: number;
  completedTests: number;

  onlyTests: number;
  completedOnlyTests: number;
}

interface StackItem extends Hooks {
  name: string;
}

interface GlobalContext extends Hooks {
  stack: StackItem[];
}

const globalContext: GlobalContext = {
  stack: [],
  waitingTests: 0,
  completedTests: 0,
  onlyTests: 0,
  completedOnlyTests: 0,
};

function badArgs(): never {
  throw new Error("Invalid test definition");
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

  if (opts.only) {
    globalContext.onlyTests++;
    globalContext.stack.map((name) => name.onlyTests++);
  }

  // Generate name.
  let name = globalContext.stack.map(({ name: n }) => n);
  name.push(testName);

  // Build hook stack.
  const hooks: Hooks[] = [globalContext, ...globalContext.stack];
  const revHooks: Hooks[] = [...hooks].reverse();

  Deno.test({
    name: name.join(" > "),
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

        if (opts.only) {
          hook.completedOnlyTests++;
        }
      }

      // After.
      for (
        const {
          afterAll,
          afterEach,
          waitingTests,
          completedTests,
          onlyTests,
          completedOnlyTests,
        } of revHooks
      ) {
        await afterEach?.();

        if (
          waitingTests === completedTests ||
          (onlyTests > 0 && onlyTests === completedOnlyTests)
        ) {
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
    waitingTests: 0,
    completedTests: 0,
    onlyTests: 0,
    completedOnlyTests: 0,
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
