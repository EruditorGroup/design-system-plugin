export type Color = {
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
  hexColor?: string;
};

type ComponentToHexTransformer = (component: number) => string;
const componentToHex: ComponentToHexTransformer = component => {
  const hex = Math.floor(component * 255).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

type RgbToHexTransformer = (color: Color) => string;
const rgbToHex: RgbToHexTransformer = color =>
  color
    ? '#' +
      componentToHex(color.r) +
      componentToHex(color.g) +
      componentToHex(color.b)
    : '';

type PaintColorConverter = (paint: Paint) => Paint;
export const convertPaintColor: PaintColorConverter = paint => ({
  ...paint,
  hexColor: paint.color && rgbToHex(paint.color),
});
