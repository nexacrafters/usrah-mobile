/**
 * Usrah - Muslim Family Management App
 * Fully Native React Native Application
 *
 * @format
 */

import {AppRegistry} from 'react-native';
// Apply the Tajawal font globally (side-effect import) before anything renders.
import './src/utils/applyFonts';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
