import {Color, convertPaintColor} from '../app/utils/colorUtils';
import {
  GET_CONFIG_MESSAGE,
  GITHUB_CONFIG,
  NETWORK_REQUEST,
} from '../app/constants';

const POST_MESSAGE_DELAY = 1000;

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
      color?: Color;
      hexColor?: string;
    }[];
  };
};

type IconStyle = {
  name: string;
  path: VectorPaths;
  paints: any;
  width: number;
  height: number;
};

type Styles = {
  colorStyles: ColorStyle[];
  textStyles: TextStyle[];
  iconStyles: IconStyle[];
};

type SvgAsyncMessageSender = (
  node: SceneNode,
  msg: any,
  delay: number
) => Promise<unknown> | void;
const postSvgAsyncMessage: SvgAsyncMessageSender = (node, msg, delay) => {
  node
    .exportAsync({contentsOnly: false, format: 'SVG'})
    .then((svg: Uint8Array) => {
      // @ts-ignore
      const str = String.fromCharCode.apply(null, svg);
      let svgFile = str.replace(/"/g, "'");
      svgFile = svgFile.replace(/\n/g, '');
      return new Promise(() =>
        setTimeout(
          () =>
            figma.ui.postMessage({
              type: NETWORK_REQUEST,
              content: svgFile,
              config: msg.config,
              fileName: node.name + '.svg',
            }),
          delay
        )
      );
    })
    .catch((error: Error) => {
      console.log(`Error exporting svg. ${error}`);
    });
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
    // TODO: get necessary properties when they'll be in figma
    styles.colorStyles = figma.getLocalPaintStyles().map(style => {
      return {
        [style.name]: {
          paints: style.paints.map(paint => convertPaintColor(paint)),
        },
      };
    });

    // Get svg icons (mostly for Web React now)
    let nodes = figma.currentPage.findAll(node => node.type === 'COMPONENT');
    let delay = 0;
    nodes.map(node => {
      delay += POST_MESSAGE_DELAY;
      return postSvgAsyncMessage(node, msg, delay);
    });

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
