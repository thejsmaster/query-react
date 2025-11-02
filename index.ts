import { useState, useEffect } from "react";

export function i<T extends Object>(
  currentState: T,
  producer: (draft: T) => void
) {
  // only supports objects and arrays. no maps or sets. or any other kind.
  if (
    (!isValidObject(currentState) && !isValidPrimitive(currentState)) ||
    currentState === null ||
    currentState === undefined
  ) {
    throw new Error(
      "Only objects, arrays or primitives are supported at this moment"
    );
  }
  const newState = shallowClone(currentState);
  producer(createStateProxy(newState));
  function createStateProxy<T extends Object>(obj: T, path = ""): T {
    return new Proxy(obj, {
      get(target, key: string) {
        const fullPath = path ? `${path}.${key}` : key;
        //@ts-ignore
        let value = target[key];
        if (typeof value === "object" && value !== null) {
          return createStateProxy(
            Object.isFrozen(value)
              ? Array.isArray(value)
                ? [...value]
                : { ...value }
              : value,
            fullPath
          );
        } else {
          return value;
        }
      },
      set(target, key: string, value) {
        const fullPath = path ? `${path}.${key}` : key;

        updateValue(newState, fullPath, value);
        return true;
      },
      deleteProperty(target, key: string) {
        const fullPath = path ? `${path}.${key}` : key;
        updateValue(newState, fullPath, undefined, true);
        //@ts-ignore
        delete target[key];
        return true;
      },
    });
  }
  alreadyDestructuredPaths = [];
  return newState;
}

export function shallowClone<T>(currentState: T): T {
  if (Array.isArray(currentState)) {
    return [...currentState] as T;
  }
  //     else if(currentState instanceof Map){
  //     return new Map({...currentState});
  //    } else if(currentState instanceof Set){
  //     return new Set([...currentState]);
  //    }
  else if (typeof currentState === "object" && currentState !== null) {
    return { ...currentState };
  }
  return currentState;
}

export let alreadyDestructuredPaths: string[] = [];

export function updateValue(
  obj: any,
  path: string,
  val: any,
  isDelete: boolean = false
): void {
  if (typeof obj !== "object" || obj === null) {
    return;
  }
  let pathAccumulated = "";
  const keys = path.split(".");
  let currentObj = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    pathAccumulated =
      pathAccumulated.length > 0 ? pathAccumulated + "." + key : key;
    if (!alreadyDestructuredPaths.includes(pathAccumulated)) {
      if (
        currentObj.hasOwnProperty(key) &&
        typeof currentObj[key] === "object"
      ) {
        if (Array.isArray(currentObj[key])) {
          currentObj[key] = [...currentObj[key]];
        } else {
          currentObj[key] = { ...currentObj[key] };
        }
        alreadyDestructuredPaths.push(pathAccumulated);
        currentObj = currentObj[key];
      } else {
        // If the key doesn't exist or is not an object, create an empty object
        currentObj[key] = {};
        currentObj = currentObj[key];
      }
    } else {
      currentObj = currentObj[key];
    }
  }

  //@ts-ignore
  if (isDelete) {
    delete currentObj[keys[keys.length - 1]];
  } else {
    currentObj[keys[keys.length - 1]] = val;
  }
}

export function recursiveDeepFreeze<T>(obj: any): T {
  // Return early for non-objects or already frozen objects
  if (
    obj === null ||
    typeof obj !== "object" ||
    Object.isFrozen(obj) ||
    obj instanceof File ||
    obj instanceof Blob
  ) {
    return obj;
  }

  // Freeze properties before freezing the object itself
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Object.isFrozen(value)
    ) {
      recursiveDeepFreeze(value);
    }
  });

  return Object.freeze(obj);
}

export function q<T>(obj: T, deepFreeze: boolean = true): Query<T, T> {
  if (!isValidObject(obj) && !isValidPrimitive(obj)) {
    throw new Error(
      "Only objects, arrays or primitives are supported at this moment"
    );
  }
  const root = {
    subs: new Set<any>(),
    value: obj as T,
    get(): T {
      return this.value;
    },
    subscribe(
      fn: (
        changes?: { path: string; from: "set"; type: "update"; value: T }[]
      ) => void
    ) {
      this.subs.add(fn);
      return () => {
        this.subs.delete(fn);
      };
    },
    set(path: string, _obj: any) {
      this.value = _obj;
      if (deepFreeze) {
        recursiveDeepFreeze(this.value);
      }
      this.subs.forEach((fn) =>
        fn([{ path, from: "set", type: "update", value: _obj }])
      );
      return this.value;
    },
  };
  return new Query("", root);
}

