/**
 * Make Tajawal the app-wide font (beautiful for Arabic, clean for Latin too).
 *
 * RN on Android resolves custom fonts by exact file name, and `fontWeight`
 * alone won't pick a bold TTF — so we map the requested weight to the matching
 * Tajawal variant and inject it as the BASE font on every <Text>/<TextInput>.
 * Any element that sets its own `fontFamily` (e.g. icon fonts) keeps it, because
 * the component's own style is layered AFTER our base.
 *
 * Imported for its side effects from index.js BEFORE the app renders.
 */
import {Text, TextInput, StyleSheet} from 'react-native';

const familyForWeight = (weight?: string | number): string => {
  const w = String(weight ?? '');
  if (w === 'bold' || w === '600' || w === '700' || w === '800' || w === '900') {
    return 'Tajawal-Bold';
  }
  if (w === '500') {
    return 'Tajawal-Medium';
  }
  return 'Tajawal-Regular';
};

const patch = (Component: any) => {
  const original = Component?.render;
  if (typeof original !== 'function' || Component.__tajawalPatched) {
    return;
  }
  Component.__tajawalPatched = true;
  Component.render = function patchedRender(props: any, ref: any) {
    const flat = StyleSheet.flatten(props?.style) || {};
    const base = {fontFamily: familyForWeight((flat as any).fontWeight)};
    // Base first, the element's own style second (so explicit fontFamily wins).
    return original.call(this, {...props, style: [base, props?.style]}, ref);
  };
};

patch(Text);
patch(TextInput);
