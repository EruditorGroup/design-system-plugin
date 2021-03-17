type Color = {
  r: number;
  g: number;
  b: number;
};

export type Paint = {
  type: string;
  visible?: boolean;
  opacity?: number;
  blendMode?: string;
  color?: Color;
  colorCode?: string;
};

type ComponentToRgbaTransformer = (
  components: number[],
  opacity: string
) => string;
const componentToRgba: ComponentToRgbaTransformer = (components, opacity) => {
  return (
    'rgba(' +
    components.map(component => Math.floor(component * 255)).join(',') +
    `,${opacity})`
  );
};

type ComponentToHexTransformer = (component: number) => string;
const componentToHex: ComponentToHexTransformer = component => {
  const hex = Math.floor(component * 255).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

type RgbToColorCodeTransformer = (
  color: Color | undefined,
  opacity: number
) => string;
const rgbToColorCode: RgbToColorCodeTransformer = (color, opacity) =>
  color
    ? opacity && opacity === 1
      ? '#' +
        componentToHex(color.r) +
        componentToHex(color.g) +
        componentToHex(color.b)
      : componentToRgba([color.r, color.g, color.b], opacity.toFixed(2))
    : '';

type PaintColorConverter = (paint: Paint) => Paint;
export const convertPaintColor: PaintColorConverter = paint => ({
  ...paint,
  colorCode: rgbToColorCode(paint.color, paint.opacity || 1),
});

type PaintNameConverter = (paintName: string) => string;
export const convertPaintName: PaintNameConverter = paintName => {
  const nameSet = new Set(paintName.split('/').map(str => str.trim()));
  return Array.from(nameSet).join('-').toLowerCase();
};