const getValueFromPath = (obj: any, path: string) => {
  if (path === "") return obj;
  const keys = path.split(".");
  let currentObj = obj;
  try {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (currentObj.hasOwnProperty(key)) {
        currentObj = currentObj[key];
      } else {
        return undefined;
      }
    }
    return currentObj;
  } catch (e) {
    return undefined;
  }
};
export class Query<T, S = T> {
  path = "";
  rootObj: any = null;
  constructor(_path: string = "", _rootObj: any) {
    this.path = _path;
    this.rootObj = _rootObj;
  }
  /**
   * Creates a new Query object for a specific key of the current object.
   * @param key - The key of the object to create a Query for.
   * @returns A new Query object for the specified key.
   */
  q<K extends keyof T>(key: K): Query<T[K], S> {
    //@ts-ignore
    return new Query(this.path + "." + key, this.rootObj);
  }
  /**
   * Sets a value at the current path.
   * @param value - The value to set. Can be a function that returns a value.
   * @returns The updated object.
   */
  set(value: T | ((currentValue: T) => T)): S {
    let finalValue =
      typeof value === "function"
        ? (value as (currentValue: T) => T)(this.get())
        : value;
    if (this.path === "") {
      this.rootObj.set("", finalValue);
      return this.rootObj.value;
    }

    let updatedRootObject: any = this.rootObj.value;
    updatedRootObject = Array.isArray(this.rootObj.value)
      ? [...this.rootObj.value]
      : typeof this.rootObj.value === "object" && this.rootObj.value !== null
      ? { ...this.rootObj.value }
      : this.rootObj.value;

    updateValue(
      updatedRootObject,
      this.path.slice(1),
      // @ts-ignore
      finalValue
    );

    this.rootObj.set(this.path.slice(1), updatedRootObject);
    alreadyDestructuredPaths = [];

    return updatedRootObject;
  }
  /**
   * Sets multiple items at once.
   * @param items - An object where the keys are the property names and the values are the new values.
   * @returns The updated object.
   * @throws Error if the root object is not an object or is null.
   */
  setItems(
    items: T extends (infer U)[] ? Record<number, Partial<U>> : Partial<T>
  ): this {
    // this is only supported for objects.
    if (typeof this.rootObj.value !== "object" || this.rootObj.value === null) {
      throw new Error("setItems is only supported for objects");
    }

    let currentObject = this.get();

    if (Array.isArray(currentObject)) {
      // Handle arrays properly
      //@ts-ignore
      currentObject = [...currentObject];
      Object.entries(items).forEach(([key, value]) => {
        const index = parseInt(key, 10);
        if (!isNaN(index)) {
          //@ts-ignore
          currentObject[index] = value;
        }
      });
    } else {
      currentObject = { ...currentObject };
      // For objects, Object.assign works fine
      //@ts-ignore
      Object.assign(currentObject, items);
    }
    this.set(currentObject);
    return this;
  }
  /**
   * Gets the value at the current path.
   * @returns The value at the current path.
   */
  get(): T {
    return getValueFromPath(this.rootObj.value, this.path.slice(1));
  }
  /**
   * Subscribes to changes in the current path.
   * @param fn - The function to call when the value changes.
   * @returns A function to unsubscribe from the changes.
   */
  subscribe(
    fn: (
      changes?: { path: string; from: "set"; type: "update"; value: T }[]
    ) => void
  ) {
    return this.rootObj.subscribe(fn);
  }

