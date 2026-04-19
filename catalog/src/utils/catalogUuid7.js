import { v7 as uuidv7 } from 'uuid';

/** RFC 9562 UUID version 7 (time-ordered); use for new toolkit tech ids, etc. */
export function newUuid7String() {
  return uuidv7();
}
