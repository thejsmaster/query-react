```typecript

// x-plus (supports deep freeze by default)
const countStore = x({count: 0});
countStore.get(); // {count: 0}
countStore.set({count:2});
countStore.update(s=>s.count++); 

// let-state (supports deep freeze by default)
let state = {count: 0}
function incr(){
    state = {count: state.count + 1}
}

// get-set-react
const countStore = create({count:0, _incr(){this.count++}})

// molx
const countMol = mol({count:0, incr(){this.count = this.count + 1}})

// query-react
const countQuery = query({count:0});

function incr(){
    countQuery.get("count").set(s=>s+1);
}
```
