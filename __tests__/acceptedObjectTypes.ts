import { q } from "../index";
import { Query } from "../index";

describe("acceptedObjectTypes", () => {
  it("should accept an object", () => {
    const query = q({ count: 0 });
    expect(query.get()).toEqual({ count: 0 });
  });
  it("should accept an array", () => {
    const query = q([1, 2, 3]);
    expect(query.get()).toEqual([1, 2, 3]);
  });
  it("should accept a primitive", () => {
    const query = q(1);
    expect(query.get()).toEqual(1);
  });
  it("should accept a string", () => {
    const query = q("hello");
    expect(query.get()).toEqual("hello");
  });
  it("should accept a boolean", () => {
    const query = q(true);
    expect(query.get()).toEqual(true);
  });
  it("should accept a null", () => {
    const query = q(null);
    expect(query.get()).toEqual(null);
  });
  it("should accept a undefined", () => {
    const query = q(undefined);
    expect(query.get()).toEqual(undefined);
  });

  it("should throw error if function is passed", () => {
    expect(() => {
      const query = q(() => {});
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if Map is passed", () => {
    expect(() => {
      const query = q(new Map());
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if Set is passed", () => {
    expect(() => {
      const query = q(new Set());
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if WeakMap is passed", () => {
    expect(() => {
      const query = q(new WeakMap());
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if WeakSet is passed", () => {
    expect(() => {
      const query = q(new WeakSet());
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if Promise is passed", () => {
    expect(() => {
      const query = q(Promise.resolve(1));
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if Date is passed", () => {
    expect(() => {
      const query = q(new Date());
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
  it("should throw error if RegExp is passed", () => {
    expect(() => {
      const query = q(new RegExp(".*"));
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });

  it("should throw error if Error is passed", () => {
    expect(() => {
      const query = q(new Error("test"));
    }).toThrow(/only.*objects.*arrays.*primitives/i);
  });
});
