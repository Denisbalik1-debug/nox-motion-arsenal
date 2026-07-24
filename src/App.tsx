import React from 'react';
import { ArsenalShell } from './motion-arsenal/components/ArsenalShell';
import { EFFECTS_CATALOG } from './motion-arsenal/data/effectsCatalog';

export default function App() {
  return <ArsenalShell catalog={EFFECTS_CATALOG} />;
}
