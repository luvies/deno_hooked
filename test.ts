import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  group,
  test,
} from "./mod.ts";

const encoder = new TextEncoder();
function log(...strs: string[]): void {
  const msg = " '" + strs.join(" ") + "' ";
  Deno.stdout.writeSync(encoder.encode(msg));
}

beforeAll(() => {
  log("before all global");
});

beforeEach(() => {
  log("before each global");
});

afterEach(() => {
  log("after each global");
});

afterAll(() => {
  log("after all global");
});

test("1", () => {
  log("1");
});

test({
  name: "2",
  fn() {
    log("2");
  },
  ignore: true,
});

test("3", async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  log("3");
});

group("group 1", () => {
  beforeAll(() => {
    log("before all group 1");
  });

  beforeEach(() => {
    log("before each group 1");
  });

  afterEach(() => {
    log("after each group 1");
  });

  afterAll(() => {
    log("after all group 1");
  });

  test("1", () => {
    log("1");
  });

  test({
    name: "2",
    fn() {
      log("2");
    },
    ignore: true,
  });

  test("3", async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    log("3");
  });
});

group("group 2", () => {
  beforeAll(() => {
    log("before all group 2");
  });

  beforeEach(() => {
    log("before each group 2");
  });

  afterEach(() => {
    log("after each group 2");
  });

  afterAll(() => {
    log("after all group 2");
  });

  test("1", () => {
    log("1");
  });

  group("group 3", () => {
    beforeAll(() => {
      log("before all group 3");
    });

    beforeEach(() => {
      log("before each group 3");
    });

    afterEach(() => {
      log("after each group 3");
    });

    afterAll(() => {
      log("after all group 3");
    });

    test("1", () => {
      log("1");
    });

    test({
      name: "2",
      fn() {
        log("2");
      },
      ignore: true,
    });

    test("3", async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      log("3");
    });
  });

  test("3", async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    log("3");
  });
});