  /**
   * update the current state with a function in which you can mutate the state directly
   * @param fn - The function to dispatch.
   * @returns The updated object.
   * @throws Error if the current path is not an object.
   */
  update(fn: (currentState: T) => void) {
    if (typeof this.get() !== "object" || this.get() === null) {
      throw new Error("dispatch is only supported for objects");
    }
    //@ts-ignore
    return this.set(i(this.get(), fn));
  }
  /**
   * Gets the current state of the root object.
   * @returns The current state of the root object.
   */
  getState(): S {
    return this.rootObj.value;
  }
  qfind<U = T extends (infer U)[] ? U : never>( // Introduce new generic 'U'
    selectorFn: (item: U, index?: number, array?: T) => boolean
  ): Query<U, S> {
    // Return XQuery<U>
    const array = this.get() as T; // No change here
    let index = -1;
    if (array && Array.isArray(array)) {
      //@ts-ignore
      index = array.findIndex(selectorFn);
    } else {
      throw Error("array is not found at provided path: " + this.path);
    }

    //@ts-ignore
    return new Query<U, S>(this.path + "." + index, this.rootObj);
  }
  qEach<U = T extends (infer U)[] ? U : never>(
    fn: (xQuery: Query<U, S>) => void
  ): this {
    const array = this.get() as T[];
    array.forEach((_, index) => {
      //@ts-ignore
      const x = new Query<U, S>(
        this.path + "." + index,
        //@ts-ignore

        this.rootObj
      );
      fn(x);
    });
    return this;
  }
  qFilter<U = T extends (infer U)[] ? U : never>(
    predicateFn: (item: U, index?: number, array?: U[]) => boolean,
    transformFn: (xQuery: Query<U, S>) => void
  ): this {
    const array = this.get() as U[];
    const filteredItems = array?.filter(predicateFn);

    filteredItems.map((_item, index, _array) => {
      const x = new Query<U, S>(
        this.path + "." + index,
        //@ts-ignore
        this.rootObj
      );
      return transformFn(x);
    });

    return this;
  }

  /**
   * Returns a new Query object for the current path.
   * @returns A new Query object for the current path.
   */
  setItem<K extends keyof T>(
    keyOrIndex: K,
    value:
      | (T[K] extends Object ? Partial<T[K]> : any)
      | ((currentValue: T[K]) => T[K])
  ): this {
    const finalValue =
      typeof value === "function"
        ? (value as (currentValue: T[K]) => T[K])(
            this.get()?.[keyOrIndex] as T[K]
          )
        : value;
    if (Array.isArray(this.get())) {
      //@ts-ignore
      const updatedArray = [...this.get()];

      updatedArray[keyOrIndex as any] = finalValue;
      //@ts-ignore
      this.set(updatedArray);
    } else if (
      typeof keyOrIndex === "string" &&
      typeof this.get() === "object"
    ) {
      //@ts-ignore
      this.set({ ...this.get(), [keyOrIndex]: finalValue });
    } else {
      throw new Error("setItem is only supported for arrays and objects");
    }
    return this;
  }
}

export const atom = q;

/**
 * mol({
 *  count: atom(0),
 *  isDisabled: atom(false),
 * });
 *
 *
 */
const test = {
  count: 0,
  isDisabled: false,
  address: { street: "123 Main St", city: "Anytown", zip: "12345" },
};
q(test).q("address").q("street").set("123 Main St");

// recieves an object with atoms and returns a molecule: { getState, }

export class Q {
  update<K extends keyof this>(
    key: K,
    fn: (currentState: this[K]) => void
  ): void {
    if (typeof this[key] === "object" && this[key] != null)
      this[key] = i(this[key], fn);
  }
}

export function useQ<T, S>(
  query: Query<T, S>
): [T, typeof query.set, typeof query.update] {
  const [state, setState] = useState(query.get());
  useEffect(() => {
    console.log("state", state);
    return query.subscribe((changes) => setState(query.get()));
  }, [state, setState]);
  return [state, query.set.bind(query), query.update.bind(query)];
}

function isValidObject(value: any) {
  if (value === undefined || value === null) return true;

  if (typeof value !== "object") return false;

  const tag = Object.prototype.toString.call(value);

  // List of types you want to REJECT
  const invalidTags = new Set([
    "[object Date]",
    "[object Promise]",
    "[object RegExp]",
    "[object Map]",
    "[object Set]",
    "[object WeakMap]",
    "[object WeakSet]",
    "[object Error]",
    "[object BigInt]",
    "[object ArrayBuffer]",
    "[object DataView]",
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]",
    "[object SharedArrayBuffer]",
    "[object Atomics]",
    "[object FinalizationRegistry]",
    "[object WeakRef]",
  ]);

  return !invalidTags.has(tag);
}

function isValidPrimitive(value: any) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  );
}
