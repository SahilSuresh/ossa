import { registerRootComponent } from 'expo';

import App from './App';
import { register as registerWidget } from './native/widget';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// The Android home-screen widget redraws itself in the background through this.
// (Does nothing in Expo Go or on iPhone.)
registerWidget();
