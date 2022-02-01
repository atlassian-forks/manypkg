import externalMismatch from "../EXTERNAL_MISMATCH";
import { getWS, getFakeWS } from "../../test-helpers";

let rootWorkspace = getFakeWS("root");

it("should error if the ranges are valid and they are not equal", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "1.0.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "2.0.0"
  };
  ws.set("pkg-2", pkg2);

  let errors = externalMismatch.validate(pkg2, ws, rootWorkspace, {});
  expect(errors.length).toEqual(0);

  errors = externalMismatch.validate(ws.get("pkg-1")!, ws, rootWorkspace, {});
  expect(errors.length).toEqual(1);
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "dependencyName": "something",
        "dependencyRange": "1.0.0",
        "mostCommonDependencyRange": "2.0.0",
        "type": "EXTERNAL_MISMATCH",
        "workspace": Object {
          "dir": "some/fake/dir/pkg-1",
          "packageJson": Object {
            "dependencies": Object {
              "something": "1.0.0",
            },
            "name": "pkg-1",
            "version": "1.0.0",
          },
        },
      },
    ]
  `);
});

it("should error and return the correct mostCommonDependencyRange when the ranges are valid, they are not equal and there are more than 2", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "1.0.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "2.0.0"
  };
  ws.set("pkg-2", pkg2);

  let pkg3 = getFakeWS("pkg-3");
  pkg3.packageJson.dependencies = {
    something: "1.0.0"
  };

  ws.set("pkg-3", pkg3);
  let errors = externalMismatch.validate(
    ws.get("pkg-1")!,
    ws,
    rootWorkspace,
    {}
  );
  expect(errors.length).toEqual(0);

  errors = externalMismatch.validate(pkg2, ws, rootWorkspace, {});
  expect(errors.length).toEqual(1);
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "dependencyName": "something",
        "dependencyRange": "2.0.0",
        "mostCommonDependencyRange": "1.0.0",
        "type": "EXTERNAL_MISMATCH",
        "workspace": Object {
          "dir": "some/fake/dir/pkg-2",
          "packageJson": Object {
            "dependencies": Object {
              "something": "2.0.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
        },
      },
    ]
  `);
});

it("should error and return the correct mostCommonDependencyRange when the ranges are valid, but the 2nd dependnecy is most common", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "2.0.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "1.0.0"
  };
  ws.set("pkg-2", pkg2);

  let pkg3 = getFakeWS("pkg-3");
  pkg3.packageJson.dependencies = {
    something: "1.0.0"
  };

  ws.set("pkg-3", pkg3);
  let errors = externalMismatch.validate(
    ws.get("pkg-1")!,
    ws,
    rootWorkspace,
    {}
  );
  console.log(errors);

  expect(errors.length).toEqual(1);
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "dependencyName": "something",
        "dependencyRange": "2.0.0",
        "mostCommonDependencyRange": "1.0.0",
        "type": "EXTERNAL_MISMATCH",
        "workspace": Object {
          "dir": "some/fake/dir/pkg-1",
          "packageJson": Object {
            "dependencies": Object {
              "something": "2.0.0",
            },
            "name": "pkg-1",
            "version": "1.0.0",
          },
        },
      },
    ]
  `);

  errors = externalMismatch.validate(pkg2, ws, rootWorkspace, {});
  expect(errors.length).toEqual(0);
});

it("should error and return the correct mostCommonDependencyRange when the ranges are valid, but everything wants a different version", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "1.0.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "2.0.0"
  };
  ws.set("pkg-2", pkg2);

  let pkg3 = getFakeWS("pkg-3");
  pkg3.packageJson.dependencies = {
    something: "3.0.0"
  };

  ws.set("pkg-3", pkg3);
  let errors = externalMismatch.validate(
    ws.get("pkg-1")!,
    ws,
    rootWorkspace,
    {}
  );
  expect(errors.length).toEqual(1);
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "dependencyName": "something",
        "dependencyRange": "1.0.0",
        "mostCommonDependencyRange": "3.0.0",
        "type": "EXTERNAL_MISMATCH",
        "workspace": Object {
          "dir": "some/fake/dir/pkg-1",
          "packageJson": Object {
            "dependencies": Object {
              "something": "1.0.0",
            },
            "name": "pkg-1",
            "version": "1.0.0",
          },
        },
      },
    ]
  `);

  errors = externalMismatch.validate(pkg2, ws, rootWorkspace, {});
  expect(errors.length).toEqual(1);
  expect(errors).toMatchInlineSnapshot(`
    Array [
      Object {
        "dependencyName": "something",
        "dependencyRange": "2.0.0",
        "mostCommonDependencyRange": "3.0.0",
        "type": "EXTERNAL_MISMATCH",
        "workspace": Object {
          "dir": "some/fake/dir/pkg-2",
          "packageJson": Object {
            "dependencies": Object {
              "something": "2.0.0",
            },
            "name": "pkg-2",
            "version": "1.0.0",
          },
        },
      },
    ]
  `);

  errors = externalMismatch.validate(pkg3, ws, rootWorkspace, {});
  expect(errors.length).toEqual(0);
});

it("should not error if the value is not a valid semver range", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "1.0.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "git:x"
  };
  ws.set("pkg-2", pkg2);

  let errors = externalMismatch.validate(pkg2, ws, rootWorkspace, {});
  expect(errors.length).toEqual(0);

  errors = externalMismatch.validate(ws.get("pkg-1")!, ws, rootWorkspace, {});
  expect(errors.length).toEqual(0);
});

it("should not error if the range is included in the allowedDependencyVersions option", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "1.0.0" };

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "2.0.0"
  };
  ws.set("pkg-2", pkg2);

  const options = {
    allowedDependencyVersions: {
      something: ["1.0.0", "2.0.0"]
    }
  };

  let errors = externalMismatch.validate(pkg2, ws, rootWorkspace, options);
  expect(errors.length).toEqual(0);

  errors = externalMismatch.validate(
    ws.get("pkg-1")!,
    ws,
    rootWorkspace,
    options
  );
  expect(errors.length).toEqual(0);
});

it("should error if the range is the range is outside allowedDependencyVersions and running fix should clamp it to the most commonly used one", () => {
  let ws = getWS();

  ws.get("pkg-1")!.packageJson.dependencies = { something: "1.0.0" };

  // version 1.0.0 is the most commonly used one
  let pkg1a = getFakeWS("pkg-1a");
  pkg1a.packageJson.dependencies = {
    something: "1.0.0"
  };
  ws.set("pkg-1a", pkg1a);

  let pkg2 = getFakeWS("pkg-2");
  pkg2.packageJson.dependencies = {
    something: "2.0.0"
  };
  ws.set("pkg-2", pkg2);

  // version 3.0.0 is outside allowedDependencyVersions
  let pkg3 = getFakeWS("pkg-3");
  pkg3.packageJson.dependencies = {
    something: "3.0.0"
  };
  ws.set("pkg-3", pkg3);

  const options = {
    allowedDependencyVersions: {
      something: ["1.0.0", "2.0.0"]
    }
  };

  let errors = externalMismatch.validate(pkg3, ws, rootWorkspace, options);
  expect(errors.length).toEqual(1);
  expect(errors[0]).toEqual(
    expect.objectContaining({
      dependencyName: "something",
      dependencyRange: "3.0.0"
    })
  );

  externalMismatch.fix(errors[0], options);
  expect(pkg3.packageJson.dependencies.something).toEqual("1.0.0");
});
