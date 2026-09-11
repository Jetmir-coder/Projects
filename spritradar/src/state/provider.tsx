/**
 * Stellt die Einstellungen allen Screens zur Verfügung.
 *
 * Ein "Provider" ist in React die Klammer um den ganzen Baum: alles darunter
 * kann die Werte über useEinstellungen() lesen, ohne dass man sie von Screen
 * zu Screen durchreichen muss.
 */

import type { ReactNode } from 'react';

import { Kontext, useEinstellungenStore } from './settings';

export function EinstellungenProvider({ children }: { children: ReactNode }) {
  const store = useEinstellungenStore();
  return <Kontext.Provider value={store}>{children}</Kontext.Provider>;
}
