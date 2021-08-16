  import { writable } from 'svelte/store'

  const { subscribe, set, update } = writable({
    AccessToken: undefined,
    State:       undefined
  })

  function define (KeyOrObject, Value) {
    if (typeof(KeyOrObject) === 'string') {
      update((Globals) => { Globals[KeyOrObject] = Value; return Globals })
    } else {
      update((Globals) => Object.assign(Globals,KeyOrObject))
    }
  }

  export const Globals = { subscribe, define }
