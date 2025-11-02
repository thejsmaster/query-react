import { q } from "../index";
import { describe, it, expect } from "@jest/globals";

// writing unit tests for the query library

describe("Query", () => {
  it("should create a query", () => {
    const query = q({ count: 0 });
    expect(query.get()).toEqual({ count: 0 });
  });
  it("should update the query", () => {
    const query = q({ count: 0 });
    query.update((state) => {
      state.count = 1;
    });
    expect(query.get()).toEqual({ count: 1 });
  });
  it("should set the query", () => {
    const query = q({ count: 0 });
    query.q("count").set(1);
    expect(query.get()).toEqual({ count: 1 });
  });
  it("should setItems the query", () => {
    const query = q({ count: 0 });
    query.setItems({ count: 1 });
    expect(query.get()).toEqual({ count: 1 });
  });
  it("should setItem the query", () => {
    const query = q({ count: 0 });
    query.setItem("count", 1);
    expect(query.get()).toEqual({ count: 1 });
  });

  it("should set the nested object", () => {
    const query = q({ address: { city: "New York" } });
    query.q("address").q("city").set("Los Angeles");
    expect(query.get()).toEqual({ address: { city: "Los Angeles" } });
  });

  it("should set the nested object with update function", () => {
    const query = q({ address: { city: "New York" } });
    query.q("address").update((s) => {
      s.city = "Los Angeles";
    });
    expect(query.get()).toEqual({ address: { city: "Los Angeles" } });
  });
});

describe("multiple set operations", () => {
  it("should set the nested object with multiple set operations", () => {
    const query = q({ address: { city: "New York", test: "test" } });
    query.q("address").q("city").set("Los Angeles");
    query.q("address").q("test").set("test2");
    expect(query.get()).toEqual({
      address: { city: "Los Angeles", test: "test2" },
    });
  });
  it("should set the nested object with multiple set operations", () => {
    const query = q({ address: { city: "New York", test: "test" } });
    query.q("address").setItem("city", "Los Angeles");
    query.q("address").setItems({ test: "test2" });
    console.log("updated get", query.get());
    console.log("updated state", query.getState());
    expect(query.get()).toEqual({
      address: { city: "Los Angeles", test: "test2" },
    });
  });
  it("should set the nested object with multiple update operations", () => {
    const query = q({ address: { city: "New York", test: "test" } });
    query.q("address").update((s) => {
      s.city = "Los Angeles";
      s.test = "test2";
    });
    query.q("address").update((s) => {
      s.city = "Los Angeles2";
      s.test = "test3";
    });
    expect(query.get()).toEqual({
      address: { city: "Los Angeles2", test: "test3" },
    });
  });
});

describe("qEach works for arrays", () => {
  it("should set the nested object with multiple set operations", () => {
    const state = {
      address: {
        city: "New York",
        test: "test",
        emails: ["test@setFips", "test2@setFips"],
      },
    };
    const query = q(state);
    query
      .q("address")
      .q("emails")
      .qEach((emailQ) => {
        emailQ.set("test3");
      });
    // check the refs changed or not
    expect(query.get() === state).toBe(false);
    expect(query.get()).toEqual({
      address: { city: "New York", test: "test", emails: ["test3", "test3"] },
    });
  });
});

describe("qFilter works for arrays", () => {
  it("should set the nested object with multiple set operations", () => {
    const state = {
      address: {
        city: "New York",
        test: "test",
        testRef: { count: 0 },
        emails: ["test@setFips", "test2@setFips"],
      },
    };
    const query = q(state);
    query
      .q("address")
      .q("emails")
      .qFilter(
        (email) => email.includes("test@setFips"),
        (emailQ) => {
          emailQ.set("test3");
        }
      );
    expect(query.get()).toEqual({
      address: {
        city: "New York",
        test: "test",
        testRef: { count: 0 },
        emails: ["test3", "test2@setFips"],
      },
    });
    // check if the refs changed or not
    expect(query.get() === state).toBe(false);
    expect(query.get().address.testRef === state.address.testRef).toBe(true);
  });
});
