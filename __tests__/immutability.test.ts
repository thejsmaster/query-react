import { q } from "../index";

describe("immutability", () => {
  it("should be immutable", () => {
    const state = { address: { city: "New York" } };
    const query = q(state);
    const newState = query.q("address").q("city").set("Los Angeles");
    expect(state.address.city).toBe("New York");
    expect(state.address !== newState.address).toBe(true);
    expect(newState.address.city).toBe("Los Angeles");
  });

  it("should be immutable with arrays", () => {
    const state = { addresses: [{ city: "New York" }] };
    const query = q(state);
    const newState = query.q("addresses").setItem(0, { city: "Los Angeles" });
    expect(state.addresses[0].city).toBe("New York");
    expect(
      state.addresses !== query.get().addresses && state !== query.get()
    ).toBe(true);
  });

  it("should be immutable with update function", () => {
    const state = { addresses: [{ city: "New York" }] };
    const query = q(state);
    const newState = query
      .q("addresses")
      .update((s) => (s[0].city = "Los Angeles"));
    expect(state.addresses[0].city).toBe("New York");
    expect(state.addresses !== newState.addresses).toBe(true);
    expect(newState === query.getState()).toBe(true);
    expect(state !== newState).toBe(true);
    expect(newState.addresses[0].city).toBe("Los Angeles");
  });

  
});
