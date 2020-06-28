# Hooked - A tiny test module

![CI](https://github.com/luvies/deno_hooked/workflows/CI/badge.svg)

A simple expansion to Deno's standard test framework, providing before/after hooks to allow setting up and tearing down test data. This module also provides a simple method of grouping tests into logical blocks.

## Overview

The `test` function provided is identical to `Deno.test`, except it provides support for hooks & groupings.

```ts
test({
  name: "Test name",
  async fn() {
    // Test logic
  },
});
```

The `group` function allows hooks and tests to be grouped together. The names of the groups are prefixed to the test names to allow easy filtering and console output scanning. `group` also allows nesting, so you can nest a group within a group.

```ts
group("Grouped tests", () => {
  test("First test", () => {
    // Test logic
  });

  test("Second test", async () => {
    // Test logic
  });
});
```

### Hooks

The primary feature of this testing module are hooks. 4 hooks are provided:

```ts
/**
 * fn is called before any test is ran.
 */
export function beforeAll(fn: () => void): void;
/**
 * fn is called before each and every test.
 */
export function beforeEach(fn: () => void): void;
/**
 * fn is called after each and every test.
 */
export function afterEach(fn: () => void): void;
/**
 * fn is called after all tests are ran.
 */
export function afterAll(fn: () => void): void;
```

Hooks are called in the following order:

```
Before All -> Before Each -> Test -> After Each -> After All
```

It is worth noting, that global hooks (ones defined outside a `group` call) are global to the entire deno instance, meaning every single global hook will be called before each single test across all test files. Due to this, it is recommended to group all tests within a file, as this means the hooks for that file will only run for the tests within it.

#### Hooks Within Groups

If hooks are used within a group, then they will only apply to the test within that group, and all child groups. Hooks of parent groups have outer priority to hooks of the child groups.

In the given example:

```ts
beforeAll(() => {
  console.log("Before all global");
});

beforeEach(() => {
  console.log("Before each global");
});

afterEach(() => {
  console.log("After each global");
});

afterAll(() => {
  console.log("After all global");
});

test("Global test", () => {});

group("Parent", () => {
  beforeAll(() => {
    console.log("Before all parent");
  });

  beforeEach(() => {
    console.log("Before each parent");
  });

  afterEach(() => {
    console.log("After each parent");
  });

  afterAll(() => {
    console.log("After all parent");
  });

  test("Parent test", () => {});

  group("Child", () => {
    beforeAll(() => {
      console.log("Before all child");
    });

    beforeEach(() => {
      console.log("Before each child");
    });

    afterEach(() => {
      console.log("After each child");
    });

    afterAll(() => {
      console.log("After all child");
    });

    test("Child test", () => {});
  });
});
```

Output:

```
Before all global
Before each global
> Global test
After each global

Before each global
Before all parent
Before each parent
> Parent test
After each parent
After each global

Before each global
Before each parent
Before all child
Before each child
> Child test
After each child
After all child
After each parent
After all parent
After each global
After all global
```

The global hooks (`before/after all/each global`) are called before/after every test defined. The hooks in the group `Parent` are called before/after all tests defined in the groups `Parent` and `Child`, however the global hooks take outer priority. This means the global before hooks are called before the hooks in the `Parent` group, and the global after hooks are called _after_ the hooks in the `Parent` group. The same applies between the `Parent` and `Child` groups, the parent hooks take outer priority.

The ordering means that you can assume that any data that is set up by higher priority hooks is guaranteed to be set up before lower priority hooks are called.
