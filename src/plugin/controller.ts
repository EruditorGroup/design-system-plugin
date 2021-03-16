import {convertPaintColor, convertPaintName} from '../app/utils/colorUtils';
import {
  GET_CONFIG_MESSAGE,
  GITHUB_CONFIG,
  NETWORK_REQUEST,
} from '../app/constants';

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
  [key: string]: string;
};

type IconStyle = {
  name: string;
  path: VectorPaths;
  paints: any;
  width: number;
  height: number;
};

type Styles = {
  colors: ColorStyle;
  textStyles: TextStyle[];
  iconStyles: IconStyle[];
};

figma.showUI(__html__, {width: 600, height: 500});

figma.ui.onmessage = msg => {
  if (msg.type === GET_CONFIG_MESSAGE) {
    figma.clientStorage.getAsync('config').then(config => {
      figma.ui.postMessage({type: GITHUB_CONFIG, config: JSON.parse(config)});
    });
  }
  if (msg.type === 'send') {
    figma.clientStorage.setAsync('config', JSON.stringify(msg.config));
    let styles = {} as Styles;

    // Get text styles changes
    styles.textStyles = figma.getLocalTextStyles().map(style => {
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
    let colors: ColorStyle = {};
    figma
      .getLocalPaintStyles()
      .forEach(
        style =>
          (colors[convertPaintName(style.name)] =
            convertPaintColor(style.paints[0]).hexColor || '')
      );
    styles.colors = colors;

    // Get svg icons (mostly for Web React now)
    let nodes = figma.currentPage.findAll(node => node.type === 'VECTOR');
    let iconStyles = [];
    for (let node of nodes) {
      if ('vectorPaths' in node) {
        iconStyles.push({
          name: node.name,
          path: node.vectorPaths,
          // @ts-ignore
          paints: node.fills?.map(fill => convertPaintColor(fill)),
          width: node.width,
          height: node.height,
        });
      }
    }
    styles.iconStyles = iconStyles;

    // Transfer styles to ui for a network request to Github
    figma.ui.postMessage({
      type: NETWORK_REQUEST,
      content: JSON.stringify(styles, null, 2),
      config: msg.config,
    });
  }
  if (msg.type === 'done') {
    figma.closePlugin();
  }
};
