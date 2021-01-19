import {convertPaintColor} from '../app/utils/colorUtils';

type TextStyle = {
  [key: string]: {
    fontName: FontName;
    fontSize: number;
    textCase: TextCase;
    textDecoration: TextDecoration;
    letterSpacing: LetterSpacing;
    lineHeight: LineHeight;
  };
};

type ColorStyle = {
  [key: string]: {
    paints: {
      type: string;
      visible?: boolean;
      opacity?: number;
      blendMode?: string;
      color?: string;
    }[];
  };
}

type IconStyle = {
  name: string;
  path: VectorPaths;
  paints: any;
  width: number;
  height: number;
}

type Styles = {
  colorStyles: ColorStyle[];
  textStyles: TextStyle[];
  iconStyles: IconStyle[];
}

figma.showUI(__html__, {width: 600, height: 500});

figma.ui.onmessage = (msg) => {
  if (msg.type === 'getConfig') {
    figma.clientStorage.getAsync('config').then((config) => {
      figma.ui.postMessage({type: 'githubConfig', content: JSON.parse(config)});
    });
  }
  if (msg.type === 'send') {
    figma.clientStorage.setAsync('config', JSON.stringify(msg.config));
    let styles = {} as Styles;

    // Get text styles changes
    styles.textStyles = figma.getLocalTextStyles().map((style) => {
      return {
        [style.name]: {
          fontName: style.fontName,
          fontSize: style.fontSize,
          textCase: style.textCase,
          textDecoration: style.textDecoration,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
        },
      };
    });

    // Get colors
    // TODO: get necessary properties when they'll be in figma
    styles.colorStyles = figma.getLocalPaintStyles().map((style) => {
      return {
        [style.name]: {
          paints: style.paints.map((paint) => convertPaintColor(paint)),
        },
      };
    });

    // Get svg icons (mostly for Web React now)
    let nodes = figma.currentPage.findAll((node) => node.type === 'VECTOR');
    let iconStyles = [];
    for (let node of nodes) {
      if ('vectorPaths' in node) {
        iconStyles.push({
          name: node.name,
          path: node.vectorPaths,
          // @ts-ignore
          paints: node.fills?.map((fill: any) => convertPaintColor(fill)),
          width: node.width,
          height: node.height,
        });
      }
    }
    styles.iconStyles = iconStyles;

    // Transfer styles to ui for a network request to Github
    figma.ui.postMessage({
      type: 'networkRequest',
      content: JSON.stringify(styles, null, 2),
      config: msg.config,
    });
  }
  if (msg.type === 'done') {
    figma.closePlugin();
  }
};
