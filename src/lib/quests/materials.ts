import type { ZoneId } from '@/lib/world';

export const LEARNING_MATERIALS = {
  instruments: {
    id: 'instruments',
    title: 'Instruments: Making Evidence Trustworthy',
    topic: 'Measurement and calibration',
    zone: 'instrument',
    paragraphs: [
      'A scientific instrument turns a property—such as temperature, mass, or pressure—into a reading we can compare. A number without a unit is incomplete because the unit tells us what was measured.',
      'Calibration checks an instrument against a trusted reference. If a gauge reads 2 units when the true value is zero, every later reading carries that same systematic error until the instrument is corrected.',
      'Precision describes how closely repeated readings agree. Accuracy describes how close a result is to the accepted value. An instrument can be precise but inaccurate when it repeats the same biased reading.',
      'Good researchers record the instrument, units, uncertainty, and conditions alongside each measurement. That information lets another person judge the evidence and repeat the investigation.',
    ],
  },
  optics: {
    id: 'optics',
    title: 'Optics: Gathering Light',
    topic: 'Telescopes, lenses, and observation',
    zone: 'instrument',
    paragraphs: [
      'A telescope does more than make distant objects look larger. Its main mirror or lens gathers light over a wider area than an eye, allowing faint objects to become visible.',
      'The objective forms an image and the eyepiece magnifies it. More magnification is not always better: atmospheric motion, vibration, and the instrument’s resolution can make an enlarged image blurrier.',
      'A larger aperture can separate finer details because it reduces diffraction. Stable mounting also matters; even a tiny movement at the telescope becomes a large jump in the magnified view.',
      'Filters select particular wavelengths so observers can compare features. Never point an unfiltered telescope at the Sun—focused sunlight can permanently damage eyes and equipment.',
    ],
  },
  'scientific-method': {
    id: 'scientific-method',
    title: 'Scientific Method: From Question to Evidence',
    topic: 'Questions, variables, and conclusions',
    zone: 'study',
    paragraphs: [
      'Scientific investigations often begin with a focused question. A useful hypothesis is a testable explanation, not a guess that must be defended at all costs.',
      'A fair test changes one independent variable while measuring a dependent variable. Other important conditions are controlled so they do not quietly create a different explanation for the result.',
      'Observations describe what happened; conclusions explain what the observations mean. Keeping those separate helps researchers notice when the evidence does not support their first idea.',
      'One experiment rarely ends a question. Researchers repeat measurements, compare uncertainty, revise explanations, and share methods so other people can test the same claim.',
    ],
  },
  'plant-science': {
    id: 'plant-science',
    title: 'Plant Science: Light, Water, and Growth',
    topic: 'Photosynthesis and plant responses',
    zone: 'greenhouse',
    paragraphs: [
      'Plants use light energy to build sugars from carbon dioxide and water. This process, photosynthesis, stores energy in chemical bonds and releases oxygen as a by-product.',
      'Water travels from roots through xylem. Tiny pores called stomata let carbon dioxide enter leaves, but water vapor escapes through them too, so plants constantly balance photosynthesis with water loss.',
      'Growth responses called tropisms help plants reach resources. Shoots usually bend toward light, while roots respond strongly to gravity and moisture.',
      'Leaf color is evidence about pigments and conditions. Chlorophyll reflects green light, while other pigments become easier to see when chlorophyll breaks down or when a plant is stressed.',
    ],
  },
} as const satisfies Record<string, {
  id: string;
  title: string;
  topic: string;
  zone: ZoneId;
  paragraphs: readonly string[];
}>;

export type LearningMaterialId = keyof typeof LEARNING_MATERIALS;
export const LEARNING_MATERIAL_IDS = Object.keys(LEARNING_MATERIALS) as LearningMaterialId[];
