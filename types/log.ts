'use strict';

export interface LoggedFlow {
  log: (message: string, properties?: Record<string, unknown>) => void;
}
