import { afterEach } from 'vitest'
import 'fake-indexeddb/auto'

afterEach(() => {
  // Each test owns its own IndexedDB instance through fake-indexeddb.
})
