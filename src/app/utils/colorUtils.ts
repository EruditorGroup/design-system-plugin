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
};

function componentToHex(component: number) {
  const hex = Math.floor(component * 255).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(color: Color) {
  return color
    ? '#' +
        componentToHex(color.r) +
        componentToHex(color.g) +
        componentToHex(color.b)
    : undefined;
}

export function convertPaintColor(paint: Paint) {
  return {...paint, color: paint.color && rgbToHex(paint.color)};
}
