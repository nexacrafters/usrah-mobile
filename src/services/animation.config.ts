/**
 * Animation Configuration
 * Reanimated v3 configurations and presets
 */

import {
  withSpring,
  withTiming,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

// Spring configurations
export const springConfigs: Record<string, WithSpringConfig> = {
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  smooth: {
    damping: 20,
    stiffness: 100,
    mass: 0.8,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1.2,
  },
  gentle: {
    damping: 25,
    stiffness: 80,
    mass: 0.6,
  },
};

// Timing configurations
export const timingConfigs: Record<string, WithTimingConfig> = {
  fast: {
    duration: 200,
  },
  normal: {
    duration: 300,
  },
  slow: {
    duration: 500,
  },
  verySlow: {
    duration: 800,
  },
};

// Animation presets
export const animations = {
  // Fade animations
  fadeIn: (duration = 300) => ({
    entering: () => {
      'worklet';
      return {
        initialValues: {opacity: 0},
        animations: {opacity: withTiming(1, {duration})},
      };
    },
  }),

  fadeOut: (duration = 300) => ({
    exiting: () => {
      'worklet';
      return {
        initialValues: {opacity: 1},
        animations: {opacity: withTiming(0, {duration})},
      };
    },
  }),

  // Scale animations
  scaleIn: (duration = 300) => ({
    entering: () => {
      'worklet';
      return {
        initialValues: {transform: [{scale: 0}]},
        animations: {
          transform: [{scale: withSpring(1, springConfigs.bouncy)}],
        },
      };
    },
  }),

  scaleOut: (duration = 300) => ({
    exiting: () => {
      'worklet';
      return {
        initialValues: {transform: [{scale: 1}]},
        animations: {
          transform: [{scale: withTiming(0, {duration})}],
        },
      };
    },
  }),

  // Slide animations
  slideInFromRight: (duration = 300) => ({
    entering: () => {
      'worklet';
      return {
        initialValues: {transform: [{translateX: 300}]},
        animations: {
          transform: [{translateX: withTiming(0, {duration})}],
        },
      };
    },
  }),

  slideInFromLeft: (duration = 300) => ({
    entering: () => {
      'worklet';
      return {
        initialValues: {transform: [{translateX: -300}]},
        animations: {
          transform: [{translateX: withTiming(0, {duration})}],
        },
      };
    },
  }),

  slideInFromBottom: (duration = 300) => ({
    entering: () => {
      'worklet';
      return {
        initialValues: {transform: [{translateY: 300}]},
        animations: {
          transform: [{translateY: withTiming(0, {duration})}],
        },
      };
    },
  }),

  // Shake animation
  shake: {
    entering: () => {
      'worklet';
      return {
        initialValues: {transform: [{translateX: 0}]},
        animations: {
          transform: [
            {
              translateX: withSpring(-10, springConfigs.bouncy, () => {
                return withSpring(10, springConfigs.bouncy, () => {
                  return withSpring(0, springConfigs.bouncy);
                });
              }),
            },
          ],
        },
      };
    },
  },

  // Pulse animation
  pulse: {
    entering: () => {
      'worklet';
      return {
        initialValues: {transform: [{scale: 1}]},
        animations: {
          transform: [
            {
              scale: withSpring(1.1, springConfigs.bouncy, () => {
                return withSpring(1, springConfigs.bouncy);
              }),
            },
          ],
        },
      };
    },
  },
};

// Layout transition configurations
export const layoutTransitions = {
  default: {
    type: 'spring',
    config: springConfigs.default,
  },
  smooth: {
    type: 'spring',
    config: springConfigs.smooth,
  },
  bouncy: {
    type: 'spring',
    config: springConfigs.bouncy,
  },
};

// Gesture configurations
export const gestureConfigs = {
  swipe: {
    direction: 'horizontal',
    minDistance: 50,
    velocityThreshold: 500,
  },
  longPress: {
    minDuration: 500,
  },
  doubleTap: {
    maxDelay: 300,
  },
};
